import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  CheckIn,
  Person,
  Family,
  CheckInChildRequest,
  CheckInChildResponse,
  CheckOutChildRequest,
  BulkCheckInChildrenRequest,
  BulkCheckInChildrenResponse,
  CheckOutByPinRequest,
  CheckOutByPinResponse,
  ValidatePinRequest,
  ValidatePinResponse,
  AdminCheckOutRequest,
  ERROR_CODE,
  CHECK_IN_STATUS,
  CHECKOUT_METHOD,
} from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';
import { dynamoDb, Tables } from '../../shared/utils/dynamodb';
import { getPeopleByFamily } from '../../family/services/familyService';

/**
 * Generates a random 6-character alphanumeric string for IDs
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Generates a secure 4-digit PIN for checkout
 * Range: 1000-9999 (exactly 4 digits)
 */
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Creates a new check-in record
 */
async function createCheckIn(checkIn: CheckIn): Promise<CheckIn> {
  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: Tables.CHECKINS,
        Item: checkIn,
        ConditionExpression: 'attribute_not_exists(checkInId)',
      })
    );

    return checkIn;
  } catch (error) {
    if ((error as any).name === 'ConditionalCheckFailedException') {
      throw new Error('Check-in with this ID already exists');
    }
    console.error('Error creating check-in:', error);
    throw new Error('Failed to create check-in');
  }
}

/**
 * Checks in a child to childcare and generates secure PIN
 *
 * Creates a check-in record with automatically generated PIN
 * that parents must provide at pickup.
 *
 * @param data - Check-in information
 * @param data.childId - Unique child identifier from Person table
 * @param data.familyId - Unique family identifier
 * @param data.room - Childcare room assignment (e.g., "Nursery")
 *
 * @returns Promise that resolves to check-in record with PIN
 *
 * @example
 * ```typescript
 * const result = await checkInChild({
 *   childId: 'per-123',
 *   familyId: 'fam-456',
 *   room: 'Nursery'
 * });
 * console.log(`PIN: ${result.pin}`);
 * ```
 */

export async function checkInChild(data: CheckInChildRequest): Promise<CheckInChildResponse> {
  // Check for existing active check-in
  const existingCheckIns = await dynamoDb.send(
    new QueryCommand({
      TableName: Tables.CHECKINS,
      IndexName: 'status-checkInTime-index',
      KeyConditionExpression: '#status = :status',
      FilterExpression: 'childId = :childId',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': CHECK_IN_STATUS.ACTIVE,
        ':childId': data.childId,
      },
    })
  );

  if (existingCheckIns.Items && existingCheckIns.Items.length > 0) {
    throw new AppError(ERROR_CODE.ALREADY_CHECKED_IN, 'Child is already checked in');
  }

  const checkInId = `chk-${Date.now()}-${generateRandomId()}`;
  const pin = generatePin();
  const now = new Date().toISOString();

  const checkIn: CheckIn = {
    checkInId,
    childId: data.childId,
    familyId: data.familyId,
    checkInTime: now,
    checkOutTime: null,
    checkOutPin: pin,
    checkOutMethod: null,
    manualOverrideNotes: null,
    status: CHECK_IN_STATUS.ACTIVE,
    room: data.room,
    createdAt: now,
    updatedAt: now,
    checkedOutBy: null,
    checkedOutByUserId: null,
  };

  await createCheckIn(checkIn);

  return { checkIn, pin };
}

/**
 * Gets all active check-ins (not yet checked out)
 * Uses status-checkInTime-index GSI for efficient querying
 */
export async function getActiveCheckIns(): Promise<CheckIn[]> {
  try {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Tables.CHECKINS,
        IndexName: 'status-checkInTime-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status', // status is a reserved word in DynamoDB
        },
        ExpressionAttributeValues: {
          ':status': CHECK_IN_STATUS.ACTIVE,
        },
        ScanIndexForward: false, // Sort by checkInTime descending (newest first)
      })
    );

    return (result.Items || []) as CheckIn[];
  } catch (error) {
    console.error('Error getting active check-ins:', error);
    throw new Error('Failed to retrieve active check-ins');
  }
}

/**
 * Checks out a child with PIN verification
 */
export async function checkOutChild({ checkInId, pin }: CheckOutChildRequest): Promise<CheckIn> {
  // Validate PIN format (4 digits)
  if (!/^\d{4}$/.test(pin)) {
    throw new AppError(ERROR_CODE.INVALID_FORMAT, 'PIN must be 4 digits');
  }

  try {
    // Get the check-in record (using GetItem is more efficient than Query)
    const getResult = await dynamoDb.send(
      new GetCommand({
        TableName: Tables.CHECKINS,
        Key: { checkInId },
      })
    );

    if (!getResult.Item) {
      throw new AppError(ERROR_CODE.CHECKIN_NOT_FOUND, 'Check-in not found', 404);
    }

    const checkIn = getResult.Item as CheckIn;

    // Verify PIN
    if (checkIn.checkOutPin !== pin) {
      throw new AppError(ERROR_CODE.INVALID_PIN, 'Invalid PIN');
    }

    // Check if already checked out
    if (checkIn.status === CHECK_IN_STATUS.COMPLETED) {
      throw new AppError(ERROR_CODE.ALREADY_CHECKED_OUT, 'Child already checked out');
    }

    // Update check-out time and status
    const now = new Date().toISOString();
    await dynamoDb.send(
      new UpdateCommand({
        TableName: Tables.CHECKINS,
        Key: { checkInId },
        UpdateExpression:
          'SET checkOutTime = :checkOutTime, checkOutMethod = :method, #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':checkOutTime': now,
          ':method': CHECKOUT_METHOD.PIN,
          ':status': CHECK_IN_STATUS.COMPLETED,
          ':updatedAt': now,
        },
      })
    );

    return {
      ...checkIn,
      checkOutTime: now,
      checkOutMethod: CHECKOUT_METHOD.PIN,
      status: CHECK_IN_STATUS.COMPLETED,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error checking out child:', error);
    throw error;
  }
}

/**
 * Checks in multiple children at once with a shared PIN.
 *
 * Creates multiple check-in records, all with the same PIN for easy checkout.
 * Used for kiosk mode where parents check in multiple children together.
 *
 * @param data - Bulk check-in information
 * @param data.familyId - Family ID for all children
 * @param data.childIds - Array of child IDs to check in
 * @param data.room - Childcare room assignment
 *
 * @returns Promise resolving to array of check-in records and shared PIN
 * @throws {Error} If any child is already checked in
 * @throws {Error} If required fields are missing
 *
 * @example
 * ```typescript
 * const result = await bulkCheckInChildren({
 *   familyId: 'fam-123',
 *   childIds: ['per-456', 'per-789'],
 *   room: 'Nursery'
 * });
 * // Returns: { checkins: [...], pin: '4289' }
 * ```
 */
export async function bulkCheckInChildren(
  data: BulkCheckInChildrenRequest
): Promise<BulkCheckInChildrenResponse> {
  const { familyId, childIds, room } = data;

  try {
    const pin = generatePin();
    const checkInTime = new Date().toISOString();
    const checkIns: CheckIn[] = [];

    // Check if any children are already checked in
    for (const childId of childIds) {
      const existingCheckIn = await getActiveCheckInByChild(childId);
      if (existingCheckIn) {
        throw new AppError(ERROR_CODE.ALREADY_CHECKED_IN, `Child ${childId} is already checked in`);
      }
    }

    // Create check-in records for each child with the same PIN
    for (const childId of childIds) {
      const checkInId = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      const checkIn: CheckIn = {
        checkInId,
        childId,
        familyId,
        room,
        checkInTime,
        checkOutTime: null,
        checkOutPin: pin,
        checkOutMethod: null,
        manualOverrideNotes: null,
        status: CHECK_IN_STATUS.ACTIVE,
        createdAt: now,
        updatedAt: now,
        checkedOutBy: null,
        checkedOutByUserId: null,
      };

      await dynamoDb.send(
        new PutCommand({
          TableName: Tables.CHECKINS,
          Item: checkIn,
        })
      );

      checkIns.push(checkIn);

      // Small delay to ensure unique timestamps for checkInId
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    return { checkIns, pin };
  } catch (error) {
    console.error('Error during bulk check-in:', error);
    throw error;
  }
}

/**
 * Checks out all children associated with a PIN.
 *
 * Finds all active check-ins with the given PIN and marks them as checked out.
 * Fetches child names from the People table to include in the response.
 * Used for kiosk mode where one PIN checks out multiple children.
 *
 *
 * @returns Promise resolving to array of checked-out records with child names and success message
 * @throws {Error} If PIN is incorrect or no active check-ins found
 *
 * @example
 * ```typescript
 * const result = await checkOutByPin('4289', 'Tony Stank');
 * // Returns: {
 * //   checkins: [
 * //     { checkInId: 'chk-1', childName: 'Emma', ... },
 * //     { checkInId: 'chk-2', childName: 'Noah', ... }
 * //   ],
 * //   message: '2 children checked out successfully'
 * // }
 * @param request
 */
export async function checkOutByPin(request: CheckOutByPinRequest): Promise<CheckOutByPinResponse> {
  const { pin, checkedOutBy } = request;

  try {
    const activeCheckIns = await getActiveCheckIns();

    // Filter by PIN
    const matchingCheckIns = activeCheckIns.filter((checkIn) => checkIn.checkOutPin === pin);

    if (matchingCheckIns.length === 0) {
      throw new AppError(ERROR_CODE.NO_ACTIVE_CHECKINS, 'No active check-ins found with that PIN');
    }

    const checkOutTime = new Date().toISOString();
    const checkedOutRecords: Array<CheckIn & { childName?: string }> = [];

    // Check out all matching children
    for (const checkIn of matchingCheckIns) {
      const updatedCheckIn: CheckIn = {
        ...checkIn,
        checkOutTime,
        checkOutMethod: CHECKOUT_METHOD.PIN,
        checkedOutBy: checkedOutBy.trim(),
        checkedOutByUserId: null,
        status: CHECK_IN_STATUS.COMPLETED,
        updatedAt: checkOutTime,
      };

      await dynamoDb.send(
        new UpdateCommand({
          TableName: Tables.CHECKINS,
          Key: {
            checkInId: checkIn.checkInId,
          },
          UpdateExpression:
            'SET checkOutTime = :checkOutTime, checkOutMethod = :checkOutMethod, checkedOutBy = :checkedOutBy, checkedOutByUserId = :checkedOutByUserId, #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':checkOutTime': checkOutTime,
            ':checkOutMethod': CHECKOUT_METHOD.PIN,
            ':checkedOutBy': checkedOutBy.trim(),
            ':checkedOutByUserId': null,
            ':status': CHECK_IN_STATUS.COMPLETED,
            ':updatedAt': checkOutTime,
          },
        })
      );

      // Fetch child name
      try {
        const personResult = await dynamoDb.send(
          new GetCommand({
            TableName: Tables.PEOPLE,
            Key: {
              personId: checkIn.childId,
            },
          })
        );

        const child = personResult.Item as Person | undefined;
        checkedOutRecords.push({
          ...updatedCheckIn,
          childName: child?.firstName,
        });
      } catch (error) {
        console.error(`Error fetching child name for ${checkIn.childId}:`, error);
        checkedOutRecords.push(updatedCheckIn);
      }
    }

    return {
      checkIns: checkedOutRecords,
      message: `${checkedOutRecords.length} ${
        checkedOutRecords.length === 1 ? 'child' : 'children'
      } checked out successfully`,
    };
  } catch (error) {
    console.error('Error checking out by PIN:', error);
    throw error;
  }
}

/**
 * Gets active check-in for a specific child.
 * Used to prevent duplicate check-ins.
 *
 * @param childId - Child's person ID
 * @returns Active check-in record or null if child not checked in
 */
async function getActiveCheckInByChild(childId: string): Promise<CheckIn | null> {
  try {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Tables.CHECKINS,
        IndexName: 'status-checkInTime-index',
        KeyConditionExpression: '#status = :status',
        FilterExpression: 'childId = :childId',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': CHECK_IN_STATUS.ACTIVE,
          ':childId': childId,
        },
      })
    );

    const checkIns = (result.Items || []) as CheckIn[];
    return checkIns.length > 0 ? checkIns[0] : null;
  } catch (error) {
    console.error('Error checking for active check-in:', error);
    return null;
  }
}

/**
 * Validates a PIN and returns family information for checkout.
 *
 * Checks if the PIN is valid and returns the family details including
 * parent names and children being picked up. Does NOT perform the actual checkout.
 * Used in kiosk flow to show parent selection before checkout.
 *
 *
 * @returns Promise resolving to family info and children to be picked up
 * @throws {Error} If PIN is invalid or no active check-ins found
 *
 * @example
 * ```typescript
 * const result = await validatePinForCheckout('4289');
 * // Returns: {
 * //   familyId: 'fam-123',
 * //   lastName: 'Johnson',
 * //   children: [{ personId: 'per-456', firstName: 'Emma' }, ...],
 * //   parents: [{ personId: 'per-789', firstName: 'Sarah' }, ...]
 * // }
 * ```
 * @param request
 */
export async function validatePinForCheckout(
  request: ValidatePinRequest
): Promise<ValidatePinResponse> {
  try {
    const activeCheckIns = await getActiveCheckIns();

    const matchingCheckIns = activeCheckIns.filter(
      (checkIn) => checkIn.checkOutPin === request.pin
    );

    if (matchingCheckIns.length === 0) {
      throw new AppError(ERROR_CODE.NO_ACTIVE_CHECKINS, 'No active check-ins found with that PIN');
    }

    const familyId = matchingCheckIns[0].familyId;

    // Get family details
    const familyResult = await dynamoDb.send(
      new GetCommand({
        TableName: Tables.FAMILIES,
        Key: {
          familyId,
        },
      })
    );

    const family = familyResult.Item as Family | undefined;
    if (!family) {
      throw new AppError(ERROR_CODE.FAMILY_NOT_FOUND, 'Family not found', 404);
    }

    // Get all family members
    const people = await getPeopleByFamily(familyId);

    // Get children info from check-ins
    const children = await Promise.all(
      matchingCheckIns.map(async (checkIn) => {
        const child = people.find((p) => p.personId === checkIn.childId);
        return {
          personId: checkIn.childId,
          firstName: child?.firstName || 'Unknown',
        };
      })
    );

    // Get parents
    const parents = people
      .filter((p) => p.role === 'parent')
      .map((p) => ({
        personId: p.personId,
        firstName: p.firstName,
      }));

    return {
      familyId,
      lastName: family.lastName,
      children,
      parents,
    };
  } catch (error) {
    console.error('Error validating PIN for checkout:', error);
    throw error;
  }
}

/**
 * Admin checkout - staff checks out a child without PIN.
 *
 * Staff have authority to check out any child. This bypasses PIN verification.
 * Records who performed the checkout for audit trail.
 *
 * @param checkInId - Check-in ID to checkout
 * @param request
 * @param adminUserId - Optional: ID of admin who performed checkout (for future Cognito integration)
 *
 * @returns Promise resolving to updated check-in record with child name
 * @throws {Error} If check-in not found or already checked out
 *
 * @example
 * ```typescript
 * const result = await adminCheckOut('chk-123', 'Sarah Johnson');
 * // Returns: { checkIn: {..., checkedOutBy: 'Sarah Johnson', ...}, childName: 'Emma' }
 * ```
 */
export async function adminCheckOut(
  checkInId: string,
  request: AdminCheckOutRequest,
  adminUserId?: string
): Promise<{ checkIn: CheckIn; childName?: string }> {
  const { checkedOutBy } = request;

  if (!checkedOutBy || !checkedOutBy.trim()) {
    throw new AppError(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Name of person picking up is required');
  }

  try {
    // Get the check-in record
    const getResult = await dynamoDb.send(
      new GetCommand({
        TableName: Tables.CHECKINS,
        Key: { checkInId },
      })
    );

    if (!getResult.Item) {
      throw new AppError(ERROR_CODE.CHECKIN_NOT_FOUND, 'Check-in not found', 404);
    }

    const checkIn = getResult.Item as CheckIn;
    // Check if already checked out
    if (checkIn.status === CHECK_IN_STATUS.COMPLETED) {
      throw new AppError(ERROR_CODE.ALREADY_CHECKED_OUT, 'Child already checked out');
    }

    // Update check-out time and status
    const now = new Date().toISOString();
    const updatedCheckIn: CheckIn = {
      ...checkIn,
      checkOutTime: now,
      checkOutMethod: CHECKOUT_METHOD.STAFF_OVERRIDE,
      checkedOutBy: checkedOutBy.trim(),
      checkedOutByUserId: adminUserId || null,
      status: CHECK_IN_STATUS.COMPLETED,
      updatedAt: now,
    };

    await dynamoDb.send(
      new UpdateCommand({
        TableName: Tables.CHECKINS,
        Key: { checkInId },
        UpdateExpression:
          'SET checkOutTime = :checkOutTime, checkOutMethod = :checkOutMethod, checkedOutBy = :checkedOutBy, checkedOutByUserId = :checkedOutByUserId, #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':checkOutTime': updatedCheckIn.checkOutTime,
          ':checkOutMethod': updatedCheckIn.checkOutMethod,
          ':checkedOutBy': updatedCheckIn.checkedOutBy,
          ':checkedOutByUserId': updatedCheckIn.checkedOutByUserId,
          ':status': updatedCheckIn.status,
          ':updatedAt': updatedCheckIn.updatedAt,
        },
      })
    );

    // Fetch child name
    let childName: string | undefined;
    try {
      const personResult = await dynamoDb.send(
        new GetCommand({
          TableName: Tables.PEOPLE,
          Key: { personId: checkIn.childId },
        })
      );
      const child = personResult.Item as Person | undefined;
      childName = child?.firstName;
    } catch (error) {
      console.error(`Error fetching child name for ${checkIn.childId}:`, error);
    }

    return {
      checkIn: updatedCheckIn,
      childName,
    };
  } catch (error) {
    console.error('Error in admin checkout:', error);
    throw error;
  }
}

/**
 * Get all completed check-ins (status = CHECK_IN_STATUS.COMPLETED).
 * Returns check-ins sorted by checkout time (most recent first).
 *
 * Used by the History tab to show past check-ins with pickup information.
 *
 * @returns Promise resolving to array of completed check-in records
 *
 * @example
 * ```typescript
 * const history = await getCompletedCheckIns();
 * // Returns: [{ checkInId, childId, familyId, checkOutTime, checkedOutBy, ... }]
 * ```
 */
export async function getCompletedCheckIns(): Promise<CheckIn[]> {
  try {
    // Query GSI for completed check-ins
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Tables.CHECKINS,
        IndexName: 'status-checkInTime-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': CHECK_IN_STATUS.COMPLETED,
        },
        ScanIndexForward: false, // Descending order (most recent first by checkInTime)
      })
    );

    const checkIns = (result.Items || []) as CheckIn[];

    // Sort by checkout time (most recent first)
    // Note: We sort by checkOutTime, not checkInTime, for better UX
    checkIns.sort((a, b) => {
      if (!a.checkOutTime || !b.checkOutTime) return 0;
      return new Date(b.checkOutTime).getTime() - new Date(a.checkOutTime).getTime();
    });

    return checkIns;
  } catch (error) {
    console.error('Error fetching completed check-ins:', error);
    throw error;
  }
}

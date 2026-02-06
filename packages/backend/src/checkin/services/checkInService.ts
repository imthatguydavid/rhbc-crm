import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { CheckIn, Person } from '@rhbc-crm/shared';
import { dynamoDb, Tables } from '../../shared/utils/dynamodb';

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

export async function checkInChild(data: {
  childId: string;
  familyId: string;
  room: string;
}): Promise<{ checkIn: CheckIn; pin: string }> {
  // NEW: Check for existing active check-in
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
        ':status': 'active',
        ':childId': data.childId,
      },
      Limit: 1, // We only need to know if one exists
    })
  );

  if (existingCheckIns.Items && existingCheckIns.Items.length > 0) {
    throw new Error('Child is already checked in');
  }

  // Rest of the existing code...
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
    status: 'active',
    room: data.room,
    createdAt: now,
    updatedAt: now,
  };

  await createCheckIn(checkIn);

  return { checkIn, pin };
}

/**
 * Creates a new check-in record
 */
export async function createCheckIn(checkIn: CheckIn): Promise<CheckIn> {
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
          ':status': 'active',
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
export async function checkOutChild(checkInId: string, providedPin: string): Promise<CheckIn> {
  // Validate PIN format (4 digits)
  if (!/^\d{4}$/.test(providedPin)) {
    throw new Error('PIN must be 4 digits');
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
      throw new Error('Check-in not found');
    }

    const checkIn = getResult.Item as CheckIn;

    // Verify PIN
    if (checkIn.checkOutPin !== providedPin) {
      throw new Error('Invalid PIN');
    }

    // Check if already checked out
    if (checkIn.status === 'completed') {
      throw new Error('Child already checked out');
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
          ':method': 'pin',
          ':status': 'completed',
          ':updatedAt': now,
        },
      })
    );

    return {
      ...checkIn,
      checkOutTime: now,
      checkOutMethod: 'pin',
      status: 'completed',
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
 * // Returns: { checkIns: [...], pin: '4289' }
 * ```
 */
export async function bulkCheckInChildren(data: {
  familyId: string;
  childIds: string[];
  room: string;
}): Promise<{ checkIns: CheckIn[]; pin: string }> {
  const { familyId, childIds, room } = data;

  // Validation
  if (!familyId || !childIds || childIds.length === 0 || !room) {
    throw new Error('familyId, childIds (non-empty array), and room are required');
  }

  try {
    // Generate ONE PIN for all children
    const pin = generatePin();
    const checkInTime = new Date().toISOString();
    const checkIns: CheckIn[] = [];

    // Check if any children are already checked in
    for (const childId of childIds) {
      const existingCheckIn = await getActiveCheckInByChild(childId);
      if (existingCheckIn) {
        throw new Error(`Child ${childId} is already checked in`);
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
        status: 'active',
        createdAt: now,
        updatedAt: now,
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
 * @param pin - 4-digit PIN provided by parent
 *
 * @returns Promise resolving to array of checked-out records with child names and success message
 * @throws {Error} If PIN is incorrect or no active check-ins found
 *
 * @example
 * ```typescript
 * const result = await checkOutByPin('4289');
 * // Returns: {
 * //   checkIns: [
 * //     { checkInId: 'chk-1', childName: 'Emma', ... },
 * //     { checkInId: 'chk-2', childName: 'Noah', ... }
 * //   ],
 * //   message: '2 children checked out successfully'
 * // }
 * ```
export async function checkOutByPin(pin: string): Promise<{
  checkIns: Array<CheckIn & { childName?: string }>;
  message: string;
}> {
  if (!pin || pin.length !== 4) {
    throw new Error('Valid 4-digit PIN is required');
  }

  try {
    // Get all active check-ins
    const activeCheckIns = await getActiveCheckIns();

    // Filter by PIN
    const matchingCheckIns = activeCheckIns.filter((checkIn) => checkIn.checkOutPin === pin);

    if (matchingCheckIns.length === 0) {
      throw new Error('No active check-ins found with that PIN');
    }

    const checkOutTime = new Date().toISOString();
    const checkedOutRecords: Array<CheckIn & { childName?: string }> = [];

    // Check out all matching children
    for (const checkIn of matchingCheckIns) {
      const updatedCheckIn: CheckIn = {
        ...checkIn,
        checkOutTime,
        checkOutMethod: 'pin',
        status: 'completed',
        updatedAt: checkOutTime,
      };

      await dynamoDb.send(
        new UpdateCommand({
          TableName: Tables.CHECKINS,
          Key: {
            checkInId: checkIn.checkInId,
          },
          UpdateExpression:
            'SET checkOutTime = :checkOutTime, checkOutMethod = :checkOutMethod, #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':checkOutTime': checkOutTime,
            ':checkOutMethod': 'pin',
            ':status': 'completed',
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
          ':status': 'active',
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

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { CheckIn } from '@rhbc-crm/shared';
import { dynamoDb, Tables } from '../utils/dynamodb.js';

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
          '#status': 'status',  // status is a reserved word in DynamoDB
        },
        ExpressionAttributeValues: {
          ':status': 'active',
        },
        ScanIndexForward: false,  // Sort by checkInTime descending (newest first)
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
export async function checkOutChild(
  checkInId: string,
  providedPin: string
): Promise<CheckIn> {
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
        UpdateExpression: 'SET checkOutTime = :checkOutTime, checkOutMethod = :method, #status = :status, updatedAt = :updatedAt',
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
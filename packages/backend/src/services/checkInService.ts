import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { CheckIn } from '@rhbc-crm/shared';
import { dynamoDb, Tables } from '../utils/dynamodb.js';

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
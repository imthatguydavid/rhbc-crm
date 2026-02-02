import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { Family, Person } from '@rhbc-crm/shared';
import { dynamoDb, Tables } from '../utils/dynamodb.js';

/**
 * Constant partition key for all families
 * Used for efficient querying via GSI
 */
const FAMILY_PK = 'FAMILY';

/**
 * Get all families using Query (not Scan!)
 * Uses pk-createdAt-index GSI for efficient retrieval
 */
export async function getAllFamilies(): Promise<Family[]> {
  try {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Tables.FAMILIES,
        IndexName: 'pk-createdAt-index',
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': FAMILY_PK,
        },
        ScanIndexForward: false, // Newest families first
      })
    );

    return (result.Items || []) as Family[];
  } catch (error) {
    console.error('Error getting families:', error);
    throw new Error('Failed to retrieve families');
  }
}

/**
 * Get a single family by ID
 */
export async function getFamilyById(familyId: string): Promise<Family | null> {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: Tables.FAMILIES,
        Key: { familyId },
      })
    );

    return (result.Item as Family) || null;
  } catch (error) {
    console.error('Error getting family:', error);
    throw new Error('Failed to retrieve family');
  }
}

/**
 * Create a new family in DynamoDB
 */
export async function createFamily(family: Family): Promise<Family> {
  // Ensure pk is set
  const familyWithPk = {
    ...family,
    pk: FAMILY_PK,
  };

  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: Tables.FAMILIES,
        Item: familyWithPk,
        // Prevent overwriting existing family
        ConditionExpression: 'attribute_not_exists(familyId)',
      })
    );

    return familyWithPk;
  } catch (error) {
    if ((error as any).name === 'ConditionalCheckFailedException') {
      throw new Error('Family with this ID already exists');
    }
    console.error('Error creating family:', error);
    throw new Error('Failed to create family');
  }
}

/**
 * Get all people for a specific family
 */
export async function getPeopleByFamily(familyId: string): Promise<Person[]> {
  try {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Tables.PEOPLE,
        IndexName: 'familyId-index',
        KeyConditionExpression: 'familyId = :familyId',
        ExpressionAttributeValues: {
          ':familyId': familyId,
        },
      })
    );

    return (result.Items || []) as Person[];
  } catch (error) {
    console.error('Error getting people for family:', error);
    throw new Error('Failed to retrieve family members');
  }
}

/**
 * Create a new person in DynamoDB
 */
export async function createPerson(person: Person): Promise<Person> {
  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: Tables.PEOPLE,
        Item: person,
        ConditionExpression: 'attribute_not_exists(personId)',
      })
    );

    return person;
  } catch (error) {
    if ((error as any).name === 'ConditionalCheckFailedException') {
      throw new Error('Person with this ID already exists');
    }
    console.error('Error creating person:', error);
    throw new Error('Failed to create person');
  }
}

/**
 * Get all people (for admin/reporting)
 * Note: In production, this should also use a GSI with pagination
 */
export async function getAllPeople(): Promise<Person[]> {
  try {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Tables.PEOPLE,
        IndexName: 'pk-createdAt-index',
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: {
          ':pk': 'PERSON',
        },
      })
    );

    return (result.Items || []) as Person[];
  } catch (error) {
    console.error('Error getting all people:', error);
    throw new Error('Failed to retrieve people');
  }
}
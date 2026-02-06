import { PutCommand, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Family, Person } from '@rhbc-crm/shared';
import { dynamoDb, Tables } from '../../shared/dynamodb.js';

/**
 * Generates a unique family ID with timestamp
 */
function generateFamilyId(): string {
  return `fam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates a unique person ID with timestamp
 */
function generatePersonId(): string {
  return `per-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Constant partition key for all families
 * Used for efficient querying via GSI
 */
const FAMILY_PK = 'FAMILY';
/**
 * Gets a person by ID.
 *
 * @param personId - Person ID to retrieve
 * @returns Promise resolving to Person or null if not found
 */
export async function getPersonById(personId: string): Promise<Person | null> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: Tables.PEOPLE,
      Key: { personId },
    })
  );

  return result.Item as Person | null;
}

/**
 * Creates a new family with a parent contact in one operation
 *
 * This is the high-level business logic function that orchestrates:
 * - Generating unique IDs
 * - Building Family and Person objects
 * - Saving both to database
 *
 * @param data - Family and parent information from the request
 * @returns Promise with created family and parent records
 *
 * @example
 * ```typescript
 * const result = await createFamilyWithParent({
 *   lastName: 'Smith',
 *   status: 'member',
 *   parentFirstName: 'John',
 *   parentPhone: '5551234567',
 *   parentEmail: 'john@example.com'
 * });
 * ```
 */
export async function createFamilyWithParent(data: {
  lastName: string;
  status: 'member' | 'guest';
  parentFirstName: string;
  parentPhone: string;
  parentEmail?: string;
}): Promise<{ family: Family; parent: Person }> {
  // Generate unique IDs
  const familyId = generateFamilyId();
  const personId = generatePersonId();
  const now = new Date().toISOString();

  // Build Family object
  const family: Family = {
    familyId,
    pk: FAMILY_PK,
    lastName: data.lastName,
    status: data.status,
    createdAt: now,
    updatedAt: now,
  };

  // Build Person object (parent)
  const parent: Person = {
    personId,
    familyId,
    firstName: data.parentFirstName,
    phone: data.parentPhone,
    email: data.parentEmail,
    role: 'parent',
    createdAt: now,
    updatedAt: now,
  };

  // Save both to database
  await createFamily(family);
  await createPerson(parent);

  // Return both records
  return { family, parent };
}

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

/**
 * Adds a child to an existing family.
 *
 * Creates a new Person record with role='child' and associates it
 * with the specified family. The family must exist.
 *
 * @param familyId - Family ID to add child to
 * @param childData - Child information
 * @returns Promise resolving to created Person record
 * @throws Error if family doesn't exist
 */
export async function addChildToFamily(
  familyId: string,
  childData: {
    firstName: string;
    phone?: string;
    email?: string;
  }
): Promise<Person> {
  // 1. Verify family exists
  const family = await getFamilyById(familyId);
  if (!family) {
    throw new Error('Family not found');
  }

  // 2. Generate child ID and timestamp
  const personId = generatePersonId();
  const now = new Date().toISOString();

  // 3. Create child record
  const child: Person = {
    personId,
    familyId,
    firstName: childData.firstName,
    phone: childData.phone,
    email: childData.email,
    role: 'child',
    createdAt: now,
    updatedAt: now,
  };

  // 4. Save to database
  await createPerson(child);

  return child;
}

/**
 * Updates a person's information.
 *
 * Only updates fields that are provided. All fields are optional.
 *
 * @param personId - Person ID to update
 * @param updates - Fields to update
 * @returns Promise resolving to updated Person record
 * @throws Error if person doesn't exist
 */
export async function updatePerson(
  personId: string,
  updates: {
    firstName?: string;
    phone?: string;
    email?: string;
  }
): Promise<Person> {
  // 1. Get existing person
  const existingPerson = await getPersonById(personId);
  if (!existingPerson) {
    throw new Error('Person not found');
  }

  // 2. Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Add fields that are being updated
  if (updates.firstName !== undefined) {
    updateExpressions.push('#firstName = :firstName');
    expressionAttributeNames['#firstName'] = 'firstName';
    expressionAttributeValues[':firstName'] = updates.firstName;
  }

  if (updates.phone !== undefined) {
    updateExpressions.push('#phone = :phone');
    expressionAttributeNames['#phone'] = 'phone';
    expressionAttributeValues[':phone'] = updates.phone;
  }

  if (updates.email !== undefined) {
    updateExpressions.push('#email = :email');
    expressionAttributeNames['#email'] = 'email';
    expressionAttributeValues[':email'] = updates.email;
  }

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  // 3. Update in database
  const result = await dynamoDb.send(
    new UpdateCommand({
      TableName: Tables.PEOPLE,
      Key: { personId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as Person;
}

/**
 * Updates a family's information.
 *
 * Only updates fields that are provided. All fields are optional.
 *
 * @param familyId - Family ID to update
 * @param updates - Fields to update
 * @returns Promise resolving to updated Family record
 * @throws Error if family doesn't exist
 */
export async function updateFamily(
  familyId: string,
  updates: {
    lastName?: string;
    status?: 'member' | 'guest';
  }
): Promise<Family> {
  // 1. Get existing family
  const existingFamily = await getFamilyById(familyId);
  if (!existingFamily) {
    throw new Error('Family not found');
  }

  // 2. Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Add fields that are being updated
  if (updates.lastName !== undefined) {
    updateExpressions.push('#lastName = :lastName');
    expressionAttributeNames['#lastName'] = 'lastName';
    expressionAttributeValues[':lastName'] = updates.lastName;
  }

  if (updates.status !== undefined) {
    updateExpressions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = updates.status;
  }

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  // 3. Update in database
  const result = await dynamoDb.send(
    new UpdateCommand({
      TableName: Tables.FAMILIES,
      Key: { familyId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as Family;
}

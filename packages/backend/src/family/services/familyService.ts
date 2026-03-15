import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  AddChildToFamilyRequest,
  ERROR_CODE,
  Family,
  Person,
  UpdateFamilyRequest,
  UpdatePersonRequest,
} from '@rhbc-crm/shared';
import { dynamoDb, Tables } from '../../shared/utils/dynamodb';
import { AppError } from '../../shared/utils/AppError';

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
 * Gets all families with optional search and status filtering.
 * Includes primary parent information for each family.
 *
 * Queries the pk-createdAt-index GSI for efficient retrieval.
 * For each family, fetches the primary parent to display in search results.
 * Filters results based on provided search and status parameters.
 *
 * @param filters - Optional search filters
 * @param filters.search - Search term for lastName (case-insensitive partial match)
 * @param filters.status - Filter by family status (member or guest)
 * @returns Promise resolving to array of Family records with primary parent info
 */
export async function getAllFamilies(filters?: {
  search?: string;
  status?: 'member' | 'guest';
}): Promise<Array<Family & { primaryParent?: Person }>> {
  // Build filter expression dynamically
  const filterExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Add status filter if provided
  if (filters?.status) {
    filterExpressions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = filters.status;
  }

  // Always exclude soft-deleted families
  filterExpressions.push('attribute_not_exists(deletedAt)');

  // Query DynamoDB
  const queryParams: any = {
    TableName: Tables.FAMILIES,
    IndexName: 'pk-createdAt-index',
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': 'FAMILY',
      ...expressionAttributeValues,
    },
    ScanIndexForward: false, // Most recent first
  };

  // Add filter expression if we have filters
  if (filterExpressions.length > 0) {
    queryParams.FilterExpression = filterExpressions.join(' AND ');
    if (Object.keys(expressionAttributeNames).length > 0) {
      queryParams.ExpressionAttributeNames = expressionAttributeNames;
    }
  }

  const result = await dynamoDb.send(new QueryCommand(queryParams));
  let families = (result.Items as Family[]) || [];

  // Client-side search filter for lastName
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    families = families.filter((family) => family.lastName.toLowerCase().includes(searchTerm));
  }

  // Fetch primary parent for each family
  const familiesWithParents = await Promise.all(
    families.map(async (family) => {
      try {
        const people = await getPeopleByFamily(family.familyId);
        const primaryParent = people.find((p) => p.role === 'parent');

        return {
          ...family,
          primaryParent: primaryParent || undefined,
        };
      } catch (error) {
        console.error(`Error fetching parent for family ${family.familyId}:`, error);
        return { ...family, primaryParent: undefined };
      }
    })
  );

  return familiesWithParents;
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
    throw error;
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
 * Gets all people (not deleted) in a family.
 *
 * Queries the familyId-index GSI to efficiently retrieve all family members.
 * Filters out soft-deleted people (those with deletedAt set).
 *
 * @param familyId - Family ID to get people for
 * @returns Promise resolving to array of Person records
 */
export async function getPeopleByFamily(familyId: string): Promise<Person[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: Tables.PEOPLE,
      IndexName: 'familyId-index',
      KeyConditionExpression: 'familyId = :familyId',
      // Filter out deleted people
      FilterExpression: 'attribute_not_exists(deletedAt)',
      ExpressionAttributeValues: {
        ':familyId': familyId,
      },
    })
  );

  return (result.Items as Person[]) || [];
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
    console.error('Error getting family:', error);
    throw error;
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
  childData: AddChildToFamilyRequest
): Promise<Person> {
  const family = await getFamilyById(familyId);
  if (!family) {
    throw new AppError(ERROR_CODE.FAMILY_NOT_FOUND, 'Family not found', 404);
  }

  const personId = generatePersonId();
  const now = new Date().toISOString();

  const request: Person = {
    personId,
    familyId,
    firstName: childData.firstName,
    phone: childData.phone,
    email: childData.email,
    role: 'child',
    createdAt: now,
    updatedAt: now,
  };

  return await createPerson(request);
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
  updates: UpdatePersonRequest
): Promise<Person> {
  // 1. Get existing person
  const existingPerson = await getPersonById(personId);
  if (!existingPerson) {
    throw new AppError(ERROR_CODE.PERSON_NOT_FOUND, 'Person not found', 404);
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
  updates: UpdateFamilyRequest
): Promise<Family> {
  const existingFamily = await getFamilyById(familyId);
  if (!existingFamily) {
    throw new AppError(ERROR_CODE.FAMILY_NOT_FOUND, 'Family not found', 404);
  }

  // 1. Build update expression dynamically
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

  // 2. Update in database
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

/**
 * Soft deletes a person by marking them as deleted.
 *
 * Sets deletedAt timestamp instead of actually removing from database.
 * This preserves data integrity and allows for restoration if needed.
 *
 * @param personId - Person ID to soft delete
 * @returns Promise resolving to updated Person record with deletedAt set
 * @throws Error if person doesn't exist or already deleted
 */
export async function deletePerson(personId: string): Promise<Person> {
  // 1. Get existing person
  const existingPerson = await getPersonById(personId);
  if (!existingPerson) {
    throw new AppError(ERROR_CODE.PERSON_NOT_FOUND, 'Person not found', 404);
  }

  // 2. Check if already deleted
  if (existingPerson.deletedAt) {
    throw new AppError(ERROR_CODE.ALREADY_DELETED, 'Person already deleted');
  }

  // 3. Mark as deleted
  const now = new Date().toISOString();

  const result = await dynamoDb.send(
    new UpdateCommand({
      TableName: Tables.PEOPLE,
      Key: { personId },
      UpdateExpression: 'SET #deletedAt = :deletedAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#deletedAt': 'deletedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':deletedAt': now,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as Person;
}

/**
 * Soft deletes a family and all its members.
 *
 * Sets deletedAt on the family record and cascades to all people
 * in the family. Data is preserved but filtered from queries.
 *
 * @param familyId - Family ID to soft delete
 * @returns Promise resolving to updated Family record with deletedAt set
 * @throws Error if family doesn't exist or already deleted
 */
export async function deleteFamily(familyId: string): Promise<Family> {
  // 1. Verify family exists
  const existingFamily = await getFamilyById(familyId);
  if (!existingFamily) {
    throw new AppError(ERROR_CODE.FAMILY_NOT_FOUND, 'Family not found', 404);
  }

  // 2. Check if already deleted
  if (existingFamily.deletedAt) {
    throw new AppError(ERROR_CODE.ALREADY_DELETED, 'Family already deleted');
  }

  const now = new Date().toISOString();

  // 3. Cascade soft delete all people in the family
  const people = await getPeopleByFamily(familyId);
  await Promise.all(
    people.map((person) =>
      dynamoDb.send(
        new UpdateCommand({
          TableName: Tables.PEOPLE,
          Key: { personId: person.personId },
          UpdateExpression: 'SET #deletedAt = :deletedAt, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#deletedAt': 'deletedAt',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':deletedAt': now,
            ':updatedAt': now,
          },
        })
      )
    )
  );

  // 4. Soft delete the family
  const result = await dynamoDb.send(
    new UpdateCommand({
      TableName: Tables.FAMILIES,
      Key: { familyId },
      UpdateExpression: 'SET #deletedAt = :deletedAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#deletedAt': 'deletedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':deletedAt': now,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes as Family;
}

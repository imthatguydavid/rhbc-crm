import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  createFamilyWithParent,
  addChildToFamily,
  updatePerson,
  updateFamily,
  deletePerson,
  getPeopleByFamily,
  getAllFamilies,
  deleteFamily
} from '../services/familyService.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('familyService', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('createFamilyWithParent', () => {
    it('should generate unique family and person IDs', async () => {
      // Arrange
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createFamilyWithParent({
        lastName: 'Smith',
        status: 'member',
        parentFirstName: 'John',
        parentPhone: '5551234567',
        parentEmail: 'john@example.com',
      });

      // Assert: Check ID formats
      expect(result.family.familyId).toMatch(/^fam-\d+-[a-z0-9]{7}$/);
      expect(result.parent.personId).toMatch(/^per-\d+-[a-z0-9]{7}$/);
      expect(result.family.familyId).not.toBe(result.parent.personId);
    });

    it('should create family with correct fields', async () => {
      // Arrange
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createFamilyWithParent({
        lastName: 'Johnson',
        status: 'guest',
        parentFirstName: 'Jane',
        parentPhone: '5559876543',
      });

      // Assert
      expect(result.family.lastName).toBe('Johnson');
      expect(result.family.status).toBe('guest');
      expect(result.family.pk).toBe('FAMILY');
      expect(result.family.createdAt).toBeDefined();
      expect(result.family.updatedAt).toBeDefined();
    });

    it('should create parent with correct fields', async () => {
      // Arrange
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createFamilyWithParent({
        lastName: 'Brown',
        status: 'member',
        parentFirstName: 'Michael',
        parentPhone: '5551112222',
        parentEmail: 'michael@example.com',
      });

      // Assert
      expect(result.parent.firstName).toBe('Michael');
      expect(result.parent.phone).toBe('5551112222');
      expect(result.parent.email).toBe('michael@example.com');
      expect(result.parent.role).toBe('parent');
      expect(result.parent.familyId).toBe(result.family.familyId);
      expect(result.parent.createdAt).toBeDefined();
    });

    it('should handle optional email field', async () => {
      // Arrange
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createFamilyWithParent({
        lastName: 'Davis',
        status: 'member',
        parentFirstName: 'Sarah',
        parentPhone: '5553334444',
        // No email provided
      });

      // Assert
      expect(result.parent.email).toBeUndefined();
      expect(result.parent.firstName).toBe('Sarah');
    });

    it('should call PutCommand twice (family and person)', async () => {
      // Arrange
      ddbMock.on(PutCommand).resolves({});

      // Act
      await createFamilyWithParent({
        lastName: 'Wilson',
        status: 'guest',
        parentFirstName: 'David',
        parentPhone: '5556667777',
      });

      // Assert: Verify both database writes happened
      expect(ddbMock.commandCalls(PutCommand).length).toBe(2);
    });
  });
  describe('addChildToFamily', () => {
    it('should add child to existing family', async () => {
      // Mock family exists
      ddbMock.on(GetCommand).resolves({
        Item: {
          familyId: 'fam-123',
          lastName: 'Smith',
          status: 'member',
        },
      });

      // Mock child creation
      ddbMock.on(PutCommand).resolves({});

      const result = await addChildToFamily('fam-123', {
        firstName: 'Emma',
      });

      expect(result.firstName).toBe('Emma');
      expect(result.familyId).toBe('fam-123');
      expect(result.role).toBe('child');
      expect(result.personId).toMatch(/^per-/);
    });

    it('should throw error if family not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      await expect(
        addChildToFamily('fam-nonexistent', {
          firstName: 'Emma',
        })
      ).rejects.toThrow('Family not found');
    });

    it('should include optional phone and email', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { familyId: 'fam-123' },
      });
      ddbMock.on(PutCommand).resolves({});

      const result = await addChildToFamily('fam-123', {
        firstName: 'Emma',
        phone: '5551234567',
        email: 'emma@email.com',
      });

      expect(result.phone).toBe('5551234567');
      expect(result.email).toBe('emma@email.com');
    });
  });
  describe('updatePerson', () => {
    it('should update person firstName', async () => {
      // Mock person exists
      ddbMock.on(GetCommand).resolves({
        Item: {
          personId: 'per-123',
          firstName: 'John',
          phone: '5551234567',
        },
      });

      // Mock update
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          personId: 'per-123',
          firstName: 'Jane',
          phone: '5551234567',
          updatedAt: '2026-02-06T00:00:00.000Z',
        },
      });

      const result = await updatePerson('per-123', {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.phone).toBe('5551234567');
    });

    it('should update multiple fields', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { personId: 'per-123' },
      });

      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          personId: 'per-123',
          firstName: 'Jane',
          phone: '5559999999',
          email: 'jane@email.com',
          updatedAt: '2026-02-06T00:00:00.000Z',
        },
      });

      const result = await updatePerson('per-123', {
        firstName: 'Jane',
        phone: '5559999999',
        email: 'jane@email.com',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.phone).toBe('5559999999');
      expect(result.email).toBe('jane@email.com');
    });

    it('should throw error if person not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      await expect(updatePerson('per-nonexistent', { firstName: 'Jane' })).rejects.toThrow(
        'Person not found'
      );
    });
  });
  describe('updateFamily', () => {
    it('should update family lastName', async () => {
      // Mock family exists
      ddbMock.on(GetCommand).resolves({
        Item: {
          familyId: 'fam-123',
          lastName: 'Smith',
          status: 'member',
        },
      });

      // Mock update
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          familyId: 'fam-123',
          lastName: 'Johnson',
          status: 'member',
          updatedAt: '2026-02-06T00:00:00.000Z',
        },
      });

      const result = await updateFamily('fam-123', {
        lastName: 'Johnson',
      });

      expect(result.lastName).toBe('Johnson');
      expect(result.status).toBe('member');
    });

    it('should update family status', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: { familyId: 'fam-123', lastName: 'Smith', status: 'guest' },
      });

      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          familyId: 'fam-123',
          lastName: 'Smith',
          status: 'member',
          updatedAt: '2026-02-06T00:00:00.000Z',
        },
      });

      const result = await updateFamily('fam-123', {
        status: 'member',
      });

      expect(result.status).toBe('member');
    });

    it('should throw error if family not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      await expect(updateFamily('fam-nonexistent', { lastName: 'Johnson' })).rejects.toThrow(
        'Family not found'
      );
    });
  });
  describe('deletePerson', () => {
    it('should soft delete a person', async () => {
      // Mock person exists
      ddbMock.on(GetCommand).resolves({
        Item: {
          personId: 'per-123',
          firstName: 'John',
          familyId: 'fam-123',
        },
      });

      // Mock update with deletedAt
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          personId: 'per-123',
          firstName: 'John',
          familyId: 'fam-123',
          deletedAt: '2026-02-06T00:00:00.000Z',
          updatedAt: '2026-02-06T00:00:00.000Z',
        },
      });

      const result = await deletePerson('per-123');

      expect(result.personId).toBe('per-123');
      expect(result.deletedAt).toBeDefined();
    });

    it('should throw error if person not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      await expect(deletePerson('per-nonexistent')).rejects.toThrow('Person not found');
    });

    it('should throw error if person already deleted', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          personId: 'per-123',
          deletedAt: '2026-02-05T00:00:00.000Z',
        },
      });

      await expect(deletePerson('per-123')).rejects.toThrow('Person already deleted');
    });
  });

  describe('getPeopleByFamily - with deletedAt filter', () => {
    it('should exclude deleted people', async () => {
      // Mock returns both deleted and active people
      // But FilterExpression will filter out deleted ones
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            personId: 'per-123',
            firstName: 'John',
            familyId: 'fam-123',
          },
          // Person with deletedAt would be filtered by DynamoDB
        ],
      });

      const result = await getPeopleByFamily('fam-123');

      expect(result).toHaveLength(1);
      expect(result[0].personId).toBe('per-123');
    });
  });
  describe('getAllFamilies - with search and filters', () => {
    it('should return all families when no filters provided', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            familyId: 'fam-1',
            lastName: 'Smith',
            status: 'member',
            pk: 'FAMILY',
          },
          {
            familyId: 'fam-2',
            lastName: 'Johnson',
            status: 'guest',
            pk: 'FAMILY',
          },
        ],
      });

      const result = await getAllFamilies();

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            familyId: 'fam-1',
            lastName: 'Smith',
            status: 'member',
            pk: 'FAMILY',
          },
          // Guest families filtered by DynamoDB FilterExpression
        ],
      });

      const result = await getAllFamilies({ status: 'member' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('member');
    });

    it('should search by lastName (case-insensitive)', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            familyId: 'fam-1',
            lastName: 'Smith',
            status: 'member',
            pk: 'FAMILY',
          },
          {
            familyId: 'fam-2',
            lastName: 'Smithson',
            status: 'member',
            pk: 'FAMILY',
          },
          {
            familyId: 'fam-3',
            lastName: 'Johnson',
            status: 'guest',
            pk: 'FAMILY',
          },
        ],
      });

      const result = await getAllFamilies({ search: 'smith' });

      expect(result).toHaveLength(2); // Smith and Smithson
      expect(result[0].lastName).toBe('Smith');
      expect(result[1].lastName).toBe('Smithson');
    });

    it('should filter by both search and status', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            familyId: 'fam-1',
            lastName: 'Smith',
            status: 'member',
            pk: 'FAMILY',
          },
          // Other families filtered by status in DynamoDB
        ],
      });

      const result = await getAllFamilies({
        search: 'smith',
        status: 'member',
      });

      expect(result).toHaveLength(1);
      expect(result[0].lastName).toBe('Smith');
      expect(result[0].status).toBe('member');
    });

    it('should return empty array when no matches found', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            familyId: 'fam-1',
            lastName: 'Johnson',
            status: 'member',
            pk: 'FAMILY',
          },
        ],
      });

      const result = await getAllFamilies({ search: 'nonexistent' });

      expect(result).toHaveLength(0);
    });
  });
  describe('deleteFamily', () => {
    it('should soft delete a family and all its members', async () => {
      // Mock family exists
      ddbMock.on(GetCommand).resolves({
        Item: {
          familyId: 'fam-123',
          lastName: 'Smith',
          status: 'member',
          pk: 'FAMILY',
        },
      });

      // Mock getPeopleByFamily returning two people
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { personId: 'per-1', familyId: 'fam-123', firstName: 'John' },
          { personId: 'per-2', familyId: 'fam-123', firstName: 'Emma' },
        ],
      });

      // Mock all UpdateCommands (2 people + 1 family = 3 total)
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          familyId: 'fam-123',
          lastName: 'Smith',
          deletedAt: '2026-03-08T00:00:00.000Z',
          updatedAt: '2026-03-08T00:00:00.000Z',
        },
      });

      const result = await deleteFamily('fam-123');

      expect(result.familyId).toBe('fam-123');
      expect(result.deletedAt).toBeDefined();
      // 2 people + 1 family = 3 UpdateCommands
      expect(ddbMock.commandCalls(UpdateCommand).length).toBe(3);
    });

    it('should soft delete a family with no members', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          familyId: 'fam-123',
          lastName: 'Smith',
          status: 'member',
          pk: 'FAMILY',
        },
      });

      // No people in family
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          familyId: 'fam-123',
          deletedAt: '2026-03-08T00:00:00.000Z',
          updatedAt: '2026-03-08T00:00:00.000Z',
        },
      });

      const result = await deleteFamily('fam-123');

      expect(result.deletedAt).toBeDefined();
      // 0 people + 1 family = 1 UpdateCommand
      expect(ddbMock.commandCalls(UpdateCommand).length).toBe(1);
    });

    it('should throw error if family not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      await expect(deleteFamily('fam-nonexistent')).rejects.toThrow('Family not found');
    });

    it('should throw error if family already deleted', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          familyId: 'fam-123',
          lastName: 'Smith',
          deletedAt: '2026-03-07T00:00:00.000Z',
        },
      });

      await expect(deleteFamily('fam-123')).rejects.toThrow('Family already deleted');
    });
  });
});

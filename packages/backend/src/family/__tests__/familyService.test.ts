import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createFamilyWithParent, addChildToFamily } from '../services/familyService.js';

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
});

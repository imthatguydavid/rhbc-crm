import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  checkInChild,
  checkOutChild,
  getActiveCheckIns,
  bulkCheckInChildren,
  checkOutByPin,
  validatePinForCheckout,
} from '../services/checkInService.js';

// Create a mock DynamoDB client
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('checkInService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('checkInChild', () => {
    it('should generate a 4-digit PIN', async () => {
      // Arrange: Mock DynamoDB responses
      ddbMock.on(QueryCommand).resolves({ Items: [] }); // ← ADD THIS LINE
      ddbMock.on(PutCommand).resolves({});

      // Act: Call the function
      const result = await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery',
      });

      // Assert: Check the PIN format
      expect(result.pin).toBeDefined();
      expect(result.pin).toMatch(/^\d{4}$/);
      expect(parseInt(result.pin)).toBeGreaterThanOrEqual(1000);
      expect(parseInt(result.pin)).toBeLessThanOrEqual(9999);
    });

    it('should set status to active', async () => {
      // Arrange
      ddbMock.on(QueryCommand).resolves({ Items: [] }); // ← ADD THIS LINE
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery',
      });

      // Assert
      expect(result.checkIn.status).toBe('active');
    });

    it('should set checkInTime', async () => {
      // Arrange
      ddbMock.on(QueryCommand).resolves({ Items: [] }); // ← ADD THIS LINE
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery',
      });

      // Assert
      expect(result.checkIn.checkInTime).toBeDefined();
      expect(result.checkIn.checkInTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should set checkOutTime to null', async () => {
      // Arrange
      ddbMock.on(QueryCommand).resolves({ Items: [] }); // ← ADD THIS LINE
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery',
      });

      // Assert
      expect(result.checkIn.checkOutTime).toBeNull();
    });

    it('should store the PIN in checkOutPin field', async () => {
      // Arrange
      ddbMock.on(QueryCommand).resolves({ Items: [] }); // ← ADD THIS LINE
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery',
      });

      // Assert
      expect(result.checkIn.checkOutPin).toBe(result.pin);
    });

    it('should prevent duplicate check-in for same child', async () => {
      // Arrange: Set up mock to return different responses for each call
      ddbMock
        .on(QueryCommand)
        .resolvesOnce({ Items: [] }) // 1st call: no duplicates
        .resolvesOnce({
          Items: [
            {
              // 2nd call: duplicate exists!
              checkInId: 'chk-existing',
              childId: 'per-test-123',
              status: 'active',
              checkInTime: '2026-02-04T10:00:00Z',
            },
          ],
        });

      ddbMock.on(PutCommand).resolves({}); // PutCommand can use .resolves() (not Once)

      // Act: First check-in should succeed
      await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery',
      });

      // Assert: Second check-in should fail
      await expect(
        checkInChild({
          childId: 'per-test-123',
          familyId: 'fam-test-456',
          room: 'Nursery',
        })
      ).rejects.toThrow('Child is already checked in');
    });
  });

  describe('checkOutChild', () => {
    it('should allow checkout with correct PIN', async () => {
      // Arrange: Mock existing active check-in
      ddbMock.on(GetCommand).resolves({
        Item: {
          checkInId: 'chk-test-123',
          childId: 'per-test-123',
          familyId: 'fam-test-456',
          checkInTime: '2026-02-04T10:00:00Z',
          checkOutTime: null,
          checkOutPin: '1234',
          checkOutMethod: null,
          manualOverrideNotes: null,
          status: 'active',
          room: 'Nursery',
          createdAt: '2026-02-04T10:00:00Z',
          updatedAt: '2026-02-04T10:00:00Z',
        },
      });

      ddbMock.on(UpdateCommand).resolves({});

      // Act: Checkout with correct PIN
      const result = await checkOutChild('chk-test-123', '1234');

      // Assert: Check-out succeeded
      expect(result.status).toBe('completed');
      expect(result.checkOutMethod).toBe('pin');
      expect(result.checkOutTime).toBeDefined();
      expect(result.checkOutTime).not.toBeNull();
      expect(result.checkOutTime).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    it('should reject checkout with wrong PIN', async () => {
      // Arrange: Mock existing check-in
      ddbMock.on(GetCommand).resolves({
        Item: {
          checkInId: 'chk-test-123',
          checkOutPin: '1234', // Correct PIN is 1234
          status: 'active',
        },
      });

      // Act & Assert: Wrong PIN should throw error
      await expect(
        checkOutChild('chk-test-123', '9999') // ← Wrong PIN!
      ).rejects.toThrow('Invalid PIN');

      // Verify UpdateCommand was NOT called (no checkout happened)
      expect(ddbMock.commandCalls(UpdateCommand).length).toBe(0);
    });

    it('should reject checkout if already checked out', async () => {
      // Arrange: Mock check-in that's already completed
      ddbMock.on(GetCommand).resolves({
        Item: {
          checkInId: 'chk-test-123',
          childId: 'per-test-123',
          familyId: 'fam-test-456',
          checkInTime: '2026-02-04T10:00:00Z',
          checkOutTime: '2026-02-04T11:00:00Z', // Already checked out!
          checkOutPin: '1234',
          checkOutMethod: 'pin',
          manualOverrideNotes: null,
          status: 'completed', // ← Key field: already completed
          room: 'Nursery',
          createdAt: '2026-02-04T10:00:00Z',
          updatedAt: '2026-02-04T11:00:00Z',
        },
      });

      // Act & Assert: Should reject even with correct PIN
      await expect(
        checkOutChild('chk-test-123', '1234') // Correct PIN doesn't matter!
      ).rejects.toThrow('Child already checked out');

      // Verify UpdateCommand was NOT called (no second checkout)
      expect(ddbMock.commandCalls(UpdateCommand).length).toBe(0);
    });

    it('should reject checkout if check-in not found', async () => {
      // Arrange: Mock that no check-in exists
      ddbMock.on(GetCommand).resolves({
        // No Item property = not found
      });

      // Act & Assert: Should throw error
      await expect(checkOutChild('chk-nonexistent', '1234')).rejects.toThrow('Check-in not found');
    });
  });

  describe('getActiveCheckIns', () => {
    it('should return empty array when no active check-ins', async () => {
      // Arrange: Mock empty result
      ddbMock.on(QueryCommand).resolves({
        Items: [],
      });

      // Act
      const result = await getActiveCheckIns();

      // Assert
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return active check-ins', async () => {
      // Arrange: Mock active check-ins
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            checkInId: 'chk-1',
            childId: 'per-123',
            familyId: 'fam-456',
            status: 'active',
            checkInTime: '2026-02-04T10:00:00Z',
            checkOutTime: null,
            room: 'Nursery',
          },
          {
            checkInId: 'chk-2',
            childId: 'per-789',
            familyId: 'fam-012',
            status: 'active',
            checkInTime: '2026-02-04T10:30:00Z',
            checkOutTime: null,
            room: 'Toddler Room',
          },
        ],
      });

      // Act
      const result = await getActiveCheckIns();

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('active');
      expect(result[1].status).toBe('active');
      expect(result[0].checkOutTime).toBeNull();
      expect(result[1].checkOutTime).toBeNull();
    });

    it('should handle query errors gracefully', async () => {
      // Arrange: Mock DynamoDB error
      ddbMock.on(QueryCommand).rejects(new Error('DynamoDB unavailable'));

      // Act & Assert
      await expect(getActiveCheckIns()).rejects.toThrow('Failed to retrieve active check-ins');
    });
  });
  describe('bulkCheckInChildren', () => {
    it('should check in multiple children with same PIN', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] }); // No existing check-ins
      ddbMock.on(PutCommand).resolves({});

      const result = await bulkCheckInChildren({
        familyId: 'fam-123',
        childIds: ['per-456', 'per-789'],
        room: 'Nursery',
      });

      expect(result.checkIns).toHaveLength(2);
      expect(result.pin).toMatch(/^\d{4}$/);
      expect(result.checkIns[0].checkOutPin).toBe(result.pin);
      expect(result.checkIns[1].checkOutPin).toBe(result.pin);
      expect(result.checkIns[0].familyId).toBe('fam-123');
      expect(result.checkIns[1].familyId).toBe('fam-123');
    });

    it('should throw error if child is already checked in', async () => {
      ddbMock
        .on(QueryCommand)
        .resolvesOnce({ Items: [] }) // First child not checked in
        .resolvesOnce({ Items: [{ checkInId: 'chk-existing' }] }); // Second child already checked in

      await expect(
        bulkCheckInChildren({
          familyId: 'fam-123',
          childIds: ['per-456', 'per-789'],
          room: 'Nursery',
        })
      ).rejects.toThrow('already checked in');
    });

    it('should throw error if childIds is empty', async () => {
      await expect(
        bulkCheckInChildren({
          familyId: 'fam-123',
          childIds: [],
          room: 'Nursery',
        })
      ).rejects.toThrow('childIds (non-empty array)');
    });
  });

  describe('checkOutByPin', () => {
    it('should check out multiple children with same PIN', async () => {
      const activeCheckIns = [
        {
          checkInId: 'chk-1',
          childId: 'per-456',
          checkOutPin: '4289',
          status: 'active',
        },
        {
          checkInId: 'chk-2',
          childId: 'per-789',
          checkOutPin: '4289',
          status: 'active',
        },
        {
          checkInId: 'chk-3',
          childId: 'per-999',
          checkOutPin: '5555',
          status: 'active',
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: activeCheckIns });
      ddbMock.on(UpdateCommand).resolves({});

      const result = await checkOutByPin('4289', 'Peter Parker');

      expect(result.checkIns).toHaveLength(2);
      expect(result.message).toContain('2 children');
      expect(result.checkIns[0].status).toBe('completed');
      expect(result.checkIns[1].status).toBe('completed');
    });

    it('should throw error if PIN not found', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await expect(checkOutByPin('9999', 'Eddie Brock')).rejects.toThrow(
        'No active check-ins found'
      );
    });

    it('should throw error if PIN is invalid', async () => {
      await expect(checkOutByPin('123', 'Saja Boys')).rejects.toThrow('4-digit PIN');
    });
  });
  describe('validatePinForCheckout', () => {
    it('should throw error for invalid PIN format (too short)', async () => {
      await expect(validatePinForCheckout('123')).rejects.toThrow('4-digit PIN');
    });

    it('should throw error for empty PIN', async () => {
      await expect(validatePinForCheckout('')).rejects.toThrow('4-digit PIN');
    });

    it('should throw error if no active check-ins found with PIN', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await expect(validatePinForCheckout('9999')).rejects.toThrow('No active check-ins found');
    });

    it('should throw error if family not found', async () => {
      const activeCheckIns = [
        {
          checkInId: 'chk-1',
          childId: 'per-child-1',
          familyId: 'fam-nonexistent',
          checkOutPin: '4289',
          status: 'active',
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: activeCheckIns });
      ddbMock.on(GetCommand).resolves({}); // No family found

      await expect(validatePinForCheckout('4289')).rejects.toThrow('Family not found');
    });
  });
});

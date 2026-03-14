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
  adminCheckOut,
  getCompletedCheckIns,
} from '../services/checkInService.js';
import { CHECK_IN_STATUS, CHECKOUT_METHOD } from '@rhbc-crm/shared';

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
      expect(result.checkIn.status).toBe(CHECK_IN_STATUS.ACTIVE);
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
              status: CHECK_IN_STATUS.ACTIVE,
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
          status: CHECK_IN_STATUS.ACTIVE,
          room: 'Nursery',
          createdAt: '2026-02-04T10:00:00Z',
          updatedAt: '2026-02-04T10:00:00Z',
        },
      });

      ddbMock.on(UpdateCommand).resolves({});

      // Act: Checkout with correct PIN
      const result = await checkOutChild({ checkInId: 'chk-test-123', pin: '1234' });

      // Assert: Check-out succeeded
      expect(result.status).toBe(CHECK_IN_STATUS.COMPLETED);
      expect(result.checkOutMethod).toBe(CHECKOUT_METHOD.PIN);
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
          status: CHECK_IN_STATUS.ACTIVE,
        },
      });

      // Act & Assert: Wrong PIN should throw error
      await expect(
        checkOutChild({ checkInId: 'chk-test-123', pin: '9999' }) // ← Wrong PIN!
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
          checkOutMethod: CHECKOUT_METHOD.PIN,
          manualOverrideNotes: null,
          status: CHECK_IN_STATUS.COMPLETED, // ← Key field: already completed
          room: 'Nursery',
          createdAt: '2026-02-04T10:00:00Z',
          updatedAt: '2026-02-04T11:00:00Z',
        },
      });

      // Act & Assert: Should reject even with correct PIN
      await expect(
        checkOutChild({ checkInId: 'chk-test-123', pin: '1234' }) // Correct PIN doesn't matter!
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
      await expect(checkOutChild({ checkInId: 'chk-nonexistent', pin: '1234' })).rejects.toThrow(
        'Check-in not found'
      );
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
            status: CHECK_IN_STATUS.ACTIVE,
            checkInTime: '2026-02-04T10:00:00Z',
            checkOutTime: null,
            room: 'Nursery',
          },
          {
            checkInId: 'chk-2',
            childId: 'per-789',
            familyId: 'fam-012',
            status: CHECK_IN_STATUS.ACTIVE,
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
      expect(result[0].status).toBe(CHECK_IN_STATUS.ACTIVE);
      expect(result[1].status).toBe(CHECK_IN_STATUS.ACTIVE);
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
          status: CHECK_IN_STATUS.ACTIVE,
        },
        {
          checkInId: 'chk-2',
          childId: 'per-789',
          checkOutPin: '4289',
          status: CHECK_IN_STATUS.ACTIVE,
        },
        {
          checkInId: 'chk-3',
          childId: 'per-999',
          checkOutPin: '5555',
          status: CHECK_IN_STATUS.ACTIVE,
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: activeCheckIns });
      ddbMock.on(UpdateCommand).resolves({});

      const result = await checkOutByPin({ pin: '4289', checkedOutBy: 'Peter Parker' });

      expect(result.checkIns).toHaveLength(2);
      expect(result.message).toContain('2 children');
      expect(result.checkIns[0].status).toBe(CHECK_IN_STATUS.COMPLETED);
      expect(result.checkIns[1].status).toBe(CHECK_IN_STATUS.COMPLETED);
    });

    it('should throw error if PIN not found', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await expect(checkOutByPin({ pin: '9999', checkedOutBy: 'Eddie Brock' })).rejects.toThrow(
        'No active check-ins found'
      );
    });

    it('should throw error if PIN is invalid', async () => {
      await expect(checkOutByPin({ pin: '123', checkedOutBy: 'Saja Boys' })).rejects.toThrow(
        '4-digit PIN'
      );
    });
  });
  describe('validatePinForCheckout', () => {
    it('should throw error for invalid PIN format (too short)', async () => {
      await expect(validatePinForCheckout({ pin: '123' })).rejects.toThrow('4-digit PIN');
    });

    it('should throw error for empty PIN', async () => {
      await expect(validatePinForCheckout({ pin: '' })).rejects.toThrow('4-digit PIN');
    });

    it('should throw error if no active check-ins found with PIN', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await expect(validatePinForCheckout({ pin: '9999' })).rejects.toThrow(
        'No active check-ins found'
      );
    });

    it('should throw error if family not found', async () => {
      const activeCheckIns = [
        {
          checkInId: 'chk-1',
          childId: 'per-child-1',
          familyId: 'fam-nonexistent',
          checkOutPin: '4289',
          status: CHECK_IN_STATUS.ACTIVE,
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: activeCheckIns });
      ddbMock.on(GetCommand).resolves({}); // No family found

      await expect(validatePinForCheckout({ pin: '4289' })).rejects.toThrow('Family not found');
    });
  });

  describe('adminCheckOut', () => {
    it('should successfully check out a child', async () => {
      const mockCheckIn = {
        checkInId: 'chk-123',
        childId: 'per-456',
        familyId: 'fam-789',
        checkInTime: '2026-02-11T10:00:00Z',
        checkOutTime: null,
        checkOutPin: '1234',
        checkOutMethod: null,
        manualOverrideNotes: null,
        status: CHECK_IN_STATUS.ACTIVE,
        room: 'Nursery',
        createdAt: '2026-02-11T10:00:00Z',
        updatedAt: '2026-02-11T10:00:00Z',
        checkedOutBy: null,
        checkedOutByUserId: null,
      };

      const mockChild = {
        personId: 'per-456',
        firstName: 'Emma',
        role: 'child',
      };

      // Mock GetCommand with conditional responses based on table
      ddbMock.on(GetCommand).callsFake((input) => {
        if (input.TableName === 'rhbc-checkins-dev') {
          return { Item: mockCheckIn };
        }
        if (input.TableName === 'rhbc-people-dev') {
          return { Item: mockChild };
        }
        return {};
      });

      ddbMock.on(UpdateCommand).resolves({});
      const result = await adminCheckOut('chk-123', { checkedOutBy: 'Sarah Johnson' });

      expect(result.checkIn.status).toBe(CHECK_IN_STATUS.COMPLETED);
      expect(result.checkIn.checkOutTime).toBeDefined();
      expect(result.checkIn.checkOutMethod).toBe(CHECKOUT_METHOD.STAFF_OVERRIDE);
      expect(result.checkIn.checkedOutBy).toBe('Sarah Johnson');
      expect(result.checkIn.checkedOutByUserId).toBeNull();
      expect(result.childName).toBe('Emma');
    });

    it('should throw error if checkedOutBy is empty', async () => {
      await expect(adminCheckOut('chk-123', { checkedOutBy: '' })).rejects.toThrow(
        'Name of person picking up is required'
      );
    });

    it('should throw error if check-in not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      await expect(
        adminCheckOut('chk-nonexistent', { checkedOutBy: 'Sarah Johnson' })
      ).rejects.toThrow('Check-in not found');
    });

    it('should throw error if already checked out', async () => {
      const mockCheckIn = {
        checkInId: 'chk-123',
        childId: 'per-456',
        familyId: 'fam-789',
        checkInTime: '2026-02-11T10:00:00Z',
        checkOutTime: '2026-02-11T11:00:00Z',
        checkOutPin: '1234',
        checkOutMethod: CHECKOUT_METHOD.PIN,
        manualOverrideNotes: null,
        status: CHECK_IN_STATUS.COMPLETED, // Already completed
        room: 'Nursery',
        createdAt: '2026-02-11T10:00:00Z',
        updatedAt: '2026-02-11T11:00:00Z',
        checkedOutBy: 'John Doe',
        checkedOutByUserId: null,
      };

      ddbMock.on(GetCommand).resolves({ Item: mockCheckIn });

      await expect(adminCheckOut('chk-123', { checkedOutBy: 'Sarah Johnson' })).rejects.toThrow(
        'Child already checked out'
      );
    });

    it('should trim whitespace from checkedOutBy', async () => {
      const mockCheckIn = {
        checkInId: 'chk-123',
        childId: 'per-456',
        familyId: 'fam-789',
        checkInTime: '2026-02-11T10:00:00Z',
        checkOutTime: null,
        checkOutPin: '1234',
        checkOutMethod: null,
        manualOverrideNotes: null,
        status: CHECK_IN_STATUS.ACTIVE,
        room: 'Nursery',
        createdAt: '2026-02-11T10:00:00Z',
        updatedAt: '2026-02-11T10:00:00Z',
        checkedOutBy: null,
        checkedOutByUserId: null,
      };

      ddbMock.on(GetCommand).resolvesOnce({ Item: mockCheckIn });
      ddbMock.on(UpdateCommand).resolves({});
      ddbMock.on(GetCommand).resolvesOnce({ Item: { firstName: 'Emma' } });

      const result = await adminCheckOut('chk-123', { checkedOutBy: '  Sarah Johnson  ' });

      expect(result.checkIn.checkedOutBy).toBe('Sarah Johnson');
    });

    it('should handle missing child name gracefully', async () => {
      const mockCheckIn = {
        checkInId: 'chk-123',
        childId: 'per-456',
        familyId: 'fam-789',
        checkInTime: '2026-02-11T10:00:00Z',
        checkOutTime: null,
        checkOutPin: '1234',
        checkOutMethod: null,
        manualOverrideNotes: null,
        status: CHECK_IN_STATUS.ACTIVE,
        room: 'Nursery',
        createdAt: '2026-02-11T10:00:00Z',
        updatedAt: '2026-02-11T10:00:00Z',
        checkedOutBy: null,
        checkedOutByUserId: null,
      };

      // Mock GetCommand with conditional responses based on table
      ddbMock.on(GetCommand).callsFake((input) => {
        if (input.TableName === 'rhbc-checkins-dev') {
          return { Item: mockCheckIn };
        }
        if (input.TableName === 'rhbc-people-dev') {
          return {};
        }
        return {};
      });

      // ddbMock.on(GetCommand).resolvesOnce({ Item: mockCheckIn }); // Get check-in
      ddbMock.on(UpdateCommand).resolves({});
      // ddbMock.on(GetCommand).resolvesOnce({}); // Child not found

      const result = await adminCheckOut('chk-123', { checkedOutBy: 'Sarah Johnson' });

      expect(result.checkIn.status).toBe(CHECK_IN_STATUS.COMPLETED);
      expect(result.childName).toBeUndefined();
    });

    it('should accept optional adminUserId parameter', async () => {
      const mockCheckIn = {
        checkInId: 'chk-123',
        childId: 'per-456',
        familyId: 'fam-789',
        checkInTime: '2026-02-11T10:00:00Z',
        checkOutTime: null,
        checkOutPin: '1234',
        checkOutMethod: null,
        manualOverrideNotes: null,
        status: CHECK_IN_STATUS.ACTIVE,
        room: 'Nursery',
        createdAt: '2026-02-11T10:00:00Z',
        updatedAt: '2026-02-11T10:00:00Z',
        checkedOutBy: null,
        checkedOutByUserId: null,
      };

      ddbMock.on(GetCommand).resolvesOnce({ Item: mockCheckIn });
      ddbMock.on(UpdateCommand).resolves({});
      ddbMock.on(GetCommand).resolvesOnce({ Item: { firstName: 'Emma' } });

      const result = await adminCheckOut(
        'chk-123',
        { checkedOutBy: 'Sarah Johnson' },
        'user-admin-1'
      );

      expect(result.checkIn.checkedOutByUserId).toBe('user-admin-1');
    });
  });

  describe('getCompletedCheckIns', () => {
    it('should return completed check-ins sorted by checkout time', async () => {
      const mockCheckIns = [
        {
          checkInId: 'chk-1',
          childId: 'per-1',
          familyId: 'fam-1',
          status: CHECK_IN_STATUS.COMPLETED,
          checkInTime: '2026-02-12T09:00:00Z',
          checkOutTime: '2026-02-12T11:00:00Z',
          room: 'Nursery',
          checkOutPin: '1234',
          checkOutMethod: CHECKOUT_METHOD.PIN,
          checkedOutBy: 'John Doe',
          checkedOutByUserId: null,
          manualOverrideNotes: null,
          createdAt: '2026-02-12T09:00:00Z',
          updatedAt: '2026-02-12T11:00:00Z',
        },
        {
          checkInId: 'chk-2',
          childId: 'per-2',
          familyId: 'fam-2',
          status: CHECK_IN_STATUS.COMPLETED,
          checkInTime: '2026-02-12T09:30:00Z',
          checkOutTime: '2026-02-12T12:00:00Z',
          room: 'Nursery',
          checkOutPin: '5678',
          checkOutMethod: CHECKOUT_METHOD.PIN,
          checkedOutBy: 'Jane Smith',
          checkedOutByUserId: null,
          manualOverrideNotes: null,
          createdAt: '2026-02-12T09:30:00Z',
          updatedAt: '2026-02-12T12:00:00Z',
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: mockCheckIns });

      const result = await getCompletedCheckIns();

      expect(result).toHaveLength(2);
      // Should be sorted by checkOutTime descending (most recent first)
      expect(result[0].checkInId).toBe('chk-2'); // 12:00 PM
      expect(result[1].checkInId).toBe('chk-1'); // 11:00 AM
    });

    it('should return empty array when no completed check-ins exist', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      const result = await getCompletedCheckIns();

      expect(result).toEqual([]);
    });

    it('should query the correct GSI with completed status', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await getCompletedCheckIns();

      const call = ddbMock.commandCalls(QueryCommand)[0];
      expect(call.args[0].input).toMatchObject({
        TableName: 'rhbc-checkins-dev',
        IndexName: 'status-checkInTime-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
          ':status': CHECK_IN_STATUS.COMPLETED,
        },
      });
    });

    it('should handle missing checkOutTime gracefully', async () => {
      const mockCheckIns = [
        {
          checkInId: 'chk-1',
          status: CHECK_IN_STATUS.COMPLETED,
          checkOutTime: '2026-02-12T11:00:00Z',
        },
        {
          checkInId: 'chk-2',
          status: CHECK_IN_STATUS.COMPLETED,
          checkOutTime: null, // Missing checkout time
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: mockCheckIns });

      const result = await getCompletedCheckIns();

      expect(result).toHaveLength(2);
      // Should not crash due to null checkOutTime
    });
  });
});

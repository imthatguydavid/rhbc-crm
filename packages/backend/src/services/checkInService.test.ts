import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { checkInChild } from './checkInService.js';

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
        room: 'Nursery'
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
        room: 'Nursery'
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
        room: 'Nursery'
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
        room: 'Nursery'
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
        room: 'Nursery'
      });

      // Assert
      expect(result.checkIn.checkOutPin).toBe(result.pin);
    });

    it('should prevent duplicate check-in for same child', async () => {
      // Arrange: Set up mock to return different responses for each call
      ddbMock
        .on(QueryCommand)
        .resolvesOnce({ Items: [] })        // 1st call: no duplicates
        .resolvesOnce({ Items: [{           // 2nd call: duplicate exists!
            checkInId: 'chk-existing',
            childId: 'per-test-123',
            status: 'active',
            checkInTime: '2026-02-04T10:00:00Z'
          }] });

      ddbMock.on(PutCommand).resolves({}); // PutCommand can use .resolves() (not Once)

      // Act: First check-in should succeed
      await checkInChild({
        childId: 'per-test-123',
        familyId: 'fam-test-456',
        room: 'Nursery'
      });

      // Assert: Second check-in should fail
      await expect(
        checkInChild({
          childId: 'per-test-123',
          familyId: 'fam-test-456',
          room: 'Nursery'
        })
      ).rejects.toThrow('Child is already checked in');
    });
  });
});
import { APIGatewayProxyHandler } from 'aws-lambda';
import { bulkCheckInChildren } from '../services/checkInService.js';
import { success, badRequest, serverError } from '../../shared/utils/response.js';
import { BulkCheckInChildrenRequest, BulkCheckInChildrenResponse } from '@rhbc-crm/shared';

/**
 * Lambda handler for bulk checking in multiple children with one PIN.
 *
 * Endpoint: POST /checkin/bulk
 *
 * Request body:
 * {
 *   familyId: string;
 *   childIds: string[];
 *   room: string;
 * }
 *
 * Response: 200 OK with check-ins array and shared PIN
 *
 * Errors:
 * - 400: Missing required fields or child already checked in
 * - 500: Internal server error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return badRequest('Request body is required');
    }

    const request: BulkCheckInChildrenRequest = JSON.parse(event.body);
    const { familyId, childIds, room } = request;

    // Validation
    if (!familyId) {
      return badRequest('familyId is required');
    }

    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return badRequest('childIds must be a non-empty array');
    }

    if (!room) {
      return badRequest('room is required');
    }

    // Bulk check-in
    const result: BulkCheckInChildrenResponse = await bulkCheckInChildren({
      familyId,
      childIds,
      room,
    });

    return success(result);
  } catch (error) {
    console.error('Error in bulkCheckIn handler:', error);

    if (error instanceof Error) {
      if (error.message.includes('already checked in')) {
        return badRequest(error.message);
      }
    }

    return serverError('Failed to check in children');
  }
};

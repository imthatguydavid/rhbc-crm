import { APIGatewayProxyHandler } from 'aws-lambda';
import { adminCheckOut } from '../services/checkInService.js';
import { success, badRequest, serverError } from '../../shared/utils/response.js';
import { AdminCheckOutRequest, AdminCheckOutResponse } from '@rhbc-crm/shared';

/**
 * Lambda handler for admin checkout (no PIN required).
 *
 * Endpoint: POST /checkin/:checkInId/checkout
 *
 * Request body:
 * {
 *   checkedOutBy: string;
 * }
 *
 * Response: 200 OK with updated check-in record
 *
 * Errors:
 * - 400: Missing checkedOutBy or check-in not found
 * - 500: Internal server error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const checkInId = event.pathParameters?.checkInId;

    if (!checkInId) {
      return badRequest('Check-in ID is required');
    }

    if (!event.body) {
      return badRequest('Request body is required');
    }

    const request: AdminCheckOutRequest = JSON.parse(event.body);
    const { checkedOutBy } = request;

    if (!checkedOutBy) {
      return badRequest('Name of person picking up is required');
    }

    // TODO: Get adminUserId from Cognito token when auth is implemented
    const result: AdminCheckOutResponse = await adminCheckOut(checkInId, request);

    return success(result);
  } catch (error) {
    console.error('Error in adminCheckOut handler:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('required') ||
        error.message.includes('already checked out')
      ) {
        return badRequest(error.message);
      }
    }

    return serverError('Failed to check out child');
  }
};

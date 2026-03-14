import { APIGatewayProxyHandler } from 'aws-lambda';
import { checkOutByPin } from '../services/checkInService.js';
import { success, badRequest, serverError } from '../../shared/utils/response.js';
import { CheckOutByPinRequest, CheckOutByPinResponse } from '@rhbc-crm/shared';

/**
 * Lambda handler for checking out children by PIN.
 *
 * Endpoint: POST /checkout/pin
 *
 * Request body:
 * {
 *   pin: string;
 *   checkedOutBy: string;
 * }
 *
 * Response: 200 OK with checked-out records
 *
 * Errors:
 * - 400: Invalid PIN or no active check-ins found
 * - 500: Internal server error
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return badRequest('Request body is required');
    }

    const request: CheckOutByPinRequest = JSON.parse(event.body);
    const { checkedOutBy, pin } = request;

    if (!pin) {
      return badRequest('PIN is required');
    }

    if (!checkedOutBy) {
      return badRequest('Name of person picking up is required');
    }

    // Check out by PIN
    const result: CheckOutByPinResponse = await checkOutByPin(request);

    return success(result);
  } catch (error) {
    console.error('Error in checkOutByPin handler:', error);

    if (error instanceof Error) {
      if (error.message.includes('No active check-ins')) {
        return badRequest(error.message);
      }
    }

    return serverError('Failed to check out children');
  }
};

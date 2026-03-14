import { APIGatewayProxyHandler } from 'aws-lambda';
import { validatePinForCheckout } from '../services/checkInService.js';
import { success, badRequest, serverError } from '../../shared/utils/response.js';
import { ValidatePinRequest, ValidatePinResponse } from '@rhbc-crm/shared';

/**
 * Lambda handler for validating a PIN before checkout.
 *
 * Endpoint: POST /checkout/pin/validate
 *
 * Request body:
 * {
 *   pin: string;
 * }
 *
 * Response: 200 OK with family info and parent options
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

    const request: ValidatePinRequest = JSON.parse(event.body);

    if (!request.pin) {
      return badRequest('PIN is required');
    }

    // Validate PIN and get family info
    const result: ValidatePinResponse = await validatePinForCheckout(request);

    return success(result);
  } catch (error) {
    console.error('Error in validatePinForCheckout handler:', error);

    if (error instanceof Error) {
      if (error.message.includes('No active check-ins') || error.message.includes('required')) {
        return badRequest(error.message);
      }
    }

    return serverError('Failed to validate PIN');
  }
};

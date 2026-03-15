import { APIGatewayProxyHandler } from 'aws-lambda';
import { validatePinForCheckout } from '../services/checkInService.js';
import { success, badRequest, serverError, appErrorResponse } from '../../shared/utils/response.js';
import { ERROR_CODE, ValidatePinRequest, ValidatePinResponse } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

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
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Request body is required');
    }

    const request: ValidatePinRequest = JSON.parse(event.body);

    if (!request.pin) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'PIN is required');
    }

    if (request.pin.length !== 4) {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'Valid 4-digit PIN is required');
    }

    // Validate PIN and get family info
    const result: ValidatePinResponse = await validatePinForCheckout(request);

    return success(result);
  } catch (error) {
    console.error('Error in validatePinForCheckout handler:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
};

import { APIGatewayProxyHandler } from 'aws-lambda';
import { checkOutByPin } from '../services/checkInService.js';
import { success, badRequest, serverError, appErrorResponse } from '../../shared/utils/response.js';
import { CheckOutByPinRequest, CheckOutByPinResponse, ERROR_CODE } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

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
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Request body is required');
    }

    const request: CheckOutByPinRequest = JSON.parse(event.body);
    const { checkedOutBy, pin } = request;

    if (!pin) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'PIN is required');
    }

    if (pin.length !== 4) {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'Valid 4-digit PIN is required');
    }

    if (!checkedOutBy) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Name of person picking up is required');
    }

    // Check out by PIN
    const result: CheckOutByPinResponse = await checkOutByPin(request);

    return success(result);
  } catch (error) {
    console.error('Error in checkOutByPin handler:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
};

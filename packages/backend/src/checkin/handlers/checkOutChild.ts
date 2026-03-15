import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { checkOutChild } from '../services/checkInService.js';
import { AppError } from '../../shared/utils/AppError';
import { success, badRequest, serverError, appErrorResponse } from '../../shared/utils/response';
import { CheckOutChildRequest, ERROR_CODE } from '@rhbc-crm/shared';

/**
 * Lambda handler for POST /checkout
 * Verifies PIN and checks out a child
 *
 * @example
 * POST /checkout
 * {
 *   "checkInId": "chk-1234567890-abc123",
 *   "pin": "5847"
 * }
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('POST /checkout - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Request body is required');
    }

    const request: CheckOutChildRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.checkInId || !request.pin) {
      return badRequest(
        ERROR_CODE.MISSING_REQUIRED_FIELD,
        'Missing required fields: checkInId, pin'
      );
    }

    // Check out child with PIN verification
    const checkIn = await checkOutChild(request);

    console.log(`Checked out child from check-in ${request.checkInId}`);

    return success({
      checkIn,
      message: 'Child checked out successfully',
    });
  } catch (error) {
    console.error('Error in checkOutChild handler:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
}

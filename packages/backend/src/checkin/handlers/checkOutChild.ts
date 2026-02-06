import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { checkOutChild } from '../services/checkInService.js';
import { success, badRequest, notFound, serverError } from '../../shared/utils/response';

/**
 * Request body for checking out a child
 */
interface CheckOutChildRequest {
  checkInId: string;
  pin: string;
}

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
      return badRequest('Request body is required');
    }

    const body: CheckOutChildRequest = JSON.parse(event.body);

    // Validate required fields
    if (!body.checkInId || !body.pin) {
      return badRequest('Missing required fields: checkInId, pin');
    }

    // Check out child with PIN verification
    const checkIn = await checkOutChild(body.checkInId, body.pin);

    console.log(`Checked out child from check-in ${body.checkInId}`);

    return success({
      checkIn,
      message: 'Child checked out successfully',
    });
  } catch (error) {
    console.error('Error in checkOutChild handler:', error);

    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message === 'Check-in not found') {
        return notFound('Check-in record not found');
      }
      if (error.message === 'Invalid PIN') {
        return badRequest('Incorrect PIN');
      }
      if (error.message === 'PIN must be 4 digits') {
        // ← ADD THIS
        return badRequest('PIN must be 4 digits');
      }
      if (error.message === 'Child already checked out') {
        return badRequest('Child has already been checked out');
      }

      return serverError(error.message);
    }

    return serverError('Failed to check out child');
  }
}

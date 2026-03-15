import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { checkInChild } from '../services/checkInService.js';
import { created, badRequest, serverError, appErrorResponse } from '../../shared/utils/response';
import { CheckInChildRequest, ERROR_CODE } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

/**
 * Lambda handler for POST /checkin
 * Checks in a child and generates a unique PIN for checkout
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('POST /checkin - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Request body is required');
    }

    const body: CheckInChildRequest = JSON.parse(event.body);

    // Validate required fields
    if (!body.childId || !body.familyId || !body.room) {
      return badRequest(
        ERROR_CODE.MISSING_REQUIRED_FIELD,
        'Missing required fields: childId, familyId, room'
      );
    }

    // Call service to handle business logic
    const result = await checkInChild({
      childId: body.childId,
      familyId: body.familyId,
      room: body.room,
    });

    console.log(`Checked in child ${body.childId} to ${body.room}, PIN: ${result.pin}`);

    return created(result);
  } catch (error) {
    console.error('Error in checkInChild handler:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
}

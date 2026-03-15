import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCompletedCheckIns } from '../services/checkInService.js';
import { success, serverError, appErrorResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/AppError';

/**
 * Lambda handler for getting completed check-ins.
 *
 * Endpoint: GET /checkins/completed
 *
 * Response: 200 OK with array of completed check-in records
 *
 * Errors:
 * - 500: Internal server error
 */
export const handler: APIGatewayProxyHandler = async () => {
  try {
    const checkIns = await getCompletedCheckIns();

    return success({ checkIns });
  } catch (error) {
    console.error('Error in getCompletedCheckIns handler:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
};

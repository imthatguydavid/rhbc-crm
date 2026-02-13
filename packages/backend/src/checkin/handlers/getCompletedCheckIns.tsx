import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCompletedCheckIns } from '../services/checkInService.js';
import { success, serverError } from '../../shared/utils/response.js';

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
    return serverError('Failed to fetch completed check-ins');
  }
};

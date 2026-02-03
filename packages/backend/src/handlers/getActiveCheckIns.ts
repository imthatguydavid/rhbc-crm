import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveCheckIns } from '../services/checkInService.js';
import { success, serverError } from '../utils/response.js';

/**
 * Lambda handler for GET /checkin/active
 * Returns all children currently checked in (not yet checked out)
 *
 * Useful for:
 * - Dashboard showing who's currently in childcare
 * - Staff knowing which rooms have children
 * - Parents seeing if their child is checked in
 *
 * @example
 * GET /checkin/active
 *
 * Returns:
 * {
 *   "checkIns": [
 *     {
 *       "checkInId": "chk-123",
 *       "childId": "per-456",
 *       "familyId": "fam-789",
 *       "room": "Nursery",
 *       "checkInTime": "2026-02-02T10:30:00Z",
 *       "checkOutTime": null
 *     }
 *   ],
 *   "count": 1
 * }
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('GET /checkin/active - Event:', JSON.stringify(event, null, 2));

  try {
    // Get all active check-ins
    const checkIns = await getActiveCheckIns();

    console.log(`Found ${checkIns.length} active check-ins`);

    return success({
      checkIns,
      count: checkIns.length,
    });
  } catch (error) {
    console.error('Error in getActiveCheckIns handler:', error);

    if (error instanceof Error) {
      return serverError(error.message);
    }

    return serverError('Failed to retrieve active check-ins');
  }
}
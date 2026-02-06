import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAllFamilies } from '../services/familyService.js';
import { success, serverError } from '../../shared/utils/response.js';

/**
 * Lambda handler for getting all families with optional filtering.
 *
 * Endpoint: GET /families
 *
 * Query parameters (all optional):
 * - search: Search term for lastName (case-insensitive partial match)
 * - status: Filter by status ('member' or 'guest')
 *
 * Examples:
 * - GET /families
 * - GET /families?search=Smith
 * - GET /families?status=member
 * - GET /families?search=Smith&status=member
 *
 * Returns: 200 OK with array of families
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse query parameters
    const search = event.queryStringParameters?.search;
    const status = event.queryStringParameters?.status as 'member' | 'guest' | undefined;

    // Validate status if provided
    if (status && status !== 'member' && status !== 'guest') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'status must be either "member" or "guest"',
        }),
      };
    }

    // Get families with filters
    const filters: any = {};
    if (search) filters.search = search;
    if (status) filters.status = status;

    const families = await getAllFamilies(Object.keys(filters).length > 0 ? filters : undefined);

    return success({
      families,
      count: families.length,
      filters: filters, // Return applied filters for transparency
    });
  } catch (error) {
    console.error('Error getting families:', error);
    return serverError('Failed to get families');
  }
};

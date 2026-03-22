import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAllFamilies } from '../services/familyService.js';
import { success, serverError, badRequest, appErrorResponse } from '../../shared/utils/response.js';
import { ERROR_CODE, type Family, type Person } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

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

type test = Family & { primaryParent?: Person };

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse query parameters
    const search = event.queryStringParameters?.search;
    const status = event.queryStringParameters?.status as 'member' | 'guest' | undefined;

    // Validate status if provided
    if (status && status !== 'member' && status !== 'guest') {
      return badRequest(ERROR_CODE.INVALID_STATUS, 'Status must be either "member" or "guest"');
    }

    // Get families with filters
    const filters: test = {};
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
    if (error instanceof AppError) {
      return appErrorResponse(error);
    }
    return serverError();
  }
};

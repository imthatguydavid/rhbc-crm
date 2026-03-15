import { APIGatewayProxyHandler } from 'aws-lambda';
import { deleteFamily } from '../services/familyService.js';
import { success, badRequest, serverError, appErrorResponse } from '../../shared/utils/response.js';
import { ERROR_CODE } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

/**
 * Lambda handler for soft deleting a family and all its members.
 *
 * Endpoint: DELETE /families/{familyId}
 *
 * Cascades soft delete to all people in the family.
 * All records remain in database but are filtered from queries.
 *
 * Returns: 200 OK with deleted Family object
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const familyId = event.pathParameters?.id;
    if (!familyId) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Family ID is required');
    }

    const family = await deleteFamily(familyId);

    return success({
      family,
      message: 'Family deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting family:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
};

import { APIGatewayProxyHandler } from 'aws-lambda';
import { deleteFamily } from '../services/familyService.js';
import { success, badRequest, notFound, serverError } from '../../shared/utils/response.js';

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
      return badRequest('Family ID is required');
    }

    const family = await deleteFamily(familyId);

    return success({
      family,
      message: 'Family deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting family:', error);

    if (error instanceof Error) {
      if (error.message === 'Family not found') {
        return notFound('Family not found');
      }
      if (error.message === 'Family already deleted') {
        return badRequest('Family already deleted');
      }
    }

    return serverError('Failed to delete family');
  }
};

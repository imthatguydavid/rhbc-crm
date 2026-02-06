import { APIGatewayProxyHandler } from 'aws-lambda';
import { deletePerson } from '../services/familyService.js';
import { success, badRequest, notFound, serverError } from '../../shared/utils/response.js';

/**
 * Lambda handler for soft deleting a person.
 *
 * Endpoint: DELETE /people/{personId}
 *
 * Marks person as deleted by setting deletedAt timestamp.
 * Person remains in database but is filtered out of queries.
 *
 * Returns: 200 OK with deleted Person object
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse person ID from path
    const personId = event.pathParameters?.id;
    if (!personId) {
      return badRequest('Person ID is required');
    }

    // Soft delete the person
    const person = await deletePerson(personId);

    return success({
      person,
      message: 'Person deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting person:', error);

    if (error instanceof Error) {
      if (error.message === 'Person not found') {
        return notFound('Person not found');
      }
      if (error.message === 'Person already deleted') {
        return badRequest('Person already deleted');
      }
    }

    return serverError('Failed to delete person');
  }
};

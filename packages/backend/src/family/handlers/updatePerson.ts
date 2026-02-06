import { APIGatewayProxyHandler } from 'aws-lambda';
import { updatePerson } from '../services/familyService.js';
import { success, badRequest, notFound, serverError } from '../../shared/utils/response.js';

/**
 * Lambda handler for updating a person's information.
 *
 * Endpoint: PUT /people/{personId}
 *
 * Request body (all fields optional):
 * {
 *   firstName?: string
 *   phone?: string
 *   email?: string
 * }
 *
 * Returns: 200 OK with updated Person object
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse person ID from path
    const personId = event.pathParameters?.id;
    if (!personId) {
      return badRequest('Person ID is required');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { firstName, phone, email } = body;

    // Validate at least one field is provided
    if (!firstName && !phone && !email) {
      return badRequest('At least one field must be provided to update');
    }

    // Validate firstName if provided
    if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length < 2)) {
      return badRequest('firstName must be at least 2 characters');
    }

    // Update person
    const updates: any = {};
    if (firstName) updates.firstName = firstName.trim();
    if (phone) updates.phone = phone.trim();
    if (email) updates.email = email.trim();

    const person = await updatePerson(personId, updates);

    return success({ person });
  } catch (error) {
    console.error('Error updating person:', error);

    if (error instanceof Error && error.message === 'Person not found') {
      return notFound('Person not found');
    }

    return serverError('Failed to update person');
  }
};

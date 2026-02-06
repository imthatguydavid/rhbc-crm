import { APIGatewayProxyHandler } from 'aws-lambda';
import { updateFamily } from '../services/familyService.js';
import { success, badRequest, notFound, serverError } from '../../shared/utils/response.js';

/**
 * Lambda handler for updating a family's information.
 *
 * Endpoint: PUT /families/{familyId}
 *
 * Request body (all fields optional):
 * {
 *   lastName?: string
 *   status?: 'member' | 'guest'
 * }
 *
 * Returns: 200 OK with updated Family object
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse family ID from path
    const familyId = event.pathParameters?.id;
    if (!familyId) {
      return badRequest('Family ID is required');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { lastName, status } = body;

    // Validate at least one field is provided
    if (!lastName && !status) {
      return badRequest('At least one field must be provided to update');
    }

    // Validate lastName if provided
    if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length < 2)) {
      return badRequest('lastName must be at least 2 characters');
    }

    // Validate status if provided
    if (status !== undefined && status !== 'member' && status !== 'guest') {
      return badRequest('status must be either "member" or "guest"');
    }

    // Update family
    const updates: any = {};
    if (lastName) updates.lastName = lastName.trim();
    if (status) updates.status = status;

    const family = await updateFamily(familyId, updates);

    return success({ family });
  } catch (error) {
    console.error('Error updating family:', error);

    if (error instanceof Error && error.message === 'Family not found') {
      return notFound('Family not found');
    }

    return serverError('Failed to update family');
  }
};

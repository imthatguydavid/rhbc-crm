import { APIGatewayProxyHandler } from 'aws-lambda';
import { addChildToFamily } from '../services/familyService.js';
import { created, badRequest, notFound, serverError } from '../../shared/utils/response.js';

/**
 * Lambda handler for adding a child to a family.
 *
 * Endpoint: POST /families/{familyId}/children
 *
 * Request body:
 * {
 *   firstName: string (required)
 *   phone?: string
 *   email?: string
 * }
 *
 * Returns: 201 Created with child Person object
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
    const { firstName, phone, email } = body;

    // Validate required fields
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      return badRequest('firstName is required and must be at least 2 characters');
    }

    // Call service to handle business logic
    const child = await addChildToFamily(familyId, {
      firstName: firstName.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
    });

    return created({ child });
  } catch (error) {
    console.error('Error adding child:', error);

    if (error instanceof Error && error.message === 'Family not found') {
      return notFound('Family not found');
    }

    return serverError('Failed to add child to family');
  }
};

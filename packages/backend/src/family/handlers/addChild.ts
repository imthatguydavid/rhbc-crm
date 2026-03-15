import { APIGatewayProxyHandler } from 'aws-lambda';
import { addChildToFamily } from '../services/familyService.js';
import { created, badRequest, serverError } from '../../shared/utils/response.js';
import { AddChildToFamilyRequest, Person, ERROR_CODE } from '@rhbc-crm/shared';
import { appErrorResponse } from '../../shared/utils/response.js';
import { AppError } from '../../shared/utils/AppError';

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
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Family ID is required');
    }

    // Parse request body
    const request: AddChildToFamilyRequest = JSON.parse(event.body || '{}');
    const { firstName, phone, email } = request;

    // Validate required fields
    if (!firstName) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'First name is required');
    }

    if (firstName.trim().length < 2) {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'First name must be at least 2 characters');
    }

    // Call service to handle business logic
    const child: Person = await addChildToFamily(familyId, {
      firstName: firstName.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
    });

    return created({ child });
  } catch (error) {
    console.error('Error adding child:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
};

import { APIGatewayProxyHandler } from 'aws-lambda';
import { updateFamily } from '../services/familyService.js';
import { success, badRequest, serverError, appErrorResponse } from '../../shared/utils/response.js';
import { ERROR_CODE, UpdateFamilyRequest } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

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
    if (!event.body) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Request body is required');
    }

    // Parse family ID from path
    const familyId = event.pathParameters?.id;
    if (!familyId) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Family ID is required');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { lastName, status } = body;

    // Validate at least one field is provided
    if (!lastName && !status) {
      return badRequest(
        ERROR_CODE.NO_UPDATE_FIELDS,
        'At least one field must be provided to update'
      );
    }

    // Validate lastName if provided
    if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length < 2)) {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'lastName must be at least 2 characters');
    }

    // Validate status if provided
    if (status !== undefined && status !== 'member' && status !== 'guest') {
      return badRequest(ERROR_CODE.INVALID_STATUS, 'status must be either "member" or "guest"');
    }

    // Update family
    const updates: UpdateFamilyRequest = {};
    if (lastName) updates.lastName = lastName.trim();
    if (status) updates.status = status;

    const family = await updateFamily(familyId, updates);

    return success({ family });
  } catch (error) {
    console.error('Error updating family:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
};

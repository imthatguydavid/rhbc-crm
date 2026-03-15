import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, badRequest, serverError, appErrorResponse } from '../../shared/utils/response';
import { createFamilyWithParent } from '../services/familyService.js';
import { CreateFamilyRequest, ERROR_CODE } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

/**
 * Lambda handler for POST /families
 * Creates a new family with primary contact parent
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('POST /families - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Request body is required');
    }

    const body: CreateFamilyRequest = JSON.parse(event.body);

    // Validate required fields
    if (!body.lastName) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Missing required fields: lastName');
    }
    if (!body.status) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Missing required fields: status');
    }
    if (!body.parentFirstName) {
      return badRequest(
        ERROR_CODE.MISSING_REQUIRED_FIELD,
        'Missing required fields: parentFirstName'
      );
    }
    if (!body.parentPhone) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Missing required fields: parentPhone');
    }

    // Validate status
    if (body.status !== 'member' && body.status !== 'guest') {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'Status must be either "member" or "guest"');
    }

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(body.parentPhone)) {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'Phone must be exactly 10 digits');
    }

    // Validate email if provided
    if (body.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.parentEmail)) {
      return badRequest(ERROR_CODE.INVALID_FORMAT, 'Invalid email format');
    }

    // Call service to handle business logic
    const result = await createFamilyWithParent({
      lastName: body.lastName,
      status: body.status,
      parentFirstName: body.parentFirstName,
      parentPhone: body.parentPhone,
      parentEmail: body.parentEmail,
    });

    console.log(`Created family ${result.family.familyId} with parent ${result.parent.personId}`);

    return created(result);
  } catch (error) {
    console.error('Error in createFamily handler:', error);

    if (error instanceof AppError) {
      return appErrorResponse(error);
    }

    return serverError();
  }
}

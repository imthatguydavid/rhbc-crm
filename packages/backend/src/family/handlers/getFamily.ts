import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getFamilyById, getPeopleByFamily } from '../services/familyService.js';
import {
  success,
  badRequest,
  notFound,
  serverError,
  appErrorResponse,
} from '../../shared/utils/response';
import { ERROR_CODE } from '@rhbc-crm/shared';
import { AppError } from '../../shared/utils/AppError';

/**
 * Lambda handler for GET /families/{id}
 * Returns a single family with all members
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /families/{id} - Event:', JSON.stringify(event, null, 2));

  try {
    // Get family ID from path parameters
    const familyId = event.pathParameters?.id;

    if (!familyId) {
      return badRequest(ERROR_CODE.MISSING_REQUIRED_FIELD, 'Family ID is required');
    }

    // Get family
    const family = await getFamilyById(familyId);

    if (!family) {
      return notFound(ERROR_CODE.FAMILY_NOT_FOUND, `Family with ID ${familyId} not found`);
    }

    // Get all people in this family
    const people = await getPeopleByFamily(familyId);

    console.log(`Retrieved family ${familyId} with ${people.length} members`);

    return success({
      family,
      people,
    });
  } catch (error) {
    console.error('Error in getFamily handler:', error);
    if (error instanceof AppError) {
      return appErrorResponse(error);
    }
    return serverError();
  }
}

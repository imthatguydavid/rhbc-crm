import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getFamilyById, getPeopleByFamily } from '../services/familyService.js';
import { success, badRequest, notFound, serverError } from '../utils/response.js';

/**
 * Lambda handler for GET /families/{id}
 * Returns a single family with all members
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('GET /families/{id} - Event:', JSON.stringify(event, null, 2));

  try {
    // Get family ID from path parameters
    const familyId = event.pathParameters?.id;

    if (!familyId) {
      return badRequest('Family ID is required');
    }

    // Get family
    const family = await getFamilyById(familyId);

    if (!family) {
      return notFound(`Family with ID ${familyId} not found`);
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
    return serverError('Failed to retrieve family');
  }
}
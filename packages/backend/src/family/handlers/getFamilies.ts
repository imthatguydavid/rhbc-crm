import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAllFamilies } from '../services/familyService.js';
import { success, serverError } from '../../shared/utils/response';

/**
 * Lambda handler for GET /families
 * Returns all families in the system
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('GET /families - Event:', JSON.stringify(event, null, 2));

  try {
    const families = await getAllFamilies();

    console.log(`Retrieved ${families.length} families`);

    return success({
      families,
      count: families.length,
    });
  } catch (error) {
    console.error('Error in getFamilies handler:', error);
    return serverError('Failed to retrieve families');
  }
}

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { created, badRequest, serverError } from '../../shared/utils/response';
import { createFamilyWithParent } from '../services/familyService.js';

/**
 * Request body structure for creating a family
 */
interface CreateFamilyRequest {
  lastName: string;
  status: 'member' | 'guest';
  parentFirstName: string;
  parentPhone: string;
  parentEmail?: string;
}

/**
 * Lambda handler for POST /families
 * Creates a new family with primary contact parent
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('POST /families - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return badRequest('Request body is required');
    }

    const body: CreateFamilyRequest = JSON.parse(event.body);

    // Validate required fields
    if (!body.lastName || !body.status || !body.parentFirstName || !body.parentPhone) {
      return badRequest('Missing required fields: lastName, status, parentFirstName, parentPhone');
    }

    // Validate status
    if (body.status !== 'member' && body.status !== 'guest') {
      return badRequest('Status must be either "member" or "guest"');
    }

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(body.parentPhone)) {
      return badRequest('Phone must be exactly 10 digits');
    }

    // Validate email if provided
    if (body.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.parentEmail)) {
      return badRequest('Invalid email format');
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

    if (error instanceof Error) {
      return serverError(error.message);
    }

    return serverError('Failed to create family');
  }
}

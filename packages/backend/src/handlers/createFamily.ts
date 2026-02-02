import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { Family, Person } from '@rhbc-crm/shared';
import { createFamily, createPerson } from '../services/familyService.js';
import { created, badRequest, serverError } from '../utils/response.js';

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
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
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

    // Generate IDs
    const familyId = `fam-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const personId = `per-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    // Create family
    const family: Family = {
      familyId,
      pk: 'FAMILY',
      lastName: body.lastName,
      status: body.status,
      createdAt: now,
      updatedAt: now,
    };

    // Create parent person
    const parent: Person = {
      personId,
      familyId,
      firstName: body.parentFirstName,
      phone: body.parentPhone,
      email: body.parentEmail,
      role: 'parent',
      createdAt: now,
      updatedAt: now,
    };

    // Save to DynamoDB
    await createFamily(family);
    await createPerson(parent);

    console.log(`Created family ${familyId} with parent ${personId}`);

    return created({
      family,
      parent,
    });
  } catch (error) {
    console.error('Error in createFamily handler:', error);

    if (error instanceof Error) {
      return serverError(error.message);
    }

    return serverError('Failed to create family');
  }
}
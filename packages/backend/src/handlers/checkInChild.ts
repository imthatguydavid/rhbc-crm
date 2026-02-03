import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { CheckIn } from '@rhbc-crm/shared';
import { createCheckIn } from '../services/checkInService.js';
import { created, badRequest, serverError } from '../utils/response.js';

/**
 * Request body for checking in a child
 */
interface CheckInChildRequest {
  childId: string;
  familyId: string;
  room: string;
}

/**
 * Lambda handler for POST /checkin
 * Checks in a child and generates a unique PIN for checkout
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('POST /checkin - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return badRequest('Request body is required');
    }

    const body: CheckInChildRequest = JSON.parse(event.body);

    // Validate required fields
    if (!body.childId || !body.familyId || !body.room) {
      return badRequest('Missing required fields: childId, familyId, room');
    }

    // Generate check-in ID and PIN
    const checkInId = `chk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const checkOutPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
    const now = new Date().toISOString();

    // Create check-in record
    const checkIn: CheckIn = {
      checkInId,
      childId: body.childId,
      familyId: body.familyId,
      checkInTime: now,
      checkOutTime: null,
      checkOutPin,
      checkOutMethod: null,
      manualOverrideNotes: null,
      room: body.room,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    // Save to DynamoDB
    await createCheckIn(checkIn);

    console.log(`Checked in child ${body.childId} to ${body.room}, PIN: ${checkOutPin}`);

    return created({
      checkIn,
      pin: checkOutPin, // Return PIN to show parent
    });
  } catch (error) {
    console.error('Error in checkInChild handler:', error);

    if (error instanceof Error) {
      return serverError(error.message);
    }

    return serverError('Failed to check in child');
  }
}
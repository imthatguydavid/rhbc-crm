/**
 * API client for RHBC CRM backend.
 * Provides methods to interact with families and people endpoints.
 *
 * Base URL points to AWS API Gateway which routes to Lambda functions.
 */

import { getApiUrl, API_ENDPOINTS, API_CONFIG } from '@/config/api';
import {
  CheckIn,
  CheckInChildRequest,
  CheckInChildResponse,
  CheckOutChildRequest,
  CheckOutChildResponse,
  CreateFamilyRequest,
  CreateFamilyResponse,
  GetFamilyResponse,
  AddChildToFamilyRequest,
  AddChildToFamilyResponse,
} from '@rhbc-crm/shared';

/**
 * Retrieves all families from the database.
 *
 * Calls GET /families endpoint which queries DynamoDB using
 * the pk-createdAt-index GSI for efficient retrieval.
 *
 * @returns Promise that resolves to array of Family objects
 * @throws {Error} If the API request fails or returns non-200 status
 *
 * @example
 * ```typescript
 * const families = await getFamilies();
 * console.log(`Found ${families.length} families`);
 * ```
 */

/**
 * Parses error response from API and throws with meaningful message
 */
async function handleErrorResponse(response: Response, fallbackMessage: string): Promise<never> {
  try {
    const error = await response.json();
    throw new Error(error.error || error.message || fallbackMessage);
  } catch {
    throw new Error(fallbackMessage);
  }
}

export async function getFamilies() {
  const response = await fetch(getApiUrl(API_ENDPOINTS.GET_FAMILIES), {
    ...API_CONFIG,
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch family');
  }

  const data = await response.json();
  return data.families; // API returns { families: [...], count: n }
}

/**
 * Creates a new family with a primary parent contact.
 *
 * Generates unique IDs for both family and parent, creates records
 * in both DynamoDB tables (rhbc-families and rhbc-people), and
 * returns the created entities.
 *
 * @param request - Family and parent information
 * @param request.lastName - Family surname (min 2 characters)
 * @param request.status - Family status: "member" or "guest"
 * @param request.parentFirstName - Primary parent's first name (required)
 * @param request.parentPhone - Primary parent's phone (10 digits, no formatting)
 * @param request.parentEmail - Primary parent's email (optional)
 *
 * @returns Promise that resolves to object containing created family and parent
 * @returns Returns { family: Family, parent: Person }
 *
 * @throws {Error} If validation fails (400 Bad Request)
 * @throws {Error} If family ID already exists (409 Conflict)
 * @throws {Error} If API request fails (500 Internal Server Error)
 *
 * @example
 * ```typescript
 * const result = await createFamily({
 *   lastName: 'Smith',
 *   status: 'member',
 *   parentFirstName: 'John',
 *   parentPhone: '7145551234',
 *   parentEmail: 'john.smith@email.com'
 * });
 *
 * console.log(`Created family: ${result.family.familyId}`);
 * console.log(`Created parent: ${result.parent.personId}`);
 * ```
 */
export async function createFamily(request: CreateFamilyRequest): Promise<CreateFamilyResponse> {
  const response = await fetch(getApiUrl(API_ENDPOINTS.CREATE_FAMILY), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to create family');
  }

  return await response.json(); // Returns { family, parent }
}

/**
 * Retrieves a single family by ID along with all family members.
 *
 * Performs two operations:
 * 1. GetItem on rhbc-families table to fetch family record
 * 2. Query on rhbc-people table using familyId-index GSI to fetch all members
 *
 * @param familyId - Unique family identifier (format: fam-timestamp-randomstring)
 *
 * @returns Promise that resolves to object containing family and its members
 * @returns Returns { family: Family, people: Person[] }
 *
 * @throws {Error} If family is not found (404 Not Found)
 * @throws {Error} If API request fails (500 Internal Server Error)
 *
 * @example
 * ```typescript
 * const { family, people } = await getFamilyById('fam-1738425600000-x7k9m2p');
 *
 * console.log(`Family: ${family.lastName}`);
 * console.log(`Members: ${people.length}`);
 *
 * people.forEach(person => {
 *   console.log(`- ${person.firstName} (${person.role})`);
 * });
 * ```
 */
export async function getFamilyById(familyId: string): Promise<GetFamilyResponse> {
  const response = await fetch(getApiUrl(API_ENDPOINTS.GET_FAMILY(familyId)), {
    ...API_CONFIG,
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch family');
  }

  return await response.json(); // Returns { family, people }
}

/**
 * Checks in a child to childcare and generates a secure PIN.
 *
 * Creates a check-in record in DynamoDB with an automatically generated
 * 4-digit PIN that parents must provide at pickup. The PIN is returned
 * immediately and should be displayed prominently to the parent.
 *
 * @param data - Check-in information
 * @param data.childId - Unique child identifier from Person table
 * @param data.familyId - Unique family identifier
 * @param data.room - Childcare room assignment (e.g., "Nursery", "Toddler Room")
 *
 * @returns Promise that resolves to check-in record with PIN
 * @returns Returns { checkIn: CheckIn, pin: string }
 *
 * @throws {Error} If child is already checked in (400 Bad Request)
 * @throws {Error} If required fields are missing (400 Bad Request)
 * @throws {Error} If API request fails (500 Internal Server Error)
 *
 * @example
 * ```typescript
 * const result = await checkInChild({
 *   childId: 'per-1738425600000-abc123',
 *   familyId: 'fam-1738425600000-xyz789',
 *   room: 'Nursery'
 * });
 *
 * console.log(`Check-in created: ${result.checkIn.checkInId}`);
 * console.log(`PIN for pickup: ${result.pin}`);
 * // Display PIN prominently: result.pin is a 4-digit string like "4289"
 * ```
 */
export async function checkInChild(data: CheckInChildRequest): Promise<CheckInChildResponse> {
  const response = await fetch(getApiUrl(API_ENDPOINTS.CHECKIN), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to check in child');
  }

  return await response.json();
}

/**
 * Retrieves all children currently checked in to childcare.
 *
 * Queries DynamoDB using status-checkInTime-index GSI to efficiently
 * fetch only active check-ins (children not yet picked up). Results are
 * sorted by check-in time with newest first.
 *
 * This endpoint uses Query operation (not Scan) for optimal performance.
 *
 * @returns Promise that resolves to array of active CheckIn records
 * @returns Each CheckIn includes: childId, familyId, room, checkInTime, PIN
 *
 * @throws {Error} If API request fails (500 Internal Server Error)
 *
 * @example
 * ```typescript
 * const activeCheckIns = await getActiveCheckIns();
 *
 * console.log(`${activeCheckIns.length} children currently checked in`);
 *
 * activeCheckIns.forEach(checkIn => {
 *   console.log(`Child: ${checkIn.childId}`);
 *   console.log(`Room: ${checkIn.room}`);
 *   console.log(`PIN: ${checkIn.checkOutPin}`);
 * });
 * ```
 */
export async function getActiveCheckIns() {
  const response = await fetch(getApiUrl(API_ENDPOINTS.ACTIVE_CHECKINS), {
    ...API_CONFIG,
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get active check-ins');
  }

  const data = await response.json();
  return data.checkIns;
}

/**
 * Checks out a child from childcare with PIN verification.
 *
 * Verifies the provided PIN matches the one generated at check-in,
 * then marks the check-in as completed and records the checkout time.
 * This is the secure release mechanism for child pickup.
 *
 * @param request.checkInId - Unique check-in identifier to checkout
 * @param request.pin - 4-digit PIN provided by parent (must match check-in PIN)
 *
 * @returns Promise that resolves to checkout confirmation
 * @returns Returns { checkIn: CheckIn, message: string }
 *
 * @throws {Error} If PIN is incorrect (400 Bad Request)
 * @throws {Error} If check-in not found (404 Not Found)
 * @throws {Error} If child already checked out (400 Bad Request)
 * @throws {Error} If API request fails (500 Internal Server Error)
 *
 * @example
 * ```typescript
 * try {
 *   const result = await checkOutChild({
 *     checkInId: 'chk-1738425600000-abc123',
 *     pin: '4289'
 *   });
 *
 *   console.log(result.message); // "Child checked out successfully"
 *   console.log(`Checked out at: ${result.checkIn.checkOutTime}`);
 * } catch (error) {
 *   console.error('Checkout failed:', error.message);
 *   // Error might be: "Incorrect PIN" or "Child already checked out"
 * }
 * ```
 */
export async function checkOutChild(request: CheckOutChildRequest): Promise<CheckOutChildResponse> {
  const response = await fetch(getApiUrl(API_ENDPOINTS.CHECKOUT), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to check out child');
  }

  return await response.json();
}

/**
 * Adds a child to an existing family.
 *
 * @param familyId - Family ID to add child to
 * @param childData - Child information
 * @returns Promise that resolves to created child Person record
 * @throws {Error} If family not found or API request fails
 */
export async function addChildToFamily(
  familyId: string,
  childData: AddChildToFamilyRequest
): Promise<AddChildToFamilyResponse> {
  const response = await fetch(getApiUrl(`/families/${familyId}/children`), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify(childData),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to add child');
  }

  const data = await response.json();
  return data.child;
}

/**
 * Updates a person's information.
 *
 * @param personId - Person ID to update
 * @param updates - Fields to update (all optional)
 * @returns Promise that resolves to updated Person record
 * @throws {Error} If person not found or API request fails
 */
export async function updatePerson(
  personId: string,
  updates: {
    firstName?: string;
    phone?: string;
    email?: string;
  }
) {
  const response = await fetch(getApiUrl(`/people/${personId}`), {
    ...API_CONFIG,
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to update person');
  }

  const data = await response.json();
  return data.child;
}

/**
 * Updates a family's information.
 *
 * @param familyId - Family ID to update
 * @param updates - Fields to update (all optional)
 * @returns Promise that resolves to updated Family record
 * @throws {Error} If family not found or API request fails
 */
export async function updateFamily(
  familyId: string,
  updates: {
    lastName?: string;
    status?: 'member' | 'guest';
  }
) {
  const response = await fetch(getApiUrl(`/families/${familyId}`), {
    ...API_CONFIG,
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to update family');
  }

  const data = await response.json();
  return data.family;
}

/**
 * Soft deletes a person (marks as deleted).
 *
 * @param personId - Person ID to delete
 * @returns Promise that resolves to deleted Person record
 * @throws {Error} If person not found, already deleted, or API request fails
 */
export async function deletePerson(personId: string) {
  const response = await fetch(getApiUrl(`/people/${personId}`), {
    ...API_CONFIG,
    method: 'DELETE',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to delete person');
  }

  const data = await response.json();
  return data.person;
}

/**
 * Searches/filters families by lastName and/or status.
 *
 * @param filters - Optional search filters
 * @returns Promise that resolves to array of Family objects
 * @throws {Error} If API request fails
 */
export async function searchFamilies(filters?: { search?: string; status?: 'member' | 'guest' }) {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);

  const url = params.toString()
    ? `${getApiUrl(API_ENDPOINTS.GET_FAMILIES)}?${params}`
    : getApiUrl(API_ENDPOINTS.GET_FAMILIES);

  const response = await fetch(url, {
    ...API_CONFIG,
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to search families');
  }

  const data = await response.json();
  return data.families;
}

/**
 * Bulk check-in multiple children with one PIN.
 * Used for kiosk mode where parents check in multiple kids together.
 */
export async function bulkCheckInChildren(data: {
  familyId: string;
  childIds: string[];
  room: string;
}) {
  const response = await fetch(getApiUrl('/checkin/bulk'), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to bulk check-in');
  }

  return await response.json();
}

/**
 * Check out all children with a PIN.
 * Used for kiosk mode where one PIN checks out multiple kids.
 */
export async function checkOutByPin(pin: string, checkedOutBy: string) {
  const response = await fetch(getApiUrl('/checkout/pin'), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify({ pin, checkedOutBy }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to check out');
  }

  return await response.json();
}

/**
 * Validate PIN and get family info for checkout selection.
 */
export async function validatePinForCheckout(pin: string) {
  const response = await fetch(getApiUrl('/checkout/pin/validate'), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to validate PIN');
  }

  return await response.json();
}

/**
 * Admin checkout - check out a child without PIN.
 * Used by staff in the admin portal.
 */
export async function adminCheckOut(checkInId: string, checkedOutBy: string) {
  const response = await fetch(getApiUrl(`/checkin/${checkInId}/checkout`), {
    ...API_CONFIG,
    method: 'POST',
    body: JSON.stringify({ checkedOutBy }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to check out');
  }

  return await response.json();
}

/**
 * Get all completed check-ins (history)
 */
export async function getCompletedCheckIns(): Promise<CheckIn[]> {
  const response = await fetch(getApiUrl(`/checkins/completed`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to fetch completed check-ins');
  }

  const data = await response.json();
  return data.checkIns;
}

/**
 * Soft deletes a family and all its members.
 *
 * @param familyId - Family ID to delete
 * @returns Promise that resolves to deleted Family record
 * @throws {Error} If family not found or already deleted
 */
export async function deleteFamily(familyId: string) {
  const response = await fetch(getApiUrl(`/families/${familyId}`), {
    ...API_CONFIG,
    method: 'DELETE',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to delete family');
  }

  return await response.json();
}

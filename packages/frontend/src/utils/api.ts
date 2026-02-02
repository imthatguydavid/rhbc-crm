/**
 * API client for RHBC CRM backend.
 * Provides methods to interact with families and people endpoints.
 *
 * Base URL points to AWS API Gateway which routes to Lambda functions.
 */

/**
 * Base URL for the RHBC CRM API.
 * Points to AWS API Gateway dev stage.
 *
 * @constant
 */
const API_BASE_URL = 'https://xvq0jeloif.execute-api.us-west-2.amazonaws.com/dev';

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
export async function getFamilies() {
  const response = await fetch(`${API_BASE_URL}/families`);

  if (!response.ok) {
    throw new Error(`Failed to fetch families: ${response.statusText}`);
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
 * @param familyData - Family and parent information
 * @param familyData.lastName - Family surname (min 2 characters)
 * @param familyData.status - Family status: "member" or "guest"
 * @param familyData.parentFirstName - Primary parent's first name (required)
 * @param familyData.parentPhone - Primary parent's phone (10 digits, no formatting)
 * @param familyData.parentEmail - Primary parent's email (optional)
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
export async function createFamily(familyData: {
  lastName: string;
  status: 'member' | 'guest';
  parentFirstName: string;
  parentPhone: string;
  parentEmail?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/families`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(familyData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create family: ${response.statusText}`);
  }

  const data = await response.json();
  return data; // Returns { family, parent }
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
export async function getFamilyById(familyId: string) {
  const response = await fetch(`${API_BASE_URL}/families/${familyId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch family: ${response.statusText}`);
  }

  const data = await response.json();
  return data; // Returns { family, people }
}
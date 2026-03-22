/**
 * Represents an individual person (parent or child) in the church database.
 *
 * Each person belongs to a Family and has a role as either a parent (contact)
 * or child (requiring check-in tracking). Parents have contact information
 * while children may have allergies and special notes for childcare safety.
 */
export interface Person {
  personId: string;
  familyId: string;
  firstName: string;
  phone?: string;
  email?: string;
  role: 'parent' | 'child';
  allergies?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * Payload for adding a child to a family via POST /families/{familyId}/children.
 * familyId comes from the URL path parameter.
 */
export type AddChildToFamilyRequest = Pick<Person, 'firstName' | 'phone' | 'email'>;

/**
 * Response from POST /families/{familyId}/children.
 */
export interface AddChildToFamilyResponse {
  child: Person;
}

/**
 * Payload for updating a person via PUT /people/{personId}.
 * personId comes from the URL path parameter.
 * All fields optional — only provided fields are updated.
 */
export type UpdatePersonRequest = Partial<Pick<Person, 'firstName' | 'phone' | 'email'>>;

/**
 * Response from PUT /people/{personId}.
 */
export interface UpdatePersonResponse {
  person: Person;
}

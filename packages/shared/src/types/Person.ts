/**
 * Represents an individual person in the church database.
 *
 * People belong to families and can be either parents or children.
 * Parents have contact information, while children may have
 * allergy/medical notes for childcare.
 */
export interface Person {
  /**
   * Unique identifier for this person.
   * Generated as a UUID when person is created.
   *
   * @example "660e8400-e29b-41d4-a716-446655440001"
   */
  personId: string;

  /**
   * Reference to the family this person belongs to.
   * Foreign key to Family.familyId.
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  familyId: string;

  /**
   * Person's first name (given name).
   *
   * @example "Emma"
   */
  firstName: string;

  /**
   * Contact phone number (normalized to digits only). optional for children
   * Stored as digits, displayed with formatting: (XXX) XXX-XXXX
   *
   * @example "5551234567"
   */
  phone?: string;

  /**
   * Email address for communication.
   * Optional - not all people (especially children) have email.
   *
   * @example "emma.smith@example.com"
   */
  email?: string;

  /**
   * Role in family structure.
   * - "parent": Adult with contact/pickup authority
   * - "child": Minor being checked into childcare
   */
  role: 'parent' | 'child';

  /**
   * Allergy information for children.
   * Only used for children, helps staff during childcare.
   *
   * @example "Peanuts, dairy"
   */
  allergies?: string;

  /**
   * Additional notes about this person.
   * Can include medical info, special needs, preferences, etc.
   *
   * @example "Prefers to sit in front row"
   */
  notes?: string;

  /**
   * ISO 8601 timestamp when person record was created.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when person record was last updated.
   *
   * @example "2026-01-31T14:30:00.000Z"
   */
  updatedAt: string;
}
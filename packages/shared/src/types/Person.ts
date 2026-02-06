/**
 * Represents an individual person (parent or child) in the church database.
 *
 * Each person belongs to a Family and has a role as either a parent (contact)
 * or child (requiring check-in tracking). Parents have contact information
 * while children may have allergies and special notes for childcare safety.
 */
export interface Person {
  /**
   * Unique identifier for this person.
   * Generated as a timestamp-based ID when person is created.
   *
   * @example "per-1738425600000-a5n8k3r"
   */
  personId: string;

  /**
   * Reference to the family this person belongs to.
   * Links to Family.familyId for relationship tracking.
   *
   * @example "fam-1738425600000-x7k9m2p"
   */
  familyId: string;

  /**
   * Person's first name (given name).
   * Used for identification and display throughout the system.
   *
   * @example "Michael"
   * @example "Emma"
   */
  firstName: string;

  /**
   * Phone number for contact purposes.
   * Stored as 10 digits with no formatting (digits only).
   * Required for parents, optional for children (who don't have phones).
   *
   * @example "7145551234"
   * @example "3105559876"
   */
  phone?: string;

  /**
   * Email address for electronic communication.
   * Used for event notifications and family communications.
   * Optional field - not all families provide email.
   *
   * @example "michael.johnson@email.com"
   * @example "parent@church.org"
   */
  email?: string;

  /**
   * Person's role within the family unit.
   * - "parent": Adult contact/guardian with phone/email
   * - "child": Minor requiring check-in/check-out tracking
   *
   * Role determines which fields are required and how person
   * appears in check-in interface.
   *
   * @example "parent"
   * @example "child"
   */
  role: 'parent' | 'child';

  /**
   * Known allergies or medical conditions.
   * Critical safety information for childcare workers.
   * Only applicable to children - parents don't need this field.
   *
   * @example "Peanuts, Tree nuts"
   * @example "Dairy, Eggs"
   * @example "Bee stings (EpiPen required)"
   */
  allergies?: string;

  /**
   * Additional notes or special instructions.
   * Can include behavioral notes, pickup restrictions, or other
   * important information for childcare staff.
   *
   * @example "Needs EpiPen in classroom"
   * @example "Shy, needs gentle encouragement"
   * @example "Only release to parents, not siblings"
   */
  notes?: string;

  /**
   * ISO 8601 timestamp when person record was created.
   * Used for tracking when family members were added.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when person record was last updated.
   * Updated whenever any information changes.
   *
   * @example "2026-01-31T14:30:00.000Z"
   */
  updatedAt: string;

  /**
   * ISO 8601 timestamp when person record was deleted.
   * Updated whenever any information changes.
   *
   * @example "2026-01-31T14:30:00.000Z"
   */
  deletedAt?: string;
}

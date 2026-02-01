/**
 * Represents a family unit in the church database.
 *
 * A family groups related individuals (parents and children) together
 * for check-in purposes and contact management.
 */
export interface Family {
  /**
   * Unique identifier for this family.
   * Generated as a UUID when family is created.
   *
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  familyId: string;

  /**
   * Family last name (surname).
   * Used for searching and display purposes.
   *
   * @example "Smith"
   */
  lastName: string;

  /**
   * Guest or member status.
   * - "guest": First-time visitor, not yet a member
   * - "member": Regular church member
   */
  status: 'guest' | 'member';

  /**
   * ISO 8601 timestamp when family record was created.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when family record was last updated.
   *
   * @example "2026-01-31T14:30:00.000Z"
   */
  updatedAt: string;
}
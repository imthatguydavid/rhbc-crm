/**
 * Represents a family unit in the church database.
 *
 * A family groups related individuals (parents and children) together
 * for check-in purposes and contact management.
 */
export interface Family {
  /**
   * Unique identifier for this family.
   * Generated as a timestamp-based ID when family is created.
   *
   * @example "fam-1738425600000-x7k9m2p"
   */
  familyId: string;

  /**
   * Partition key for efficient querying via GSI.
   * Always set to constant value "FAMILY" for all family records.
   * Enables Query operations instead of Scan for better performance.
   *
   * @example "FAMILY"
   */
  pk: string;

  /**
   * Family last name (surname).
   * Used for searching, sorting, and display purposes.
   *
   * @example "Smith"
   * @example "Garcia"
   */
  lastName: string;

  /**
   * Family's status in the church.
   * - "guest": First-time visitor or occasional attendee
   * - "member": Regular church member with active membership
   *
   * @example "member"
   * @example "guest"
   */
  status: 'guest' | 'member';

  /**
   * ISO 8601 timestamp when family record was created.
   * Used for sorting families by registration date.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when family record was last updated.
   * Updated whenever any family information changes.
   *
   * @example "2026-01-31T14:30:00.000Z"
   */
  updatedAt: string;

  /**
   * ISO 8601 timestamp when family record was soft deleted.
   * When set, family is excluded from all queries.
   * Undefined for active families.
   *
   * @example "2026-03-08T00:00:00.000Z"
   */
  deletedAt?: string;
}

/**
 * Payload for creating a new family via POST /families.
 * Only includes fields the client is responsible for —
 * server generates familyId, pk, timestamps, etc.
 */
export type CreateFamilyRequest = {
  lastName: string;
  status: 'member' | 'guest';
  parentFirstName: string;
  parentPhone: string;
  parentEmail?: string;
};

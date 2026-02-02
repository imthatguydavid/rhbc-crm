/**
 * Represents a person's registration for a specific event.
 *
 * Tracks who has signed up for events using email as the primary identifier.
 * Automatically links to existing families when email matches, enabling
 * streamlined registration for returning attendees.
 */
export interface EventRegistration {
  /**
   * Unique identifier for this registration.
   * Generated as a timestamp-based ID when registration is created.
   *
   * @example "reg-1738425600000-t7m3n9k"
   */
  registrationId: string;

  /**
   * Reference to the event being registered for.
   * Links to Event.eventId.
   *
   * @example "evt-1738425600000-k2n9r5x"
   */
  eventId: string;

  /**
   * Email address of the registrant.
   * Used as primary identifier to match with existing families.
   * If email matches a Person.email, familyId can be auto-populated.
   *
   * @example "john.smith@email.com"
   * @example "guest@example.com"
   */
  email: string;

  /**
   * Registrant's first name (given name).
   * Collected even if person is not yet in system.
   *
   * @example "John"
   * @example "Sarah"
   */
  firstName: string;

  /**
   * Registrant's last name (surname).
   * Used along with firstName for identification.
   *
   * @example "Smith"
   * @example "Garcia"
   */
  lastName: string;

  /**
   * Reference to registrant's family, if known.
   * Automatically linked when email matches existing Person record.
   * Null for first-time visitors or guests not yet in database.
   *
   * This enables quick lookup of family information and
   * helps identify returning vs. new attendees.
   *
   * @example "fam-1738425600000-x7k9m2p"  // Known family
   * @example null  // New guest, no family record yet
   */
  familyId: string | null;

  /**
   * ISO 8601 timestamp when registration was submitted.
   * Used for tracking sign-up order and confirmation timing.
   *
   * @example "2026-02-01T14:30:00.000Z"
   */
  registeredAt: string;
}
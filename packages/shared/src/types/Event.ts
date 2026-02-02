/**
 * Represents a church event or activity available for registration.
 *
 * Events can be services, classes, retreats, or other church activities
 * that members and guests can register for. Supports capacity limits
 * and tracks event details for communication and planning.
 */
export interface Event {
  /**
   * Unique identifier for this event.
   * Generated as a timestamp-based ID when event is created.
   *
   * @example "evt-1738425600000-k2n9r5x"
   */
  eventId: string;

  /**
   * Event name or title.
   * Displayed in event listings and registration forms.
   *
   * @example "Sunday Service - 10:00 AM"
   * @example "Marriage Enrichment Retreat"
   * @example "Youth Group Game Night"
   */
  name: string;

  /**
   * Detailed event description.
   * Provides additional context about what to expect,
   * what to bring, target audience, etc.
   *
   * @example "Join us for worship, teaching, and fellowship"
   * @example "Weekend retreat for married couples. Includes meals and lodging."
   * @example "Games, pizza, and fun for middle and high school students"
   */
  description: string;

  /**
   * ISO 8601 timestamp for event date and time.
   * When the event is scheduled to begin.
   *
   * @example "2026-02-09T10:00:00.000Z"  // Sunday 10 AM
   * @example "2026-03-15T18:30:00.000Z"  // Friday 6:30 PM
   */
  date: string;

  /**
   * Physical location or venue for the event.
   * Can be a building, room, or off-site address.
   *
   * @example "Main Sanctuary"
   * @example "Fellowship Hall"
   * @example "Camp Cedar Crest, 123 Mountain Rd"
   */
  location: string;

  /**
   * Maximum number of registrants allowed.
   * Null means unlimited capacity.
   * Used to prevent over-booking and manage logistics.
   *
   * @example 200  // Sanctuary seats 200
   * @example 30   // Small group limit
   * @example null // Unlimited (like regular Sunday service)
   */
  capacity: number | null;

  /**
   * ISO 8601 timestamp when event record was created.
   * Used for tracking when event was added to system.
   *
   * @example "2026-01-15T08:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when event record was last updated.
   * Updated whenever event details are modified.
   *
   * @example "2026-01-20T14:30:00.000Z"
   */
  updatedAt: string;
}
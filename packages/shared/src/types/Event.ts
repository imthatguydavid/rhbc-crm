/**
 * Question configuration for event registration form.
 * Defines a custom question that event registrants will answer.
 */
export interface Question {
  /**
   * Unique identifier for this question.
   *
   * @example "q_550e8400"
   */
  questionId: string;

  /**
   * The question text shown to registrants.
   *
   * @example "Do you have any dietary restrictions?"
   */
  text: string;

  /**
   * Type of input field to display.
   * - "text": Free-form text input
   * - "email": Email address input with validation
   * - "phone": Phone number input with formatting
   * - "checkbox": Yes/No checkbox
   * - "dropdown": Select from predefined options
   */
  type: 'text' | 'email' | 'phone' | 'checkbox' | 'dropdown';

  /**
   * Whether this question must be answered.
   * If true, form cannot be submitted without an answer.
   */
  required: boolean;

  /**
   * Available options for dropdown questions.
   * Only used when type is "dropdown".
   *
   * @example ["Vegetarian", "Vegan", "Gluten-free", "No restrictions"]
   */
  options?: string[];
}

/**
 * Represents a church event that people can register for.
 *
 * Events have custom registration forms with configurable questions.
 * Each event generates a unique shareable link for public registration.
 */
export interface Event {
  /**
   * Unique identifier for this event.
   *
   * @example "880e8400-e29b-41d4-a716-446655440003"
   */
  eventId: string;

  /**
   * Event name/title.
   *
   * @example "Community Picnic" | "Christmas Service" | "Youth Retreat"
   */
  title: string;

  /**
   * Detailed event description.
   * Shown on registration form to help people understand the event.
   *
   * @example "Join us for our annual community picnic with games, food, and fellowship!"
   */
  description: string;

  /**
   * ISO 8601 timestamp for when the event occurs.
   *
   * @example "2026-06-15T14:00:00.000Z"
   */
  date: string;

  /**
   * Maximum number of registrations allowed.
   * Registration is closed once this limit is reached.
   *
   * @example 100
   */
  capacity: number;

  /**
   * Custom questions for this event's registration form.
   * Admin can add/remove/reorder questions as needed.
   *
   * @example [
   *   {
   *     questionId: "q1",
   *     text: "How many people in your group?",
   *     type: "text",
   *     required: true
   *   }
   * ]
   */
  questions: Question[];

  /**
   * ISO 8601 timestamp when event was created.
   *
   * @example "2026-01-31T12:00:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when event was last updated.
   *
   * @example "2026-01-31T14:30:00.000Z"
   */
  updatedAt: string;
}
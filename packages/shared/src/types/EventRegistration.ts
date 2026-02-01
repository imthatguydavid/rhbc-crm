/**
 * A response to a single event registration question.
 * Links a question to the registrant's answer.
 */
export interface Response {
  /**
   * Reference to the question being answered.
   * Corresponds to Question.questionId in the Event.
   *
   * @example "q_550e8400"
   */
  questionId: string;

  /**
   * The registrant's answer to this question.
   * Stored as string regardless of question type:
   * - text/email/phone: user's input
   * - checkbox: "true" or "false"
   * - dropdown: selected option value
   *
   * @example "Vegetarian" | "john@example.com" | "5551234567" | "true"
   */
  answer: string;
}

/**
 * Represents a registration for an event.
 *
 * Tracks who signed up, when they registered, and their answers
 * to custom event questions. Uses email as the primary identifier
 * (no phone matching for event registrations).
 */
export interface EventRegistration {
  /**
   * Unique identifier for this registration.
   *
   * @example "990e8400-e29b-41d4-a716-446655440004"
   */
  registrationId: string;

  /**
   * Reference to the event being registered for.
   * Foreign key to Event.eventId.
   *
   * @example "880e8400-e29b-41d4-a716-446655440003"
   */
  eventId: string;

  /**
   * Registrant's email address.
   * Primary identifier for registration (prevents duplicates).
   * Used for matching and communication.
   *
   * @example "sarah.jones@example.com"
   */
  email: string;

  /**
   * Answers to all event registration questions.
   * Array of questionId + answer pairs.
   *
   * @example [
   *   { questionId: "q1", answer: "No restrictions" },
   *   { questionId: "q2", answer: "5551234567" }
   * ]
   */
  responses: Response[];

  /**
   * ISO 8601 timestamp when registration was submitted.
   *
   * @example "2026-02-15T18:45:00.000Z"
   */
  registeredAt: string;

  /**
   * ISO 8601 timestamp when record was created.
   *
   * @example "2026-02-15T18:45:00.000Z"
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp when record was last updated.
   *
   * @example "2026-02-15T18:45:00.000Z"
   */
  updatedAt: string;
}
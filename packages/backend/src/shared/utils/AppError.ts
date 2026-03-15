import type { ErrorCode } from '@rhbc-crm/shared';

/**
 * Custom error class for known business/validation errors.
 * Carries error code and HTTP status.
 *
 * - 400 errors: validation failures, business rule violations
 * - 404 errors: resource not found
 * - Anything not thrown as AppError becomes a generic 500
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
  }
}

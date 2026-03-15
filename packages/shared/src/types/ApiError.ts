import type { ErrorCode } from '../constants/constants.js';

/**
 * Standard error response shape for all API endpoints.
 * Frontend can rely on this shape for every non-2xx response.
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}

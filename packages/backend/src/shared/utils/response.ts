import { ERROR_CODE } from '@rhbc-crm/shared';
import type { ErrorCode } from '@rhbc-crm/shared';

/**
 * Standard API response format for AWS Lambda
 */
export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * CORS headers for all responses
 */
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Create success response (200)
 */
export function success<T>(data: T): ApiResponse {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

/**
 * Create created response (201)
 */
export function created<T>(data: T): ApiResponse {
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

/**
 * Create standardized error response
 */
export function errorResponse(statusCode: number, code: ErrorCode, message: string): ApiResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      error: { code, message },
    }),
  };
}

/**
 * 400 Bad Request
 */
export function badRequest(code: ErrorCode, message: string): ApiResponse {
  return errorResponse(400, code, message);
}

/**
 * 404 Not Found
 */
export function notFound(code: ErrorCode, message: string): ApiResponse {
  return errorResponse(404, code, message);
}

/**
 * 500 Internal Server Error — always uses generic message
 */
export function serverError(): ApiResponse {
  return errorResponse(500, ERROR_CODE.INTERNAL_ERROR, 'Internal server error');
}

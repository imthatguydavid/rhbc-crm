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
  'Access-Control-Allow-Credentials': 'true', // ← Fixed: string not boolean
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
 * Create error response (400/500)
 */
export function error(statusCode: number, message: string): ApiResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ error: message }),
  };
}

/**
 * Create bad request response (400)
 */
export function badRequest(message: string): ApiResponse {
  return error(400, message);
}

/**
 * Create not found response (404)
 */
export function notFound(message: string = 'Resource not found'): ApiResponse {
  return error(404, message);
}

/**
 * Create internal server error response (500)
 */
export function serverError(message: string = 'Internal server error'): ApiResponse {
  return error(500, message);
}
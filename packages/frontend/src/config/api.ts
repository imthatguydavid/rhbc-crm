/**
 * API Configuration
 *
 * Centralized API endpoint configuration for the RHBC CRM backend.
 * Automatically uses the correct stage based on environment.
 */

/**
 * Determine the current stage based on environment
 */
const getStage = (): 'dev' | 'prod' => {
  // Check if we're in production build
  if (import.meta.env.MODE === 'production') {
    return 'prod';
  }
  return 'dev';
};

/**
 * Base URL for the backend API
 *
 * Dev: https://f8thjtmy3d.execute-api.us-west-2.amazonaws.com/dev
 * Prod: https://f8thjtmy3d.execute-api.us-west-2.amazonaws.com/prod
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `https://f8thjtmy3d.execute-api.us-west-2.amazonaws.com/${getStage()}`;

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Check-in endpoints
  CHECKIN: '/checkin',
  CHECKOUT: '/checkout',
  ACTIVE_CHECKINS: '/checkin/active',

  // Family endpoints
  CREATE_FAMILY: '/families',
  GET_FAMILIES: '/families',
  GET_FAMILY: (id: string) => `/families/${id}`,
} as const;

/**
 * Construct full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Common fetch configuration
 */
export const API_CONFIG: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  mode: 'cors',
};

/**
 * Log current API configuration (for debugging)
 */
if (import.meta.env.DEV) {
  console.log('🔗 API Configuration:');
  console.log(`   Base URL: ${API_BASE_URL}`);
  console.log(`   Stage: ${getStage()}`);
}

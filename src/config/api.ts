/**
 * API Configuration
 * Update the API_BASE_URL to point to your backend API
 * 
 * In development, use '/api' to leverage Vite proxy (avoids CORS)
 * In production, use full URL or set VITE_API_BASE_URL environment variable
 * 
 * To configure your API URL:
 * 1. Create a .env file in the project root
 * 2. Add: VITE_API_TARGET_URL=http://your-api-server.com
 *    (This is used by the Vite proxy in development)
 * 3. For production: VITE_API_BASE_URL=http://your-api-server.com/api
 */

// For development: use proxy path to avoid CORS
// For production: use full API URL
const isDevelopment = import.meta.env.DEV;

// Get environment variables safely
const getEnvVar = (key: string): string | undefined => {
  try {
    return import.meta.env[key];
  } catch {
    return undefined;
  }
};

const envApiUrl = getEnvVar('VITE_API_BASE_URL');

// Determine API base URL
let API_BASE_URL: string;
if (isDevelopment) {
  // Use proxy in development to avoid CORS
  // The proxy will forward /api/* to your actual API server
  API_BASE_URL = '/api';
} else {
  // In production, use environment variable or fallback
  API_BASE_URL = envApiUrl || 'http://localhost:3000/api';
}

// API Endpoints
export const API_ENDPOINTS = {
  QUOTES: `${API_BASE_URL}/quotes`,
  GET_QUOTES: `${API_BASE_URL}/quotes`, // POST endpoint to get quotes
  SAVE_INPUT: `${API_BASE_URL}/save-input`, // POST endpoint to save input.json
  RESET_INPUT: `${API_BASE_URL}/reset-input`, // POST endpoint to reset input.json from backup
} as const;

// Export for debugging
export { API_BASE_URL };

// Log API configuration in development
if (isDevelopment) {
  console.log('API Configuration:', {
    API_BASE_URL,
    isDevelopment,
    proxyTarget: 'Configure VITE_API_TARGET_URL in .env or vite.config.ts',
  });
}

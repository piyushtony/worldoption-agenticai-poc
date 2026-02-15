/**
 * API Configuration
 * Update the API_BASE_URL to point to your backend API
 * 
 * In development, use '/api' to leverage Vite proxy (avoids CORS)
 * In production, use full URL or set VITE_API_BASE_URL environment variable
 */

// For development: use proxy path to avoid CORS
// For production: use full API URL
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? '/api'  // Use proxy in development
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api');

// API Endpoints
export const API_ENDPOINTS = {
  QUOTES: `${API_BASE_URL}/quotes`,
  GET_QUOTES: `${API_BASE_URL}/quotes`, // POST endpoint to get quotes
} as const;

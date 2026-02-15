/**
 * API Configuration
 * Update the API_BASE_URL to point to your backend API
 */

// For development, you can use a local API or a remote API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  QUOTES: `${API_BASE_URL}/quotes`,
  GET_QUOTES: `${API_BASE_URL}/quotes`, // POST endpoint to get quotes
} as const;

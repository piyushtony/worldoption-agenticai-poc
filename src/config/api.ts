/**
 * API Configuration
 * Reads API_BASE_URL from config.json file at runtime
 * 
 * The config.json file should be in the public folder
 */

// Default API base URL (fallback if config.json is not available)
const DEFAULT_API_BASE_URL = 'https://xpqacwxtiw.us-east-2.awsapprunner.com';

// Cache for the API base URL
let API_BASE_URL: string = DEFAULT_API_BASE_URL;
let configLoaded = false;

/**
 * Load API_BASE_URL from config.json
 * This should be called early in the app lifecycle
 */
export async function loadApiConfig(): Promise<void> {
  if (configLoaded) {
    return;
  }

  try {
    const response = await fetch('/config.json?v=' + Date.now());
    if (response.ok) {
      const config = await response.json();
      if (config.API_BASE_URL) {
        API_BASE_URL = config.API_BASE_URL;
        console.log('API Base URL loaded from config.json:', API_BASE_URL);
      }
    } else {
      console.warn('Failed to load config.json, using default API URL:', DEFAULT_API_BASE_URL);
    }
  } catch (error) {
    console.error('Error loading config.json:', error);
    console.warn('Using default API URL:', DEFAULT_API_BASE_URL);
  } finally {
    configLoaded = true;
  }
}

// Auto-load config when module is imported
loadApiConfig();

// Helper function to get current API base URL
function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// API Endpoints - use getters to always get current API_BASE_URL
export const API_ENDPOINTS = {
  get QUOTES() { return `${getApiBaseUrl()}/quotes/`; },
  get GET_QUOTES() { return `${getApiBaseUrl()}/optimize_prices/`; }, // POST endpoint to get quotes
  get GET_QUOTES_DATA() { return `${getApiBaseUrl()}/get-quotes/`; }, // GET endpoint to get quotes data for admin
  get SAVE_INPUT() { return `${getApiBaseUrl()}/save-input/`; }, // POST endpoint to save input.json
  get RESET_INPUT() { return `${getApiBaseUrl()}/reset-input/`; }, // POST endpoint to reset input.json from backup
} as const;

// Export for debugging
export { API_BASE_URL, getApiBaseUrl };

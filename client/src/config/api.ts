// API Configuration
export const API_BASE_URL = 'http://localhost:3002';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  
  // Users
  USER_STATS: '/api/users/stats',
  
  // Tests
  TESTS_RECENT: '/api/tests/recent',
  TESTS_SUBMIT: '/api/tests',
  
  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
  
  // Books
  BOOKS_SEARCH: '/api/books/search',
  BOOKS_CONTENT: '/api/books/content',
  
  // Texts
  TEXTS_CONTENT: '/api/texts/content'
};

// Helper function to make API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiRequest
};

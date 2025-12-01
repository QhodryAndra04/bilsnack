/**
 * API Configuration for Billsnack Frontend
 * Central configuration for all API endpoints and request utilities
 */

// Base API URL - uses environment variable or same origin in production
// In production (Vercel), use same origin (window.location.origin)
export const API_BASE_URL = '';

/**
 * Get authorization headers with JWT token
 * @param {string} token - JWT token from localStorage
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * API Endpoints - All endpoints centralized for easy maintenance
 */
export const API_ENDPOINTS = {
  // Health Check (server exposes /api/health externally)
  HEALTH: '/api/health',
  
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    PROFILE: '/api/auth/profile',
  },
  
  // Products
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id) => `/api/products/${id}`,
    TOP_SELLING: '/api/products/top-selling',
    RESELLER: {
      MY_PRODUCTS: '/api/products/reseller/my-products',
      CREATE: '/api/products',
      UPDATE: (id) => `/api/products/${id}`,
      DELETE: (id) => `/api/products/${id}`,
    },
  },
  
  // Orders
  ORDERS: {
    CREATE: '/api/orders',
    USER_ORDERS: '/api/orders/user',
    DETAIL: (id) => `/api/orders/${id}`,
    UPDATE_STATUS: (id) => `/api/orders/${id}/status`,
    UPDATE_TRACKING: (id) => `/api/orders/${id}/tracking`,
  },
  
  // Reviews
  REVIEWS: {
    CREATE: '/api/reviews',
    PRODUCT_REVIEWS: (productId) => `/api/reviews/product/${productId}`,
    UPDATE: (id) => `/api/reviews/${id}`,
    DELETE: (id) => `/api/reviews/${id}`,
  },
  
  // Reseller
  RESELLER: {
    LIST: '/api/resellers',
    CONNECTIONS: '/api/resellers/connections',
    CREATE_CONNECTION: '/api/resellers/connections',
    DELETE_CONNECTION: (id) => `/api/resellers/connections/${id}`,
    STATS: '/api/resellers/stats',
    SOLD_PRODUCTS: '/api/resellers/sold-products',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    UNREAD: '/api/notifications/unread',
    COUNT_UNREAD: '/api/notifications/count-unread',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (id) => `/api/notifications/${id}`,
  },
  
  // Admin
  ADMIN: {
    PRODUCTS: {
      LIST: '/api/admin/products',
      UPDATE: (id) => `/api/admin/products/${id}`,
      DELETE: (id) => `/api/admin/products/${id}`,
    },
    USERS: {
      LIST: '/api/admin/users',
      DETAIL: (id) => `/api/admin/users/${id}`,
      CREATE: '/api/admin/users',
      UPDATE: (id) => `/api/admin/users/${id}`,
      DELETE: (id) => `/api/admin/users/${id}`,
    },
    TRANSACTIONS: '/api/admin/transactions',
  },
  
  // Uploads
  UPLOADS: {
    IMAGE: '/api/uploads/image',
  },
  
  // Telegram
  TELEGRAM: {
    COMMANDS: '/api/telegram/commands',
    RESELLER_COMMANDS: '/api/telegram/reseller/commands',
    REGISTER_RESELLER: '/api/telegram/register-reseller',
    RESELLER_STATUS: '/api/telegram/reseller-status',
    UNREGISTER_RESELLER: '/api/telegram/unregister-reseller',
  },
};

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint (relative or absolute)
 * @param {Object} options - Fetch options
 * @returns {Promise} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // If endpoint starts with /, prepend API_BASE_URL for absolute URL
    const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : endpoint;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return { ok: response.ok, status: response.status };
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * GET request helper
 */
export const apiGet = (endpoint, token = null) => {
  return apiRequest(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
};

/**
 * POST request helper
 */
export const apiPost = (endpoint, body, token = null) => {
  return apiRequest(endpoint, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
};

/**
 * PUT request helper
 */
export const apiPut = (endpoint, body, token = null) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
};

/**
 * DELETE request helper
 */
export const apiDelete = (endpoint, token = null) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};

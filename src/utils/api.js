const API_BASE = "https://api-attendance.onesaas.in";

/**
 * Unified API calling utility
 * @param {string} endpoint - The API endpoint or full URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object|null} body - Request payload
 * @param {string|number|null} companyId - Optional Company ID for the 'company' header
 * @returns {Promise<Response>} - The fetch response object
 */
export const apiCall = async (endpoint, method = 'GET', body = null, companyId = null) => {
  const token = localStorage.getItem('token');

  const headers = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (companyId) {
    headers['company'] = companyId.toString();
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  // Handle absolute vs relative URLs
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`API Call Error (${url}):`, error);
    throw error;
  }
};

export default apiCall;

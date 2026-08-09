import { BACKEND_URL } from './config.js';
import { showToast } from './utils.js';

export const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    // Attach Bearer token from localStorage for mobile browser compatibility
    const token = localStorage.getItem('session_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;

    const config = {
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include',
      ...options
    };

    if (config.method === 'POST' || config.method === 'PUT') {
      const payload = options.body !== undefined ? options.body : {};
      config.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    try {
      const response = await fetch(fullUrl, config);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        const errorMsg = data?.error?.message || data?.message || `HTTP Error ${response.status}`;
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${fullUrl}:`, err);
      throw err;
    }
  },

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body = {}, options) {
    return this.request(endpoint, { ...options, method: 'POST', body: body || {} });
  },

  put(endpoint, body = {}, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body: body || {} });
  },

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

import { BACKEND_URL } from './config.js';
import { showToast } from './utils.js';

export const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const fullUrl = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;

    const config = {
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include', // Cross-domain cookie support for Render + Cloudflare Pages
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
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

  post(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  put(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  },

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

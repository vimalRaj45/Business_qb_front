import { BACKEND_URL } from './config.js';
import { showToast, showActionLoading, hideActionLoading } from './utils.js';

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

    const isMutatingAction = config.method !== 'GET';
    if (isMutatingAction) {
      const actionTitle = options.loadingTitle || getActionTitle(endpoint, config.method);
      showActionLoading(actionTitle);
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
    } finally {
      if (isMutatingAction) {
        hideActionLoading();
      }
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

function getActionTitle(endpoint, method) {
  if (endpoint.includes('customer')) return method === 'DELETE' ? 'Deleting Customer...' : 'Saving Customer...';
  if (endpoint.includes('invoice')) return method === 'DELETE' ? 'Deleting Invoice...' : 'Generating Invoice...';
  if (endpoint.includes('quotation')) return method === 'DELETE' ? 'Deleting Quotation...' : 'Generating Quotation...';
  if (endpoint.includes('product')) return method === 'DELETE' ? 'Deleting Item...' : 'Saving Product...';
  if (endpoint.includes('expense')) return method === 'DELETE' ? 'Deleting Expense...' : 'Saving Expense...';
  if (endpoint.includes('payment')) return method === 'DELETE' ? 'Removing Payment...' : 'Recording Payment...';
  if (endpoint.includes('business')) return 'Saving Settings...';
  if (endpoint.includes('team')) return method === 'DELETE' ? 'Revoking Access...' : 'Inviting Member...';
  if (endpoint.includes('webhook')) return method === 'DELETE' ? 'Deleting Webhook...' : 'Saving Webhook...';
  if (endpoint.includes('key')) return method === 'DELETE' ? 'Revoking Key...' : 'Generating Key...';
  return 'Processing Request...';
}

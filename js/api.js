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
    const actionTitle = options.loadingTitle || getActionTitle(endpoint, config.method);
    const actionSub = options.loadingSubtitle || getActionSubtitle(endpoint, config.method);

    let getColdStartTimer = null;

    if (isMutatingAction && !options.skipLoading) {
      showActionLoading(actionTitle, actionSub);
    } else if (!options.skipLoading) {
      // For GET requests, if Render cold start delays response past 1.2s, show loading overlay automatically
      getColdStartTimer = setTimeout(() => {
        showActionLoading(actionTitle, actionSub);
      }, 1200);
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
      if (getColdStartTimer) clearTimeout(getColdStartTimer);
      if (!options.skipLoading) {
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
  if (endpoint.includes('send-email')) {
    if (endpoint.includes('quotation')) return 'Sending Quotation Email...';
    if (endpoint.includes('invoice')) return 'Sending Invoice Email...';
    return 'Sending Email via Gmail...';
  }
  if (endpoint.includes('convert')) return 'Converting Quotation to Invoice...';
  if (endpoint.includes('customer')) return method === 'DELETE' ? 'Deleting Customer...' : (method === 'GET' ? 'Loading Customers...' : 'Saving Customer Details...');
  if (endpoint.includes('invoice')) return method === 'DELETE' ? 'Deleting Invoice...' : (method === 'GET' ? 'Loading Invoices...' : 'Generating Invoice...');
  if (endpoint.includes('quotation')) return method === 'DELETE' ? 'Deleting Quotation...' : (method === 'GET' ? 'Loading Quotations...' : 'Saving Quotation Details...');
  if (endpoint.includes('product')) return method === 'DELETE' ? 'Deleting Item...' : (method === 'GET' ? 'Loading Inventory...' : 'Saving Product Details...');
  if (endpoint.includes('expense')) return method === 'DELETE' ? 'Deleting Expense...' : (method === 'GET' ? 'Loading Expenses...' : 'Saving Expense Details...');
  if (endpoint.includes('payment')) return method === 'DELETE' ? 'Removing Payment...' : 'Recording Payment...';
  if (endpoint.includes('business')) return 'Saving Business Settings...';
  if (endpoint.includes('team')) return method === 'DELETE' ? 'Revoking Access...' : 'Inviting Team Member...';
  if (endpoint.includes('webhook')) return method === 'DELETE' ? 'Deleting Webhook...' : 'Saving Webhook...';
  if (endpoint.includes('key')) return method === 'DELETE' ? 'Revoking API Key...' : 'Generating API Key...';
  if (endpoint.includes('seed')) return 'Generating Sample Demo Data...';
  if (endpoint.includes('auth') || endpoint.includes('login') || endpoint.includes('register') || endpoint.includes('me')) return 'Authenticating Account...';
  if (endpoint.includes('report') || endpoint.includes('summary')) return 'Fetching Financial Reports...';
  return method === 'GET' ? 'Loading Data...' : 'Processing Request...';
}

function getActionSubtitle(endpoint, method) {
  if (endpoint.includes('send-email')) return 'Delivering MIME HTML email via connected Gmail OAuth...';
  if (endpoint.includes('convert')) return 'Transferring quotation items to new invoice ledger...';
  if (endpoint.includes('customer')) return 'Updating customer directory & ledger records...';
  if (endpoint.includes('invoice')) return 'Syncing invoice details with cloud database...';
  if (endpoint.includes('quotation')) return 'Writing quotation record & items to ledger...';
  if (endpoint.includes('payment')) return 'Recording payment transaction & updating balance...';
  if (endpoint.includes('seed')) return 'Seeding database with sample customers, products & invoices...';
  if (endpoint.includes('auth') || endpoint.includes('login') || endpoint.includes('me')) return 'Verifying session & OAuth credentials...';
  return 'Connecting to backend service...';
}

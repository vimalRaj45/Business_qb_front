/**
 * Configuration file for Cloudflare Pages (Frontend) + Render (Backend)
 */

// Replace this with your exact Render backend URL if different
export const DEFAULT_RENDER_BACKEND_URL = 'https://business-qb-back.onrender.com';

export const BACKEND_URL = (function() {
  if (typeof window !== 'undefined' && window.BACKEND_URL) {
    return window.BACKEND_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && localStorage.getItem('BACKEND_URL')) {
    return localStorage.getItem('BACKEND_URL').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // When running on Cloudflare Pages (*.pages.dev), direct API requests to Render backend
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('pages.dev')) {
    return DEFAULT_RENDER_BACKEND_URL;
  }
  return typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : DEFAULT_RENDER_BACKEND_URL;
})();

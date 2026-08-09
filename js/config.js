/**
 * Configuration file for Cloudflare Pages (Frontend) + Render (Backend)
 */

export const DEFAULT_RENDER_BACKEND_URL = 'https://business-qb-back.onrender.com';

export const BACKEND_URL = (function() {
  if (typeof window !== 'undefined' && window.BACKEND_URL) {
    return window.BACKEND_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && localStorage.getItem('BACKEND_URL')) {
    return localStorage.getItem('BACKEND_URL').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  // All production domains (bizsheet.vsgrps.com & *.pages.dev) route API calls to Render backend
  return DEFAULT_RENDER_BACKEND_URL;
})();

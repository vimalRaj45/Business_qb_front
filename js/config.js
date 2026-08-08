/**
 * Configuration file for Cloudflare Pages (Frontend) + Render (Backend)
 */
export const BACKEND_URL = (function() {
  if (typeof window !== 'undefined' && window.BACKEND_URL) {
    return window.BACKEND_URL;
  }
  if (typeof window !== 'undefined' && localStorage.getItem('BACKEND_URL')) {
    return localStorage.getItem('BACKEND_URL');
  }
  // Default to window.location.origin if hosted on unified server or localhost:3000
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
})();

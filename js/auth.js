import { API } from './api.js';
import { confirmModal } from './utils.js';

export async function checkAuth() {
  try {
    const res = await API.get('/api/auth/me');
    if (!res.authenticated) {
      window.location.href = '/login.html';
      return null;
    }

    const currentPath = window.location.pathname;
    const isCompleted = res.business?.onboarding_completed === true || 
                        res.business?.onboarding_completed === 'true' ||
                        (Boolean(res.business?.business_name) && 
                         res.business.business_name.trim() !== '' && 
                         !res.business.business_name.endsWith("'s Business"));

    // First-time users without a completed profile are forced to onboarding.html
    if (!isCompleted && !currentPath.endsWith('/onboarding.html')) {
      window.location.href = '/onboarding.html';
      return null;
    }

    // Returning users who have already set up their profile skip onboarding
    if (isCompleted && currentPath.endsWith('/onboarding.html')) {
      window.location.href = '/dashboard.html';
      return null;
    }

    return res;
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = '/login.html';
    return null;
  }
}

export async function logout(skipConfirm = false) {
  const shouldSkip = skipConfirm === true;

  if (!shouldSkip) {
    const confirmed = await confirmModal({
      title: 'Logout of your account?',
      message: 'Are you sure you want to log out of your business billing session?',
      confirmText: 'Yes, Logout',
      cancelText: 'Cancel & Stay Logged In',
      type: 'info'
    });
    if (!confirmed) return;
  }

  try {
    await API.post('/api/auth/logout');
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    window.location.href = '/login.html';
  }
}

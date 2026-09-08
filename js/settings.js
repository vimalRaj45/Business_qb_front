import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { showToast, confirmModal, escapeHtml } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  renderLayout(auth.business, auth.user);
  populateSettings(auth.business, auth.user);
  await populateSubscriptionSettings();
  await renderWorkspacesList(auth);
  setupEventListeners();
});

async function populateSubscriptionSettings() {
  const badgeEl = document.getElementById('plan-badge-container');
  const usageTextEl = document.getElementById('plan-usage-text');
  const subTextEl = document.getElementById('plan-sub-text');
  const upgradeBtn = document.getElementById('settings-upgrade-btn');

  if (!badgeEl || !upgradeBtn) return;

  try {
    const { getSubscriptionStatus, openUpgradeModal } = await import('./subscription.js');
    const sub = await getSubscriptionStatus();
    if (!sub) return;

    upgradeBtn.onclick = () => openUpgradeModal();

    if (sub.isPro) {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 bg-teal-100 text-teal-800 text-[10px] font-extrabold rounded-full flex items-center gap-1"><i class="bi bi-patch-check-fill text-teal-600"></i> PRO PLAN</span>`;
      usageTextEl.innerHTML = `Unlimited Invoices Active &bull; <span class="text-teal-700 font-bold">${sub.daysLeft} days remaining</span>`;
      subTextEl.textContent = `Expires on ${new Date(sub.subscriptionExpiresAt).toLocaleDateString()}. You can renew anytime.`;
      upgradeBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Renew Pro (₹100/mo)';
    } else {
      badgeEl.innerHTML = `<span class="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">FREE PLAN</span>`;
      usageTextEl.innerHTML = `Used <strong>${sub.invoiceCount}</strong> of <strong>${sub.freeLimit}</strong> free invoices (${sub.remainingFreeInvoices} remaining)`;
      subTextEl.textContent = sub.canCreateInvoice ? 'First 10 invoices are free. Upgrade to unlock unlimited invoicing.' : 'Free limit reached! Upgrade to create more invoices.';
      upgradeBtn.innerHTML = '<i class="bi bi-lightning-charge-fill text-amber-400"></i> Upgrade to Pro (₹100/mo)';
    }
  } catch (err) {
    console.warn('Subscription settings error:', err.message);
  }
}

function populateSettings(business, user) {
  document.getElementById('settings-user-email').textContent = user.email || 'Not connected';
  
  const sheetIdEl = document.getElementById('settings-sheet-id');
  const sheetBtn = document.getElementById('settings-open-sheet-btn');

  if (business.spreadsheet_id) {
    sheetIdEl.textContent = business.spreadsheet_id;
    sheetBtn.href = `https://docs.google.com/spreadsheets/d/${business.spreadsheet_id}`;
  } else {
    sheetIdEl.textContent = 'None';
    sheetBtn.classList.add('opacity-50', 'pointer-events-none');
  }

  document.getElementById('set-inv-prefix').value = business.invoice_prefix || 'INV-';
  document.getElementById('set-quo-prefix').value = business.quotation_prefix || 'QUO-';
}

async function renderWorkspacesList(auth) {
  const container = document.getElementById('workspaces-list-container');
  if (!container) return;

  try {
    const res = await API.get('/api/auth/me');
    const workspaces = res.workspaces || [];
    const currentBizId = auth.business.business_id;

    if (workspaces.length === 0) {
      container.innerHTML = `<div class="p-3 text-slate-400 text-xs italic">No workspaces found.</div>`;
      return;
    }

    container.innerHTML = workspaces.map(w => {
      const isActive = w.business_id === currentBizId;
      const roleBadge = w.is_owner 
        ? '<span class="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">OWNER</span>'
        : '<span class="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">STAFF</span>';

      const activeBadge = isActive
        ? '<span class="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">Active Workspace</span>'
        : '';

      return `
        <div class="p-3 bg-white border ${isActive ? 'border-teal-500 shadow-xs' : 'border-slate-200'} rounded-2xl flex items-center justify-between transition">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-9 h-9 rounded-xl ${w.is_owner ? 'bg-teal-600' : 'bg-slate-700'} text-white font-black text-sm flex items-center justify-center shrink-0">
              ${(w.business_name || 'B').charAt(0).toUpperCase()}
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                ${escapeHtml(w.business_name)} ${activeBadge}
              </div>
              <div class="text-[10px] text-slate-500">${w.is_owner ? 'Your Personal Company' : 'Shared Team Workspace'}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${roleBadge}
            ${!isActive ? `
              <button onclick="window.switchWorkspace('${w.business_id}')" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition">
                Switch
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="text-rose-500 text-xs p-2">Failed to load workspaces</div>`;
  }
}

function setupEventListeners() {
  const form = document.getElementById('settings-form');
  const deleteBtn = document.getElementById('delete-account-btn');
  const createOwnedBtn = document.getElementById('create-owned-biz-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.put('/api/business', payload);
        showToast('Settings saved successfully!', 'success');
      } catch (err) {
        showToast('Failed to save settings: ' + err.message, 'error');
      }
    });
  }

  if (createOwnedBtn) {
    createOwnedBtn.addEventListener('click', async () => {
      const confirmed = await confirmModal({
        title: 'Start / Create Your Own Business?',
        message: 'This will create a brand new Google Spreadsheet ("Business Billing Data") in your personal Google Drive account and set up your business account.',
        confirmText: 'Create Business Account',
        cancelText: 'Cancel'
      });

      if (!confirmed) return;

      try {
        showToast('Initializing your personal business Google Sheet...', 'info');
        const res = await API.post('/api/business/create-owned');
        showToast(res.message || 'Personal business created successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/onboarding.html';
        }, 600);
      } catch (err) {
        showToast('Failed to create business: ' + err.message, 'error');
      }
    });
  }

  window.switchWorkspace = async (targetBizId) => {
    try {
      showToast('Switching workspace...', 'info');
      await API.post('/api/auth/switch-workspace', { business_id: targetBizId });
      showToast('Workspace switched successfully!', 'success');
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      showToast('Failed to switch workspace: ' + err.message, 'error');
    }
  };

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      openDeleteWorkspaceOtpModal();
    });
  }
}

function openDeleteWorkspaceOtpModal() {
  const existing = document.getElementById('delete-workspace-modal');
  if (existing) existing.remove();

  const userEmail = document.getElementById('settings-user-email')?.textContent?.trim() || 'your registered email';

  const modalHtml = `
    <div id="delete-workspace-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-5">
        
        <!-- Header -->
        <div class="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div class="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 text-xl font-bold">
            <i class="bi bi-shield-exclamation"></i>
          </div>
          <div>
            <h3 class="font-extrabold text-slate-900 text-base">Permanent Workspace Deletion</h3>
            <p class="text-xs text-slate-500 mt-0.5">Email OTP verification is required to authorize deletion.</p>
          </div>
        </div>

        <!-- Step 1: Warning & Request OTP -->
        <div id="del-step-1" class="space-y-4">
          <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
            <p class="font-extrabold flex items-center gap-1.5 text-rose-900">
              <i class="bi bi-exclamation-triangle-fill text-rose-600"></i> Irreversible Deletion
            </p>
            <p class="text-[11.5px] leading-relaxed text-rose-700">
              This action will <strong>permanently erase</strong> your <em>"Business Billing Data"</em> spreadsheet from your Google Drive and destroy all invoice and customer records. This cannot be recovered.
            </p>
          </div>

          <p class="text-xs text-slate-600">
            A 6-digit confirmation security code will be sent to the owner email:<br/>
            <strong class="text-slate-900 font-bold">${escapeHtml(userEmail)}</strong>
          </p>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" id="del-cancel-btn-1" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
              Cancel
            </button>
            <button type="button" id="send-del-otp-btn" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5">
              <i class="bi bi-send-fill"></i> Send Confirmation OTP
            </button>
          </div>
        </div>

        <!-- Step 2: Enter OTP -->
        <div id="del-step-2" class="space-y-4 hidden">
          <div class="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
            <i class="bi bi-check-circle-fill text-teal-600 shrink-0"></i>
            <span>OTP sent! Check your inbox (and spam folder) for the 6-digit code.</span>
          </div>

          <div class="space-y-2">
            <label class="font-bold text-slate-700 text-xs block">Enter 6-Digit OTP Code</label>
            <input 
              type="text" 
              id="del-otp-input" 
              maxlength="6" 
              placeholder="000000" 
              autocomplete="one-time-code"
              class="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-900 font-black focus:outline-none transition" 
            />
            <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span id="del-timer-text">Code valid for 10 minutes</span>
              <button type="button" id="resend-del-otp-btn" class="text-teal-600 font-bold hover:underline">
                Resend Code
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" id="del-cancel-btn-2" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
              Cancel
            </button>
            <button type="button" id="confirm-del-btn" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center gap-1.5" disabled>
              <i class="bi bi-trash3-fill"></i> Confirm & Wipe Workspace
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('delete-workspace-modal');
  const step1 = document.getElementById('del-step-1');
  const step2 = document.getElementById('del-step-2');
  const sendBtn = document.getElementById('send-del-otp-btn');
  const confirmBtn = document.getElementById('confirm-del-btn');
  const otpInput = document.getElementById('del-otp-input');
  const resendBtn = document.getElementById('resend-del-otp-btn');
  const cancel1 = document.getElementById('del-cancel-btn-1');
  const cancel2 = document.getElementById('del-cancel-btn-2');

  const closeModal = () => modal?.remove();
  cancel1.addEventListener('click', closeModal);
  cancel2.addEventListener('click', closeModal);

  // Send OTP
  const triggerSendOtp = async () => {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Sending OTP...';
    try {
      const res = await API.post('/api/business/delete-otp');
      showToast(res.message || 'OTP sent to your registered email!', 'success');
      step1.classList.add('hidden');
      step2.classList.remove('hidden');
      otpInput.focus();
    } catch (err) {
      showToast('Failed to send OTP: ' + err.message, 'error');
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="bi bi-send-fill"></i> Send Confirmation OTP';
    }
  };

  sendBtn.addEventListener('click', triggerSendOtp);

  // Resend OTP
  resendBtn.addEventListener('click', async () => {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    try {
      const res = await API.post('/api/business/delete-otp');
      showToast(res.message || 'New OTP sent to email!', 'success');
    } catch (err) {
      showToast('Failed to resend OTP: ' + err.message, 'error');
    } finally {
      setTimeout(() => {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }, 5000);
    }
  });

  // Enable confirm button only when 6 digits typed
  otpInput.addEventListener('input', () => {
    otpInput.value = otpInput.value.replace(/[^0-9]/g, '');
    confirmBtn.disabled = otpInput.value.length !== 6;
  });

  // Confirm Deletion
  confirmBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();
    if (otp.length !== 6) {
      showToast('Please enter the full 6-digit OTP code', 'error');
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Deleting Workspace & Drive Sheet...';

    try {
      const res = await API.delete('/api/business', { otp });
      showToast(res.message || 'Workspace deleted successfully!', 'success');
      localStorage.removeItem('session_token');
      modal.remove();
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1200);
    } catch (err) {
      showToast(err.message || 'Invalid or expired OTP', 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="bi bi-trash3-fill"></i> Confirm & Wipe Workspace';
      otpInput.value = '';
      otpInput.focus();
    }
  });
}

import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { showToast, confirmModal, escapeHtml } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  renderLayout(auth.business, auth.user);
  populateSettings(auth.business, auth.user);
  await renderWorkspacesList(auth);
  setupEventListeners();
});

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
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await confirmModal({
        title: 'Delete Account & Wipe Google Drive Data?',
        message: 'This will permanently delete your "Business Billing Data" spreadsheet file from your Google Drive account and erase all local data. This action CANNOT be undone.',
        confirmText: 'Permanently Delete Account',
        cancelText: 'Cancel & Keep Data',
        type: 'danger'
      });

      if (!confirmed) return;

      try {
        showToast('Deleting business spreadsheet & account...', 'info');
        await API.delete('/api/business');
        showToast('Account deleted successfully', 'success');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1000);
      } catch (err) {
        showToast('Failed to delete account: ' + err.message, 'error');
      }
    });
  }
}

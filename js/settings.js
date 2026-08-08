import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { showToast, confirmModal } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  renderLayout(auth.business, auth.user);
  populateSettings(auth.business, auth.user);
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

function setupEventListeners() {
  const form = document.getElementById('settings-form');
  const deleteBtn = document.getElementById('delete-account-btn');

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

      deleteBtn.disabled = true;
      deleteBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin"></i> Deleting Account & Drive File...`;

      try {
        await API.delete('/api/business/account');
        showToast('Account and Google Drive file deleted successfully.', 'success');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1200);
      } catch (err) {
        showToast('Failed to delete account: ' + err.message, 'error');
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = `<i class="bi bi-trash3-fill"></i> Delete Account & Wipe Google Sheet`;
      }
    });
  }
}

import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, showToast, confirmModal, exportToCSV, exportTableToPDF } from './utils.js';

let currencySymbol = 'USD $';
let customersList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  currencySymbol = auth.business.currency || 'USD $';
  renderLayout(auth.business, auth.user);

  loadCustomers();
  setupEventListeners();
});

// Bind to window for inline HTML click handlers
window.openCustomerModal = function() {
  const modal = document.getElementById('customer-modal');
  const form = document.getElementById('customer-form');
  if (form) form.reset();
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

window.closeCustomerModal = function() {
  const modal = document.getElementById('customer-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

window.exportCustomersCSV = function() {
  exportToCSV(customersList, 'customers_list.csv');
};

window.exportCustomersPDF = function() {
  exportTableToPDF('customers-table-card', 'customers_list.pdf');
};

async function loadCustomers() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  try {
    const res = await API.get('/api/customers');
    customersList = res.data || [];
    renderCustomersTable(customersList);
  } catch (err) {
    console.error('Failed to load customers:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-rose-500 font-semibold">Failed to load customers: ${err.message}</td></tr>`;
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  if (!customers.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-400">
          <i class="bi bi-people text-3xl block mb-2 text-slate-300"></i>
          No customers found. Click <strong>"+ Add Customer"</strong> to create your first client record.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr class="border-b border-slate-100 hover:bg-slate-50/60 transition">
      <td class="py-3 px-4 font-bold text-slate-900">
        <a href="/customer-view.html?id=${c.customer_id}" class="hover:text-teal-600 flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-100">
            ${(c.customer_name || 'C').charAt(0).toUpperCase()}
          </div>
          <span>${c.customer_name}</span>
        </a>
      </td>
      <td class="py-3 px-4 text-slate-600 font-medium">${c.company_name || '-'}</td>
      <td class="py-3 px-4 text-slate-600">${c.email || '-'}</td>
      <td class="py-3 px-4 text-slate-600">${c.phone || '-'}</td>
      <td class="py-3 px-4 font-semibold text-slate-800">${formatCurrency(c.opening_balance || 0, currencySymbol)}</td>
      <td class="py-3 px-4 text-right space-x-2 no-print">
        <a href="/customer-view.html?id=${c.customer_id}" class="text-xs font-semibold text-teal-600 hover:text-teal-800 px-2 py-1 bg-teal-50 rounded-lg">View</a>
        <button class="delete-customer-btn text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 bg-rose-50 rounded-lg" data-id="${c.customer_id}" data-name="${c.customer_name}">Delete</button>
      </td>
    </tr>
  `).join('');

  // Delete Listeners with Tailwind Confirmation Modal
  document.querySelectorAll('.delete-customer-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const name = e.currentTarget.getAttribute('data-name');
      
      const confirmed = await confirmModal({
        title: 'Delete Customer?',
        message: `Are you sure you want to delete "${name}"? All associated customer history will be permanently removed.`,
        confirmText: 'Yes, Delete Customer',
        type: 'danger'
      });

      if (confirmed) {
        try {
          await API.delete(`/api/customers/${id}`);
          showToast('Customer deleted successfully', 'success');
          loadCustomers();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  });
}

function setupEventListeners() {
  const openBtn = document.getElementById('open-customer-modal-btn');
  const closeBtn = document.getElementById('close-customer-modal-btn');
  const cancelBtn = document.getElementById('cancel-customer-modal-btn');
  const form = document.getElementById('customer-form');
  const searchInput = document.getElementById('search-customers');

  if (openBtn) openBtn.addEventListener('click', window.openCustomerModal);
  if (closeBtn) closeBtn.addEventListener('click', window.closeCustomerModal);
  if (cancelBtn) cancelBtn.addEventListener('click', window.closeCustomerModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.post('/api/customers', payload);
        showToast('Customer created successfully!', 'success');
        window.closeCustomerModal();
        loadCustomers();
      } catch (err) {
        showToast(`Failed to create customer: ${err.message}`, 'error');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = customersList.filter(c => 
        (c.customer_name && c.customer_name.toLowerCase().includes(query)) ||
        (c.company_name && c.company_name.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
      );
      renderCustomersTable(filtered);
    });
  }
}

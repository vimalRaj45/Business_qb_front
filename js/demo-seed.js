import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, formatDate, showToast } from './utils.js';

let currencySymbol = 'USD $';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  currencySymbol = auth.business.currency || 'USD $';
  renderLayout(auth.business, auth.user);

  fetchLiveData();
  setupEventListeners();
});

async function fetchLiveData() {
  try {
    const res = await API.get('/api/demo/data');
    const d = res || {};

    const counts = d.counts || {};
    document.getElementById('cnt-customers').textContent = counts.customers || 0;
    document.getElementById('cnt-products').textContent = counts.products || 0;
    document.getElementById('cnt-quotations').textContent = counts.quotations || 0;
    document.getElementById('cnt-invoices').textContent = counts.invoices || 0;
    document.getElementById('cnt-expenses').textContent = counts.expenses || 0;
    document.getElementById('cnt-transactions').textContent = counts.transactions || 0;

    const linkBtn = document.getElementById('sheet-link-btn');
    if (linkBtn && d.spreadsheet_url) {
      linkBtn.href = d.spreadsheet_url;
      linkBtn.classList.remove('opacity-50', 'pointer-events-none');
    }

    renderInspectCustomers(d.sample_data?.customers || []);
    renderInspectInvoices(d.sample_data?.invoices || []);

  } catch (err) {
    console.error('Failed to fetch live data:', err);
    showToast('Failed to fetch data: ' + err.message, 'error');
  }
}

function renderInspectCustomers(customers) {
  const tbody = document.getElementById('inspect-customers-tbody');
  if (!tbody) return;

  if (!customers.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400">No customers found. Click "⚡ Feed Sample Test Data" to seed records.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr class="border-b border-slate-100">
      <td class="py-2.5 font-bold text-slate-900">${c.customer_name}</td>
      <td class="py-2.5 text-slate-600">${c.company_name || '-'}</td>
      <td class="py-2.5 text-slate-600">${c.email || '-'}</td>
      <td class="py-2.5 text-slate-600">${c.phone || '-'}</td>
      <td class="py-2.5 text-right font-mono text-xs text-slate-600">${c.tax_number || '-'}</td>
    </tr>
  `).join('');
}

function renderInspectInvoices(invoices) {
  const tbody = document.getElementById('inspect-invoices-tbody');
  if (!tbody) return;

  if (!invoices.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400">No invoices found. Click "⚡ Feed Sample Test Data" to seed records.</td></tr>`;
    return;
  }

  tbody.innerHTML = invoices.map(i => {
    let badge = 'badge-unpaid';
    if (i.status === 'Paid') badge = 'badge-paid';
    else if (i.status === 'Partially Paid') badge = 'badge-partially-paid';

    return `
      <tr class="border-b border-slate-100">
        <td class="py-2.5 font-bold text-slate-900">${i.invoice_number}</td>
        <td class="py-2.5 text-slate-600">${formatDate(i.due_date)}</td>
        <td class="py-2.5 font-bold text-slate-900">${formatCurrency(i.total || 0, currencySymbol)}</td>
        <td class="py-2.5 font-bold text-rose-600">${formatCurrency(i.balance_due || 0, currencySymbol)}</td>
        <td class="py-2.5 text-right"><span class="badge-status ${badge}">${i.status}</span></td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  const seedBtn = document.getElementById('seed-data-btn');
  const fetchBtn = document.getElementById('fetch-live-btn');

  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      seedBtn.disabled = true;
      seedBtn.classList.add('opacity-75');
      seedBtn.innerHTML = `<i class="bi bi-arrow-repeat animate-spin text-lg"></i> <span>Feeding Test Records...</span>`;

      try {
        const res = await API.post('/api/demo/seed', {});
        showToast(res.message || 'Sample data seeded successfully!', 'success');
        await fetchLiveData();
      } catch (err) {
        showToast('Seeding error: ' + err.message, 'error');
      } finally {
        seedBtn.disabled = false;
        seedBtn.classList.remove('opacity-75');
        seedBtn.innerHTML = `<i class="bi bi-lightning-charge-fill text-lg"></i> <span>⚡ Feed Sample Test Data (1-Click)</span>`;
      }
    });
  }

  if (fetchBtn) {
    fetchBtn.addEventListener('click', async () => {
      showToast('Refreshing live sheet metrics...', 'info');
      await fetchLiveData();
    });
  }
}

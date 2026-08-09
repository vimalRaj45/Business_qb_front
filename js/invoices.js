import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, formatDate, getStatusBadge, showToast, confirmModal, exportToCSV, exportToPDF } from './utils.js';

let allInvoices = [];
let currencySymbol = '₹';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;

  renderLayout(session.business, session.user);
  currencySymbol = session.business.currency ? session.business.currency.split(' ')[1] || session.business.currency : '₹';

  await loadInvoices();
  setupEventListeners();
});

async function loadInvoices() {
  try {
    const res = await API.get('/api/invoices');
    allInvoices = res.data || [];
    renderTable(allInvoices);
  } catch (err) {
    showToast('Failed to load invoices: ' + err.message, 'error');
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('inv-search');
  const statusFilter = document.getElementById('inv-status-filter');

  if (searchInput) searchInput.addEventListener('input', filterInvoices);
  if (statusFilter) statusFilter.addEventListener('change', filterInvoices);
}

function filterInvoices() {
  const search = document.getElementById('inv-search')?.value.toLowerCase().trim() || '';
  const status = document.getElementById('inv-status-filter')?.value || '';

  const filtered = allInvoices.filter(i => {
    const matchSearch = (i.invoice_number || '').toLowerCase().includes(search) || 
                        (i.customer_name || '').toLowerCase().includes(search);
    const matchStatus = !status || i.status === status;
    return matchSearch && matchStatus;
  });

  renderTable(filtered);
}

function renderTable(invoices) {
  const tbody = document.getElementById('invoices-tbody');
  if (!tbody) return;

  if (!invoices.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">No invoices found. Click "Create New Invoice" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = invoices.map(i => `
    <tr class="border-b border-slate-100 hover:bg-slate-50/60">
      <td class="py-3.5 px-4 font-bold">
        <a href="/invoice-view.html?id=${i.invoice_id}" class="text-teal-600 hover:underline">${i.invoice_number}</a>
      </td>
      <td class="py-3.5 px-4 font-semibold text-slate-800">${i.customer_name || 'N/A'}</td>
      <td class="py-3.5 px-4 text-slate-600">${formatDate(i.invoice_date)}</td>
      <td class="py-3.5 px-4 text-slate-600">${formatDate(i.due_date)}</td>
      <td class="py-3.5 px-4">${getStatusBadge(i.status)}</td>
      <td class="py-3.5 px-4 text-right font-bold text-slate-900">${formatCurrency(i.total, currencySymbol)}</td>
      <td class="py-3.5 px-4 text-right text-emerald-600 font-semibold">${formatCurrency(i.paid_amount, currencySymbol)}</td>
      <td class="py-3.5 px-4 text-right text-rose-600 font-extrabold">${formatCurrency(i.balance_due, currencySymbol)}</td>
      <td class="py-3.5 px-4 text-right space-x-1.5 no-print">
        <a href="/invoice-view.html?id=${i.invoice_id}" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold">View / Pay</a>
        <button onclick="window.deleteInvoice('${i.invoice_id}')" class="owner-only px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-semibold" title="Delete Invoice">
          <i class="bi bi-trash-fill"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteInvoice = async function(invoiceId) {
  const confirmed = await confirmModal({
    title: 'Delete Invoice?',
    message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });

  if (!confirmed) return;

  try {
    await API.delete(`/api/invoices/${invoiceId}`);
    showToast('Invoice deleted successfully', 'success');
    setTimeout(() => window.location.reload(), 400);
  } catch (err) {
    showToast('Failed to delete invoice: ' + err.message, 'error');
  }
};

window.exportInvoicesCSV = () => exportToCSV(allInvoices, 'Invoices_Export');
window.exportInvoicesPDF = () => exportToPDF('invoices-table-card', 'Invoices_Report');

import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, formatDate, getStatusBadge, showToast, confirmModal, exportToCSV, exportToPDF } from './utils.js';

let allQuotations = [];
let currencySymbol = '₹';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;

  renderLayout(session.business, session.user);
  currencySymbol = session.business.currency ? session.business.currency.split(' ')[1] || session.business.currency : '₹';

  await loadQuotations();
  setupEventListeners();
});

async function loadQuotations() {
  try {
    const res = await API.get('/api/quotations');
    allQuotations = res.data || [];
    renderTable(allQuotations);
  } catch (err) {
    showToast('Failed to load quotations: ' + err.message, 'error');
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('quo-search');
  const statusFilter = document.getElementById('quo-status-filter');

  if (searchInput) searchInput.addEventListener('input', filterQuotations);
  if (statusFilter) statusFilter.addEventListener('change', filterQuotations);
}

function filterQuotations() {
  const search = document.getElementById('quo-search')?.value.toLowerCase().trim() || '';
  const status = document.getElementById('quo-status-filter')?.value || '';

  const filtered = allQuotations.filter(q => {
    const matchSearch = (q.quotation_number || '').toLowerCase().includes(search) || 
                        (q.customer_name || '').toLowerCase().includes(search);
    const matchStatus = !status || q.status === status;
    return matchSearch && matchStatus;
  });

  renderTable(filtered);
}

function renderTable(quotations) {
  const tbody = document.getElementById('quotations-tbody');
  if (!tbody) return;

  if (!quotations.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">No quotations found. Click "Create New Quotation" above.</td></tr>`;
    return;
  }

  tbody.innerHTML = quotations.map(q => `
    <tr class="border-b border-slate-100 hover:bg-slate-50/60">
      <td class="py-3.5 px-4 font-bold">
        <a href="/quotation-view.html?id=${q.quotation_id}" class="text-teal-600 hover:underline">${q.quotation_number}</a>
      </td>
      <td class="py-3.5 px-4 font-semibold text-slate-800">${q.customer_name || 'N/A'}</td>
      <td class="py-3.5 px-4 text-slate-600">${formatDate(q.quotation_date)}</td>
      <td class="py-3.5 px-4 text-slate-600">${formatDate(q.valid_until)}</td>
      <td class="py-3.5 px-4">${getStatusBadge(q.status)}</td>
      <td class="py-3.5 px-4 text-right font-extrabold text-slate-900">${formatCurrency(q.total, currencySymbol)}</td>
      <td class="py-3.5 px-4 text-right space-x-1.5 no-print">
        <a href="/quotation-view.html?id=${q.quotation_id}" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold">View</a>
        ${q.status !== 'Converted' ? `
          <button onclick="window.convertToInvoice('${q.quotation_id}')" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold">Convert</button>
        ` : ''}
        <button onclick="window.deleteQuotation('${q.quotation_id}')" class="owner-only px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-semibold" title="Delete Quotation">
          <i class="bi bi-trash-fill"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

window.convertToInvoice = async function(quotationId) {
  const confirmed = await confirmModal({
    title: 'Convert Quotation to Invoice?',
    message: 'This will automatically generate a new Invoice pre-filled with line items from this Quotation.',
    confirmText: 'Convert to Invoice',
    cancelText: 'Cancel',
    type: 'info'
  });

  if (!confirmed) return;

  try {
    const res = await API.post(`/api/quotations/${quotationId}/convert`, {});
    showToast('Quotation converted to Invoice!', 'success');
    setTimeout(() => {
      window.location.href = `/invoice-view.html?id=${res.data.invoice_id}`;
    }, 600);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteQuotation = async function(quotationId) {
  const confirmed = await confirmModal({
    title: 'Delete Quotation?',
    message: 'Are you sure you want to delete this quotation? This action cannot be undone.',
    confirmText: 'Yes, Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });

  if (!confirmed) return;

  try {
    await API.delete(`/api/quotations/${quotationId}`);
    showToast('Quotation deleted successfully', 'success');
    setTimeout(() => window.location.reload(), 400);
  } catch (err) {
    showToast('Failed to delete quotation: ' + err.message, 'error');
  }
};

window.exportQuotationsCSV = () => exportToCSV(allQuotations, 'Quotations_Export');
window.exportQuotationsPDF = () => exportToPDF('quotations-table-card', 'Quotations_Report');

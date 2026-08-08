import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, formatDate, getStatusBadge, showToast, confirmModal, exportToCSV, exportTableToPDF } from './utils.js';

let allQuotations = [];
let currencySymbol = 'USD $';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  currencySymbol = auth.business.currency || 'USD $';
  renderLayout(auth.business, auth.user);
  loadQuotations();

  document.getElementById('quo-search')?.addEventListener('input', applyFilters);
  document.getElementById('quo-status-filter')?.addEventListener('change', applyFilters);
});

window.exportQuotationsCSV = function() {
  exportToCSV(allQuotations, 'quotations_list.csv');
};

window.exportQuotationsPDF = function() {
  exportTableToPDF('quotations-table-card', 'quotations_list.pdf');
};

async function loadQuotations() {
  try {
    const res = await API.get('/api/quotations');
    allQuotations = res.data || [];
    renderTable(allQuotations);
  } catch (err) {
    console.error('Failed to load quotations:', err);
  }
}

function applyFilters() {
  const searchVal = document.getElementById('quo-search').value.toLowerCase();
  const statusVal = document.getElementById('quo-status-filter').value;

  const filtered = allQuotations.filter(q => {
    const matchesSearch = (q.quotation_number && q.quotation_number.toLowerCase().includes(searchVal)) ||
                          (q.customer_name && q.customer_name.toLowerCase().includes(searchVal));
    const matchesStatus = !statusVal || q.status === statusVal;
    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

function renderTable(quotations) {
  const tbody = document.getElementById('quotations-tbody');
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
      <td class="py-3.5 px-4 text-right space-x-2 no-print">
        <a href="/quotation-view.html?id=${q.quotation_id}" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold">View</a>
        ${q.status !== 'Converted' ? `
          <button onclick="window.convertToInvoice('${q.quotation_id}')" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold">Convert → Invoice</button>
        ` : ''}
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
    const res = await API.post(`/api/quotations/${quotationId}/convert`);
    showToast('Quotation converted to Invoice!', 'success');
    setTimeout(() => {
      window.location.href = `/invoice-view.html?id=${res.data.invoice_id}`;
    }, 600);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

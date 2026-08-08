import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, formatDate, getStatusBadge, exportToCSV, exportTableToPDF } from './utils.js';

let allInvoices = [];
let currencySymbol = 'USD $';

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  currencySymbol = auth.business.currency || 'USD $';
  renderLayout(auth.business, auth.user);
  loadInvoices();

  document.getElementById('inv-search')?.addEventListener('input', applyFilters);
  document.getElementById('inv-status-filter')?.addEventListener('change', applyFilters);
});

window.exportInvoicesCSV = function() {
  exportToCSV(allInvoices, 'invoices_list.csv');
};

window.exportInvoicesPDF = function() {
  exportTableToPDF('invoices-table-card', 'invoices_list.pdf');
};

async function loadInvoices() {
  try {
    const res = await API.get('/api/invoices');
    allInvoices = res.data || [];
    renderTable(allInvoices);
  } catch (err) {
    console.error('Failed to load invoices:', err);
  }
}

function applyFilters() {
  const searchVal = document.getElementById('inv-search').value.toLowerCase();
  const statusVal = document.getElementById('inv-status-filter').value;

  const filtered = allInvoices.filter(i => {
    const matchesSearch = (i.invoice_number && i.invoice_number.toLowerCase().includes(searchVal)) ||
                          (i.customer_name && i.customer_name.toLowerCase().includes(searchVal));
    const matchesStatus = !statusVal || i.status === statusVal;
    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

function renderTable(invoices) {
  const tbody = document.getElementById('invoices-tbody');
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
      <td class="py-3.5 px-4 text-right space-x-2 no-print">
        <a href="/invoice-view.html?id=${i.invoice_id}" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold">View / Pay</a>
      </td>
    </tr>
  `).join('');
}

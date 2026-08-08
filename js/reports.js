import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, exportTableToPDF } from './utils.js';

let currencySymbol = 'USD $';
let chartInstanceRev = null;
let chartInstanceExp = null;

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  currencySymbol = auth.business.currency || 'USD $';
  renderLayout(auth.business, auth.user);
  loadReports();

  document.getElementById('export-rep-pdf-btn')?.addEventListener('click', () => {
    exportTableToPDF('reports-document-container', 'financial_analytics_report.pdf');
  });
});

async function loadReports() {
  try {
    const [plRes, salesRes, expRes, taxRes] = await Promise.all([
      API.get('/api/reports/profit-loss'),
      API.get('/api/reports/sales'),
      API.get('/api/reports/expenses'),
      API.get('/api/reports/tax')
    ]);

    const pl = plRes.data || {};
    document.getElementById('pl-sales').textContent = formatCurrency(pl.revenue || 0, currencySymbol);
    document.getElementById('pl-exp').textContent = formatCurrency(pl.expenses || 0, currencySymbol);
    document.getElementById('pl-net').textContent = formatCurrency(pl.net_profit || 0, currencySymbol);
    document.getElementById('pl-margin').textContent = `${pl.margin_percentage || 0}% margin`;

    const sales = salesRes.data || {};
    document.getElementById('sales-cnt').textContent = `${sales.invoice_count || 0} Invoices`;
    document.getElementById('sales-paid').textContent = formatCurrency(sales.total_paid || 0, currencySymbol);
    document.getElementById('sales-due').textContent = formatCurrency(sales.total_outstanding || 0, currencySymbol);

    const tax = taxRes.data || {};
    document.getElementById('tax-base').textContent = formatCurrency(tax.taxable_amount || 0, currencySymbol);
    document.getElementById('tax-collected').textContent = formatCurrency(tax.tax_collected || 0, currencySymbol);

    // Expense Categories Chart
    const exp = expRes.data || {};
    const categories = Object.entries(exp.category_breakdown || {});
    renderExpenseChart(categories);

    // Revenue vs Expense Chart
    renderRevenueChart(pl.revenue || 0, pl.expenses || 0);

  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

function renderRevenueChart(revenue, expenses) {
  const ctx = document.getElementById('rev-exp-chart');
  if (!ctx || !window.Chart) return;

  if (chartInstanceRev) chartInstanceRev.destroy();

  chartInstanceRev = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Overall Total'],
      datasets: [
        { label: 'Revenue', data: [revenue], backgroundColor: '#0d9488', borderRadius: 8 },
        { label: 'Expenses', data: [expenses], backgroundColor: '#f43f5e', borderRadius: 8 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderExpenseChart(categories) {
  const ctx = document.getElementById('expense-cat-chart');
  if (!ctx || !window.Chart) return;

  if (chartInstanceExp) chartInstanceExp.destroy();

  const labels = categories.map(c => c[0]);
  const data = categories.map(c => c[1]);

  chartInstanceExp = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['Operational'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#be123c', '#9f1239'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

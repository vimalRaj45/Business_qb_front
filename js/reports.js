import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, exportTableToPDF } from './utils.js';

let currencySymbol = 'USD $';
let chartInstanceRev = null;
let chartInstanceExp = null;

export async function initReports(auth) {
  if (chartInstanceRev) { try { chartInstanceRev.destroy(); } catch(e) {} chartInstanceRev = null; }
  if (chartInstanceExp) { try { chartInstanceExp.destroy(); } catch(e) {} chartInstanceExp = null; }

  currencySymbol = auth?.business?.currency || 'USD $';
  if (document.getElementById('rep-biz-name')) {
    document.getElementById('rep-biz-name').textContent = auth?.business?.business_name || 'My Business';
  }
  if (document.getElementById('rep-date')) {
    document.getElementById('rep-date').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  loadReports();

  document.getElementById('export-rep-pdf-btn')?.addEventListener('click', () => {
    exportTableToPDF('reports-document-container', 'financial_analytics_report.pdf');
  });
}

async function handleInit() {
  const auth = await checkAuth();
  if (!auth) return;

  renderLayout(auth.business, auth.user);
  initReports(auth);
}

if (document.readyState !== 'loading') {
  handleInit();
} else {
  document.addEventListener('DOMContentLoaded', handleInit);
}

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
      labels: ['Fiscal Ledger Total'],
      datasets: [
        { label: 'Revenue', data: [revenue], backgroundColor: '#000000', borderRadius: 4 },
        { label: 'Expenses', data: [expenses], backgroundColor: '#64748b', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { weight: 'bold', size: 11 }
          }
        }
      },
      scales: {
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold', size: 11 } }
        }
      }
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
        backgroundColor: ['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#cbd5e1'],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { size: 10 }
          }
        }
      }
    }
  });
}

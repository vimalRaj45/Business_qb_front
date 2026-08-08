import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, formatDate } from './utils.js';

let chartInstance1 = null;
let chartInstance2 = null;

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  renderLayout(auth.business, auth.user);
  loadDashboardData(auth.business.currency);
});

async function loadDashboardData(currency = 'USD $') {
  try {
    const [summaryRes, txRes] = await Promise.all([
      API.get('/api/reports/summary').catch(e => ({ data: {} })),
      API.get('/api/transactions?limit=5').catch(e => ({ data: [] }))
    ]);

    const s = summaryRes.data || {};
    
    // Render KPIs
    const elRevenue = document.getElementById('kpi-revenue');
    const elExpenses = document.getElementById('kpi-expenses');
    const elProfit = document.getElementById('kpi-profit');
    const elReceivables = document.getElementById('kpi-receivables');

    if (elRevenue) { elRevenue.classList.remove('skeleton'); elRevenue.textContent = formatCurrency(s.total_revenue || 0, currency); }
    if (elExpenses) { elExpenses.classList.remove('skeleton'); elExpenses.textContent = formatCurrency(s.total_expenses || 0, currency); }
    if (elProfit) { elProfit.classList.remove('skeleton'); elProfit.textContent = formatCurrency(s.net_profit || 0, currency); }
    if (elReceivables) { elReceivables.classList.remove('skeleton'); elReceivables.textContent = formatCurrency(s.outstanding_receivables || 0, currency); }

    // Safely Render Chart.js Visualizations
    try {
      renderCashFlowChart(s, currency);
      renderStatusDoughnutChart(s);
    } catch (chartErr) {
      console.warn('Chart rendering notice:', chartErr);
    }

    // Render Recent Transactions Table
    const tbody = document.getElementById('recent-transactions-tbody');
    const transactions = txRes.data || [];

    if (!tbody) return;

    if (!transactions.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">No transactions recorded yet. Create an invoice payment or expense to see live activity.</td></tr>`;
      return;
    }

    tbody.innerHTML = transactions.slice(0, 5).map(t => {
      const isIncome = t.transaction_type === 'Income';
      const amtClass = isIncome ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
      const prefix = isIncome ? '+' : '-';
      const amount = parseFloat(isIncome ? t.income : t.expense) || 0;

      return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50">
          <td class="py-3 font-medium text-slate-600">${formatDate(t.transaction_date)}</td>
          <td class="py-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">${t.transaction_type}</span></td>
          <td class="py-3 font-medium text-slate-800">${t.description || 'Transaction'}</td>
          <td class="py-3 text-right ${amtClass}">${prefix} ${formatCurrency(amount, currency)}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

function renderCashFlowChart(summary, currency) {
  const ctx = document.getElementById('revenueExpenseChart');
  if (!ctx || !window.Chart) return;

  if (chartInstance1) chartInstance1.destroy();

  chartInstance1 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Total Revenue', 'Total Expenses', 'Net Profit', 'Outstanding Due'],
      datasets: [{
        label: `Financial Amount (${currency})`,
        data: [
          summary.total_revenue || 0,
          summary.total_expenses || 0,
          summary.net_profit || 0,
          summary.outstanding_receivables || 0
        ],
        backgroundColor: [
          '#10b981', // Emerald for Revenue
          '#f43f5e', // Rose for Expenses
          '#0d9488', // Teal for Profit
          '#f59e0b'  // Amber for Due
        ],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${currency} ${context.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Outfit' } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Outfit', weight: 'bold' } }
        }
      }
    }
  });
}

function renderStatusDoughnutChart(summary) {
  const ctx = document.getElementById('invoiceStatusChart');
  if (!ctx || !window.Chart) return;

  if (chartInstance2) chartInstance2.destroy();

  chartInstance2 = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Paid Invoices', 'Unpaid Invoices', 'Pending Quotations'],
      datasets: [{
        data: [
          summary.paid_invoices || 0,
          summary.unpaid_invoices || 0,
          summary.pending_quotations || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#7c3aed'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Outfit', size: 11, weight: 'bold' } }
        }
      },
      cutout: '70%'
    }
  });
}

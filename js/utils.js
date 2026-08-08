/**
  React-Hot-Toast & Tailwind Modal & Universal Export System
**/

export function formatCurrency(amount, currency = 'USD $') {
  const val = parseFloat(amount) || 0;
  return `${currency} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getStatusBadge(status = '') {
  let badgeClass = 'badge-unpaid';
  const lower = String(status).toLowerCase();

  if (lower === 'paid' || lower === 'accepted' || lower === 'active') {
    badgeClass = 'badge-paid';
  } else if (lower === 'partially paid') {
    badgeClass = 'badge-partially-paid';
  } else if (lower === 'overdue' || lower === 'rejected') {
    badgeClass = 'badge-overdue';
  } else if (lower === 'converted') {
    badgeClass = 'badge-converted';
  }

  return `<span class="badge-status ${badgeClass}">${status}</span>`;
}

export function showModal(modalId) {
  const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('flex');
  }
}

export function hideModal(modalId) {
  const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (el) {
    el.classList.add('hidden');
    el.classList.remove('flex');
  }
}

window.showModal = showModal;
window.hideModal = hideModal;
window.closeModal = hideModal;

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function truncateText(str = '', maxLength = 30) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export function parseNumber(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

/**
 * Universal Data Exporters (CSV, PDF, JSON)
 */
export function exportToCSV(dataArray = [], filename = 'export.csv') {
  if (!dataArray || !dataArray.length) {
    showToast('No data available to export', 'warning');
    return;
  }

  const headers = Object.keys(dataArray[0]);
  const csvRows = [headers.join(',')];

  for (const row of dataArray) {
    const values = headers.map(header => {
      const escaped = String(row[header] !== undefined ? row[header] : '').replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Exported ${dataArray.length} records to CSV!`, 'success');
}

export function exportToJSON(dataArray = [], filename = 'export.json') {
  if (!dataArray || !dataArray.length) {
    showToast('No data available to export', 'warning');
    return;
  }

  const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataArray, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonContent);
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Exported ${dataArray.length} records to JSON!`, 'success');
}

export function exportTableToPDF(elementOrId, filename = 'document.pdf') {
  const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!element) {
    showToast('Table element not found for PDF export', 'error');
    return;
  }

  if (typeof window.html2pdf === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => doExport();
    document.head.appendChild(script);
  } else {
    doExport();
  }

  function doExport() {
    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3],
      filename:     filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    showToast('Generating PDF document...', 'info');
    window.html2pdf().set(opt).from(element).save().then(() => {
      showToast('PDF downloaded successfully!', 'success');
    }).catch(err => {
      showToast('PDF Export error: ' + err.message, 'error');
    });
  }
}

window.exportToCSV = exportToCSV;
window.exportToJSON = exportToJSON;
window.exportTableToPDF = exportTableToPDF;

/**
 * React-Hot-Toast Style Floating Notifications
 */
export function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `react-hot-toast ${type}`;

  let iconHtml = '<i class="bi bi-info-circle-fill text-blue-400 text-lg shrink-0"></i>';
  if (type === 'success') {
    iconHtml = '<div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black shrink-0"><i class="bi bi-check-lg"></i></div>';
  } else if (type === 'error') {
    iconHtml = '<div class="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm font-black shrink-0"><i class="bi bi-exclamation-triangle-fill"></i></div>';
  } else if (type === 'warning') {
    iconHtml = '<div class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-black shrink-0"><i class="bi bi-exclamation-circle-fill"></i></div>';
  }

  toast.innerHTML = `
    ${iconHtml}
    <div class="flex-1 overflow-hidden pr-2">
      ${title ? `<div class="font-bold text-xs leading-tight text-white">${title}</div>` : ''}
      <div class="text-xs font-medium text-slate-200 leading-snug break-words">${message}</div>
    </div>
    <button class="text-slate-400 hover:text-white text-xs pl-1 text-base transition focus:outline-none" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

/**
 * Tailwind CSS Confirmation Modal Promise Dialog
 */
export function confirmModal({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
} = {}) {
  return new Promise((resolve) => {
    const existing = document.getElementById('tailwind-confirm-modal-root');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'tailwind-confirm-modal-root';
    root.className = 'fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-opacity duration-200';

    let iconBg = 'bg-rose-50 text-rose-600 border-rose-100';
    let btnBg = 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white';
    let iconClass = 'bi-exclamation-triangle-fill';

    if (type === 'warning') {
      iconBg = 'bg-amber-50 text-amber-600 border-amber-100';
      btnBg = 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white';
      iconClass = 'bi-exclamation-circle-fill';
    } else if (type === 'info') {
      iconBg = 'bg-teal-50 text-teal-600 border-teal-100';
      btnBg = 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white';
      iconClass = 'bi-info-circle-fill';
    }

    root.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 modal-enter modal-enter-active">
        
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center text-xl shrink-0 shadow-xs">
            <i class="bi ${iconClass}"></i>
          </div>
          <div class="space-y-1 pr-2">
            <h3 class="font-black text-slate-900 text-base leading-tight">${title}</h3>
            <p class="text-xs text-slate-500 leading-relaxed">${message}</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button id="modal-cancel-btn" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition">
            ${cancelText}
          </button>
          <button id="modal-confirm-btn" class="px-5 py-2.5 ${btnBg} font-extrabold rounded-xl text-xs transition shadow-md">
            ${confirmText}
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(root);

    const cleanup = (result) => {
      root.classList.add('opacity-0');
      setTimeout(() => {
        root.remove();
        resolve(result);
      }, 200);
    };

    document.getElementById('modal-confirm-btn').addEventListener('click', () => cleanup(true));
    document.getElementById('modal-cancel-btn').addEventListener('click', () => cleanup(false));
    root.addEventListener('click', (e) => {
      if (e.target === root) cleanup(false);
    });
  });
}

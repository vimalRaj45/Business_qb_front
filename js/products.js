import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { formatCurrency, showToast, confirmModal, exportToCSV, exportTableToPDF } from './utils.js';

let currencySymbol = 'USD $';
let productsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const auth = await checkAuth();
  if (!auth) return;

  currencySymbol = auth.business.currency || 'USD $';
  renderLayout(auth.business, auth.user);

  loadProducts();
  setupEventListeners();
});

// Bind to window for inline HTML click handlers
window.openProductModal = function() {
  const modal = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  if (form) form.reset();
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

window.closeProductModal = function() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

window.exportProductsCSV = function() {
  exportToCSV(productsList, 'products_catalog.csv');
};

window.exportProductsPDF = function() {
  exportTableToPDF('products-table-card', 'products_catalog.pdf');
};

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  try {
    const res = await API.get('/api/products');
    productsList = res.data || [];
    renderProductsTable(productsList);
  } catch (err) {
    console.error('Failed to load products:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-rose-500 font-semibold">Failed to load catalog: ${err.message}</td></tr>`;
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-400">
          <i class="bi bi-box-seam text-3xl block mb-2 text-slate-300"></i>
          No products or services in catalog yet. Click <strong>"+ Add Item"</strong> to create one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="border-b border-slate-100 hover:bg-slate-50/60 transition">
      <td class="py-3 px-4 font-bold text-slate-900">${p.name}</td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${p.type === 'Service' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">${p.type || 'Product'}</span></td>
      <td class="py-3 px-4 text-slate-600 font-mono text-xs">${p.sku || '-'}</td>
      <td class="py-3 px-4 font-bold text-emerald-700">${formatCurrency(p.price || 0, currencySymbol)}</td>
      <td class="py-3 px-4 text-slate-600">${p.stock ? `${p.stock} ${p.unit || 'units'}` : 'N/A'}</td>
      <td class="py-3 px-4 text-right no-print">
        <button class="delete-product-btn text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 bg-rose-50 rounded-lg" data-id="${p.product_id}" data-name="${p.name}">Delete</button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const name = e.currentTarget.getAttribute('data-name');
      
      const confirmed = await confirmModal({
        title: 'Delete Item?',
        message: `Are you sure you want to delete "${name}" from your catalog?`,
        confirmText: 'Yes, Delete Item',
        type: 'danger'
      });

      if (confirmed) {
        try {
          await API.delete(`/api/products/${id}`);
          showToast('Product deleted successfully', 'success');
          loadProducts();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  });
}

function setupEventListeners() {
  const openBtn = document.getElementById('open-product-modal-btn');
  const closeBtn = document.getElementById('close-product-modal-btn');
  const cancelBtn = document.getElementById('cancel-product-modal-btn');
  const form = document.getElementById('product-form');

  if (openBtn) openBtn.addEventListener('click', window.openProductModal);
  if (closeBtn) closeBtn.addEventListener('click', window.closeProductModal);
  if (cancelBtn) cancelBtn.addEventListener('click', window.closeProductModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        await API.post('/api/products', payload);
        showToast('Product added successfully!', 'success');
        window.closeProductModal();
        loadProducts();
      } catch (err) {
        showToast(`Failed to add product: ${err.message}`, 'error');
      }
    });
  }
}

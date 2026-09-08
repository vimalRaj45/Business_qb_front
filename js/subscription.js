import { API } from './api.js';
import { showToast } from './utils.js';

/**
 * Dynamically load Razorpay Checkout SDK
 */
export async function loadRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Fetch subscription status and remaining invoice allowance
 */
export async function getSubscriptionStatus() {
  try {
    const res = await API.get('/api/subscription/status', { skipLoading: true });
    return res.data;
  } catch (err) {
    console.warn('Could not fetch subscription status:', err.message);
    return null;
  }
}

/**
 * Open Upgrade to Pro Modal (₹100/mo) with Razorpay Checkout
 */
export async function openUpgradeModal(reason = '') {
  await loadRazorpayScript();

  const existing = document.getElementById('pro-upgrade-modal');
  if (existing) existing.remove();

  const status = await getSubscriptionStatus();
  const invoiceCount = status?.invoiceCount || 0;
  const freeLimit = status?.freeLimit || 10;

  const modalHtml = `
    <div id="pro-upgrade-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-teal-100 space-y-6 relative overflow-hidden">
        
        <!-- Top decorative badge -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-xl pointer-events-none"></div>

        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <span class="px-3 py-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-[10px] font-extrabold rounded-full tracking-wider uppercase shadow-xs">
              ★ Bizsheet Pro
            </span>
            <h3 class="text-xl font-black text-slate-900 pt-1 tracking-tight">Upgrade to Unlimited Invoicing</h3>
            <p class="text-xs text-slate-500">
              ${reason || `You have used <strong>${invoiceCount}</strong> of <strong>${freeLimit}</strong> free invoices.`}
            </p>
          </div>
          <button type="button" id="close-pro-modal-btn" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            <i class="bi bi-x-lg text-xs font-bold"></i>
          </button>
        </div>

        <!-- Price Card -->
        <div class="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-3">
          <div class="flex items-baseline justify-between">
            <div class="text-xs text-slate-300 font-semibold uppercase tracking-wider">Pro Monthly Plan</div>
            <div class="text-right">
              <span class="text-3xl font-black tracking-tight text-white">₹100</span>
              <span class="text-xs text-slate-400 font-medium">/ 30 days</span>
            </div>
          </div>
          <div class="h-px bg-slate-700/60"></div>
          <ul class="text-xs text-slate-200 space-y-2 pt-1">
            <li class="flex items-center gap-2">
              <i class="bi bi-check-circle-fill text-teal-400"></i>
              <span><strong>Unlimited</strong> Invoices & Quotations</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="bi bi-check-circle-fill text-teal-400"></i>
              <span><strong>Instant Gmail</strong> Invoice Dispatch</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="bi bi-check-circle-fill text-teal-400"></i>
              <span><strong>UPI QR</strong> on all invoices for instant customer payments</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="bi bi-check-circle-fill text-teal-400"></i>
              <span><strong>Cloud Drive</strong> auto-sync without storage limits</span>
            </li>
          </ul>
        </div>

        <!-- Action Button -->
        <div class="space-y-2 pt-1">
          <button 
            type="button" 
            id="start-razorpay-pay-btn" 
            class="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-extrabold text-sm transition shadow-md shadow-teal-600/25 flex items-center justify-center gap-2"
          >
            <i class="bi bi-shield-lock-fill"></i> Pay ₹100 via Razorpay (UPI / Card)
          </button>
          <div class="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
            <span class="flex items-center gap-1"><i class="bi bi-lightning-charge-fill text-amber-500"></i> Instant Activation</span>
            <span>&bull;</span>
            <span class="flex items-center gap-1"><i class="bi bi-shield-check text-teal-600"></i> Secured by Razorpay</span>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('pro-upgrade-modal');
  const closeBtn = document.getElementById('close-pro-modal-btn');
  const payBtn = document.getElementById('start-razorpay-pay-btn');

  const closeModal = () => modal?.remove();
  closeBtn?.addEventListener('click', closeModal);

  payBtn?.addEventListener('click', async () => {
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="bi bi-arrow-repeat animate-spin"></i> Initializing Payment Gateway...';

    try {
      const res = await API.post('/api/subscription/create-order');
      const order = res.data;

      // Handle Mock Order if in Development or keys not yet configured
      if (order.isMock) {
        showToast('Running in Demo Mode: Simulating ₹100 payment...', 'info');
        setTimeout(async () => {
          try {
            const verifyRes = await API.post('/api/subscription/verify', {
              is_mock: true,
              order_id: order.orderId
            });
            showToast(verifyRes.message || 'Pro Plan Activated successfully!', 'success');
            closeModal();
            setTimeout(() => window.location.reload(), 1000);
          } catch (e) {
            showToast('Activation failed: ' + e.message, 'error');
            payBtn.disabled = false;
            payBtn.innerHTML = '<i class="bi bi-shield-lock-fill"></i> Pay ₹100 via Razorpay (UPI / Card)';
          }
        }, 1200);
        return;
      }

      // Real Razorpay Checkout Modal
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Bizsheet',
        description: order.description,
        image: 'https://bizsheet.vsgrps.com/assets/logo.png',
        order_id: order.orderId,
        handler: async function (response) {
          showToast('Payment received! Activating Pro Subscription...', 'info');
          try {
            const verifyRes = await API.post('/api/subscription/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            showToast(verifyRes.message || '🎉 Pro Plan Activated!', 'success');
            closeModal();
            setTimeout(() => window.location.reload(), 1000);
          } catch (err) {
            showToast('Payment verification failed: ' + err.message, 'error');
          }
        },
        prefill: {
          name: status?.businessName || '',
          email: status?.userEmail || ''
        },
        theme: {
          color: '#0d9488'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        showToast(`Payment Failed: ${response.error.description || 'Transaction cancelled'}`, 'error');
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="bi bi-shield-lock-fill"></i> Pay ₹100 via Razorpay (UPI / Card)';
      });
      rzp.open();

    } catch (err) {
      showToast('Could not initialize payment: ' + err.message, 'error');
      payBtn.disabled = false;
      payBtn.innerHTML = '<i class="bi bi-shield-lock-fill"></i> Pay ₹100 via Razorpay (UPI / Card)';
    }
  });
}

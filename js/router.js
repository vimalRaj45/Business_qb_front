/**
 * Bizsheet Single Page Application (SPA) Router
 * Provides zero-reload client-side routing, template caching, and script execution.
 */

// Self-contained navigation highlight and header title updater (zero dependency on layout.js caching)
export function updateActiveNav(routeName = 'dashboard') {
  const cleanRoute = (routeName || 'dashboard').replace(/^#\/?/, '').split('?')[0].replace(/\.html$/, '');

  document.querySelectorAll('#sidebar-container .nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const match = href.includes(cleanRoute) || 
      (cleanRoute.startsWith('invoice') && href.includes('invoices')) || 
      (cleanRoute.startsWith('quotation') && href.includes('quotations')) || 
      (cleanRoute.startsWith('customer') && href.includes('customers'));
    link.classList.toggle('active', match);
  });

  document.querySelectorAll('#mobile-sidebar-drawer .nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const match = href.includes(cleanRoute) || 
      (cleanRoute.startsWith('invoice') && href.includes('invoices')) || 
      (cleanRoute.startsWith('quotation') && href.includes('quotations')) || 
      (cleanRoute.startsWith('customer') && href.includes('customers'));
    link.classList.toggle('active', match);
  });

  document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    const match = href.includes(cleanRoute) || 
      (cleanRoute.startsWith('invoice') && href.includes('invoices')) || 
      (cleanRoute.startsWith('quotation') && href.includes('quotations'));
    item.classList.toggle('active', match);
  });
}

export function updateHeaderTitle(titleText = 'Dashboard') {
  const el = document.getElementById('header-title-text');
  if (el) el.textContent = titleText;
}

// Polyfill URLSearchParams so existing view scripts using window.location.search automatically read hash params
const OriginalURLSearchParams = window.URLSearchParams;
window.URLSearchParams = class extends OriginalURLSearchParams {
  constructor(init) {
    if (init === window.location.search && (!init || init === '')) {
      const hash = window.location.hash || '';
      const qIdx = hash.indexOf('?');
      if (qIdx !== -1) {
        init = hash.substring(qIdx);
      }
    }
    super(init);
  }
};

// Route definitions and their corresponding source HTML files
const ROUTE_MAP = {
  'dashboard': '/dashboard.html',
  'invoices': '/invoices.html',
  'invoice-create': '/invoice-create.html',
  'invoice-view': '/invoice-view.html',
  'quotations': '/quotations.html',
  'quotation-create': '/quotation-create.html',
  'quotation-view': '/quotation-view.html',
  'customers': '/customers.html',
  'customer-view': '/customer-view.html',
  'payments': '/payments.html',
  'products': '/products.html',
  'expenses': '/expenses.html',
  'transactions': '/transactions.html',
  'reports': '/reports.html',
  'developer': '/developer.html',
  'api-keys': '/api-keys.html',
  'webhooks': '/webhooks.html',
  'settings': '/settings.html',
  'team': '/team.html',
  'profile': '/profile.html'
};

const ROUTE_TITLES = {
  'dashboard': 'Dashboard',
  'invoices': 'Invoices',
  'invoice-create': 'New Invoice',
  'invoice-view': 'Invoice Details',
  'quotations': 'Quotations',
  'quotation-create': 'New Quotation',
  'quotation-view': 'Quotation Details',
  'customers': 'Customer CRM',
  'customer-view': 'Customer Details',
  'payments': 'Payments',
  'products': 'Products & Services',
  'expenses': 'Expenses',
  'transactions': 'Transactions Ledger',
  'reports': 'Reports & Analytics',
  'developer': 'Developer REST API',
  'api-keys': 'API Keys Management',
  'webhooks': 'Webhooks & Automation',
  'settings': 'Business Settings',
  'team': 'Team Members',
  'profile': 'Business Profile'
};

const templateCache = new Map();
let currentRoute = null;
let currentQueryParams = '';
let isNavigating = false;

/**
 * Parses hash string into route name and query string
 * Example: "#/invoice-view?id=inv_123" -> { route: "invoice-view", query: "?id=inv_123" }
 */
export function parseHash(rawHash = window.location.hash) {
  const clean = (rawHash || '').replace(/^#\/?/, '').trim();
  if (!clean) return { route: 'dashboard', query: '' };

  const [routePart, queryPart] = clean.split('?');
  const route = (routePart || 'dashboard').replace(/\.html$/, '');
  return {
    route: ROUTE_MAP[route] ? route : 'dashboard',
    query: queryPart ? `?${queryPart}` : ''
  };
}

/**
 * Programmatic SPA navigation
 * Example: navigateTo('invoices') or navigateTo('invoice-view?id=123')
 */
export function navigateTo(target) {
  let cleanTarget = target.startsWith('/') ? target.slice(1) : target;
  cleanTarget = cleanTarget.replace(/\.html/, '');
  window.location.hash = `#/${cleanTarget}`;
}

// Attach globally for inline handlers
window.navigateSpa = navigateTo;

/**
 * Fetches, parses, and mounts the target view into #spa-view-mount
 */
export async function loadRoute(routeName, queryString = '') {
  if (isNavigating) return;
  isNavigating = true;

  const mountPoint = document.getElementById('spa-view-mount');
  if (!mountPoint) {
    console.error('SPA mount point #spa-view-mount not found!');
    isNavigating = false;
    return;
  }

  const sourceFile = ROUTE_MAP[routeName] || '/dashboard.html';
  currentRoute = routeName;
  currentQueryParams = queryString;

  // Update navigation highlights and header title immediately for instant feedback
  updateActiveNav(routeName);
  const title = ROUTE_TITLES[routeName] || 'Bizsheet';
  updateHeaderTitle(title);
  document.title = `${title} - Bizsheet`;

  // Show subtle loading state inside the view container if not cached
  if (!templateCache.has(sourceFile)) {
    mountPoint.innerHTML = `
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-bold text-slate-500">Loading ${title}...</span>
        </div>
      </div>
    `;
  }

  try {
    let htmlText = templateCache.get(sourceFile);
    if (!htmlText) {
      const res = await fetch(sourceFile);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading view`);
      htmlText = await res.text();
      templateCache.set(sourceFile, htmlText);
    }

    // Parse HTML DOM to extract <main> and external modals
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const mainEl = doc.querySelector('main');
    if (!mainEl) {
      throw new Error(`No <main> element found in ${sourceFile}`);
    }

    // Collect any modals, overlays or extra template cards attached to body outside main
    const modals = Array.from(doc.body.children).filter(el => {
      const id = el.id || '';
      return (
        el.tagName !== 'MAIN' &&
        el.tagName !== 'SCRIPT' &&
        el.tagName !== 'ASIDE' &&
        id !== 'sidebar-container' &&
        id !== 'header-container' &&
        id !== 'app-splash-screen' &&
        id !== 'mobile-sidebar-drawer' &&
        id !== 'mobile-drawer-backdrop' &&
        !el.classList.contains('flex-1')
      );
    });

    // Clear mount point and insert new content
    mountPoint.innerHTML = '';
    
    // Create animated container
    const viewWrapper = document.createElement('div');
    viewWrapper.className = 'spa-fade-in w-full';
    viewWrapper.innerHTML = mainEl.innerHTML;

    // Append modals if any
    modals.forEach(m => {
      viewWrapper.appendChild(m.cloneNode(true));
    });

    mountPoint.appendChild(viewWrapper);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Execute scripts associated with the view
    await executeViewScripts(doc, sourceFile);

  } catch (err) {
    console.error('Error loading route:', routeName, err);
    mountPoint.innerHTML = `
      <div class="p-8 max-w-lg mx-auto text-center space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h3 class="text-lg font-black text-slate-800">Failed to load view</h3>
        <p class="text-xs text-slate-500">${err.message}</p>
        <button onclick="window.navigateSpa('dashboard')" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs">
          Return to Dashboard
        </button>
      </div>
    `;
  } finally {
    isNavigating = false;
  }
}

/**
 * Extracts and executes module scripts found within the source view
 */
async function executeViewScripts(parsedDoc, sourceFile) {
  const scripts = Array.from(parsedDoc.querySelectorAll('script'));

  for (const script of scripts) {
    const src = script.getAttribute('src');
    const type = script.getAttribute('type');

    // Skip vendor CDNs already loaded in app.html
    if (src && (src.includes('tailwindcss') || src.includes('bootstrap-icons') || src.includes('chart.js') || src.includes('html2pdf') || src.includes('jspdf'))) {
      continue;
    }

    // Skip legacy forwarding scripts
    if (script.textContent && (script.textContent.includes('/app.html#') || script.textContent.includes('window.location.replace'))) {
      continue;
    }

    if (src) {
      // External script (e.g. /js/invoices.js)
      try {
        await import(`${src}?spa=${Date.now()}`);
      } catch (e) {
        console.warn('Dynamic script import notice:', src, e);
      }
    } else if (script.textContent.trim()) {
      // Inline module script
      try {
        let code = script.textContent;
        // Strip out redundant checkAuth / renderLayout calls if present to avoid loops
        const blob = new Blob([code], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        await import(blobUrl);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.warn('Inline module execution notice in', sourceFile, e);
      }
    }
  }

  // Trigger custom view-mounted event for any view-specific listeners
  window.dispatchEvent(new CustomEvent('spa:view-mounted', {
    detail: { route: currentRoute, query: currentQueryParams }
  }));
}

/**
 * Initializes the router, handles hash changes, and sets up global link interceptor
 */
export function initRouter() {
  // Listen to browser hash changes (Back / Forward / Link clicks)
  window.addEventListener('hashchange', () => {
    const { route, query } = parseHash();
    loadRoute(route, query);
  });

  // Global click interceptor for seamless internal links
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Ignore external links, mailto, tel, javascript:, or new tab links
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      anchor.getAttribute('target') === '_blank'
    ) {
      return;
    }

    // Check if link matches an app view (e.g. "/invoices.html" or "invoices.html" or "#/invoices")
    if (href.startsWith('#/')) {
      // Standard hash link, browser will handle or we navigate
      return;
    }

    const cleanHref = href.startsWith('/') ? href.slice(1) : href;
    const [pathPart, queryPart] = cleanHref.split('?');
    const baseName = pathPart.replace(/\.html$/, '');

    if (ROUTE_MAP[baseName]) {
      e.preventDefault();
      const targetHash = `#/${baseName}${queryPart ? `?${queryPart}` : ''}`;
      if (window.location.hash === targetHash) {
        // Same route, re-trigger loadRoute
        loadRoute(baseName, queryPart ? `?${queryPart}` : '');
      } else {
        window.location.hash = targetHash;
      }
    }
  });

  // Load the initial route based on current URL hash
  const { route, query } = parseHash();
  loadRoute(route, query);
}

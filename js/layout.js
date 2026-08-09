import { logout } from './auth.js';
import { API } from './api.js';

let chatHistory = [];

export function renderLayout(business = {}, user = {}) {
  // Render & Auto-Dismiss Light Professional Glass Splash Screen
  renderSplashScreen();

  // Render Sidebar & Headers
  const sidebarContainer = document.getElementById('sidebar-container');
  const headerContainer = document.getElementById('header-container');
  const currentPath = window.location.pathname;

  const navItems = [
    { label: 'Dashboard', href: '/dashboard.html', icon: 'bi-grid-1x2-fill' },
    { label: 'Quotations', href: '/quotations.html', icon: 'bi-file-earmark-text-fill' },
    { label: 'Invoices', href: '/invoices.html', icon: 'bi-receipt-cutoff' },
    { label: 'Payments', href: '/payments.html', icon: 'bi-credit-card-fill' },
    { label: 'Customers', href: '/customers.html', icon: 'bi-people-fill' },
    { label: 'Products & Services', href: '/products.html', icon: 'bi-box-seam-fill' },
    { label: 'Expenses', href: '/expenses.html', icon: 'bi-wallet2' },
    { label: 'Transactions', href: '/transactions.html', icon: 'bi-journal-text' },
    { label: 'Reports', href: '/reports.html', icon: 'bi-bar-chart-line-fill' },
    { label: 'Developer API', href: '/developer.html', icon: 'bi-code-slash' },
    { label: 'Team & Audit Logs', href: '/team.html', icon: 'bi-shield-lock-fill' },
    { label: 'Settings', href: '/settings.html', icon: 'bi-gear-fill' },
  ];

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Business Owner')}&background=0d9488&color=fff&font-size=0.45`;
  const avatarUrl = user.picture ? user.picture : fallbackAvatar;

  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <div class="h-full flex flex-col justify-between p-4 bg-white border-r border-slate-200">
        <div>
          <div class="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-100">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              ${(business.business_name || 'B').charAt(0).toUpperCase()}
            </div>
            <div class="overflow-hidden">
              <h1 class="font-extrabold text-slate-900 text-sm truncate">${business.business_name || 'My Business'}</h1>
              <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <i class="bi bi-google"></i> Google Drive Sync
              </span>
            </div>
          </div>

          <nav class="space-y-1">
            ${navItems.map(item => {
              const isActive = currentPath.endsWith(item.href);
              return `
                <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
                  <i class="bi ${item.icon}"></i>
                  <span>${item.label}</span>
                </a>
              `;
            }).join('')}
          </nav>
        </div>

        <div class="pt-4 border-t border-slate-100 space-y-2">
          <a href="/settings.html" class="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition overflow-hidden">
            <img src="${avatarUrl}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackAvatar}';" class="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover" alt="User Avatar" />
            <div class="overflow-hidden">
              <div class="font-bold text-slate-800 truncate">${user.name || 'Business Owner'}</div>
              <div class="text-[10px] text-slate-500 truncate">${user.email || 'owner@example.com'}</div>
            </div>
          </a>
          <button id="logout-btn" class="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200/60 shadow-2xs">
            <i class="bi bi-box-arrow-right text-base"></i> Logout
          </button>
        </div>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  if (headerContainer) {
    headerContainer.innerHTML = `
      <header class="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center justify-between no-print sticky top-0 z-20">
        <div class="flex items-center gap-3">
          <button id="mobile-hamburger-btn" class="md:hidden w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center text-lg active:scale-95 transition">
            <i class="bi bi-list"></i>
          </button>
          
          <h2 class="text-lg md:text-xl font-bold text-slate-900 capitalize truncate">
            ${currentPath.split('/').pop().replace('.html', '').replace('-', ' ') || 'Dashboard'}
          </h2>
        </div>

        <div class="flex items-center gap-3">
          <a href="${business.spreadsheet_id && business.spreadsheet_id !== 'local_demo_spreadsheet_id' ? `https://docs.google.com/spreadsheets/d/${business.spreadsheet_id}` : '/settings.html'}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs">
            <i class="bi bi-file-earmark-spreadsheet-fill text-emerald-600"></i> <span class="hidden sm:inline">Open Sheet</span>
          </a>

          <button id="header-logout-btn" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-extrabold transition shadow-2xs flex items-center gap-1.5">
            <i class="bi bi-box-arrow-right"></i> <span class="hidden sm:inline">Logout</span>
          </button>

          <div class="flex items-center gap-2 border-l border-slate-200 pl-3">
            <img src="${avatarUrl}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackAvatar}';" class="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover" alt="User Avatar" />
          </div>
        </div>
      </header>
    `;

    document.getElementById('header-logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  renderMobileDrawer(navItems, currentPath, business, user, fallbackAvatar, avatarUrl);
  renderMobileBottomNav(currentPath);
  injectChatbotWidget();

  if (window.AOS) {
    window.AOS.init({ duration: 600, once: true });
  }
}

function renderSplashScreen() {
  if (document.getElementById('app-splash-screen')) return;

  const splash = document.createElement('div');
  splash.id = 'app-splash-screen';
  splash.className = 'no-print';
  splash.innerHTML = `
    <div class="splash-glass-card space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-3xl font-black mx-auto shadow-lg splash-logo-pulse">
        <i class="bi bi-receipt"></i>
      </div>
      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">BizSheet Platform</h2>
        <p class="text-xs font-bold text-teal-700">Synchronizing Google Drive Ledger...</p>
      </div>
      <div class="splash-progress-track">
        <div class="splash-progress-fill"></div>
      </div>
    </div>
  `;

  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 450);
  }, 350);
}

function renderMobileDrawer(navItems, currentPath, business, user, fallbackAvatar, avatarUrl) {
  let backdrop = document.getElementById('mobile-drawer-backdrop');
  let drawer = document.getElementById('mobile-sidebar-drawer');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'mobile-drawer-backdrop';
    document.body.appendChild(backdrop);
  }

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mobile-sidebar-drawer';
    document.body.appendChild(drawer);
  }

  drawer.innerHTML = `
    <div class="h-full flex flex-col justify-between p-4 overflow-y-auto">
      <div>
        <div class="flex items-center justify-between px-2 py-3 mb-4 border-b border-slate-100">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-9 h-9 rounded-xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shrink-0">
              ${(business.business_name || 'B').charAt(0).toUpperCase()}
            </div>
            <div class="overflow-hidden">
              <div class="font-extrabold text-slate-900 text-xs truncate">${business.business_name || 'My Business'}</div>
              <div class="text-[10px] text-emerald-600 font-semibold">Google Drive Sync</div>
            </div>
          </div>

          <button id="close-mobile-drawer-btn" class="w-8 h-8 text-slate-400 hover:text-slate-900 text-lg flex items-center justify-center rounded-lg">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="space-y-1">
          ${navItems.map(item => {
            const isActive = currentPath.endsWith(item.href);
            return `
              <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
                <i class="bi ${item.icon}"></i>
                <span>${item.label}</span>
              </a>
            `;
          }).join('')}
        </nav>
      </div>

      <div class="pt-4 border-t border-slate-100 space-y-2">
        <a href="/settings.html" class="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl transition overflow-hidden">
          <img src="${avatarUrl}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackAvatar}';" class="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover" alt="User Avatar" />
          <div class="overflow-hidden">
            <div class="font-bold text-slate-800 truncate">${user.name || 'Owner'}</div>
            <div class="text-[10px] text-slate-500 truncate">${user.email || 'owner@example.com'}</div>
          </div>
        </a>
        <button id="mobile-logout-btn" class="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200/60">
          <i class="bi bi-box-arrow-right text-base"></i> Logout
        </button>
      </div>
    </div>
  `;

  const openDrawer = () => {
    backdrop.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.getElementById('mobile-hamburger-btn')?.addEventListener('click', openDrawer);
  document.getElementById('close-mobile-drawer-btn')?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.getElementById('mobile-logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

function renderMobileBottomNav(currentPath) {
  if (document.getElementById('mobile-bottom-nav-root')) return;

  const nav = document.createElement('div');
  nav.id = 'mobile-bottom-nav-root';
  nav.className = 'md:hidden no-print';

  const items = [
    { label: 'Dashboard', href: '/dashboard.html', icon: 'bi-grid-1x2-fill' },
    { label: 'Quotations', href: '/quotations.html', icon: 'bi-file-earmark-text-fill' },
    { label: 'Invoices', href: '/invoices.html', icon: 'bi-receipt-cutoff' },
    { label: 'Customers', href: '/customers.html', icon: 'bi-people-fill' },
    { label: 'Reports', href: '/reports.html', icon: 'bi-bar-chart-line-fill' }
  ];

  nav.innerHTML = `
    <nav class="mobile-bottom-nav">
      ${items.map(item => {
        const isActive = currentPath.endsWith(item.href);
        return `
          <a href="${item.href}" class="mobile-nav-item ${isActive ? 'active' : ''}">
            <i class="bi ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        `;
      }).join('')}
    </nav>
  `;

  document.body.appendChild(nav);
}

function injectChatbotWidget() {
  if (document.getElementById('mistral-chatbot-root')) return;

  const root = document.createElement('div');
  root.id = 'mistral-chatbot-root';
  root.className = 'no-print';

  root.innerHTML = `
    <button id="chatbot-toggle-btn" aria-label="Toggle AI Assistant" class="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[99998] w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 hover:bg-black text-white rounded-full shadow-2xl border-2 border-slate-700/80 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group">
      <i class="bi bi-stars text-2xl sm:text-3xl text-amber-400 group-hover:rotate-12 transition-all duration-300"></i>
      <span class="absolute -top-0.5 -right-0.5 flex h-4 w-4">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
      </span>
    </button>

    <div id="chatbot-drawer" class="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-96 max-w-full max-h-[calc(100vh-6.5rem)] sm:max-h-[600px] z-[99999] bg-white rounded-3xl shadow-2xl border border-slate-200 hidden flex-col overflow-hidden transition-all transform duration-300">
      
      <div class="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-lg sm:text-xl text-white shadow-inner shrink-0">
            <i class="bi bi-stars"></i>
          </div>
          <div>
            <h3 class="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
              BizSheet AI <span class="text-[10px] bg-white/15 text-slate-200 px-1.5 py-0.5 rounded font-mono">Mistral AI</span>
            </h3>
            <p class="text-[10px] text-slate-400">Your Intelligent Financial Advisor</p>
          </div>
        </div>
        <button id="chatbot-close-btn" class="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition shrink-0">
          <i class="bi bi-x-lg text-sm"></i>
        </button>
      </div>

      <div class="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 text-[11px] overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
        <button class="prompt-chip bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 px-3 py-1 rounded-full text-slate-800 font-semibold transition shrink-0">
          📊 Net profit summary
        </button>
        <button class="prompt-chip bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 px-3 py-1 rounded-full text-slate-800 font-semibold transition shrink-0">
          ⚠️ Unpaid invoices
        </button>
        <button class="prompt-chip bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 px-3 py-1 rounded-full text-slate-800 font-semibold transition shrink-0">
          💡 Convert quotation
        </button>
      </div>

      <div id="chatbot-messages" class="p-3.5 sm:p-4 space-y-3 flex-1 min-h-[160px] max-h-[48vh] sm:max-h-[350px] overflow-y-auto text-xs bg-slate-50/50">
        <div class="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
          <div class="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            <i class="bi bi-stars"></i>
          </div>
          <div class="bg-white p-3 rounded-2xl border border-slate-200 text-slate-800 shadow-2xs space-y-1">
            <p>Hello! I am <strong>BizSheet AI</strong> powered by Mistral AI. I can analyze your live business data, track unpaid invoices, summarize expenses, or assist with system navigation.</p>
            <p class="text-[10px] text-slate-400">Ask me anything about your business!</p>
          </div>
        </div>
      </div>

      <form id="chatbot-form" class="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
        <input type="text" id="chatbot-input" required placeholder="Ask Mistral AI..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-900 font-medium" />
        <button type="submit" id="chatbot-send-btn" class="w-9 h-9 bg-slate-900 hover:bg-black text-white rounded-xl flex items-center justify-center text-sm transition shrink-0 shadow-xs active:scale-95">
          <i class="bi bi-send-fill"></i>
        </button>
      </form>

    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.getElementById('chatbot-toggle-btn');
  const closeBtn = document.getElementById('chatbot-close-btn');
  const drawer = document.getElementById('chatbot-drawer');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');

  toggleBtn.addEventListener('click', () => {
    drawer.classList.toggle('hidden');
    drawer.classList.toggle('flex');
    if (!drawer.classList.contains('hidden')) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
  });

  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const text = e.target.textContent.trim().replace(/^[^a-zA-Z0-9?]+/, '');
      input.value = text;
      form.dispatchEvent(new Event('submit'));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    input.value = '';
    appendUserMessage(query);

    chatHistory.push({ role: 'user', content: query });
    const typingId = appendTypingIndicator();

    try {
      const res = await API.post('/api/chatbot/query', { query, history: chatHistory });
      removeTypingIndicator(typingId);

      const answer = res.answer || 'No response received.';
      appendAssistantMessage(answer);
      chatHistory.push({ role: 'assistant', content: answer });

    } catch (err) {
      removeTypingIndicator(typingId);
      appendAssistantMessage(`⚠️ Error: ${err.message}`);
    }
  });
}

function appendUserMessage(text) {
  const container = document.getElementById('chatbot-messages');
  const div = document.createElement('div');
  div.className = 'flex justify-end';
  div.innerHTML = `
    <div class="bg-slate-900 text-white p-3 rounded-2xl max-w-[85%] text-xs shadow-2xs font-medium">
      ${escapeHtml(text)}
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendAssistantMessage(text) {
  const container = document.getElementById('chatbot-messages');
  const div = document.createElement('div');
  div.className = 'flex items-start gap-2 max-w-[88%]';
  div.innerHTML = `
    <div class="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
      <i class="bi bi-stars"></i>
    </div>
    <div class="bg-white p-3 rounded-2xl border border-slate-200 text-slate-800 shadow-2xs space-y-1 text-xs leading-relaxed">
      ${formatMarkdownText(text)}
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById('chatbot-messages');
  const id = `typing-${Date.now()}`;
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex items-start gap-2 max-w-[85%]';
  div.innerHTML = `
    <div class="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
      <i class="bi bi-stars"></i>
    </div>
    <div class="bg-slate-100 px-3 py-2 rounded-2xl text-slate-500 text-xs italic flex items-center gap-1.5">
      <i class="bi bi-arrow-repeat animate-spin text-slate-900"></i> Mistral AI is thinking...
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMarkdownText(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-900">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n• /g, '<br/>• ')
    .replace(/\n- /g, '<br/>• ');
}

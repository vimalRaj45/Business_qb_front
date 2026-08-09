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
  const workspaces = user.workspaces || [];

  const workspaceSwitcherHtml = workspaces.length > 1 ? `
    <select id="workspace-switcher-select" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 rounded-xl text-xs focus:outline-none transition cursor-pointer">
      ${workspaces.map(w => `
        <option value="${w.business_id}" ${w.business_id === business.business_id ? 'selected' : ''}>
          ${w.business_name || 'Business'} (${w.role === 'owner' ? 'Owner' : 'Staff Member'})
        </option>
      `).join('')}
    </select>
  ` : '';

  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <div class="h-full flex flex-col justify-between p-4 bg-white border-r border-slate-200 overflow-y-auto">
        <div class="flex-1 flex flex-col min-h-0">
          <div class="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-100 shrink-0">
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

          <nav class="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1">
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

        <div class="pt-4 mt-2 border-t border-slate-100 space-y-2 shrink-0">
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
          ${workspaceSwitcherHtml}

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

    document.getElementById('workspace-switcher-select')?.addEventListener('change', async (e) => {
      const targetId = e.target.value;
      try {
        const res = await API.post('/api/auth/switch-workspace', { business_id: targetId });
        if (window.showToast) window.showToast(res.message || 'Switched workspace!', 'success');
        setTimeout(() => window.location.reload(), 400);
      } catch (err) {
        if (window.showToast) window.showToast(err.message || 'Failed to switch workspace', 'error');
      }
    });
  }

  renderMobileDrawer(navItems, currentPath, business, user, fallbackAvatar, avatarUrl);
  renderMobileBottomNav(currentPath);
  injectChatbotWidget();

  if (window.AOS) {
    window.AOS.init({ duration: 600, once: true });
  }

  // Hide owner-only elements for members
  const isOwner = user.role === 'owner' || business.owner_google_id === user.googleId;
  if (!isOwner) {
    document.querySelectorAll('.owner-only').forEach(el => el.classList.add('hidden'));
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
      <div class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center justify-between px-2 py-3 mb-4 border-b border-slate-100 shrink-0">
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

        <nav class="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1">
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

      <div class="pt-4 mt-2 border-t border-slate-100 space-y-2 shrink-0">
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
  };

  const closeDrawer = () => {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
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
  let nav = document.querySelector('.mobile-bottom-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav md:hidden no-print';
    document.body.appendChild(nav);
  }

  const items = [
    { label: 'Home', href: '/dashboard.html', icon: 'bi-grid-1x2-fill' },
    { label: 'Quotes', href: '/quotations.html', icon: 'bi-file-earmark-text-fill' },
    { label: 'Invoices', href: '/invoices.html', icon: 'bi-receipt-cutoff' },
    { label: 'Team', href: '/team.html', icon: 'bi-shield-lock-fill' },
    { label: 'More', href: '/settings.html', icon: 'bi-gear-fill' },
  ];

  nav.innerHTML = items.map(item => {
    const isActive = currentPath.endsWith(item.href);
    return `
      <a href="${item.href}" class="mobile-nav-item ${isActive ? 'active' : ''}">
        <i class="bi ${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `;
  }).join('');
}

function injectChatbotWidget() {
  if (document.getElementById('ai-chatbot-widget')) return;

  const container = document.createElement('div');
  container.id = 'ai-chatbot-widget';
  container.className = 'no-print';
  container.innerHTML = `
    <!-- Floating AI emblem button -->
    <button id="ai-chat-toggle" class="fixed bottom-20 md:bottom-6 right-6 z-50 bg-slate-900 hover:bg-black text-white p-3.5 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-slate-700/60">
      <div class="relative flex items-center justify-center">
        <i class="bi bi-cpu-fill text-xl text-teal-400"></i>
        <span class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900"></span>
        </span>
      </div>
    </button>

    <!-- AI Chat Dialog -->
    <div id="ai-chat-modal" class="fixed bottom-28 md:bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-3xl border border-slate-200 shadow-2xl hidden flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
      <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <div class="font-extrabold text-xs">AI Financial Assistant</div>
            <div class="text-[10px] text-teal-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected to Sheet
            </div>
          </div>
        </div>
        <button id="ai-chat-close" class="text-slate-400 hover:text-white text-lg"><i class="bi bi-x-lg"></i></button>
      </div>

      <div id="ai-chat-messages" class="p-4 h-80 overflow-y-auto space-y-3 text-xs bg-slate-50">
        <div class="bg-white p-3 rounded-2xl border border-slate-200 text-slate-700 shadow-2xs leading-relaxed">
          👋 Hello! I am your AI Business Copilot. Ask me anything about your revenue, unpaid invoices, quotations, or customer balances!
        </div>
      </div>

      <div class="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input type="text" id="ai-chat-input" placeholder="Ask AI assistant..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500" />
        <button id="ai-chat-send" class="px-3 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition">
          <i class="bi bi-send-fill text-teal-400"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const toggle = document.getElementById('ai-chat-toggle');
  const modal = document.getElementById('ai-chat-modal');
  const close = document.getElementById('ai-chat-close');
  const input = document.getElementById('ai-chat-input');
  const send = document.getElementById('ai-chat-send');
  const messages = document.getElementById('ai-chat-messages');

  toggle.addEventListener('click', () => {
    modal.classList.toggle('hidden');
    modal.classList.toggle('flex');
    if (!modal.classList.contains('hidden')) {
      input.focus();
    }
  });

  close.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    messages.innerHTML += `
      <div class="bg-teal-600 text-white p-3 rounded-2xl ml-auto max-w-[85%] font-medium leading-relaxed">
        ${escapeHtml(text)}
      </div>
    `;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    chatHistory.push({ role: 'user', content: text });

    const loadingId = 'ai-load-' + Date.now();
    messages.innerHTML += `
      <div id="${loadingId}" class="bg-white p-3 rounded-2xl border border-slate-200 text-slate-500 italic max-w-[85%] flex items-center gap-2">
        <i class="bi bi-three-dots animate-pulse"></i> Thinking...
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await API.post('/api/chatbot', { messages: chatHistory });
      document.getElementById(loadingId)?.remove();

      const reply = res.reply || 'I processed your query successfully.';
      chatHistory.push({ role: 'assistant', content: reply });

      messages.innerHTML += `
        <div class="bg-white p-3 rounded-2xl border border-slate-200 text-slate-800 shadow-2xs leading-relaxed">
          ${escapeHtml(reply)}
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      document.getElementById(loadingId)?.remove();
      messages.innerHTML += `
        <div class="bg-rose-50 text-rose-700 p-3 rounded-2xl border border-rose-200 leading-relaxed">
          Error: ${escapeHtml(err.message || 'Could not connect to AI service.')}
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }
  };

  send.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

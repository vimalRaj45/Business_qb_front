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

    fetchAndRenderWorkspaceSwitcher(business);
  }

  renderMobileDrawer(navItems, currentPath, business, user, fallbackAvatar, avatarUrl);
  renderMobileBottomNav(currentPath);
  injectChatbotWidget();

  if (window.AOS) {
    window.AOS.init({ duration: 600, once: true });
  }
}

async function fetchAndRenderWorkspaceSwitcher(currentBusiness) {
  try {
    const res = await API.get('/api/auth/me');
    if (!res || !res.workspaces || res.workspaces.length <= 1) return;

    const headerRight = document.querySelector('header .flex.items-center.gap-3');
    if (!headerRight || document.getElementById('workspace-switcher-select')) return;

    const switcherContainer = document.createElement('div');
    switcherContainer.className = 'relative flex items-center';
    
    const optionsHtml = res.workspaces.map(w => {
      const isSelected = w.business_id === currentBusiness.business_id ? 'selected' : '';
      const icon = w.is_owner ? '🏢' : '👥';
      const roleText = w.is_owner ? 'Owner' : 'Staff';
      return `<option value="${w.business_id}" ${isSelected}>${icon} ${w.business_name} (${roleText})</option>`;
    }).join('');

    switcherContainer.innerHTML = `
      <select id="workspace-switcher-select" class="px-2.5 py-1.5 bg-slate-100 border border-slate-300 hover:border-teal-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer transition">
        ${optionsHtml}
      </select>
    `;

    headerRight.insertBefore(switcherContainer, headerRight.firstChild);

    document.getElementById('workspace-switcher-select').addEventListener('change', async (e) => {
      const targetBizId = e.target.value;
      if (!targetBizId) return;

      try {
        await API.post('/api/auth/switch-workspace', { business_id: targetBizId });
        window.location.reload();
      } catch (err) {
        console.error('Workspace switch error:', err);
      }
    });
  } catch (err) {
    // ignore
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
              <h1 class="font-extrabold text-slate-900 text-xs truncate">${business.business_name || 'My Business'}</h1>
              <span class="text-[9px] font-semibold text-emerald-700">Google Drive Ledger</span>
            </div>
          </div>
          <button id="close-drawer-btn" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm">
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
            <div class="font-bold text-slate-800 truncate">${user.name || 'User'}</div>
            <div class="text-[10px] text-slate-500 truncate">${user.email || ''}</div>
          </div>
        </a>
        <button id="drawer-logout-btn" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition">
          <i class="bi bi-box-arrow-right text-base"></i> Logout
        </button>
      </div>
    </div>
  `;

  const hamburgerBtn = document.getElementById('mobile-hamburger-btn');
  const closeBtn = document.getElementById('close-drawer-btn');

  function openDrawer() {
    backdrop.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  document.getElementById('drawer-logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

function renderMobileBottomNav(currentPath) {
  if (document.querySelector('.mobile-bottom-nav')) return;

  const nav = document.createElement('div');
  nav.className = 'mobile-bottom-nav md:hidden no-print';
  nav.innerHTML = `
    <a href="/dashboard.html" class="mobile-nav-item ${currentPath.endsWith('/dashboard.html') ? 'active' : ''}">
      <i class="bi bi-grid-1x2-fill"></i>
      <span>Home</span>
    </a>
    <a href="/quotations.html" class="mobile-nav-item ${currentPath.endsWith('/quotations.html') ? 'active' : ''}">
      <i class="bi bi-file-earmark-text-fill"></i>
      <span>Quotes</span>
    </a>
    <a href="/invoices.html" class="mobile-nav-item ${currentPath.endsWith('/invoices.html') ? 'active' : ''}">
      <i class="bi bi-receipt-cutoff"></i>
      <span>Invoices</span>
    </a>
    <a href="/payments.html" class="mobile-nav-item ${currentPath.endsWith('/payments.html') ? 'active' : ''}">
      <i class="bi bi-credit-card-fill"></i>
      <span>Payments</span>
    </a>
    <a href="/team.html" class="mobile-nav-item ${currentPath.endsWith('/team.html') ? 'active' : ''}">
      <i class="bi bi-shield-lock-fill"></i>
      <span>Team</span>
    </a>
  `;
  document.body.appendChild(nav);
}

function injectChatbotWidget() {
  if (document.getElementById('ai-chatbot-floating-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ai-chatbot-floating-btn';
  btn.className = 'fixed bottom-20 md:bottom-6 right-6 z-40 p-3 bg-slate-900 hover:bg-black text-white rounded-full shadow-2xl transition hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white/20';
  btn.setAttribute('title', 'Ask AI Assistant');
  btn.innerHTML = `
    <div class="relative flex items-center justify-center">
      <i class="bi bi-stars text-xl text-white"></i>
      <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
      </span>
    </div>
  `;

  const drawer = document.createElement('div');
  drawer.id = 'ai-chatbot-drawer';
  drawer.className = 'fixed bottom-28 md:bottom-20 right-6 z-40 w-96 max-w-[90vw] h-[520px] bg-white rounded-3xl border border-slate-200 shadow-2xl hidden flex-col overflow-hidden no-print animate-in fade-in slide-in-from-bottom-5 duration-200';
  drawer.innerHTML = `
    <div class="p-4 bg-slate-900 text-white flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-teal-500 text-slate-900 flex items-center justify-center text-base font-black">
          <i class="bi bi-stars"></i>
        </div>
        <div>
          <h3 class="font-bold text-xs">AI Business Assistant</h3>
          <span class="text-[10px] text-teal-400 font-semibold">Online • Sheet Integrated</span>
        </div>
      </div>
      <button id="close-chat-btn" class="text-slate-300 hover:text-white text-base"><i class="bi bi-x-lg"></i></button>
    </div>

    <div id="chat-messages" class="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 text-xs">
      <div class="flex items-start gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">AI</div>
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs max-w-[85%] text-slate-700">
          Hello! I am your AI Business Assistant. How can I help you analyze sales, track invoices, or generate reports today?
        </div>
      </div>
    </div>

    <form id="chat-form" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
      <input type="text" id="chat-input" placeholder="Ask AI anything about your business..." required class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500" />
      <button type="submit" class="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 transition">
        <i class="bi bi-send-fill"></i>
      </button>
    </form>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(drawer);

  btn.addEventListener('click', () => {
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
      drawer.classList.remove('hidden');
      drawer.classList.add('flex');
    } else {
      drawer.classList.add('hidden');
      drawer.classList.remove('flex');
    }
  });

  document.getElementById('close-chat-btn')?.addEventListener('click', () => {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
  });

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      appendChatMessage('user', message);
      chatInput.value = '';

      const typingId = appendChatMessage('system', 'AI is thinking...');

      try {
        const res = await API.post('/api/chatbot/message', { message, history: chatHistory });
        const reply = res.reply || 'No response generated.';
        
        removeChatMessage(typingId);
        appendChatMessage('assistant', reply);
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: reply });
      } catch (err) {
        removeChatMessage(typingId);
        appendChatMessage('assistant', 'Sorry, I encountered an issue processing your request: ' + err.message);
      }
    });
  }

  function appendChatMessage(role, text) {
    const id = 'msg-' + Math.random().toString(36).substring(2, 9);
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex items-start gap-2.5';

    if (role === 'user') {
      div.className += ' justify-end';
      div.innerHTML = `
        <div class="bg-slate-900 text-white p-3 rounded-2xl max-w-[85%] text-xs shadow-xs">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">AI</div>
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs max-w-[85%] text-slate-700 leading-relaxed">
          ${escapeHtml(text)}
        </div>
      `;
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
  }

  function removeChatMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

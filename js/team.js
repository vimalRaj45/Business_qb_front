import { checkAuth } from './auth.js';
import { renderLayout } from './layout.js';
import { API } from './api.js';
import { showToast, formatDate, escapeHtml, confirmModal } from './utils.js';

let allLogs = [];
let isOwner = false;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) return;

  isOwner = session.role === 'owner' || session.business?.owner_google_id === session.user?.googleId;
  renderLayout(session.business, session.user);

  // Hide owner-only elements for members
  if (!isOwner) {
    document.querySelectorAll('.owner-only').forEach(el => el.classList.add('hidden'));
  }

  await loadTeamMembers();
  await loadActivityLogs();

  setupEventListeners();
});

async function loadTeamMembers() {
  const container = document.getElementById('team-list-container');
  const countBadge = document.getElementById('team-count-badge');

  try {
    const res = await API.get('/api/team');
    const members = res.data || [];

    countBadge.textContent = `${members.length + 1} Members`;

    let html = `
      <div class="p-3 bg-teal-50/60 border border-teal-200/60 rounded-2xl flex items-center justify-between">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0">
            <i class="bi bi-shield-check"></i>
          </div>
          <div class="overflow-hidden">
            <div class="font-bold text-xs text-slate-900 truncate">Primary Owner</div>
            <div class="text-[10px] text-slate-500 truncate">Full Workspace Administrator</div>
          </div>
        </div>
        <span class="text-[10px] font-extrabold bg-teal-600 text-white px-2 py-0.5 rounded-full">OWNER</span>
      </div>
    `;

    if (members.length === 0) {
      html += `
        <div class="text-center py-4 text-slate-400 text-xs italic">
          No staff members invited yet.
        </div>
      `;
    } else {
      members.forEach(member => {
        const isPending = member.status === 'pending';
        const roleBadge = member.role === 'owner'
          ? '<span class="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">OWNER</span>'
          : '<span class="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">STAFF</span>';

        const statusBadge = isPending
          ? '<span class="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">Pending</span>'
          : '<span class="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200">Active</span>';

        html += `
          <div class="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs hover:border-slate-300 transition">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                ${(member.name || member.email || 'M').charAt(0).toUpperCase()}
              </div>
              <div class="overflow-hidden">
                <div class="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                  ${escapeHtml(member.name || member.email)} ${statusBadge}
                </div>
                <div class="text-[10px] text-slate-500 truncate">${escapeHtml(member.email)}</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              ${roleBadge}
              ${isOwner && member.role !== 'owner' ? `
                <button onclick="window.revokeTeamMember('${member.member_id}', '${escapeHtml(member.email)}')" class="text-rose-500 hover:text-rose-700 text-xs p-1" title="Revoke Access">
                  <i class="bi bi-trash-fill"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `<div class="text-center py-4 text-rose-500 text-xs">Failed to load team members</div>`;
  }
}

async function loadActivityLogs() {
  const tbody = document.getElementById('logs-tbody');

  try {
    const res = await API.get('/api/activity-logs');
    allLogs = res.data || [];
    renderLogsTable(allLogs);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-500">Failed to load activity logs</td></tr>`;
  }
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logs-tbody');

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 italic">No activity logs recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    let actionBadge = '<span class="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">ACTION</span>';
    if (log.action === 'CREATE') actionBadge = '<span class="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">CREATE</span>';
    if (log.action === 'UPDATE') actionBadge = '<span class="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">UPDATE</span>';
    if (log.action === 'DELETE') actionBadge = '<span class="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">DELETE</span>';
    if (log.action === 'SEND_EMAIL') actionBadge = '<span class="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">SEND EMAIL</span>';
    if (log.action === 'INVITE_MEMBER') actionBadge = '<span class="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">INVITE</span>';

    const roleTag = log.user_role === 'owner' 
      ? '<span class="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Owner</span>'
      : '<span class="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">Staff</span>';

    return `
      <tr class="hover:bg-slate-50/70 transition">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800">${escapeHtml(log.user_name || 'User')}</div>
          <div class="text-[10px] text-slate-400">${escapeHtml(log.user_email || '')}</div>
        </td>
        <td class="py-3 px-4">${roleTag}</td>
        <td class="py-3 px-4">${actionBadge}</td>
        <td class="py-3 px-4 font-semibold text-slate-700">${escapeHtml(log.resource_type || '')}</td>
        <td class="py-3 px-4 text-slate-600 max-w-xs leading-tight">${escapeHtml(log.description || '-')}</td>
        <td class="py-3 px-4 text-right text-[11px] text-slate-400 whitespace-nowrap">${formatDate(log.created_at)}</td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  const modal = document.getElementById('invite-modal');
  const openBtn = document.getElementById('open-invite-modal-btn');
  const closeBtn = document.getElementById('close-invite-modal-btn');
  const cancelBtn = document.getElementById('cancel-invite-btn');
  const form = document.getElementById('invite-form');
  const searchInput = document.getElementById('log-search');
  const refreshBtn = document.getElementById('refresh-logs-btn');

  if (openBtn) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('invite-email').value.trim();
      const name = document.getElementById('invite-name').value.trim();
      const role = document.getElementById('invite-role').value;

      try {
        const res = await API.post('/api/team/invite', { email, name, role });
        showToast(res.message || 'Invitation sent successfully', 'success');
        modal.classList.add('hidden');
        form.reset();
        await loadTeamMembers();
        await loadActivityLogs();
      } catch (err) {
        showToast(err.message || 'Failed to send invite', 'error');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderLogsTable(allLogs);
        return;
      }
      const filtered = allLogs.filter(log => 
        (log.user_name && log.user_name.toLowerCase().includes(q)) ||
        (log.user_email && log.user_email.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.resource_type && log.resource_type.toLowerCase().includes(q)) ||
        (log.description && log.description.toLowerCase().includes(q))
      );
      renderLogsTable(filtered);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadTeamMembers();
      loadActivityLogs();
      showToast('Activity logs updated', 'info');
    });
  }

  window.revokeTeamMember = async (memberId, email) => {
    const confirmed = await confirmModal({
      title: 'Revoke Team Member Access?',
      message: `Are you sure you want to revoke workspace access for ${email}?`,
      confirmText: 'Yes, Revoke Access',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const res = await API.delete(`/api/team/${memberId}`);
      showToast(res.message || 'Access revoked', 'success');
      await loadTeamMembers();
      await loadActivityLogs();
    } catch (err) {
      showToast(err.message || 'Failed to revoke access', 'error');
    }
  };
}

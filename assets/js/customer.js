import { parseInviteModeCode, MODE_SHORT_LABELS } from './invite-config.js';
import { buildInviteUrl } from './invite-config.js';
import {
  loadGuestInvites,
  createGuestInvite,
  upsertGuestInvites,
  replaceGuestInvites,
  syncGuestInvitesToFirestore,
  subscribeRsvpUpdates,
  mapLatestRsvpByGuestKey,
  formatRsvpConfirm,
} from './guest-invite-store.js';

const FILTER_ALL = 'all';

let modeFilter = FILTER_ALL;
let guestList = loadGuestInvites();
let rsvpByKey = new Map();

function refreshStoredInviteUrls() {
  let changed = false;
  guestList = guestList.map((guest) => {
    const url = buildInviteUrl(guest.mode, guest.name, guest.role);
    if (guest.url !== url) changed = true;
    return { ...guest, url };
  });
  if (changed) replaceGuestInvites(guestList);
}

function loadSheetJs() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('Không tải được thư viện Excel'));
    document.head.appendChild(script);
  });
}

function qrImageUrl(url) {
  return `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=400&dark=942233`;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

async function downloadQr(url, baseName) {
  const res = await fetch(qrImageUrl(url));
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${baseName || 'qr-moi-cuoi'}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function flashButton(btn, okLabel, ms = 1800) {
  const prev = btn.textContent;
  btn.textContent = okLabel;
  btn.disabled = true;
  window.setTimeout(() => {
    btn.textContent = prev;
    btn.disabled = false;
  }, ms);
}

function normalizeRowKeys(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[String(k).trim().toLowerCase()] = row[k];
  });
  return out;
}

function rowFromExcel(rawRow) {
  const row = normalizeRowKeys(rawRow);
  const name = String(row.name || row['họ và tên'] || row['ho va ten'] || '').trim();
  const role = String(
    row.honorifics || row['xưng hô'] || row['xung ho'] || row.role || '',
  ).trim();
  const modeCode = parseInviteModeCode(row.mode ?? row['buổi tiệc']);
  if (!name || !role || !modeCode) return null;
  return createGuestInvite(name, role, modeCode);
}

function parseExcelRows(rows) {
  const entries = [];
  for (const raw of rows) {
    const entry = rowFromExcel(raw);
    if (entry) entries.push(entry);
  }
  return entries;
}

function filteredGuests() {
  if (modeFilter === FILTER_ALL) return guestList;
  return guestList.filter((g) => g.mode === modeFilter);
}

function persistGuests() {
  localStorage.setItem('wedding_guest_invites', JSON.stringify(guestList));
  syncGuestInvitesToFirestore(guestList).catch(() => {});
}

function addGuests(entries) {
  const { added, skipped, list } = upsertGuestInvites(entries);
  guestList = list;
  if (added > 0) persistGuests();
  return { added, skipped };
}

function renderGuestTable() {
  const tbody = document.getElementById('customer-guest-tbody');
  const emptyEl = document.getElementById('customer-list-empty');
  const countEl = document.getElementById('customer-list-count');
  if (!tbody) return;

  const rows = filteredGuests();
  tbody.replaceChildren();

  if (countEl) {
    countEl.textContent =
      modeFilter === FILTER_ALL
        ? `${guestList.length} khách`
        : `${rows.length} / ${guestList.length} khách`;
  }

  if (rows.length === 0) {
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent =
        guestList.length === 0
          ? 'Chưa có khách. Thêm bằng form hoặc upload Excel.'
          : 'Không có khách ở bộ lọc này.';
    }
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  for (const guest of rows) {
    const tr = document.createElement('tr');
    const rsvp = rsvpByKey.get(guest.guestKey);
    const confirmName = rsvp?.name || '—';
    const confirmStatus = rsvp ? formatRsvpConfirm(rsvp.attendance) : '—';

    tr.innerHTML = `
      <td class="customer-td-name">${escapeHtml(guest.name)}</td>
      <td>${escapeHtml(MODE_SHORT_LABELS[guest.mode] || guest.mode)}</td>
      <td>${escapeHtml(guest.role)}</td>
      <td class="customer-td-actions"></td>
      <td class="customer-td-actions"></td>
      <td>${escapeHtml(confirmName)}</td>
      <td><span class="customer-confirm-badge${rsvp ? ' is-filled' : ''}">${escapeHtml(confirmStatus)}</span></td>
    `;

    const linkCell = tr.children[3];
    const qrCell = tr.children[4];

    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'customer-table-btn';
    linkBtn.textContent = 'Lưu link';
    linkBtn.addEventListener('click', async () => {
      await copyText(guest.url);
      flashButton(linkBtn, 'Đã copy');
    });

    const qrBtn = document.createElement('button');
    qrBtn.type = 'button';
    qrBtn.className = 'customer-table-btn';
    qrBtn.textContent = 'Lưu QR';
    qrBtn.addEventListener('click', async () => {
      try {
        await downloadQr(guest.url, guest.name.replace(/\s+/g, '-'));
        flashButton(qrBtn, 'Đã tải');
      } catch {
        flashButton(qrBtn, 'Lỗi');
      }
    });

    linkCell.appendChild(linkBtn);
    qrCell.appendChild(qrBtn);
    tbody.appendChild(tr);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setModeFilter(value) {
  modeFilter = value;
  document.querySelectorAll('[data-mode-filter]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.modeFilter === value);
  });
  renderGuestTable();
}

function showUploadStatus(message) {
  const el = document.getElementById('customer-upload-status');
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function initCustomerPage() {
  const form = document.getElementById('customer-form');
  const nameInput = document.getElementById('customer-guest-name');
  const roleSelect = document.getElementById('customer-role');
  const modeSelect = document.getElementById('customer-mode');
  const greetingPreview = document.getElementById('customer-greeting-preview');
  const excelInput = document.getElementById('customer-excel-input');
  const excelBtn = document.getElementById('customer-excel-upload');

  if (!form || !nameInput || !roleSelect || !modeSelect) return;

  refreshStoredInviteUrls();

  document.querySelectorAll('[data-mode-filter]').forEach((btn) => {
    btn.addEventListener('click', () => setModeFilter(btn.dataset.modeFilter));
  });
  setModeFilter(FILTER_ALL);

  const updatePreview = () => {
    const name = nameInput.value.trim();
    const role = roleSelect.value;
    if (greetingPreview) {
      if (name && role) {
        greetingPreview.hidden = false;
        greetingPreview.textContent = `Trên thiệp: ${role} ${name}`;
      } else {
        greetingPreview.hidden = true;
      }
    }
  };

  nameInput.addEventListener('input', updatePreview);
  roleSelect.addEventListener('change', updatePreview);
  modeSelect.addEventListener('change', updatePreview);
  updatePreview();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const guest = nameInput.value.trim();
    const role = roleSelect.value.trim();
    const modeCode = modeSelect.value;

    if (!guest) {
      nameInput.focus();
      return;
    }
    if (!role) {
      roleSelect.focus();
      return;
    }

    const entry = createGuestInvite(guest, role, modeCode);
    const { added, skipped } = addGuests([entry]);

    if (added) {
      showUploadStatus(`Đã thêm ${role} ${guest} vào danh sách.`);
      nameInput.value = '';
      nameInput.focus();
      updatePreview();
    } else if (skipped) {
      showUploadStatus('Khách này đã có trong danh sách (trùng tên, buổi tiệc, xưng hô).');
    }
    renderGuestTable();
  });

  excelBtn?.addEventListener('click', () => excelInput?.click());

  excelInput?.addEventListener('change', async () => {
    const file = excelInput.files?.[0];
    excelInput.value = '';
    if (!file) return;

    try {
      const XLSX = await loadSheetJs();
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      const entries = parseExcelRows(rows);
      if (!entries.length) {
        showUploadStatus('File không có dòng hợp lệ (cần cột name, mode, Honorifics).');
        return;
      }
      const { added, skipped } = addGuests(entries);
      showUploadStatus(`Excel: thêm ${added} khách, bỏ qua ${skipped} trùng.`);
      renderGuestTable();
    } catch (err) {
      console.error(err);
      showUploadStatus('Không đọc được file Excel. Dùng đúng file mẫu .xlsx');
    }
  });

  subscribeRsvpUpdates((rsvps) => {
    rsvpByKey = mapLatestRsvpByGuestKey(rsvps);
    renderGuestTable();
  });

  window.setInterval(() => {
    if (window.firebaseDb) return;
    try {
      const local = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
      rsvpByKey = mapLatestRsvpByGuestKey(local);
      renderGuestTable();
    } catch {
      /* ignore */
    }
  }, 4000);

  renderGuestTable();
}

document.addEventListener('DOMContentLoaded', initCustomerPage);

import { isFirebaseConfigured } from './firebase-config.js';
import {
  INVITE_IMAGE_SLOTS,
  fetchInviteImageDoc,
  saveInviteImageSlot,
  resetInviteImageSlot,
} from './invite-image-store.js';
import {
  isViewAdminUnlocked,
  unlockViewAdmin,
  verifyViewAdminPin,
} from './view-config.js';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT_TYPES = /^image\//;

function setStatus(el, text, isError = false) {
  if (!el) return;
  el.hidden = !text;
  el.textContent = text;
  el.classList.toggle('album-upload-status--error', isError);
}

function resolvePreviewSrc(slot, doc) {
  if (doc?.url) return doc.url;
  return `../${slot.defaultSrc}`;
}

function buildSlotCard(slot, doc) {
  const card = document.createElement('article');
  card.className = 'view-slot-card';
  card.dataset.slotId = slot.id;

  const preview = document.createElement('img');
  preview.className = 'view-slot-preview';
  preview.alt = slot.label;
  preview.src = resolvePreviewSrc(slot, doc);
  preview.loading = 'lazy';

  const title = document.createElement('h2');
  title.className = 'view-slot-title';
  title.textContent = slot.label;

  const meta = document.createElement('p');
  meta.className = 'view-slot-meta';
  meta.textContent = doc?.url ? 'Đang dùng ảnh tùy chỉnh (Firebase)' : `Mặc định: ${slot.defaultSrc}`;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';
  input.hidden = true;
  input.dataset.slotInput = slot.id;

  const actions = document.createElement('div');
  actions.className = 'view-slot-actions';

  const pickBtn = document.createElement('button');
  pickBtn.type = 'button';
  pickBtn.className = 'album-upload-btn';
  pickBtn.textContent = 'Chọn ảnh mới';

  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'album-upload-btn album-upload-btn--primary';
  uploadBtn.textContent = 'Thay ảnh';
  uploadBtn.disabled = true;

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'album-upload-btn view-slot-reset';
  resetBtn.textContent = 'Về ảnh gốc';
  resetBtn.disabled = !doc?.url;

  pickBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    uploadBtn.disabled = !input.files?.length;
    if (input.files?.[0]) {
      preview.src = URL.createObjectURL(input.files[0]);
    }
  });

  uploadBtn.addEventListener('click', async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!ACCEPT_TYPES.test(file.type)) {
      setStatus(document.getElementById('view-admin-status'), 'Chỉ chấp nhận file ảnh.', true);
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus(document.getElementById('view-admin-status'), 'Ảnh tối đa 10MB.', true);
      return;
    }
    uploadBtn.disabled = true;
    pickBtn.disabled = true;
    resetBtn.disabled = true;
    setStatus(document.getElementById('view-admin-status'), `Đang tải: ${slot.label}…`);
    try {
      const url = await saveInviteImageSlot(slot.id, file);
      preview.src = url;
      meta.textContent = 'Đang dùng ảnh tùy chỉnh (Firebase)';
      resetBtn.disabled = false;
      input.value = '';
      setStatus(document.getElementById('view-admin-status'), `Đã cập nhật ${slot.label}.`);
    } catch (err) {
      setStatus(
        document.getElementById('view-admin-status'),
        err.message || 'Upload thất bại.',
        true,
      );
      preview.src = resolvePreviewSrc(slot, doc);
    } finally {
      uploadBtn.disabled = !input.files?.length;
      pickBtn.disabled = false;
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirm(`Trả ${slot.label} về ảnh gốc trong repo?`)) return;
    resetBtn.disabled = true;
    uploadBtn.disabled = true;
    pickBtn.disabled = true;
    setStatus(document.getElementById('view-admin-status'), `Đang khôi phục ${slot.label}…`);
    try {
      const defaultSrc = await resetInviteImageSlot(slot.id);
      preview.src = `../${defaultSrc}`;
      meta.textContent = `Mặc định: ${slot.defaultSrc}`;
      input.value = '';
      resetBtn.disabled = true;
      setStatus(document.getElementById('view-admin-status'), `Đã về ảnh gốc: ${slot.label}.`);
    } catch (err) {
      setStatus(
        document.getElementById('view-admin-status'),
        err.message || 'Khôi phục thất bại.',
        true,
      );
      resetBtn.disabled = false;
    } finally {
      pickBtn.disabled = false;
      uploadBtn.disabled = !input.files?.length;
    }
  });

  actions.append(pickBtn, uploadBtn, resetBtn);
  card.append(preview, title, meta, input, actions);
  return card;
}

async function renderSlots(gridEl) {
  if (!gridEl) return;
  gridEl.replaceChildren();
  for (const slot of INVITE_IMAGE_SLOTS) {
    let doc = null;
    try {
      doc = await fetchInviteImageDoc(slot.id);
    } catch {
      /* ignore */
    }
    gridEl.appendChild(buildSlotCard(slot, doc));
  }
}

function showPanel(pinForm, panel) {
  if (pinForm) pinForm.hidden = true;
  if (panel) panel.hidden = false;
}

function initPinGate(pinForm, panel, statusEl, onUnlocked) {
  if (isViewAdminUnlocked()) {
    showPanel(pinForm, panel);
    onUnlocked();
    return;
  }

  pinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pinInput = document.getElementById('view-admin-pin');
    const pin = pinInput?.value || '';
    if (!verifyViewAdminPin(pin)) {
      setStatus(statusEl, 'PIN không đúng.', true);
      pinInput?.focus();
      pinInput?.select();
      return;
    }
    unlockViewAdmin();
    setStatus(statusEl, '');
    showPanel(pinForm, panel);
    onUnlocked();
  });
}

function initViewAdminPage() {
  const pinForm = document.getElementById('view-admin-pin-form');
  const panel = document.getElementById('view-admin-panel');
  const gridEl = document.getElementById('view-admin-slots');
  const statusEl = document.getElementById('view-admin-status');

  if (!pinForm || !panel || !gridEl) return;

  const onUnlocked = async () => {
    if (!isFirebaseConfigured()) {
      setStatus(statusEl, 'Chưa cấu hình Firebase — không thể quản lý ảnh.', true);
      return;
    }
    if (!window.firebaseStorage) {
      setStatus(statusEl, 'Thiếu Firebase Storage SDK.', true);
      return;
    }
    setStatus(statusEl, 'Đang tải danh sách ảnh…');
    await renderSlots(gridEl);
    setStatus(statusEl, '');
  };

  initPinGate(pinForm, panel, statusEl, onUnlocked);
}

document.addEventListener('DOMContentLoaded', initViewAdminPage);

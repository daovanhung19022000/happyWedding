import { isFirebaseConfigured, initFirebaseClient } from './firebase-config.js';
import { sanitizeFileName } from './album-store.js';
import {
  isAlbumUploadUnlocked,
  unlockAlbumUpload,
  verifyAlbumUploadPin,
} from './album-upload-config.js';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT_TYPES = /^image\//;

function setStatus(el, text, isError = false) {
  if (!el) return;
  el.hidden = !text;
  el.textContent = text;
  el.classList.toggle('album-upload-status--error', isError);
}

function appendLog(logEl, line) {
  if (!logEl) return;
  const p = document.createElement('p');
  p.textContent = line;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

async function uploadOne(file, logEl) {
  if (!ACCEPT_TYPES.test(file.type)) {
    throw new Error(`${file.name}: không phải file ảnh`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`${file.name}: vượt quá 10MB`);
  }
  if (!window.firebaseStorage || !window.firebaseDb) {
    throw new Error('Firebase Storage chưa sẵn sàng');
  }

  const safe = sanitizeFileName(file.name);
  const path = `album_uploads/${Date.now()}_${safe}`;
  const ref = window.firebaseStorage.ref().child(path);

  appendLog(logEl, `Đang tải: ${file.name}…`);
  await ref.put(file, { contentType: file.type });
  const url = await ref.getDownloadURL();

  await window.firebaseDb.collection('album_photos').add({
    url,
    storagePath: path,
    fileName: file.name,
    createdAt: new Date().toISOString(),
  });

  appendLog(logEl, `✓ ${file.name}`);
  return url;
}

function showUploadPanel(pinForm, panel) {
  if (pinForm) pinForm.hidden = true;
  if (panel) panel.hidden = false;
}

function initPinGate(pinForm, panel, statusEl, onUnlocked) {
  if (isAlbumUploadUnlocked()) {
    showUploadPanel(pinForm, panel);
    onUnlocked();
    return;
  }

  pinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pinInput = document.getElementById('album-upload-pin');
    const pin = pinInput?.value || '';
    if (!verifyAlbumUploadPin(pin)) {
      setStatus(statusEl, 'PIN không đúng.', true);
      pinInput?.focus();
      pinInput?.select();
      return;
    }
    unlockAlbumUpload();
    setStatus(statusEl, '');
    showUploadPanel(pinForm, panel);
    onUnlocked();
  });
}

function initAlbumUploadPage() {
  const pinForm = document.getElementById('album-upload-pin-form');
  const panel = document.getElementById('album-upload-panel');
  const form = document.getElementById('album-upload-form');
  const input = document.getElementById('album-upload-input');
  const pickBtn = document.getElementById('album-upload-pick');
  const statusEl = document.getElementById('album-upload-status');
  const logEl = document.getElementById('album-upload-log');
  const submitBtn = document.getElementById('album-upload-submit');

  if (!pinForm || !form || !input) return;

  const initUpload = () => {
    if (!window.firebaseStorage) {
      initFirebaseClient();
    }
    if (!isFirebaseConfigured()) {
      setStatus(statusEl, 'Chưa cấu hình Firebase — không thể upload.', true);
      submitBtn?.setAttribute('disabled', 'true');
      pickBtn?.setAttribute('disabled', 'true');
      return;
    }

    pickBtn?.addEventListener('click', () => input.click());

    form.addEventListener('submit', async (e) => {
      if (!isAlbumUploadUnlocked()) {
        setStatus(statusEl, 'Vui lòng nhập PIN.', true);
        return;
      }
    e.preventDefault();
    const files = [...(input.files || [])];
    if (!files.length) {
      setStatus(statusEl, 'Chọn ít nhất một ảnh.', true);
      return;
    }

    setStatus(statusEl, '');
    if (logEl) logEl.replaceChildren();
    submitBtn.disabled = true;
    pickBtn.disabled = true;

    let ok = 0;
    let fail = 0;
    for (const file of files) {
      try {
        await uploadOne(file, logEl);
        ok += 1;
      } catch (err) {
        fail += 1;
        appendLog(logEl, `✗ ${err.message || file.name}`);
      }
    }

    input.value = '';
    submitBtn.disabled = false;
    pickBtn.disabled = false;
    setStatus(
      statusEl,
      fail
        ? `Xong: ${ok} ảnh thành công, ${fail} lỗi.`
        : `Đã thêm ${ok} ảnh vào album. Xem tại trang Album.`,
      fail > 0 && ok === 0,
    );
    });
  };

  initPinGate(pinForm, panel, statusEl, initUpload);
}

document.addEventListener('DOMContentLoaded', initAlbumUploadPage);

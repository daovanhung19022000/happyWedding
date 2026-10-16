import { initFirebaseClient, isFirebaseConfigured } from './firebase-config.js';
import { loadAllAlbumImageUrls } from './album-store.js';
import {
  INVITE_IMAGE_SLOTS,
  assignInviteImageSlot,
  fetchInviteImageDoc,
  resetInviteImageSlot,
} from './invite-image-store.js';
import {
  isViewAdminUnlocked,
  unlockViewAdmin,
  verifyViewAdminPin,
} from './view-config.js';

let albumPickerUrls = [];

/** Thứ tự khớp luồng trang chủ index.html */
const VIEW_SLOT_GROUPS = [
  {
    title: 'SAVE THE DATE',
    lead: 'Ảnh khung vòm — mở đầu sau khi mở phong thiệp.',
    slotIds: ['hero-arch'],
  },
  {
    title: 'Nhà gái & nhà trai',
    lead: 'Hai ảnh polaroid cạnh thông tin gia đình.',
    slotIds: ['polaroid-bride', 'polaroid-groom'],
  },
  {
    title: 'Lịch cưới & đếm ngược',
    slotIds: ['calendar-bg'],
  },
  {
    title: 'Always You',
    lead: 'Ba ảnh ngay sau lịch: 1 lớn bên trái, 2 xếp dọc bên phải (ảnh 1–3).',
    slotIds: ['always-you-main', 'always-you-top', 'always-you-bottom'],
  },
  {
    title: 'Banner hôn nhân — lưới 3 ảnh',
    lead: 'Hai ảnh dọc trên, một ảnh ngang full phía dưới (ảnh 4–6).',
    slotIds: ['marriage-trio-left', 'marriage-trio-right', 'marriage-trio-wide'],
  },
  {
    title: 'Album trên thiệp',
    lead: 'Lưới editorial cuối trang — thứ tự ô khớp album trên thiệp.',
    slotPrefix: 'gallery-',
  },
];

function setStatus(el, text, isError = false) {
  if (!el) return;
  el.hidden = !text;
  el.textContent = text;
  el.classList.toggle('album-upload-status--error', isError);
}

function resolveDefaultPreviewSrc(defaultSrc) {
  const src = String(defaultSrc || '').trim();
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const path = src.replace(/^\/+/, '');
  return `../${path}`;
}

function resolvePreviewSrc(slot, doc) {
  if (doc?.url) return doc.url;
  return resolveDefaultPreviewSrc(slot.defaultSrc);
}

function slotsForGroup(group, slotByIdMap) {
  if (group.slotIds?.length) {
    return group.slotIds.map((id) => slotByIdMap[id]).filter(Boolean);
  }
  if (group.slotPrefix) {
    return INVITE_IMAGE_SLOTS.filter((s) => s.id.startsWith(group.slotPrefix));
  }
  return [];
}

function buildGroupSection(group, slotByIdMap, docs) {
  const slots = slotsForGroup(group, slotByIdMap);
  if (!slots.length) return null;

  const section = document.createElement('section');
  section.className = 'view-admin-group';

  const heading = document.createElement('h2');
  heading.className = 'view-admin-group__title';
  heading.textContent = group.title;
  section.appendChild(heading);

  if (group.lead) {
    const lead = document.createElement('p');
    lead.className = 'view-admin-group__lead';
    lead.textContent = group.lead;
    section.appendChild(lead);
  }

  const grid = document.createElement('div');
  grid.className = 'view-admin-group__slots';
  slots.forEach((slot) => {
    grid.appendChild(buildSlotCard(slot, docs[slot.id] || null));
  });
  section.appendChild(grid);
  return section;
}

function buildMarqueeNoteSection() {
  const section = document.createElement('section');
  section.className = 'view-admin-group view-admin-group--note';
  section.innerHTML =
    '<h2 class="view-admin-group__title">Thiệp mời — dải ảnh cuộn</h2>' +
    '<p class="view-admin-group__lead">' +
    'Section <strong>Thiệp Mời</strong> hiển thị toàn bộ album (kimono + upload) cuộn ngang. ' +
    'Không có slot riêng; cập nhật ảnh qua trang Album hoặc upload mới.' +
    '</p>';
  return section;
}

function ensureAlbumPickerModal() {
  let modal = document.getElementById('view-album-picker');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'view-album-picker';
  modal.className = 'view-album-picker';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="view-album-picker__backdrop" data-close="1"></div>
    <div class="view-album-picker__panel" role="dialog" aria-modal="true" aria-labelledby="view-album-picker-title">
      <header class="view-album-picker__head">
        <h2 id="view-album-picker-title" class="view-album-picker__title">Chọn ảnh từ album</h2>
        <button type="button" class="view-album-picker__close" aria-label="Đóng">&times;</button>
      </header>
      <p class="view-album-picker__hint">Ảnh trong thư mục kimono + ảnh đã upload lên album.</p>
      <div class="view-album-picker__grid" id="view-album-picker-grid"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('[data-close]')?.addEventListener('click', () => {
    modal.hidden = true;
  });
  modal.querySelector('.view-album-picker__close')?.addEventListener('click', () => {
    modal.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
  });

  return modal;
}

function openAlbumPicker(slot, onPick) {
  const modal = ensureAlbumPickerModal();
  const grid = modal.querySelector('#view-album-picker-grid');
  const title = modal.querySelector('#view-album-picker-title');
  if (!grid || !title) return;

  title.textContent = `Chọn ảnh — ${slot.label}`;
  grid.replaceChildren();

  if (!albumPickerUrls.length) {
    const empty = document.createElement('p');
    empty.className = 'view-album-picker__empty';
    empty.textContent = 'Chưa có ảnh album.';
    grid.appendChild(empty);
  } else {
    albumPickerUrls.forEach((url) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'view-album-picker__thumb';
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        modal.hidden = true;
        onPick(url);
      });
      grid.appendChild(btn);
    });
  }

  modal.hidden = false;
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
  meta.textContent = doc?.url
    ? 'Đang dùng ảnh chọn từ album'
    : `Mặc định: ${slot.defaultSrc}`;

  const actions = document.createElement('div');
  actions.className = 'view-slot-actions';

  const pickBtn = document.createElement('button');
  pickBtn.type = 'button';
  pickBtn.className = 'album-upload-btn album-upload-btn--primary';
  pickBtn.textContent = 'Chọn từ album';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'album-upload-btn view-slot-reset';
  resetBtn.textContent = 'Về ảnh gốc';
  resetBtn.disabled = !doc?.url;

  pickBtn.addEventListener('click', () => {
    openAlbumPicker(slot, async (url) => {
      pickBtn.disabled = true;
      resetBtn.disabled = true;
      setStatus(document.getElementById('view-admin-status'), `Đang lưu: ${slot.label}…`);
      try {
        const saved = await assignInviteImageSlot(slot.id, url);
        preview.src = saved;
        meta.textContent = 'Đang dùng ảnh chọn từ album';
        resetBtn.disabled = false;
        setStatus(document.getElementById('view-admin-status'), `Đã cập nhật ${slot.label}.`);
      } catch (err) {
        setStatus(
          document.getElementById('view-admin-status'),
          err.message || 'Lưu thất bại.',
          true,
        );
        preview.src = resolvePreviewSrc(slot, doc);
      } finally {
        pickBtn.disabled = false;
      }
    });
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirm(`Trả ${slot.label} về ảnh gốc trong repo?`)) return;
    resetBtn.disabled = true;
    pickBtn.disabled = true;
    setStatus(document.getElementById('view-admin-status'), `Đang khôi phục ${slot.label}…`);
    try {
      const defaultSrc = await resetInviteImageSlot(slot.id);
      preview.src = resolveDefaultPreviewSrc(defaultSrc);
      meta.textContent = `Mặc định: ${slot.defaultSrc}`;
      resetBtn.disabled = true;
      setStatus(document.getElementById('view-admin-status'), `Đã về ảnh gốc: ${slot.label}.`);
    } catch (err) {
      setStatus(
        document.getElementById('view-admin-status'),
        err.message || 'Khôi phục thất bại.',
        true,
      );
      resetBtn.disabled = !!doc?.url;
    } finally {
      pickBtn.disabled = false;
    }
  });

  actions.append(pickBtn, resetBtn);
  card.append(preview, title, meta, actions);
  return card;
}

async function renderSlots(gridEl) {
  if (!gridEl) return;
  gridEl.replaceChildren();

  const slotByIdMap = Object.fromEntries(INVITE_IMAGE_SLOTS.map((s) => [s.id, s]));
  const docs = {};
  for (const slot of INVITE_IMAGE_SLOTS) {
    try {
      docs[slot.id] = await fetchInviteImageDoc(slot.id);
    } catch {
      docs[slot.id] = null;
    }
  }

  VIEW_SLOT_GROUPS.forEach((group, index) => {
    if (index === 2) {
      gridEl.appendChild(buildMarqueeNoteSection());
    }
    const section = buildGroupSection(group, slotByIdMap, docs);
    if (section) gridEl.appendChild(section);
  });
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
    if (!window.firebaseDb) {
      initFirebaseClient();
    }
    if (!window.firebaseDb) {
      setStatus(statusEl, 'Chưa kết nối Firestore — tải lại trang.', true);
      return;
    }

    setStatus(statusEl, 'Đang tải album…');
    try {
      albumPickerUrls = await loadAllAlbumImageUrls('../kimono_image/');
    } catch {
      albumPickerUrls = [];
    }
    await renderSlots(gridEl);
    setStatus(statusEl, albumPickerUrls.length ? '' : 'Chưa có ảnh album để chọn.');
  };

  initPinGate(pinForm, panel, statusEl, onUnlocked);
}

document.addEventListener('DOMContentLoaded', initViewAdminPage);

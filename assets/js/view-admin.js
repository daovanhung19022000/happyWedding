import { initFirebaseClient, isFirebaseConfigured } from './firebase-config.js';
import { loadAlbumPickerUrlsForAdmin } from './album-store.js';
import {
  assignInviteImageSlot,
  fetchAllInviteImageDocs,
  getInviteImageSlotsForLook,
  resetInviteImageSlot,
} from './invite-image-store.js';
import { getViewAdminLook, getViewAdminLookLabel } from './view-admin-look.js';
import { INVITE_LOOK_MODERN, albumBasePathForLook } from './invite-look.js';
import {
  isViewAdminUnlocked,
  unlockViewAdmin,
  verifyViewAdminPin,
} from './view-config.js';

let albumPickerUrls = [];
let pendingAlbumPick = null;
let pickerUrlsKey = '';

/** Thứ tự khớp luồng trang chủ index.html */
const VIEW_SLOT_GROUPS = [
  {
    title: 'Love Story',
    lead: 'Bốn ảnh dọc theo timeline (trước SAVE THE DATE trên thiệp).',
    slotIds: ['love-story-1', 'love-story-2', 'love-story-3', 'love-story-4'],
  },
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

function fileNameFromUrl(url) {
  try {
    const u = new URL(String(url), window.location.href);
    return decodeURIComponent(u.pathname.split('/').pop() || '');
  } catch {
    const seg = String(url).split('?')[0].split('/').pop() || '';
    return decodeURIComponent(seg);
  }
}

/** Ảnh modern chưa có file — xem trước tạm bằng ảnh kimono cùng index (MOD_3400 → THA_3400). */
function kimonoFallbackForModernDefault(defaultSrc) {
  const s = String(defaultSrc || '');
  if (s.includes('crop_image/trang.png')) return '../kimono_image/crop_image/trang.png';
  if (s.includes('crop_image/hung.png')) return '../kimono_image/crop_image/hung.png';
  const mod = s.match(/MOD_(\d+)\.(jpe?g|png|webp)$/i);
  if (mod) return `../kimono_image/THA_${mod[1]}.JPG`;
  return '';
}

function resolvePreviewSrc(slot, doc) {
  if (doc?.url) return doc.url;
  return resolveDefaultPreviewSrc(slot.defaultSrc);
}

function applySlotAssignedPreview(preview, card, meta, url) {
  preview.onerror = null;
  preview.onload = null;
  preview.classList.remove('view-slot-preview--placeholder', 'view-slot-preview--broken');
  preview.dataset.previewSource = 'assigned';
  preview.src = url;
  const note = card.querySelector('.view-slot-preview-note');
  if (note) {
    note.hidden = true;
    note.textContent = '';
  }
  meta.textContent = `Đang dùng: ${fileNameFromUrl(url)}`;
}

function wireSlotPreview(preview, slot, doc) {
  const look = getViewAdminLook();
  const primary = resolvePreviewSrc(slot, doc);
  const fallback =
    look === INVITE_LOOK_MODERN && !doc?.url ? kimonoFallbackForModernDefault(slot.defaultSrc) : '';

  preview.classList.remove('view-slot-preview--placeholder', 'view-slot-preview--broken');
  preview.dataset.previewSource = doc?.url ? 'firebase' : 'default';

  const applyFallbackNote = (fromKimono) => {
    const card = preview.closest('.view-slot-card');
    const note = card?.querySelector('.view-slot-preview-note');
    if (!note) return;
    if (fromKimono) {
      note.hidden = false;
      note.textContent =
        'Ảnh tạm từ kimono — chọn ảnh hiện đại bên dưới (lưu lên Firestore).';
    } else {
      note.hidden = true;
      note.textContent = '';
    }
  };

  if (doc?.url) {
    const card = preview.closest('.view-slot-card');
    const meta = card?.querySelector('.view-slot-meta');
    if (card && meta) applySlotAssignedPreview(preview, card, meta, primary);
    else {
      preview.onerror = null;
      preview.src = primary;
    }
    return;
  }

  const resolvedFallback = fallback
    ? (() => {
        try {
          return new URL(fallback, window.location.href).href;
        } catch {
          return fallback;
        }
      })()
    : '';

  preview.onerror = function onPreviewError() {
    if (resolvedFallback && preview.src !== resolvedFallback) {
      preview.onerror = null;
      preview.src = fallback;
      preview.classList.add('view-slot-preview--placeholder');
      preview.dataset.previewSource = 'kimono-fallback';
      applyFallbackNote(true);
      return;
    }
    preview.onerror = null;
    preview.classList.add('view-slot-preview--broken');
    applyFallbackNote(false);
  };

  preview.src = primary;
  applyFallbackNote(false);
}

function slotsForGroup(group, slotByIdMap) {
  if (group.slotIds?.length) {
    return group.slotIds.map((id) => slotByIdMap[id]).filter(Boolean);
  }
  if (group.slotPrefix) {
    const slots = getInviteImageSlotsForLook(getViewAdminLook());
    return slots.filter((s) => s.id.startsWith(group.slotPrefix));
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
    'Section <strong>Thiệp Mời</strong> hiển thị album theo look (kimono / hiện đại) cuộn ngang. ' +
    'Không có slot riêng; thêm ảnh qua thư mục hoặc upload album.' +
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

  const grid = modal.querySelector('#view-album-picker-grid');
  grid?.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-album-picker__thumb');
    if (!btn?.dataset.url || !pendingAlbumPick) return;
    modal.hidden = true;
    const url = btn.dataset.url;
    const cb = pendingAlbumPick;
    pendingAlbumPick = null;
    cb(url);
  });

  modal.querySelector('[data-close]')?.addEventListener('click', () => {
    modal.hidden = true;
    pendingAlbumPick = null;
  });
  modal.querySelector('.view-album-picker__close')?.addEventListener('click', () => {
    modal.hidden = true;
    pendingAlbumPick = null;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      modal.hidden = true;
      pendingAlbumPick = null;
    }
  });

  return modal;
}

function createPickerThumb(url) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'view-album-picker__thumb';
  btn.dataset.url = url;
  const img = document.createElement('img');
  img.src = url;
  img.alt = fileNameFromUrl(url);
  img.loading = 'lazy';
  img.decoding = 'async';
  const cap = document.createElement('span');
  cap.className = 'view-album-picker__caption';
  cap.textContent = fileNameFromUrl(url);
  if (url.includes('modern_image/')) cap.dataset.badge = 'modern';
  else if (url.includes('kimono_image/')) cap.dataset.badge = 'kimono';
  else if (/^https?:/i.test(url)) cap.dataset.badge = 'upload';
  btn.appendChild(img);
  btn.appendChild(cap);
  return btn;
}

function rebuildPickerGrid(grid, urls) {
  const key = urls.join('\n');
  if (key === pickerUrlsKey && grid.childElementCount > 0) return;
  pickerUrlsKey = key;
  grid.replaceChildren();

  if (!urls.length) {
    const empty = document.createElement('p');
    empty.className = 'view-album-picker__empty';
    empty.textContent = 'Chưa có ảnh album.';
    grid.appendChild(empty);
    return;
  }

  const batchSize = 16;
  let index = 0;
  const pump = () => {
    const frag = document.createDocumentFragment();
    const end = Math.min(index + batchSize, urls.length);
    for (; index < end; index += 1) {
      frag.appendChild(createPickerThumb(urls[index]));
    }
    grid.appendChild(frag);
    if (index < urls.length) requestAnimationFrame(pump);
  };
  requestAnimationFrame(pump);
}

function openAlbumPicker(slot, onPick) {
  const modal = ensureAlbumPickerModal();
  const grid = modal.querySelector('#view-album-picker-grid');
  const title = modal.querySelector('#view-album-picker-title');
  const hint = modal.querySelector('.view-album-picker__hint');
  if (!grid || !title) return;

  title.textContent = `Chọn ảnh — ${slot.label}`;
  if (hint) {
    hint.textContent =
      getViewAdminLook() === INVITE_LOOK_MODERN
        ? 'Kimono + upload (chạm để gán slot hiện đại). Danh sách tải dần để tránh lag.'
        : 'Ảnh kimono + upload — chạm để gán.';
  }

  pendingAlbumPick = onPick;
  rebuildPickerGrid(grid, albumPickerUrls);
  modal.hidden = false;
}

function buildSlotCard(slot, doc) {
  const card = document.createElement('article');
  card.className = 'view-slot-card';
  card.dataset.slotId = slot.id;

  const previewWrap = document.createElement('div');
  previewWrap.className = 'view-slot-preview-wrap';

  const preview = document.createElement('img');
  preview.className = 'view-slot-preview';
  preview.alt = slot.label;
  preview.decoding = 'async';

  const previewNote = document.createElement('p');
  previewNote.className = 'view-slot-preview-note';
  previewNote.hidden = true;

  previewWrap.append(preview, previewNote);
  wireSlotPreview(preview, slot, doc);

  const title = document.createElement('h2');
  title.className = 'view-slot-title';
  title.textContent = slot.label;

  const meta = document.createElement('p');
  meta.className = 'view-slot-meta';
  meta.textContent = doc?.url
    ? `Đang dùng: ${fileNameFromUrl(doc.url)}`
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

  let currentDoc = doc;

  pickBtn.addEventListener('click', () => {
    openAlbumPicker(slot, async (url) => {
      const adminLook = getViewAdminLook();
      const statusEl = document.getElementById('view-admin-status');

      applySlotAssignedPreview(preview, card, meta, url);
      resetBtn.disabled = false;
      pickBtn.disabled = true;
      setStatus(statusEl, `Đang lưu: ${slot.label}…`);

      try {
        const saved = await assignInviteImageSlot(slot.id, url, adminLook);
        currentDoc = { url: saved };
        applySlotAssignedPreview(preview, card, meta, saved);
        setStatus(statusEl, `Đã lưu ${slot.label} — ${fileNameFromUrl(saved)}`);
      } catch (err) {
        setStatus(statusEl, err.message || 'Lưu Firestore thất bại — preview chỉ trên máy này.', true);
        currentDoc = { url };
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
      await resetInviteImageSlot(slot.id, getViewAdminLook());
      currentDoc = null;
      wireSlotPreview(preview, slot, null);
      meta.textContent = `Mặc định: ${slot.defaultSrc}`;
      resetBtn.disabled = true;
      setStatus(document.getElementById('view-admin-status'), `Đã về ảnh gốc: ${slot.label}.`);
    } catch (err) {
      setStatus(
        document.getElementById('view-admin-status'),
        err.message || 'Khôi phục thất bại.',
        true,
      );
      resetBtn.disabled = !!currentDoc?.url;
    } finally {
      pickBtn.disabled = false;
    }
  });

  actions.append(pickBtn, resetBtn);
  card.append(previewWrap, title, meta, actions);
  return card;
}

async function renderSlots(gridEl) {
  if (!gridEl) return;
  gridEl.replaceChildren();

  const adminLook = getViewAdminLook();
  const inviteSlots = getInviteImageSlotsForLook(adminLook);
  const slotByIdMap = Object.fromEntries(inviteSlots.map((s) => [s.id, s]));

  let docs = {};
  try {
    docs = await fetchAllInviteImageDocs(adminLook);
  } catch {
    docs = {};
  }

  VIEW_SLOT_GROUPS.forEach((group) => {
    if (group.slotIds?.includes('calendar-bg')) {
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

    const adminLook = getViewAdminLook();
    const base = `../${albumBasePathForLook(adminLook)}`;
    setStatus(statusEl, 'Đang tải…');
    pickerUrlsKey = '';
    try {
      albumPickerUrls = await loadAlbumPickerUrlsForAdmin(adminLook);
    } catch {
      albumPickerUrls = [];
    }
    await renderSlots(gridEl);
    if (albumPickerUrls.length) {
      setStatus(statusEl, getViewAdminLookLabel(adminLook));
    } else {
      setStatus(statusEl, `Chưa có ảnh trong ${base} — thêm file hoặc upload album.`, true);
    }
  };

  initPinGate(pinForm, panel, statusEl, onUnlocked);
}

document.addEventListener('DOMContentLoaded', initViewAdminPage);

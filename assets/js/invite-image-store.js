import { INVITE_IMAGE_SLOTS, slotById } from './invite-image-slots.js';

const COLLECTION = 'invite_images';

function normalizeInviteUrl(url) {
  try {
    return new URL(String(url).trim(), window.location.href).href;
  } catch {
    return String(url || '').trim();
  }
}

export async function fetchInviteImageOverrides() {
  if (!window.firebaseDb) return {};
  const snap = await window.firebaseDb.collection(COLLECTION).get();
  const map = {};
  snap.forEach((doc) => {
    const data = doc.data();
    if (data?.url) map[doc.id] = data.url;
  });
  return map;
}

export function applyInviteImageOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object') return;
  Object.entries(overrides).forEach(([slotId, url]) => {
    if (!url) return;
    document.querySelectorAll(`[data-invite-slot="${slotId}"]`).forEach((el) => {
      if (el.tagName !== 'IMG') return;
      const slot = slotById(slotId);
      if (!el.dataset.defaultSrc) {
        el.dataset.defaultSrc = el.getAttribute('src') || slot?.defaultSrc || '';
      }
      el.onerror = function onInviteSlotImgError() {
        const fallback = this.dataset.defaultSrc;
        if (!fallback) return;
        try {
          const resolved = new URL(fallback, window.location.href).href;
          if (this.src !== resolved) {
            this.onerror = null;
            this.src = fallback;
          }
        } catch {
          this.onerror = null;
          this.src = fallback;
        }
      };
      el.src = url;
    });
  });
  if (overrides['hero-arch']) {
    const og = document.querySelector('meta[property="og:image"]');
    if (og) og.setAttribute('content', overrides['hero-arch']);
  }
}

export async function loadAndApplyInviteImages() {
  try {
    const overrides = await fetchInviteImageOverrides();
    applyInviteImageOverrides(overrides);
  } catch (err) {
    console.warn('Không áp dụng được ảnh thiệp từ Firebase:', err);
  }
}

export async function fetchInviteImageDoc(slotId) {
  if (!window.firebaseDb) return null;
  const doc = await window.firebaseDb.collection(COLLECTION).doc(slotId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/** Gán ảnh đã có trong album (static hoặc upload) — không upload file mới. */
export async function assignInviteImageSlot(slotId, url) {
  if (!window.firebaseDb) {
    throw new Error('Firebase chưa sẵn sàng');
  }
  const slot = slotById(slotId);
  if (!slot) throw new Error('Vị trí ảnh không hợp lệ');
  const cleanUrl = normalizeInviteUrl(url);
  if (!cleanUrl) throw new Error('Chưa chọn ảnh');

  const existing = await fetchInviteImageDoc(slotId);
  if (existing?.storagePath?.startsWith('invite_images/') && window.firebaseStorage) {
    try {
      await window.firebaseStorage.ref().child(existing.storagePath).delete();
    } catch {
      /* bỏ qua */
    }
  }

  await window.firebaseDb.collection(COLLECTION).doc(slotId).set(
    {
      url: cleanUrl,
      storagePath: null,
      source: 'album',
      defaultSrc: slot.defaultSrc,
      label: slot.label,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return cleanUrl;
}

export async function resetInviteImageSlot(slotId) {
  if (!window.firebaseDb) throw new Error('Firebase chưa sẵn sàng');
  const slot = slotById(slotId);
  if (!slot) throw new Error('Vị trí ảnh không hợp lệ');

  const existing = await fetchInviteImageDoc(slotId);
  if (existing?.storagePath && window.firebaseStorage) {
    try {
      await window.firebaseStorage.ref().child(existing.storagePath).delete();
    } catch {
      /* bỏ qua nếu file đã xóa */
    }
  }

  await window.firebaseDb.collection(COLLECTION).doc(slotId).delete();
  return slot.defaultSrc;
}

export { INVITE_IMAGE_SLOTS };

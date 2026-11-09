import { getInviteImageSlotsForLook, slotById as slotByIdForLook } from './invite-image-slots.js';
import {
  getInviteLook,
  inviteImagesCollectionForLook,
} from './invite-look.js';
import { getViewAdminLook } from './view-admin-look.js';

function resolveLook(explicitLook) {
  if (explicitLook) return explicitLook;
  if (typeof document !== 'undefined' && document.body?.dataset?.inviteViewLook) {
    return getViewAdminLook();
  }
  return getInviteLook();
}

function collectionForResolvedLook(look) {
  return inviteImagesCollectionForLook(resolveLook(look));
}

export async function fetchInviteImageOverrides(look) {
  const resolved = resolveLook(look);
  if (!window.firebaseDb) return {};
  const collection = collectionForResolvedLook(resolved);
  const snap = await window.firebaseDb.collection(collection).get();
  const map = {};
  snap.forEach((doc) => {
    const data = doc.data();
    if (data?.url) map[doc.id] = data.url;
  });
  return map;
}

export function applyInviteImageOverrides(overrides, look) {
  if (!overrides || typeof overrides !== 'object') return;
  const resolved = resolveLook(look);
  Object.entries(overrides).forEach(([slotId, url]) => {
    if (!url) return;
    document.querySelectorAll(`[data-invite-slot="${slotId}"]`).forEach((el) => {
      if (el.tagName !== 'IMG') return;
      const slot = slotByIdForLook(slotId, resolved);
      if (!el.dataset.defaultSrc) {
        el.dataset.defaultSrc = el.getAttribute('src') || slot?.defaultSrc || '';
      }
      el.onerror = function onInviteSlotImgError() {
        const fallback = this.dataset.defaultSrc;
        if (!fallback) return;
        try {
          const resolvedHref = new URL(fallback, window.location.href).href;
          if (this.src !== resolvedHref) {
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

export function applyInviteLookDefaultImages(look = getInviteLook()) {
  const slots = getInviteImageSlotsForLook(look);
  const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
  document.querySelectorAll('[data-invite-slot]').forEach((el) => {
    if (el.tagName !== 'IMG') return;
    const slot = byId[el.dataset.inviteSlot];
    if (!slot?.defaultSrc) return;
    const src = String(slot.defaultSrc).replace(/^\//, '');
    el.dataset.defaultSrc = src;
    el.src = src;
  });
}

export async function loadAndApplyInviteImages() {
  const look = getInviteLook();
  try {
    applyInviteLookDefaultImages(look);
    const overrides = await fetchInviteImageOverrides(look);
    applyInviteImageOverrides(overrides, look);
  } catch (err) {
    console.warn('Không áp dụng được ảnh thiệp từ Firebase:', err);
  }
}

export async function fetchInviteImageDoc(slotId, look) {
  if (!window.firebaseDb) return null;
  const collection = collectionForResolvedLook(look);
  const doc = await window.firebaseDb.collection(collection).doc(slotId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/** Một lần đọc Firestore cho toàn trang /view (tránh 40+ request tuần tự). */
export async function fetchAllInviteImageDocs(look) {
  if (!window.firebaseDb) return {};
  const overrides = await fetchInviteImageOverrides(look);
  const docs = {};
  Object.entries(overrides).forEach(([slotId, url]) => {
    docs[slotId] = { id: slotId, url };
  });
  return docs;
}

function normalizeInviteUrl(url) {
  try {
    return new URL(String(url).trim(), window.location.href).href;
  } catch {
    return String(url || '').trim();
  }
}

/** Gán ảnh đã có trong album (static hoặc upload) — không upload file mới. */
export async function assignInviteImageSlot(slotId, url, look) {
  const resolved = resolveLook(look);
  if (!window.firebaseDb) {
    throw new Error('Firebase chưa sẵn sàng');
  }
  const slot = slotByIdForLook(slotId, resolved);
  if (!slot) throw new Error('Vị trí ảnh không hợp lệ');
  const cleanUrl = normalizeInviteUrl(url);
  if (!cleanUrl) throw new Error('Chưa chọn ảnh');

  const collection = collectionForResolvedLook(resolved);
  const existing = await fetchInviteImageDoc(slotId, resolved);
  if (existing?.storagePath?.startsWith('invite_images/') && window.firebaseStorage) {
    try {
      await window.firebaseStorage.ref().child(existing.storagePath).delete();
    } catch {
      /* bỏ qua */
    }
  }

  await window.firebaseDb.collection(collection).doc(slotId).set(
    {
      url: cleanUrl,
      storagePath: null,
      source: 'album',
      look: resolved,
      defaultSrc: slot.defaultSrc,
      label: slot.label,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return cleanUrl;
}

export async function resetInviteImageSlot(slotId, look) {
  const resolved = resolveLook(look);
  if (!window.firebaseDb) throw new Error('Firebase chưa sẵn sàng');
  const slot = slotByIdForLook(slotId, resolved);
  if (!slot) throw new Error('Vị trí ảnh không hợp lệ');

  const existing = await fetchInviteImageDoc(slotId, resolved);
  if (existing?.storagePath && window.firebaseStorage) {
    try {
      await window.firebaseStorage.ref().child(existing.storagePath).delete();
    } catch {
      /* bỏ qua nếu file đã xóa */
    }
  }

  const collection = collectionForResolvedLook(resolved);
  await window.firebaseDb.collection(collection).doc(slotId).delete();
  return slot.defaultSrc;
}

export { getInviteImageSlotsForLook } from './invite-image-slots.js';

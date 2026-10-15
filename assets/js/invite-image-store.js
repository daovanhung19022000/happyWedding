import { INVITE_IMAGE_SLOTS, slotById } from './invite-image-slots.js';
import { sanitizeFileName } from './album-store.js';

const COLLECTION = 'invite_images';

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
      if (el.tagName === 'IMG') el.src = url;
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

export async function saveInviteImageSlot(slotId, file) {
  if (!window.firebaseStorage || !window.firebaseDb) {
    throw new Error('Firebase chưa sẵn sàng');
  }
  const slot = slotById(slotId);
  if (!slot) throw new Error('Vị trí ảnh không hợp lệ');

  const safe = sanitizeFileName(file.name);
  const path = `invite_images/${slotId}/${Date.now()}_${safe}`;
  const ref = window.firebaseStorage.ref().child(path);
  await ref.put(file, { contentType: file.type });
  const url = await ref.getDownloadURL();

  await window.firebaseDb.collection(COLLECTION).doc(slotId).set(
    {
      url,
      storagePath: path,
      defaultSrc: slot.defaultSrc,
      label: slot.label,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return url;
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

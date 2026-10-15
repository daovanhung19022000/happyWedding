import { verifyAlbumUploadPin } from './album-upload-config.js';

/** Cùng PIN với upload album */
export const VIEW_ADMIN_PIN_SESSION_KEY = 'wedding_invite_view_unlocked_v1';

export function isViewAdminUnlocked() {
  try {
    return sessionStorage.getItem(VIEW_ADMIN_PIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockViewAdmin() {
  try {
    sessionStorage.setItem(VIEW_ADMIN_PIN_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function verifyViewAdminPin(raw) {
  return verifyAlbumUploadPin(raw);
}

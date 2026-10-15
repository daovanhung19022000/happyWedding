/** Mã PIN mở trang upload album (sessionStorage trong cùng tab) */
export const ALBUM_UPLOAD_PIN = '611090';

export const ALBUM_UPLOAD_PIN_SESSION_KEY = 'wedding_album_upload_unlocked_v1';

export function isAlbumUploadUnlocked() {
  try {
    return sessionStorage.getItem(ALBUM_UPLOAD_PIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockAlbumUpload() {
  try {
    sessionStorage.setItem(ALBUM_UPLOAD_PIN_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function verifyAlbumUploadPin(raw) {
  return String(raw || '').trim() === ALBUM_UPLOAD_PIN;
}

/** Hai “phiên bản ảnh” trên cùng một link thiệp — không đổi URL khách. */

export const INVITE_LOOK_KIMONO = 'kimono';
export const INVITE_LOOK_MODERN = 'modern';

/** Xác suất mở thiệp kimono (phần còn lại = hiện đại). */
export const INVITE_LOOK_KIMONO_RATE = 0.3;

/** true = localhost luôn modern (chỉ khi dev cần). false = cùng tỉ lệ 30/70 như production. */
export const INVITE_LOOK_DEV_DEFAULT_MODERN = false;

export function isLocalDevHost(loc = typeof window !== 'undefined' ? window.location : null) {
  if (!loc) return false;
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(loc.hostname);
}

export const INVITE_LOOK_STORAGE_KEY = 'wedding_invite_look_v1';
export const INVITE_LOOK_SESSION_KEY = 'wedding_invite_look_session_v1';

function guestStorageKey(guest) {
  const g = String(guest || '').trim().toLowerCase();
  return g ? `${INVITE_LOOK_STORAGE_KEY}:guest:${g}` : INVITE_LOOK_STORAGE_KEY;
}

export function isInviteLook(value) {
  return value === INVITE_LOOK_KIMONO || value === INVITE_LOOK_MODERN;
}

export function persistInviteLook(look, { guest = '', sessionOnly = false } = {}) {
  if (!isInviteLook(look)) return;
  try {
    if (sessionOnly || !guest) {
      sessionStorage.setItem(INVITE_LOOK_SESSION_KEY, look);
    }
    if (guest) {
      localStorage.setItem(guestStorageKey(guest), look);
    } else if (!sessionOnly) {
      sessionStorage.setItem(INVITE_LOOK_SESSION_KEY, look);
    }
  } catch {
    /* bỏ qua */
  }
}

export function clearInviteLookStorage({ guest = '' } = {}) {
  try {
    if (guest) localStorage.removeItem(guestStorageKey(guest));
    else sessionStorage.removeItem(INVITE_LOOK_SESSION_KEY);
    if (!guest) localStorage.removeItem(INVITE_LOOK_STORAGE_KEY);
  } catch {
    /* bỏ qua */
  }
}

export function readStoredInviteLook(guest = '') {
  try {
    if (guest) {
      const perGuest = localStorage.getItem(guestStorageKey(guest));
      if (isInviteLook(perGuest)) return perGuest;
      return null;
    }
    const session = sessionStorage.getItem(INVITE_LOOK_SESSION_KEY);
    return isInviteLook(session) ? session : null;
  } catch {
    return null;
  }
}

export function purgeLegacyInviteLookStorage() {
  try {
    localStorage.removeItem(INVITE_LOOK_STORAGE_KEY);
  } catch {
    /* bỏ qua */
  }
}

/** Băm tên → kimono/modern (dùng công cụ / test; mặc định mỗi F5 vẫn bốc ngẫu nhiên). */
export function lookFromGuestKey(guest) {
  const s = String(guest || '').trim().toLowerCase();
  if (!s) return null;
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100 < Math.round(INVITE_LOOK_KIMONO_RATE * 100)
    ? INVITE_LOOK_KIMONO
    : INVITE_LOOK_MODERN;
}

export function rollInviteLook() {
  return Math.random() < INVITE_LOOK_KIMONO_RATE ? INVITE_LOOK_KIMONO : INVITE_LOOK_MODERN;
}

/**
 * Thứ tự ưu tiên:
 * 1. `?look=kimono|modern` — ép look (chỉ lần load đó)
 * 2. `?look=reset|rand` — xóa bộ nhớ cũ, bốc lại
 * 3. Mọi trường hợp khác (kể cả `?to=tên`) — mỗi F5 bốc lại 30/70
 */
export function resolveInviteLookFromLocation(loc = window.location) {
  const q = new URLSearchParams(loc.search);
  const guestRaw = q.get('to');
  const guestKey = guestRaw ? String(guestRaw).trim().toLowerCase() : '';

  const forced = q.get('look');
  purgeLegacyInviteLookStorage();

  if (forced === 'reset' || forced === 'rand') {
    clearInviteLookStorage({ guest: guestKey });
    clearInviteLookStorage({ guest: '' });
    return rollInviteLook();
  }
  if (isInviteLook(forced)) {
    return forced;
  }

  clearInviteLookStorage({ guest: guestKey });
  clearInviteLookStorage({ guest: '' });

  if (isLocalDevHost(loc) && INVITE_LOOK_DEV_DEFAULT_MODERN) {
    return INVITE_LOOK_MODERN;
  }

  return rollInviteLook();
}

export function getInviteLook() {
  if (typeof document !== 'undefined') {
    const fromDom = document.documentElement?.dataset?.inviteLook;
    if (isInviteLook(fromDom)) return fromDom;
  }
  return resolveInviteLookFromLocation();
}

export function bootstrapInviteLookOnDocument() {
  const look = resolveInviteLookFromLocation();
  document.documentElement.dataset.inviteLook = look;
  document.documentElement.classList.remove('invite-look--kimono', 'invite-look--modern');
  document.documentElement.classList.add(`invite-look--${look}`);
  return look;
}

export function inviteImagesCollectionForLook(look) {
  return look === INVITE_LOOK_MODERN ? 'invite_images_modern' : 'invite_images';
}

export function albumBasePathForLook(look) {
  return look === INVITE_LOOK_MODERN ? 'modern_image/' : 'kimono_image/';
}

/** Cấu hình mode thiệp & link khách: /0/id (nhà trai), /1/id (nhà gái), /9/id (miền Nam) */

export const INVITE_MODE_CODES = {
  trai: '0',
  gai: '1',
  nam: '9',
};

const BAC_SHARED = {
  title: 'LỄ THÀNH HÔN (MIỀN BẮC)',
  badge: 'Tiệc Mừng Miền Bắc',
  host: 'Gia đình hai bên',
  dateText: 'Chủ Nhật, ngày 15 tháng 11 năm 2026',
  lunarDate: 'Tức ngày 07 tháng 10 năm Bính Ngọ',
  targetDate: '2026-11-15T10:30:00',
  welcomeTime: '10:30',
  partyTime: '11:00',
  address: 'Đường Lương Như Học, Tân Hưng, Thành Phố Hải Dương',
  specialDateDay: 15,
  heroDateDisplay: '15 . 11 . 2026',
  saveTheDateShort: '15.11.2026',
  inviteWeekday: 'Chủ Nhật',
  inviteDay: '15',
  inviteMonthLabel: 'Tháng 11',
  inviteYear: '2026',
};

export const eventModes = {
  trai: {
    ...BAC_SHARED,
    venue: 'Tư gia Nhà Trai',
    inviteVenueTitle: 'TƯ GIA NHÀ TRAI',
    mapLink: 'https://maps.app.goo.gl/s94W9kWwDBSrkmrD6',
  },
  gai: {
    ...BAC_SHARED,
    venue: 'Tư gia Nhà Gái',
    inviteVenueTitle: 'TƯ GIA NHÀ GÁI',
    mapLink: 'https://maps.app.goo.gl/fTeZuQE2fVptXFB9A',
  },
  /** @deprecated alias — cùng nhà trai */
  bac: {
    ...BAC_SHARED,
    venue: 'Tư gia Nhà Trai',
    inviteVenueTitle: 'TƯ GIA NHÀ TRAI',
    mapLink: 'https://maps.app.goo.gl/s94W9kWwDBSrkmrD6',
  },
  nam: {
    title: 'TIỆC BÁO HỶ (MIỀN NAM)',
    badge: 'Tiệc Mừng Miền Nam',
    host: 'Gia Đình & Bạn Bè Miền Nam',
    dateText: 'Thứ Bảy, ngày 21 tháng 11 năm 2026',
    lunarDate: 'Tức ngày 13 tháng 10 năm Bính Ngọ',
    targetDate: '2026-11-21T16:00:00',
    welcomeTime: '16:00',
    partyTime: '18:00',
    venue: 'Tiệc Miền Nam',
    address: 'Theo link chỉ đường Google Maps',
    mapLink: 'https://maps.app.goo.gl/HHXffvHSaTWDwt1f8',
    specialDateDay: 21,
    heroDateDisplay: '21 . 11 . 2026',
    saveTheDateShort: '21.11.2026',
    inviteWeekday: 'Thứ Bảy',
    inviteDay: '21',
    inviteMonthLabel: 'Tháng 11',
    inviteYear: '2026',
    inviteVenueTitle: 'TIỆC MIỀN NAM',
  },
};

const CODE_TO_MODE = {
  '0': 'trai',
  '1': 'gai',
  '9': 'nam',
};

const MODE_TO_CODE = {
  trai: '0',
  gai: '1',
  nam: '9',
  bac: '0',
};

export const MODE_SHORT_LABELS = {
  '0': 'Nhà trai',
  '1': 'Nhà gái',
  '9': 'Miền Nam',
};

export function normalizeGuestName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Khóa duy nhất: mode + tên + xưng hô (dùng dedupe & khớp RSVP) */
export function buildGuestKey(modeCode, guestRaw, roleRaw) {
  const mode = String(modeCode ?? '0').trim();
  const role = String(roleRaw ?? '').trim().toLowerCase();
  return `${mode}|${normalizeGuestName(guestRaw)}|${role}`;
}

export function modeKeyToCode(modeKey) {
  const resolved = resolveEventMode(modeKey);
  return MODE_TO_CODE[resolved] || '0';
}

/** Chuẩn hóa cột mode từ Excel (1.0, "1", 9, …) */
export function parseInviteModeCode(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '0' || s === 'trai' || s === 'nhà trai') return '0';
  if (s === '1' || s === 'gai' || s === 'nhà gái') return '1';
  if (s === '9' || s === '2' || s === 'nam' || s === 'miền nam') return '9';
  const n = Number(s);
  if (!Number.isNaN(n)) {
    const code = String(Math.trunc(n));
    if (code === '0' || code === '1' || code === '9') return code;
  }
  return null;
}

/** Chuẩn hóa tham số mode (0/1/9, trai/gai/nam; ?mode=2 / nam = miền Nam; bac = nhà trai) */
export function resolveEventMode(modeParam) {
  if (!modeParam) return 'trai';
  const key = String(modeParam).trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(CODE_TO_MODE, key)) return CODE_TO_MODE[key];
  if (key === '2' || key === 'nam') return 'nam';
  if (key === 'bac') return 'trai';
  if (eventModes[key]) return key;
  return 'trai';
}

export function slugifyGuestId(name) {
  return encodeURIComponent(String(name).trim());
}

export function decodeGuestId(slug) {
  try {
    return decodeURIComponent(slug).replace(/\+/g, ' ').trim();
  } catch {
    return slug;
  }
}

/** Thư mục gốc site (hỗ trợ GitHub Pages project site) */
export function getSiteBasePath() {
  let path = window.location.pathname;
  if (path.endsWith('/index.html')) {
    path = path.slice(0, -'/index.html'.length);
  }
  path = path.replace(/\/$/, '');
  if (path.endsWith('/customer')) {
    path = path.slice(0, -'/customer'.length);
  }
  const inviteMatch = path.match(/^(.*)\/(0|1|9)\/[^/]+$/);
  if (inviteMatch) {
    path = inviteMatch[1] || '';
  }
  return path;
}

export function buildInvitePath(modeCode, guestRaw) {
  const guest = slugifyGuestId(guestRaw);
  return `${getSiteBasePath()}/${modeCode}/${guest}`;
}

/**
 * Link mời dạng index.html?mode=&to=&role= — chạy được trên GitHub Pages,
 * python -m http.server, Live Server (không cần rewrite /0/tên).
 * Đường dẫn /0/tên vẫn đọc được qua 404.html + redirect trong index.html.
 */
export function buildInviteUrl(modeCode, guestRaw, roleRaw) {
  const origin = window.location.origin;
  const base = getSiteBasePath();
  const params = new URLSearchParams();
  params.set('mode', String(modeCode).trim());
  params.set('to', String(guestRaw).trim());
  const role = roleRaw != null ? String(roleRaw).trim() : '';
  if (role) params.set('role', role);
  const prefix = base ? `${base}/` : '/';
  return `${origin}${prefix}index.html?${params.toString()}`;
}

/** Đọc mode + tên khách từ pathname /0/id hoặc query ?mode=&to= */
export function parseInviteFromLocation(loc = window.location) {
  const params = new URLSearchParams(loc.search);
  const qMode = params.get('mode');
  const qGuest = params.get('to') || params.get('guest');

  const qRole = params.get('role');

  const pathMatch = loc.pathname.match(/\/(0|1|9)\/([^/?#]+)\/?$/);
  if (pathMatch) {
    return {
      mode: resolveEventMode(pathMatch[1]),
      guestName: decodeGuestId(pathMatch[2]),
      role: qRole ? qRole.trim() : null,
    };
  }

  if (qMode || qGuest || qRole) {
    return {
      mode: resolveEventMode(qMode || '0'),
      guestName: qGuest ? decodeGuestId(qGuest) : null,
      role: qRole ? qRole.trim() : null,
    };
  }

  return { mode: 'trai', guestName: null, role: null };
}

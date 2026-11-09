/**
 * Album ảnh cưới hiện đại — file trong `modern_image/`.
 * Đường dẫn encode khoảng trắng cho trình duyệt / GitHub Pages.
 */

function encodeModernFileName(fileName) {
  return encodeURIComponent(String(fileName || '').trim());
}

/** Ảnh gốc (file lớn) — chỉ khi cần tải full / dev local. */
export function modernImageOriginalPath(fileName) {
  const name = String(fileName || '').trim();
  if (!name) return 'modern_image/';
  return `modern_image/${encodeModernFileName(name)}`;
}

/** Ảnh hiển thị trên thiệp — bản nén trong `modern_image/web/`. */
export function modernImagePath(fileName) {
  const name = String(fileName || '').trim();
  if (!name) return 'modern_image/web/';
  return `modern_image/web/${encodeModernFileName(name)}`;
}

function isLocalModernHost() {
  if (typeof window === 'undefined') return false;
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(window.location.hostname);
}

/** Toàn bộ ảnh trong folder (album cuộn + picker /view2). */
export const MODERN_STATIC_ALBUM_FILES = [
  'IMG_8731.JPG',
  'LCN06088.jpg',
  'LCN06137.jpg',
  'LCN06142.jpg',
  'LCN06191.jpg',
  'LCN06213.jpg',
  'LCN06236.jpg',
  'LCN06311.jpg',
  'LCN06348 copy ok copy-+.jpg',
  'LCN06369  OK copy+.jpg',
  'LCN06382.jpg',
  'LCN06420  OK copy+.jpg',
  'LCN06521 ok.jpg',
  'LCN06575  OK.jpg',
  'LCN06654  OK copy+.jpg',
  'LCN06685  ok.jpg',
  'LCN06713  OK.jpg',
  'LCN06727 OK.jpg',
  'LCN06786.jpg',
  'LCN06840.jpg',
  'LCN06944.jpg',
  'LCN06950.jpg',
  'LCN07002.jpg',
  'LCN07051.jpg',
  'LCN07056.jpg',
  'LCN07063.jpg',
  'LCN07101.JPEG',
  'LCN07147.jpg',
  'LCN07201.jpg',
];

/** Ảnh full-width cuối (trang /album/ & thiệp modern). */
export const MODERN_GALLERY_FINALE_FILE = 'LCN07147.jpg';

/** Bố cục trang /album/ — chỉ ảnh hiện đại (web), kimono cuối, 07147 kết. */
export const MODERN_ALBUM_CONCEPT_SECTIONS = [
  {
    id: 'forest',
    files: [
      'LCN06088.jpg',
      'LCN06137.jpg',
      'LCN06142.jpg',
      'LCN06191.jpg',
      'LCN06213.jpg',
      'LCN06236.jpg',
      'LCN06311.jpg',
      'LCN06348 copy ok copy-+.jpg',
      'LCN06369  OK copy+.jpg',
      'LCN06382.jpg',
      'LCN06420  OK copy+.jpg',
      'LCN06521 ok.jpg',
    ],
    fullWidth: ['LCN06348 copy ok copy-+.jpg'],
  },
  {
    id: 'gown',
    files: [
      'LCN06575  OK.jpg',
      'LCN06654  OK copy+.jpg',
      'LCN06685  ok.jpg',
      'LCN06713  OK.jpg',
      'LCN06727 OK.jpg',
      'LCN06786.jpg',
      'LCN06840.jpg',
    ],
    fullWidth: ['LCN06840.jpg'],
  },
  {
    id: 'car',
    files: [
      'LCN06944.jpg',
      'LCN06950.jpg',
      'LCN07002.jpg',
      'LCN07051.jpg',
      'LCN07056.jpg',
      'LCN07063.jpg',
      'LCN07101.JPEG',
      'LCN07201.jpg',
      'IMG_8731.JPG',
    ],
    fullWidth: [],
  },
];

/** Lớp chữ ảnh đầu album (full width). */
export const MODERN_GALLERY_OPENING_CAPTION = {
  title: 'Two Hearts, One Love',
};

export const KIMONO_GALLERY_OPENING_CAPTION = {
  title: 'Two Hearts, One Love',
};

/** Lớp chữ trên ảnh cuối — look modern. */
export const MODERN_GALLERY_FINALE_CAPTION = {
  eyebrow: 'Hùng & Trang',
  title: 'The Beginning of Forever',
  subtitle: '15 · 11 · 2026',
};

/** Look kimono — cùng bố cục, khác copy. */
export const KIMONO_GALLERY_FINALE_CAPTION = {
  eyebrow: 'Văn Hùng & Thu Trang',
  title: 'Khởi đầu hạnh phúc',
  subtitle: 'Forever & Always',
};

/**
 * Ảnh mặc định từng vị trí trên thiệp (look modern) — theo bố cục bạn chọn.
 */
export const MODERN_CORE_DEFAULTS = {
  'hero-arch': 'LCN06348 copy ok copy-+.jpg',
  'love-story-1': 'LCN06137.jpg',
  'love-story-2': 'LCN06382.jpg',
  'love-story-3': 'LCN06213.jpg',
  'love-story-4': 'LCN06311.jpg',
  'polaroid-bride': 'LCN07101.JPEG',
  'polaroid-groom': 'IMG_8731.JPG',
  'calendar-bg': 'LCN06840.jpg',
  'always-you-main': 'LCN07002.jpg',
  'always-you-top': 'LCN07051.jpg',
  'always-you-bottom': 'LCN07063.jpg',
  'marriage-trio-left': 'LCN06944.jpg',
  'marriage-trio-right': 'LCN06950.jpg',
};

/**
 * Vòm hero — local: file gốc; Vercel/production: bản `web/` (~500KB, tránh 23MB + lỗi `+` trên CDN).
 */
export function modernHeroArchSrc() {
  const file = MODERN_CORE_DEFAULTS['hero-arch'];
  if (!file) return '';
  return isLocalModernHost() ? modernImageOriginalPath(file) : modernImagePath(file);
}

/** Slot modern — hero-arch đặc biệt; còn lại dùng `web/`. */
export function modernDefaultSrcForSlot(slotId) {
  const file = MODERN_CORE_DEFAULTS[slotId];
  if (!file) return '';
  if (slotId === 'hero-arch') return modernHeroArchSrc();
  return modernImagePath(file);
}

export function modernStaticAlbumUrls(basePath = 'modern_image/web/') {
  return MODERN_STATIC_ALBUM_FILES.map((name) => `${basePath}${encodeModernFileName(name)}`);
}

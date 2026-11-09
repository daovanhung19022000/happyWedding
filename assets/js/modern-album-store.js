/**
 * Album ảnh cưới hiện đại — file trong `modern_image/`.
 * Đường dẫn encode khoảng trắng cho trình duyệt / GitHub Pages.
 */

export function modernImagePath(fileName) {
  const name = String(fileName || '').trim();
  if (!name) return 'modern_image/';
  return `modern_image/${encodeURI(name)}`;
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

/** Ảnh full-width cuối trang thiệp (look modern). */
export const MODERN_GALLERY_FINALE_FILE = 'LCN07147.jpg';

/**
 * Ảnh mặc định từng vị trí trên thiệp (look modern) — theo bố cục bạn chọn.
 */
export const MODERN_CORE_DEFAULTS = {
  'hero-arch': 'LCN06348 copy ok copy-+.jpg',
  'love-story-1': 'LCN06137.jpg',
  'love-story-2': 'LCN06142.jpg',
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

export function modernDefaultSrcForSlot(slotId) {
  const file = MODERN_CORE_DEFAULTS[slotId];
  return file ? modernImagePath(file) : '';
}

export function modernStaticAlbumUrls(basePath = 'modern_image/') {
  return MODERN_STATIC_ALBUM_FILES.map((name) => `${basePath}${encodeURI(name)}`);
}

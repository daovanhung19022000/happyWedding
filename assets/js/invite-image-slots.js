import { STATIC_ALBUM_FILES } from './album-store.js';

const BASE = 'kimono_image/';

/** Vị trí ảnh trên thiệp — id khớp `data-invite-slot` trong index.html */
export const INVITE_IMAGE_SLOTS = [
  { id: 'hero-arch', label: 'Hero — khung vòm', defaultSrc: `/kimono_image/THA_3400.JPG` },
  { id: 'polaroid-bride', label: 'Polaroid — cô dâu', defaultSrc: `${BASE}crop_image/trang.png` },
  { id: 'polaroid-groom', label: 'Polaroid — chú rể', defaultSrc: `${BASE}crop_image/hung.png` },
  { id: 'calendar-bg', label: 'Lịch cưới — nền', defaultSrc: `${BASE}THA_3880.JPG` },
  { id: 'always-you-main', label: 'Always You — ảnh 1 (lớn trái)', defaultSrc: `${BASE}THA_4408.JPG` },
  { id: 'always-you-top', label: 'Always You — ảnh 2 (trên phải)', defaultSrc: `${BASE}THA_4057.JPG` },
  { id: 'always-you-bottom', label: 'Always You — ảnh 3 (dưới phải)', defaultSrc: `${BASE}THA_4188.JPG` },
  { id: 'marriage-trio-left', label: 'Lưới hôn nhân — ảnh 4 (trái)', defaultSrc: `${BASE}THA_3637.JPG` },
  { id: 'marriage-trio-right', label: 'Lưới hôn nhân — ảnh 5 (phải)', defaultSrc: `${BASE}THA_3802.JPG` },
  ...STATIC_ALBUM_FILES.map((fileName, index) => ({
    id: `gallery-${index + 1}`,
    label: `Album trên thiệp — ${index + 1}`,
    defaultSrc: `${BASE}${fileName}`,
  })),
];

export function slotById(id) {
  return INVITE_IMAGE_SLOTS.find((s) => s.id === id);
}

function albumFileNameFromSrc(src) {
  if (!src) return '';
  const seg = String(src).split('?')[0].split('/').pop() || '';
  return decodeURIComponent(seg).toUpperCase();
}

/** Ảnh kimono đã hiển thị trên thiệp (trừ lưới album gallery-*). */
export function invitePageUsedAlbumFileNames() {
  const used = new Set();
  for (const slot of INVITE_IMAGE_SLOTS) {
    if (String(slot.id).startsWith('gallery-')) continue;
    const name = albumFileNameFromSrc(slot.defaultSrc);
    if (/\.(JPE?G|PNG|WEBP)$/i.test(name)) used.add(name);
  }
  /* Love Story + ảnh đã gỡ khỏi thiệp — không lặp lại ở album cuối */
  ['THA_3862.JPG', 'THA_3880.JPG', 'THA_3942.JPG', 'THA_3400.JPG'].forEach((name) => used.add(name));
  return used;
}

/** Index trong STATIC_ALBUM_FILES được phép trong album cuối thiệp. */
export function inviteGalleryEligibleIndices(files = STATIC_ALBUM_FILES) {
  const used = invitePageUsedAlbumFileNames();
  const lastIndex = files.length - 1;
  return files.map((fileName, index) => ({ fileName, index })).filter(({ fileName, index }) => {
    if (index === lastIndex) return true;
    return !used.has(String(fileName).toUpperCase());
  }).map(({ index }) => index);
}

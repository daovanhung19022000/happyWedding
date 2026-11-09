import { STATIC_ALBUM_FILES } from './album-store.js';
import { MODERN_STATIC_ALBUM_FILES } from './modern-album-store.js';
import { INVITE_LOOK_KIMONO, INVITE_LOOK_MODERN, getInviteLook } from './invite-look.js';

const KIMONO_BASE = 'kimono_image/';
const MODERN_BASE = 'modern_image/';

const CORE_SLOT_BLUEPRINT = [
  { id: 'hero-arch', label: 'Hero — khung vòm', kimono: '/kimono_image/THA_3400.JPG', modern: `${MODERN_BASE}MOD_3400.JPG` },
  { id: 'polaroid-bride', label: 'Polaroid — cô dâu', kimono: `${KIMONO_BASE}crop_image/trang.png`, modern: `${MODERN_BASE}crop_image/trang.png` },
  { id: 'polaroid-groom', label: 'Polaroid — chú rể', kimono: `${KIMONO_BASE}crop_image/hung.png`, modern: `${MODERN_BASE}crop_image/hung.png` },
  { id: 'calendar-bg', label: 'Lịch cưới — nền', kimono: `${KIMONO_BASE}THA_3880.JPG`, modern: `${MODERN_BASE}MOD_3880.JPG` },
  { id: 'always-you-main', label: 'Always You — ảnh 1 (lớn trái)', kimono: `${KIMONO_BASE}THA_4408.JPG`, modern: `${MODERN_BASE}MOD_4408.JPG` },
  { id: 'always-you-top', label: 'Always You — ảnh 2 (trên phải)', kimono: `${KIMONO_BASE}THA_4057.JPG`, modern: `${MODERN_BASE}MOD_4057.JPG` },
  { id: 'always-you-bottom', label: 'Always You — ảnh 3 (dưới phải)', kimono: `${KIMONO_BASE}THA_4188.JPG`, modern: `${MODERN_BASE}MOD_4188.JPG` },
  { id: 'marriage-trio-left', label: 'Lưới hôn nhân — ảnh 4 (trái)', kimono: `${KIMONO_BASE}THA_3637.JPG`, modern: `${MODERN_BASE}MOD_3637.JPG` },
  { id: 'marriage-trio-right', label: 'Lưới hôn nhân — ảnh 5 (phải)', kimono: `${KIMONO_BASE}THA_3802.JPG`, modern: `${MODERN_BASE}MOD_3802.JPG` },
  { id: 'love-story-1', label: 'Love Story — mốc 1', kimono: `${KIMONO_BASE}THA_3862.JPG`, modern: `${MODERN_BASE}MOD_3862.JPG` },
  { id: 'love-story-2', label: 'Love Story — mốc 2', kimono: `${KIMONO_BASE}THA_3880.JPG`, modern: `${MODERN_BASE}MOD_3880.JPG` },
  { id: 'love-story-3', label: 'Love Story — mốc 3', kimono: `${KIMONO_BASE}THA_3942.JPG`, modern: `${MODERN_BASE}MOD_3942.JPG` },
  { id: 'love-story-4', label: 'Love Story — mốc 4', kimono: `${KIMONO_BASE}THA_3400.JPG`, modern: `${MODERN_BASE}MOD_3400.JPG` },
];

function gallerySlotsForLook(look) {
  const files = look === INVITE_LOOK_MODERN ? MODERN_STATIC_ALBUM_FILES : STATIC_ALBUM_FILES;
  const base = look === INVITE_LOOK_MODERN ? MODERN_BASE : KIMONO_BASE;
  return files.map((fileName, index) => ({
    id: `gallery-${index + 1}`,
    label: `Album trên thiệp — ${index + 1}`,
    defaultSrc: `${base}${fileName}`,
  }));
}

export function getInviteImageSlotsForLook(look) {
  const variant = look === INVITE_LOOK_MODERN ? 'modern' : 'kimono';
  const core = CORE_SLOT_BLUEPRINT.map((row) => ({
    id: row.id,
    label: row.label,
    defaultSrc: row[variant],
  }));
  return [...core, ...gallerySlotsForLook(look)];
}

/** Giữ tương thích code cũ — luôn là bộ kimono. */
export const INVITE_IMAGE_SLOTS = getInviteImageSlotsForLook(INVITE_LOOK_KIMONO);

export function slotById(id, look = getInviteLook()) {
  return getInviteImageSlotsForLook(look).find((s) => s.id === id);
}

function albumFileNameFromSrc(src) {
  if (!src) return '';
  const seg = String(src).split('?')[0].split('/').pop() || '';
  return decodeURIComponent(seg).toUpperCase();
}

/** Ảnh đã dùng trên thiệp (trừ lưới gallery-*) — theo look. */
export function invitePageUsedAlbumFileNames(look = INVITE_LOOK_KIMONO) {
  const used = new Set();
  for (const slot of getInviteImageSlotsForLook(look)) {
    if (String(slot.id).startsWith('gallery-')) continue;
    const name = albumFileNameFromSrc(slot.defaultSrc);
    if (/\.(JPE?G|PNG|WEBP)$/i.test(name)) used.add(name);
  }
  if (look === INVITE_LOOK_KIMONO) {
    ['THA_3862.JPG', 'THA_3880.JPG', 'THA_3942.JPG', 'THA_3400.JPG'].forEach((name) => used.add(name));
  } else {
    ['MOD_3862.JPG', 'MOD_3880.JPG', 'MOD_3942.JPG', 'MOD_3400.JPG'].forEach((name) => used.add(name));
  }
  return used;
}

export function inviteGalleryEligibleIndices(
  files = STATIC_ALBUM_FILES,
  look = INVITE_LOOK_KIMONO,
) {
  const used = invitePageUsedAlbumFileNames(look);
  const lastIndex = files.length - 1;
  return files
    .map((fileName, index) => ({ fileName, index }))
    .filter(({ fileName, index }) => {
      if (index === lastIndex) return true;
      return !used.has(String(fileName).toUpperCase());
    })
    .map(({ index }) => index);
}

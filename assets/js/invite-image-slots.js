import { STATIC_ALBUM_FILES } from './album-store.js';

const BASE = 'kimono_image/';

/** Vị trí ảnh trên thiệp — id khớp `data-invite-slot` trong index.html */
export const INVITE_IMAGE_SLOTS = [
  { id: 'hero-arch', label: 'Hero — khung vòm', defaultSrc: `/kimono_image/THA_3400.JPG` },
  { id: 'polaroid-bride', label: 'Polaroid — cô dâu', defaultSrc: `${BASE}crop_image/trang.png` },
  { id: 'polaroid-groom', label: 'Polaroid — chú rể', defaultSrc: `${BASE}crop_image/hung.png` },
  { id: 'calendar-bg', label: 'Lịch cưới — nền', defaultSrc: `${BASE}THA_3880.JPG` },
  ...STATIC_ALBUM_FILES.map((fileName, index) => ({
    id: `gallery-${index + 1}`,
    label: `Album trên thiệp — ${index + 1}`,
    defaultSrc: `${BASE}${fileName}`,
  })),
];

export function slotById(id) {
  return INVITE_IMAGE_SLOTS.find((s) => s.id === id);
}

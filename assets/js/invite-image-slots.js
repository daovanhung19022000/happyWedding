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
  { id: 'marriage-trio-wide', label: 'Lưới hôn nhân — ảnh 6 (ngang)', defaultSrc: `${BASE}THA_3862.JPG` },
  ...STATIC_ALBUM_FILES.map((fileName, index) => ({
    id: `gallery-${index + 1}`,
    label: `Album trên thiệp — ${index + 1}`,
    defaultSrc: `${BASE}${fileName}`,
  })),
];

export function slotById(id) {
  return INVITE_IMAGE_SLOTS.find((s) => s.id === id);
}

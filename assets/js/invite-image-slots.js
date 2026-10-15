/** Vị trí ảnh trên thiệp — id khớp `data-invite-slot` trong index.html */
export const INVITE_IMAGE_SLOTS = [
  { id: 'hero-arch', label: 'Hero — khung vòm', defaultSrc: 'kimono_image/THA_3400.JPG' },
  { id: 'polaroid-bride', label: 'Polaroid — cô dâu', defaultSrc: 'kimono_image/crop_image/trang.png' },
  { id: 'polaroid-groom', label: 'Polaroid — chú rể', defaultSrc: 'kimono_image/crop_image/hung.png' },
  { id: 'triptych-left', label: 'Thiệp mời — ảnh trái', defaultSrc: 'kimono_image/THA_3862.JPG' },
  { id: 'triptych-center', label: 'Thiệp mời — ảnh giữa', defaultSrc: 'kimono_image/THA_3880.JPG' },
  { id: 'triptych-right', label: 'Thiệp mời — ảnh phải', defaultSrc: 'kimono_image/THA_3942.JPG' },
  { id: 'calendar-bg', label: 'Lịch cưới — nền', defaultSrc: 'kimono_image/THA_3880.JPG' },
  { id: 'gallery-hero', label: 'Album trên thiệp — ảnh lớn', defaultSrc: 'kimono_image/THA_3880.JPG' },
  { id: 'gallery-1', label: 'Album trên thiệp — 1', defaultSrc: 'kimono_image/THA_3524.JPG' },
  { id: 'gallery-2', label: 'Album trên thiệp — 2', defaultSrc: 'kimono_image/THA_3557.JPG' },
  { id: 'gallery-3', label: 'Album trên thiệp — 3', defaultSrc: 'kimono_image/THA_3637.JPG' },
  { id: 'gallery-4', label: 'Album trên thiệp — 4', defaultSrc: 'kimono_image/THA_3681.JPG' },
  { id: 'gallery-5', label: 'Album trên thiệp — 5', defaultSrc: 'kimono_image/THA_3802.JPG' },
  { id: 'gallery-6', label: 'Album trên thiệp — 6', defaultSrc: 'kimono_image/THA_3400.JPG' },
  { id: 'gallery-7', label: 'Album trên thiệp — 7', defaultSrc: 'kimono_image/THA_3859.JPG' },
  { id: 'gallery-8', label: 'Album trên thiệp — 8', defaultSrc: 'kimono_image/THA_3965.JPG' },
  { id: 'gallery-9', label: 'Album trên thiệp — 9', defaultSrc: 'kimono_image/THA_4057.JPG' },
  { id: 'gallery-10', label: 'Album trên thiệp — 10', defaultSrc: 'kimono_image/THA_3942.JPG' },
];

export function slotById(id) {
  return INVITE_IMAGE_SLOTS.find((s) => s.id === id);
}

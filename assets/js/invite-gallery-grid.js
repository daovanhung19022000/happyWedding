import { STATIC_ALBUM_FILES } from './album-store.js';

const BASE = 'kimono_image/';

/** Thứ tự xếp trên lưới (index 0-based trong STATIC_ALBUM_FILES). */
function galleryDisplayOrder(total) {
  if (total !== 20) {
    return Array.from({ length: total }, (_, i) => i);
  }
  return [
    0, 1, 2, 3, 4, 5,
    6, 8, 9, 7,
    10,
    11, 12,
    13, 14,
    15, 16, 17, 18,
    19,
  ];
}

function layoutClassForIndex(index, total) {
  if (index === 0) return 'gallery-grid-item--hero';
  if (index === total - 1) return 'gallery-grid-item--finale';
  if (index === 7) return 'gallery-grid-item--fit-feet';
  if (index === 6 || index === 8 || index === 9) return 'gallery-grid-item--third';
  if (index === 11 || index === 12) return 'gallery-grid-item--half';
  if (index === 13 || index === 14) return 'gallery-grid-item--half';
  const pos = (index - 1) % 5;
  if (pos >= 3) return 'gallery-grid-item--duo';
  return '';
}

export function buildInviteGalleryGrid(container) {
  if (!container) return;
  container.replaceChildren();

  const total = STATIC_ALBUM_FILES.length;
  const figures = [];

  STATIC_ALBUM_FILES.forEach((fileName, index) => {
    const slotId = `gallery-${index + 1}`;
    const extra = layoutClassForIndex(index, total);
    const fig = document.createElement('figure');
    fig.className = ['gallery-grid-item', 'gallery-item', extra].filter(Boolean).join(' ');

    const img = document.createElement('img');
    img.src = `${BASE}${fileName}`;
    img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
    img.loading = index < 4 ? 'eager' : 'lazy';
    img.setAttribute('data-invite-slot', slotId);

    fig.appendChild(img);
    figures[index] = fig;
  });

  galleryDisplayOrder(total).forEach((index) => {
    if (figures[index]) container.appendChild(figures[index]);
  });

  queueMicrotask(() => {
    window.WeddingScrollReveal?.boot?.();
  });
}

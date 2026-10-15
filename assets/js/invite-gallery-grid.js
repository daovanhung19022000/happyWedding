import { STATIC_ALBUM_FILES } from './album-store.js';

const BASE = 'kimono_image/';

/** Lặp layout editorial: 3 ô nhỏ + 2 ô đôi (sau ảnh hero). */
function layoutClassForIndex(index) {
  if (index === 0) return 'gallery-grid-item--hero';
  const pos = (index - 1) % 5;
  if (pos >= 3) return 'gallery-grid-item--duo';
  return '';
}

export function buildInviteGalleryGrid(container) {
  if (!container) return;
  container.replaceChildren();

  STATIC_ALBUM_FILES.forEach((fileName, index) => {
    const slotId = `gallery-${index + 1}`;
    const extra = layoutClassForIndex(index);
    const fig = document.createElement('figure');
    fig.className = ['gallery-grid-item', 'gallery-item', extra].filter(Boolean).join(' ');

    const img = document.createElement('img');
    img.src = `${BASE}${fileName}`;
    img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
    img.loading = index < 4 ? 'eager' : 'lazy';
    img.setAttribute('data-invite-slot', slotId);

    fig.appendChild(img);
    container.appendChild(fig);
  });

  queueMicrotask(() => {
    window.WeddingScrollReveal?.boot?.();
  });
}

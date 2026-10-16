import { STATIC_ALBUM_FILES } from './album-store.js';

const BASE = 'kimono_image/';

/** Lặp layout editorial: 3 ô nhỏ + 2 ô đôi (sau ảnh hero); ảnh cuối full khung. */
function layoutClassForIndex(index, total) {
  if (index === 0) return 'gallery-grid-item--hero';
  if (index === total - 1) return 'gallery-grid-item--finale';
  const pos = (index - 1) % 5;
  if (pos >= 3) return 'gallery-grid-item--duo';
  return '';
}

export function buildInviteGalleryGrid(container) {
  if (!container) return;
  container.replaceChildren();

  const total = STATIC_ALBUM_FILES.length;

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

    if (index === total - 1) {
      const caption = document.createElement('figcaption');
      caption.className = 'gallery-finale-caption';
      caption.innerHTML =
        '<div class="footer-script-thankyou">Thank You!</div>' +
        '<p class="footer-closing-text">Chân thành cảm ơn sự hiện diện và những lời chúc phúc tốt đẹp nhất của quý khách và người thân!</p>';
      fig.appendChild(caption);
    }

    container.appendChild(fig);
  });

  queueMicrotask(() => {
    window.WeddingScrollReveal?.boot?.();
  });
}

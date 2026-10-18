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

function createAlbumMoreLink() {
  const wrap = document.createElement('div');
  wrap.className = 'album-more-inline';
  const link = document.createElement('a');
  link.className = 'album-more-link';
  link.href = 'album/';
  link.textContent = 'Xem thêm ảnh cưới';
  link.setAttribute('aria-label', 'Xem thêm ảnh cưới — mở trang album');
  wrap.appendChild(link);
  return wrap;
}

const LOI_NGO_BODY =
  'Cảm ơn bạn đã dành tình cảm cho vợ chồng mình. Chúng mình biết các bạn đều đang rất bận, bận với công việc, với cuộc sống và với cả gia đình bạn. Nhưng thực sự sẽ rất tuyệt vời nếu như ngày Hạnh Phúc của chúng mình có thêm sự góp mặt của bạn. Vợ chồng mình rất hi vọng sẽ có mặt bạn trong ngày quan trọng này để chứng kiến và chia sẻ niềm hạnh phúc này cùng chúng mình.\nMột lần nữa, chân thành cảm ơn bạn ❤️';

function createAlbumLoiNgoBlock() {
  const wrap = document.createElement('div');
  wrap.className = 'album-loi-ngo-head';

  const title = document.createElement('h2');
  title.className = 'album-loi-ngo-title';
  title.textContent = 'Lời Ngỏ';

  const body = document.createElement('p');
  body.className = 'album-loi-ngo-lead';
  body.textContent = LOI_NGO_BODY;

  wrap.appendChild(title);
  wrap.appendChild(body);
  return wrap;
}

function createAlbumLoiNgoZone() {
  const zone = document.createElement('div');
  zone.className = 'album-loi-ngo-zone blossom-zone-section';

  const pulse = document.createElement('div');
  pulse.className = 'blossom-pulse-layer blossom-pulse-layer--section blossom-pulse-layer--hearts';
  pulse.dataset.blossomZone = 'loingo';
  pulse.dataset.blossomKind = 'heart';
  pulse.setAttribute('aria-hidden', 'true');

  zone.appendChild(pulse);
  zone.appendChild(createAlbumLoiNgoBlock());
  return zone;
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
    if (index === total - 1) {
      container.appendChild(createAlbumMoreLink());
      container.appendChild(createAlbumLoiNgoZone());
    }
    if (figures[index]) container.appendChild(figures[index]);
  });

  syncGalleryAfterBuild(container);
}

function syncGalleryAfterBuild(container) {
  const run = () => {
    window.WeddingBlossomPulse?.refresh?.();
    if (typeof window.WeddingScrollReveal?.refreshGallery === 'function') {
      window.WeddingScrollReveal.refreshGallery();
      return;
    }
    if (typeof window.WeddingScrollReveal?.markAll === 'function') {
      window.WeddingScrollReveal.markAll();
      window.WeddingScrollReveal.refresh?.();
    }
    if (document.body.classList.contains('intro-complete')) {
      container.querySelectorAll('.gallery-grid-item').forEach((el) => {
        el.classList.add('scroll-reveal', 'scroll-reveal--gallery', 'scroll-reveal--persist', 'is-visible');
        el.dataset.revealDone = '1';
      });
    }
  };

  queueMicrotask(() => {
    run();
    window.dispatchEvent(new Event('wedding:gallery-built'));
  });
  if (!document.body.classList.contains('intro-complete')) {
    window.addEventListener('wedding:intro-complete', run, { once: true });
  }
}

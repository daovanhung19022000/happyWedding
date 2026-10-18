import { STATIC_ALBUM_FILES } from './album-store.js';

const BASE = 'kimono_image/';

/**
 * 11 ảnh album (thứ tự hiển thị 1…11) — index trong STATIC_ALBUM_FILES.
 * Đã loại ảnh dùng ở phần trên thiệp; ảnh 5 = slot 4 (THA_3566) ẩn trong layout.
 */
const INVITE_GALLERY_BODY_FILE_INDICES = [1, 2, 5, 6, 7, 8, 12, 14, 15, 17, 18];

const INVITE_GALLERY_FINALE_FILE_INDEX = 19;

/**
 * Bố cục: 1 full | 2–4 | (5 ẩn) | 6–7 | 8–9–11 | 10 full
 * `slots` = vị trí 0…10 trong INVITE_GALLERY_BODY_FILE_INDICES
 */
const INVITE_GALLERY_BODY_LAYOUT = [
  { cols: 1, slots: [0] },
  { cols: 3, slots: [1, 2, 3] },
  { cols: 2, slots: [5, 6] },
  { cols: 3, slots: [7, 8, 10] },
  { cols: 1, slots: [9] },
];

function layoutClassForRowCols(cols) {
  if (cols === 1) return 'gallery-grid-item--row-full';
  if (cols === 2) return 'gallery-grid-item--row-half';
  if (cols === 3) return 'gallery-grid-item--row-third';
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
  'Cảm ơn bạn đã dành tình cảm cho vợ chồng mình. Chúng mình biết các bạn đều đang rất bận, bận với công việc, với cuộc sống và với cả gia đình. Nhưng thực sự sẽ rất tuyệt vời nếu như ngày Hạnh Phúc của chúng mình có thêm sự góp mặt của bạn. Vợ chồng mình rất hi vọng sẽ có mặt bạn trong ngày quan trọng này để chứng kiến và chia sẻ niềm hạnh phúc này cùng chúng mình.\nMột lần nữa, chân thành cảm ơn bạn ❤️';

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

function createGalleryFigure(fileName, index, { rowCols, finale = false, eager = false }) {
  const slotId = `gallery-${index + 1}`;
  const extra = [
    layoutClassForRowCols(rowCols),
    finale ? 'gallery-grid-item--finale' : '',
  ].filter(Boolean);

  const fig = document.createElement('figure');
  fig.className = ['gallery-grid-item', 'gallery-item', ...extra].join(' ');
  fig.dataset.galleryCols = String(rowCols);

  const img = document.createElement('img');
  img.src = `${BASE}${fileName}`;
  img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
  img.loading = eager ? 'eager' : 'lazy';
  img.setAttribute('data-invite-slot', slotId);

  fig.appendChild(img);
  return fig;
}

export function buildInviteGalleryGrid(container) {
  if (!container) return;
  container.replaceChildren();

  let eagerCount = 0;

  INVITE_GALLERY_BODY_LAYOUT.forEach(({ cols, slots }) => {
    slots.forEach((slot) => {
      const fileIndex = INVITE_GALLERY_BODY_FILE_INDICES[slot];
      const fileName = STATIC_ALBUM_FILES[fileIndex];
      if (!fileName) return;
      const fig = createGalleryFigure(fileName, fileIndex, {
        rowCols: cols,
        eager: eagerCount < 3,
      });
      eagerCount += 1;
      container.appendChild(fig);
    });
  });

  container.appendChild(createAlbumMoreLink());
  container.appendChild(createAlbumLoiNgoZone());

  const finaleName = STATIC_ALBUM_FILES[INVITE_GALLERY_FINALE_FILE_INDEX];
  if (finaleName) {
    container.appendChild(
      createGalleryFigure(finaleName, INVITE_GALLERY_FINALE_FILE_INDEX, {
        rowCols: 1,
        finale: true,
        eager: false,
      }),
    );
  }

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

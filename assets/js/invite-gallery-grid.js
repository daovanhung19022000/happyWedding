import { resolveAlbumPageHref, STATIC_ALBUM_FILES } from './album-store.js';
import {
  KIMONO_GALLERY_FINALE_CAPTION,
  KIMONO_GALLERY_OPENING_CAPTION,
  MODERN_GALLERY_FINALE_CAPTION,
  MODERN_GALLERY_OPENING_CAPTION,
  MODERN_GALLERY_FINALE_FILE,
  MODERN_STATIC_ALBUM_FILES,
  modernImagePath,
} from './modern-album-store.js';
import { albumBasePathForLook, getInviteLook, INVITE_LOOK_MODERN } from './invite-look.js';

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

function albumFilesForLook(look) {
  return look === INVITE_LOOK_MODERN ? MODERN_STATIC_ALBUM_FILES : STATIC_ALBUM_FILES;
}

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
  link.href = resolveAlbumPageHref();
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

function finaleCaptionForLook(look) {
  return look === INVITE_LOOK_MODERN ? MODERN_GALLERY_FINALE_CAPTION : KIMONO_GALLERY_FINALE_CAPTION;
}

function openingCaptionForLook(look) {
  return look === INVITE_LOOK_MODERN ? MODERN_GALLERY_OPENING_CAPTION : KIMONO_GALLERY_OPENING_CAPTION;
}

function appendGalleryCaption(fig, caption, kind) {
  if (!caption?.title) return;
  const overlay = document.createElement('figcaption');
  overlay.className =
    kind === 'opening' ? 'gallery-opening-overlay gallery-finale-overlay' : 'gallery-finale-overlay';
  if (caption.eyebrow) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'gallery-finale-eyebrow';
    eyebrow.textContent = caption.eyebrow;
    overlay.appendChild(eyebrow);
  }
  const decor = document.createElement('span');
  decor.className = 'gallery-finale-rule';
  decor.setAttribute('aria-hidden', 'true');
  overlay.appendChild(decor);
  const title = document.createElement('p');
  title.className = 'gallery-finale-title';
  title.textContent = caption.title;
  overlay.appendChild(title);
  if (caption.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'gallery-finale-subtitle';
    sub.textContent = caption.subtitle;
    overlay.appendChild(sub);
  }
  fig.appendChild(overlay);
}

function createGalleryFigure(
  fileName,
  index,
  base,
  look,
  { rowCols, finale = false, opening = false, eager = false, caption = null },
) {
  const slotId = `gallery-${index + 1}`;
  const extra = [
    layoutClassForRowCols(rowCols),
    finale ? 'gallery-grid-item--finale' : '',
    finale && caption ? 'gallery-grid-item--finale-editorial' : '',
    opening && caption ? 'gallery-grid-item--opening-editorial' : '',
  ].filter(Boolean);

  const fig = document.createElement('figure');
  fig.className = ['gallery-grid-item', 'gallery-item', ...extra].join(' ');
  fig.dataset.galleryCols = String(rowCols);

  const img = document.createElement('img');
  img.src =
    look === INVITE_LOOK_MODERN ? modernImagePath(fileName) : `${base}${encodeURI(fileName)}`;
  img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
  img.loading = eager ? 'eager' : 'lazy';
  img.setAttribute('data-invite-slot', slotId);

  fig.appendChild(img);

  if ((finale || opening) && caption) {
    appendGalleryCaption(fig, caption, opening ? 'opening' : 'finale');
  }

  return fig;
}

export function buildInviteGalleryGrid(container) {
  if (!container) return;
  container.replaceChildren();

  const look = getInviteLook();
  const base = albumBasePathForLook(look);
  const files = albumFilesForLook(look);

  const maxEager = look === INVITE_LOOK_MODERN ? 1 : 3;
  let eagerCount = 0;
  let albumLeadPlaced = false;
  const openingCaption = openingCaptionForLook(look);

  INVITE_GALLERY_BODY_LAYOUT.forEach(({ cols, slots }) => {
    slots.forEach((slot) => {
      const fileIndex = INVITE_GALLERY_BODY_FILE_INDICES[slot];
      const fileName = files[fileIndex];
      if (!fileName) return;
      const isAlbumLead = !albumLeadPlaced;
      const fig = createGalleryFigure(fileName, fileIndex, base, look, {
        rowCols: cols,
        eager: eagerCount < maxEager,
        opening: isAlbumLead,
        caption: isAlbumLead ? openingCaption : null,
      });
      if (isAlbumLead) albumLeadPlaced = true;
      eagerCount += 1;
      container.appendChild(fig);
    });
  });

  container.appendChild(createAlbumMoreLink());
  container.appendChild(createAlbumLoiNgoZone());

  const finaleName =
    look === INVITE_LOOK_MODERN
      ? MODERN_GALLERY_FINALE_FILE
      : files[INVITE_GALLERY_FINALE_FILE_INDEX];
  const finaleIndex =
    look === INVITE_LOOK_MODERN
      ? files.indexOf(MODERN_GALLERY_FINALE_FILE)
      : INVITE_GALLERY_FINALE_FILE_INDEX;
  if (finaleName) {
    container.appendChild(
      createGalleryFigure(
        finaleName,
        finaleIndex >= 0 ? finaleIndex : INVITE_GALLERY_FINALE_FILE_INDEX,
        base,
        look,
        {
          rowCols: 1,
          finale: true,
          eager: false,
          caption: finaleCaptionForLook(look),
        },
      ),
    );
  }

  syncGalleryAfterBuild(container);
}

function syncGalleryAfterBuild(container) {
  const unlockAlbumMoreLink = () => {
    container.querySelectorAll('.album-more-link').forEach((link) => {
      link.classList.remove(
        'scroll-reveal',
        'scroll-reveal--merge-right',
        'scroll-reveal--text',
        'scroll-reveal--gallery',
        'is-animating',
      );
      link.classList.add('is-visible');
      link.style.removeProperty('--reveal-delay');
      link.style.opacity = '';
      link.style.pointerEvents = 'auto';
    });
  };

  const run = () => {
    unlockAlbumMoreLink();
    window.WeddingBlossomPulse?.refresh?.();
    if (typeof window.WeddingScrollReveal?.refreshGallery === 'function') {
      window.WeddingScrollReveal.refreshGallery();
      unlockAlbumMoreLink();
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

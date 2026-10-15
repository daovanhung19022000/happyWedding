import { buildMosaicRows } from './album-store.js';

export function renderAlbumMosaic(mosaicEl, urlList) {
  if (!mosaicEl) return;
  mosaicEl.replaceChildren();
  const rows = buildMosaicRows(urlList);

  rows.forEach((rowUrls) => {
    const row = document.createElement('div');
    row.className = `album-mosaic-row album-mosaic-row--${rowUrls.length}`;
    rowUrls.forEach((src, colIndex) => {
      const fig = document.createElement('figure');
      fig.className = 'album-reveal';
      fig.style.setProperty('--reveal-delay', `${colIndex * 0.09}s`);
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
      img.loading = 'lazy';
      img.addEventListener(
        'load',
        () => {
          fig.classList.add('album-reveal--ready');
          maybeRevealInView(fig);
        },
        { once: true },
      );
      fig.appendChild(img);
      row.appendChild(fig);
    });
    mosaicEl.appendChild(row);
  });

  initAlbumReveal(mosaicEl);
}

function maybeRevealInView(fig) {
  if (!fig.classList.contains('album-reveal--ready')) return;
  const rect = fig.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (rect.bottom > 0 && rect.top < vh) {
    fig.classList.add('is-visible');
  }
}

export function initAlbumReveal(mosaicEl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    mosaicEl.querySelectorAll('.album-reveal').forEach((fig) => {
      fig.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const fig = entry.target;
        if (!entry.isIntersecting) return;
        const img = fig.querySelector('img');
        if (img && !img.complete) return;
        fig.classList.add('is-visible');
        observer.unobserve(fig);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px 6% 0px' },
  );

  mosaicEl.querySelectorAll('.album-reveal').forEach((fig) => {
    const img = fig.querySelector('img');
    if (img?.complete) fig.classList.add('album-reveal--ready');
    observer.observe(fig);
  });
}

export function bindAlbumLightbox(mosaicEl, modal, lightboxImg, closeBtn) {
  if (!mosaicEl || !modal || !lightboxImg) return;
  mosaicEl.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    lightboxImg.src = img.src;
    modal.classList.add('active');
  });
  closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

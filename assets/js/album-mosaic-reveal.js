/** Gắn scroll-reveal (bay từ hai bên) giống trang thiệp — chạy sau khi mosaic đã render. */
export function initAlbumReveal(mosaicEl) {
  if (!mosaicEl) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    mosaicEl.querySelectorAll('.album-reveal').forEach((fig) => fig.classList.add('is-visible'));
    return;
  }

  const refresh = () => window.WeddingScrollReveal?.refreshGallery?.();

  refresh();
  window.setTimeout(refresh, 80);
  window.dispatchEvent(new Event('wedding:gallery-built'));
}

export { bindGalleryLightbox as bindAlbumLightbox } from './wedding-lightbox.js';

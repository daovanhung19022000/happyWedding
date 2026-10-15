import { loadAllAlbumImageUrls } from './album-store.js';
import { bindAlbumLightbox, renderAlbumMosaic } from './album-mosaic.js';

async function initAlbumPage() {
  const mosaic = document.getElementById('album-mosaic');
  const modal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  const urls = await loadAllAlbumImageUrls('../kimono_image/');
  renderAlbumMosaic(mosaic, urls);
  bindAlbumLightbox(mosaic, modal, lightboxImg, closeBtn);
}

initAlbumPage();

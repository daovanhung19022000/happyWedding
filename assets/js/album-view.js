import { buildAlbumPagePlan } from './album-concept-layout.js';
import { bindAlbumLightbox, renderAlbumConceptMosaic } from './album-mosaic.js';

function initAlbumPage() {
  const mosaic = document.getElementById('album-mosaic');
  if (!mosaic) return;

  try {
    const plan = buildAlbumPagePlan();
    renderAlbumConceptMosaic(mosaic, plan);
    bindAlbumLightbox(mosaic, { imageSelector: '.album-mosaic img' });
  } catch (err) {
    console.error('Album concept layout lỗi:', err);
    mosaic.innerHTML =
      '<p class="album-mosaic-error">Không tải được album — tải lại trang (Cmd+Shift+R).</p>';
  }
}

initAlbumPage();

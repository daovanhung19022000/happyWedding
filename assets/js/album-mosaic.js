import { buildMosaicRows } from './album-store.js';
import { flattenAlbumPageRows } from './album-concept-layout.js';
import { initAlbumReveal } from './album-mosaic-reveal.js';

export function renderAlbumMosaic(mosaicEl, urlList) {
  if (!mosaicEl) return;
  mosaicEl.replaceChildren();
  const rows = buildMosaicRows(urlList);
  rows.forEach((rowUrls) => {
    appendPhotoRow(mosaicEl, rowUrls.length, rowUrls);
  });
  initAlbumReveal(mosaicEl);
}

/** Trang /album/ — một luồng ảnh, không tiêu đề concept. */
export function renderAlbumConceptMosaic(mosaicEl, plan) {
  if (!mosaicEl || !plan) return;
  mosaicEl.replaceChildren();
  mosaicEl.classList.add('album-mosaic--concept');

  let rowIndex = 0;
  flattenAlbumPageRows(plan).forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = `album-mosaic-row album-mosaic-row--${row.cols}`;
    row.urls.forEach((src, colIndex) => {
      rowEl.appendChild(createAlbumFigure(src, row.cols, colIndex, rowIndex));
    });
    if (row.fullBleed) rowEl.classList.add('album-mosaic-row--hero');
    if (row.isFinale) rowEl.classList.add('album-mosaic-row--finale');
    mosaicEl.appendChild(rowEl);
    rowIndex += 1;
  });

  initAlbumReveal(mosaicEl);
}

function createAlbumFigure(src, cols, colIndex, rowIndex) {
  const fig = document.createElement('figure');
  fig.className = 'album-reveal';
  fig.dataset.revealSide = albumRevealSide(cols, colIndex, rowIndex);
  fig.style.setProperty('--reveal-delay', `${colIndex * 0.07}s`);

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
  img.loading = 'lazy';
  img.decoding = 'async';
  fig.appendChild(img);
  return fig;
}

function albumRevealSide(cols, colIndex, rowIndex) {
  if (cols === 1) return rowIndex % 2 === 0 ? 'left' : 'right';
  if (colIndex === 0) return 'left';
  if (colIndex >= cols - 1) return 'right';
  return colIndex % 2 === 0 ? 'left' : 'right';
}

function appendPhotoRow(parent, cols, urls) {
  const row = document.createElement('div');
  row.className = `album-mosaic-row album-mosaic-row--${cols}`;
  urls.forEach((src, colIndex) => {
    row.appendChild(createAlbumFigure(src, cols, colIndex, 0));
  });
  parent.appendChild(row);
  return row;
}

export { initAlbumReveal, bindAlbumLightbox } from './album-mosaic-reveal.js';

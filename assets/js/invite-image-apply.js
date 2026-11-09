import './firebase-config.js';
import { initFirebaseClient } from './firebase-config.js';
import { buildInviteGalleryGrid } from './invite-gallery-grid.js';
import { buildInvitePhotoMarquee } from './invite-photo-marquee.js';
import { loadAndApplyInviteImages } from './invite-image-store.js';

document.addEventListener('DOMContentLoaded', () => {
  initFirebaseClient();
  const grid = document.getElementById('invite-gallery-grid');
  const marqueeRoot = document.querySelector('.invite-photo-marquee');

  loadAndApplyInviteImages().finally(() => {
    buildInviteGalleryGrid(grid);
  });

  const startMarquee = () => {
    if (marqueeRoot) buildInvitePhotoMarquee(marqueeRoot);
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(startMarquee, { timeout: 3000 });
  } else {
    window.setTimeout(startMarquee, 600);
  }
});

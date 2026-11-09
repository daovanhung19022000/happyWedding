import './firebase-config.js';
import { initFirebaseClient } from './firebase-config.js';
import { buildInviteGalleryGrid } from './invite-gallery-grid.js';
import { buildInvitePhotoMarquee } from './invite-photo-marquee.js';
import {
  applyInviteImageOverrides,
  applyInviteLookDefaultImages,
  fetchInviteImageOverrides,
} from './invite-image-store.js';
import { getInviteLook } from './invite-look.js';

function bootInviteImages() {
  initFirebaseClient();
  const look = getInviteLook();
  applyInviteLookDefaultImages(look);

  const grid = document.getElementById('invite-gallery-grid');
  const marqueeRoot = document.querySelector('.invite-photo-marquee');

  buildInviteGalleryGrid(grid);
  if (marqueeRoot) buildInvitePhotoMarquee(marqueeRoot);

  fetchInviteImageOverrides(look)
    .then((overrides) => {
      applyInviteImageOverrides(overrides, look);
    })
    .catch((err) => {
      console.warn('Không áp dụng được ảnh thiệp từ Firebase:', err);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootInviteImages);
} else {
  bootInviteImages();
}

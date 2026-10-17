import './firebase-config.js';
import { initFirebaseClient } from './firebase-config.js';
import { buildInviteGalleryGrid } from './invite-gallery-grid.js';
import { buildInvitePhotoMarquee } from './invite-photo-marquee.js';
import { loadAndApplyInviteImages } from './invite-image-store.js';

document.addEventListener('DOMContentLoaded', () => {
  initFirebaseClient();
  buildInviteGalleryGrid(document.getElementById('invite-gallery-grid'));
  buildInvitePhotoMarquee(document.querySelector('.invite-photo-marquee'));
  loadAndApplyInviteImages();
});

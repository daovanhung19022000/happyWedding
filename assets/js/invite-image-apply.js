import './firebase-config.js';
import { buildInviteGalleryGrid } from './invite-gallery-grid.js';
import { loadAndApplyInviteImages } from './invite-image-store.js';

document.addEventListener('DOMContentLoaded', () => {
  buildInviteGalleryGrid(document.getElementById('invite-gallery-grid'));
  loadAndApplyInviteImages();
});

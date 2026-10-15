import './firebase-config.js';
import { loadAndApplyInviteImages } from './invite-image-store.js';

document.addEventListener('DOMContentLoaded', () => {
  loadAndApplyInviteImages();
});

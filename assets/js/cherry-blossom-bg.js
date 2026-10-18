/**
 * Hoa anh đào hồng phóng to / thu nhỏ — lớp toàn trang + từng section (chữ ký, polaroid, thiệp, RSVP, footer).
 */
(function () {
  'use strict';

  const HEART_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  const BLOSSOM_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="24" cy="24" r="3.2" fill="#fff3b0" opacity="0.95"/>' +
    '<g fill="currentColor">' +
    '<ellipse cx="24" cy="11" rx="5.2" ry="9.5"/>' +
    '<ellipse cx="24" cy="11" rx="5.2" ry="9.5" transform="rotate(72 24 24)"/>' +
    '<ellipse cx="24" cy="11" rx="5.2" ry="9.5" transform="rotate(144 24 24)"/>' +
    '<ellipse cx="24" cy="11" rx="5.2" ry="9.5" transform="rotate(216 24 24)"/>' +
    '<ellipse cx="24" cy="11" rx="5.2" ry="9.5" transform="rotate(288 24 24)"/>' +
    '</g></svg>';

  const PINKS = [
    '#ffc2d4', '#ff9ebb', '#f783a7', '#e85a8a', '#f5b8cc',
    '#ffb3c6', '#ff8fab', '#fce4ec', '#f3aac0',
  ];

  const ZONE_COUNTS = {
    global: [48, 64],
    topbar: [20, 28],
    hero: [26, 34],
    polaroid: [28, 36],
    invite: [30, 38],
    rsvp: [32, 40],
    footer: [22, 30],
    loingo: [38, 50],
  };

  let started = false;

  function countForLayer(layer) {
    const zone = layer.dataset.blossomZone || 'global';
    const range = ZONE_COUNTS[zone] || ZONE_COUNTS.global;
    return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  }

  function spawnBlossoms(layer) {
    if (!layer || layer.dataset.ready === '1') return;
    layer.dataset.ready = '1';
    layer.replaceChildren();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      layer.classList.add('blossom-pulse-layer--static');
      return;
    }

    const isSection = layer.classList.contains('blossom-pulse-layer--section');
    const isHeart = layer.dataset.blossomKind === 'heart';
    const count = countForLayer(layer);

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = isHeart ? 'blossom-pulse-item blossom-pulse-item--heart' : 'blossom-pulse-item';
      el.innerHTML = isHeart ? HEART_SVG : BLOSSOM_SVG;

      const size = isHeart
        ? 8 + Math.random() * 16
        : isSection
          ? 10 + Math.random() * 24
          : 12 + Math.random() * 28;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.color = PINKS[Math.floor(Math.random() * PINKS.length)];

      const padX = 0.5 + Math.random() * 1.5;
      const padY = 0.5 + Math.random() * 2;
      el.style.left = `${padX + Math.random() * (100 - padX * 2)}%`;
      el.style.top = `${padY + Math.random() * (100 - padY * 2)}%`;
      el.style.setProperty('--delay', `${Math.random() * 2.6}s`);
      el.style.setProperty('--dur', `${2.2 + Math.random() * 2.4}s`);
      el.style.setProperty('--max-scale', `${0.88 + Math.random() * 0.58}`);

      layer.appendChild(el);
    }
  }

  function boot() {
    if (started) return;
    const layers = document.querySelectorAll('[data-blossom-zone]');
    if (!layers.length) return;
    started = true;
    layers.forEach(spawnBlossoms);
  }

  function wire() {
    window.addEventListener('wedding:intro-complete', boot, { once: true });
    if (document.body.classList.contains('intro-complete')) {
      window.setTimeout(boot, 80);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

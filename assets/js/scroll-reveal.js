/**
 * Scroll reveal — ảnh & chữ bay vào khi cuộn (lên / xuống).
 * Script thường (không module) để luôn chạy kể cả khi app.js lỗi.
 */
(function () {
  'use strict';

  let observer = null;
  const observed = new WeakSet();
  let openingDone = false;

  const REVEAL_MEDIA =
    '.hero-signature-col, .polaroid-photo-box, .polaroid-card-body, ' +
    '.gallery-grid-item, .formal-invite-schedule-illus, ' +
    '.gift-envelope-wrap, .love-story-card, .love-story-photo';

  const REVEAL_TEXT =
    'h1, h2, h3, h4, h5, h6, p, li, .hero-eyebrow, .hero-journey-tagline, .hero-date-ribbon, ' +
    '.love-story-title, .love-story-lead, ' +
    '.rsvp-form-heading, .form-group-item, .rsvp-submit-btn, a.formal-invite-directions, ' +
    '.formal-invite-schedule-text, .album-section-title, .footer-couple-title, ' +
    '.footer-script-thankyou, .footer-closing-text, .wedding-calendar-countdown, ' +
    '.wedding-calendar-grid';

  const OPENING_ROOTS = '.hero-canvas-section';

  function shouldSkip(el) {
    if (!el || el.classList.contains('scroll-reveal')) return true;
    if (el.closest('#envelope-intro, #gift-dialog, #guest-banner, #blossom-pulse-layer')) return true;
    if (el.closest('.hero-hearts-orbit, .wedding-calendar-bg, .wedding-calendar-scrim')) return true;
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
    if (el.matches('hr, .formal-invite-rule, .album-section-rule, .polaroid-family-rule')) return true;
    const text = (el.textContent || '').trim();
    if (el.matches('p, span, li') && !text) return true;
    return false;
  }

  function insideMedia(el) {
    const host = el.closest(REVEAL_MEDIA);
    if (!host || host === el) return false;
    return true;
  }

  function variantFor(el) {
    if (el.classList.contains('gallery-grid-item')) {
      return 'gallery';
    }
    if (
      el.classList.contains('hero-arch-wrap') ||
      el.classList.contains('wedding-calendar-grid') ||
      el.classList.contains('polaroid-photo-box') ||
      el.classList.contains('formal-invite-schedule-illus') ||
      el.classList.contains('hero-signature-col') ||
      el.classList.contains('gift-envelope-wrap') ||
      el.matches('img')
    ) {
      return 'zoom';
    }
    if (
      el.classList.contains('polaroid-card-body--bride') ||
      el.classList.contains('couple-polaroid-matrix__photo--bride')
    ) {
      return 'merge-left';
    }
    if (
      el.classList.contains('polaroid-card-body--groom') ||
      el.classList.contains('couple-polaroid-matrix__photo--groom')
    ) {
      return 'merge-right';
    }
    if (el.classList.contains('love-story-card')) {
      const milestone = el.closest('.love-story-milestone');
      if (milestone && milestone.parentElement) {
        const siblings = milestone.parentElement.querySelectorAll('.love-story-milestone');
        const idx = Array.prototype.indexOf.call(siblings, milestone);
        return idx % 2 === 0 ? 'merge-left' : 'merge-right';
      }
    }
    return 'text';
  }

  function collectSection(section) {
    const list = [];
    const seen = new Set();
    const push = (el) => {
      if (shouldSkip(el) || seen.has(el)) return;
      seen.add(el);
      list.push(el);
    };

    if (section.classList.contains('gallery-canvas-section')) {
      const head = section.querySelector('.album-section-head');
      if (head) push(head);
      section.querySelectorAll('.gallery-grid-item').forEach(push);
      return list;
    }

    section.querySelectorAll(REVEAL_MEDIA).forEach((el) => {
      if (el.closest('.hero-opening-panel')) return;
      push(el);
    });
    section.querySelectorAll(REVEAL_TEXT).forEach((el) => {
      if (shouldSkip(el)) return;
      if (el.closest('.hero-opening-panel')) return;
      if (insideMedia(el)) return;
      if (el.closest('.invite-photo-marquee, .gallery-grid-item, .formal-invite-schedule-illus')) return;
      if (el.closest('.polaroid-card-body') && !el.classList.contains('polaroid-card-body')) return;
      if (el.closest('.hero-arch-wrap') && !el.closest('.hero-arch-overlay, .hero-text-block')) return;
      push(el);
    });
    section.querySelectorAll('img').forEach((img) => {
      if (shouldSkip(img)) return;
      if (img.closest('.hero-opening-panel')) return;
      if (img.closest(REVEAL_MEDIA)) return;
      if (img.closest('.gift-envelope-icon')) return;
      push(img);
    });
    return list;
  }

  function setRevealDelay(el, index, step) {
    const delay = Math.min(index * step, 0.85);
    el.dataset.revealDelay = String(delay);
    el.style.setProperty('--reveal-delay', delay + 's');
  }

  function isHeroOpeningBlock(el) {
    return (
      el.classList.contains('hero-opening-panel') ||
      !!el.closest('.hero-opening-panel')
    );
  }

  function applyClasses(section) {
    collectSection(section).forEach((el, i) => {
      if (el.classList.contains('scroll-reveal')) return;
      const variant = el.classList.contains('album-section-head') ? 'text' : variantFor(el);
      el.classList.add('scroll-reveal', 'scroll-reveal--' + variant);
      if (section.classList.contains('gallery-canvas-section') || isHeroOpeningBlock(el)) {
        el.classList.add('scroll-reveal--persist');
      }
      const step = section.classList.contains('gallery-canvas-section') ? 0.1 : 0.06;
      setRevealDelay(el, i, step);
    });
  }

  function markOpening() {
    const canvas = document.getElementById('app-canvas');
    if (!canvas) return;
    canvas.querySelectorAll(OPENING_ROOTS).forEach(applyClasses);
  }

  function stripTopBarReveal() {
    const panel = document.querySelector('.hero-opening-panel');
    if (!panel) return;
    panel.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.classList.remove(
        'scroll-reveal',
        'scroll-reveal--text',
        'scroll-reveal--zoom',
        'scroll-reveal--gallery',
        'is-visible',
        'is-animating',
      );
      el.style.removeProperty('--reveal-delay');
    });
  }

  function lockHeroOpeningVisible() {
    const panel = document.querySelector('.hero-opening-panel');
    if (!panel) return;
    panel.querySelectorAll('.hero-arch-wrap, .hero-arch-container, .hero-arch-img').forEach((el) => {
      el.classList.remove('scroll-reveal', 'scroll-reveal--zoom', 'is-animating');
      el.style.opacity = '';
      el.style.visibility = '';
    });
  }

  function markAll() {
    const canvas = document.getElementById('app-canvas');
    if (!canvas) return;
    stripTopBarReveal();
    canvas.querySelectorAll('section, footer.canvas-footer-section').forEach(applyClasses);
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isFullyOutOfView(rect) {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom <= 0 || rect.top >= vh;
  }

  function isGalleryReveal(el) {
    return (
      el.classList.contains('gallery-grid-item') ||
      el.classList.contains('scroll-reveal--gallery') ||
      (el.classList.contains('album-section-head') && el.closest('.gallery-canvas-section'))
    );
  }

  function revealGalleryTile(el) {
    if (el.dataset.revealDone === '1' || el.classList.contains('is-visible')) return;

    const img = el.querySelector('img');
    if (img && !img.complete) return;

    const h = el.getBoundingClientRect().height;
    if (img && h < 40) return;

    el.dataset.revealDone = '1';
    el.classList.add('is-visible');
  }

  function revealEl(el, delayOverride) {
    if (isGalleryReveal(el)) {
      if (delayOverride != null) el.style.setProperty('--reveal-delay', delayOverride);
      revealGalleryTile(el);
      return;
    }

    if (el.classList.contains('is-visible') && delayOverride == null) return;

    if (delayOverride != null) {
      el.style.setProperty('--reveal-delay', delayOverride);
    }
    el.classList.remove('is-visible', 'is-animating');
    void el.offsetWidth;
    el.classList.add('is-visible', 'is-animating');
  }

  function hideEl(el) {
    if (el.classList.contains('scroll-reveal--persist') || isGalleryReveal(el) || isHeroOpeningBlock(el)) {
      return;
    }
    el.classList.remove('is-visible', 'is-animating');
  }

  function ensureObserver() {
    if (observer) return observer;

    observer = new IntersectionObserver(
      (entries) => {
        if (reducedMotion()) return;
        if (window.__weddingIdleScrollActive) return;
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting) {
            if (isGalleryReveal(el)) {
              revealGalleryTile(el);
            } else if (!el.classList.contains('is-visible')) {
              revealEl(el);
            }
          } else if (
            !window.__weddingIdleScrollActive &&
            !el.classList.contains('scroll-reveal--persist') &&
            isFullyOutOfView(entry.boundingClientRect)
          ) {
            hideEl(el);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px 0px 0px',
      }
    );

    return observer;
  }

  function observeAll() {
    const canvas = document.getElementById('app-canvas');
    if (!canvas) return;

    if (reducedMotion()) {
      canvas.querySelectorAll('.scroll-reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = ensureObserver();
    canvas.querySelectorAll('.scroll-reveal').forEach((el) => {
      if (observed.has(el)) return;
      observed.add(el);
      io.observe(el);
    });
  }

  function playOpening() {
    if (openingDone) return;
    const canvas = document.getElementById('app-canvas');
    if (!canvas) return;

    const targets = [];
    const seen = new Set();
    canvas.querySelectorAll(OPENING_ROOTS).forEach((root) => {
      collectSection(root).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        targets.push(el);
      });
    });
    if (!targets.length) return;

    openingDone = true;
    if (reducedMotion()) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    requestAnimationFrame(() => {
      targets.forEach((el, i) => {
        const d = 0.15 + Math.min(i * 0.08, 0.6);
        revealEl(el, d + 's');
      });
    });
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom > 0 && rect.top < vh && rect.height > 6;
  }

  function setupGalleryLazyReveal() {
    const section = document.querySelector('.gallery-canvas-section');
    if (!section) return;

    section.querySelectorAll('.gallery-grid-item.scroll-reveal').forEach((fig) => {
      const img = fig.querySelector('img');
      const tryShow = () => {
        if (!isInViewport(fig)) return;
        revealGalleryTile(fig);
      };
      if (!img) {
        tryShow();
        return;
      }
      if (img.complete) tryShow();
      else img.addEventListener('load', tryShow, { once: true });
    });
  }

  function freezeForAutoScroll() {
    const canvas = document.getElementById('app-canvas');
    if (!canvas) return;
    canvas.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.classList.add('is-visible', 'scroll-reveal--persist');
      el.classList.remove('is-animating');
      el.style.removeProperty('--reveal-delay');
      if (isGalleryReveal(el)) el.dataset.revealDone = '1';
    });
  }

  function boot() {
    markAll();
    lockHeroOpeningVisible();
    playOpening();
    observeAll();
    setupGalleryLazyReveal();
    lockHeroOpeningVisible();
  }

  function wireEvents() {
    window.addEventListener(
      'wedding:intro-revealing',
      () => {
        markOpening();
      },
      { once: true }
    );

    window.addEventListener(
      'wedding:intro-complete',
      () => {
        window.setTimeout(boot, 50);
      },
      { once: true }
    );

    if (document.body.classList.contains('intro-complete')) {
      window.setTimeout(boot, 50);
    }

  }

  window.WeddingScrollReveal = { boot, markAll, refresh: observeAll, freezeForAutoScroll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireEvents);
  } else {
    wireEvents();
  }
})();

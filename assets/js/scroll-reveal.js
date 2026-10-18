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
    '.gift-envelope-wrap, .love-story-card, .love-story-photo, .always-you-photo, .marriage-trio-cell';

  const REVEAL_TEXT =
    'h1, h2, h3, h4, h5, h6, p, li, .hero-eyebrow, .hero-journey-tagline, .hero-date-ribbon, ' +
    '.love-story-title, .love-story-lead, .album-loi-ngo-title, .album-loi-ngo-lead, ' +
    '.rsvp-form-heading, .form-group-item, .rsvp-submit-btn, a.formal-invite-directions, ' +
    '.formal-invite-schedule-text, .album-section-title, .footer-couple-title, ' +
    '.footer-script-thankyou, .footer-closing-text, .chuc-phuc-footer__title, .chuc-phuc-footer__lead, ' +
    '.chuc-phuc-footer__role, .chuc-phuc-footer__name, .chuc-phuc-footer__thanks, .chuc-phuc-footer__credit, .wedding-calendar-countdown, ' +
    '.wedding-calendar-grid';

  const OPENING_ROOTS = '.hero-canvas-section';
  const EDGE_SECTION_CLASS = 'scroll-reveal-edge-zone';

  function isEdgeRevealSection(section) {
    if (!section) return false;
    return (
      section.classList.contains('love-story-section') ||
      section.classList.contains('couple-polaroid-section') ||
      section.classList.contains('formal-invite-section') ||
      section.classList.contains('wedding-calendar-section') ||
      section.classList.contains('always-you-section') ||
      section.classList.contains('marriage-trio-section') ||
      section.classList.contains('rsvp-invite-section') ||
      section.classList.contains('gallery-canvas-section')
    );
  }

  function edgeSideByIndex(index) {
    return index % 2 === 0 ? 'edge-left' : 'edge-right';
  }

  /** Timeline: mốc lẻ (cột 1) trái, mốc chẵn (cột 3) phải */
  function loveStorySide(milestone) {
    if (!milestone || !milestone.parentElement) return null;
    const siblings = milestone.parentElement.querySelectorAll('.love-story-milestone');
    const idx = Array.prototype.indexOf.call(siblings, milestone);
    if (idx < 0) return null;
    return idx % 2 === 0 ? 'merge-left' : 'merge-right';
  }

  function loveStorySideFor(el) {
    const milestone = el.closest('.love-story-milestone');
    return milestone ? loveStorySide(milestone) : null;
  }

  /** Khớp invite-gallery-grid.js — lưới 6 cột (1/2/3 ảnh mỗi hàng) */
  function galleryItemSpan(el, index, total) {
    const cols = el?.dataset?.galleryCols;
    if (cols === '1') return 6;
    if (cols === '2') return 3;
    if (cols === '3') return 2;
    if (index === 0 || index === total - 1) return 6;
    const pos = (index - 1) % 5;
    return pos >= 3 ? 3 : 2;
  }

  function galleryColumnStart(index, total, items) {
    const el = items?.[index];
    if (galleryItemSpan(el, index, total) === 6) return 1;
    let col = 1;
    for (let i = 0; i < index; i++) {
      const span = galleryItemSpan(items[i], i, total);
      if (span === 6) {
        col = 1;
        continue;
      }
      if (col + span - 1 > 6) col = 1;
      col += span;
      if (col > 6) col = 1;
    }
    const span = galleryItemSpan(el, index, total);
    if (col + span - 1 > 6) col = 1;
    return col;
  }

  function gallerySideFromLayout(index, total, items) {
    const el = items?.[index];
    if (index === 0) return 'merge-left';
    if (index === total - 1) return 'merge-right';
    const start = galleryColumnStart(index, total, items);
    const span = galleryItemSpan(el, index, total);
    if (start >= 4) return 'merge-right';
    if (start + span - 1 <= 3) return 'merge-left';
    return start >= 4 ? 'merge-right' : 'merge-left';
  }

  function galleryRevealSide(el) {
    if (el.classList.contains('album-section-title')) return 'merge-left';
    if (el.classList.contains('album-more-link')) return 'merge-right';
    const grid = el.closest('.gallery-editorial-grid');
    if (!grid) return 'merge-left';
    const items = grid.querySelectorAll('.gallery-grid-item');
    const index = Array.prototype.indexOf.call(items, el);
    if (index < 0) return 'merge-left';
    return gallerySideFromLayout(index, items.length, items);
  }

  function alwaysYouSideFor(el) {
    if (el.closest('.always-you-col--light')) return 'merge-left';
    if (el.closest('.always-you-col--wine')) return 'merge-right';
    return null;
  }

  function marriageTrioSideFor(el) {
    if (el.classList.contains('marriage-trio-quote')) return 'edge-left';
    if (el.closest('.marriage-trio-cell--left')) return 'merge-left';
    if (el.closest('.marriage-trio-cell--right')) return 'merge-right';
    if (el.closest('.marriage-trio-cell--wide')) return 'merge-left';
    return null;
  }

  /** Lưới polaroid: cột 1 = trái, cột 2 = phải (ảnh chú rể trái, ảnh cô dâu phải) */
  function polaroidSideFor(el) {
    if (el.closest('.couple-polaroid-matrix__text--bride, .couple-polaroid-matrix__photo--groom')) {
      return 'merge-left';
    }
    if (el.closest('.couple-polaroid-matrix__photo--bride, .couple-polaroid-matrix__text--groom')) {
      return 'merge-right';
    }
    const sigCol = el.closest('.hero-signature-col');
    if (sigCol && el.closest('.couple-polaroid-section .hero-signatures')) {
      const row = sigCol.parentElement;
      const cols = row ? row.querySelectorAll('.hero-signature-col') : [];
      const idx = Array.prototype.indexOf.call(cols, sigCol);
      return idx <= 0 ? 'merge-left' : 'merge-right';
    }
    return null;
  }

  function shouldSkip(el) {
    if (!el || el.classList.contains('scroll-reveal')) return true;
    if (el.closest('#envelope-intro, #gift-dialog, #guest-banner, #blossom-pulse-layer')) return true;
    if (el.closest('.hero-hearts-orbit, .wedding-calendar-bg, .wedding-calendar-scrim')) return true;
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
    if (el.matches('hr, .formal-invite-rule, .album-section-rule, .polaroid-family-rule')) return true;
    if (el.classList.contains('love-story-photo') && el.closest('.love-story-card')) return true;
    if (el.matches('img') && el.closest('.love-story-card')) return true;
    if (el.matches('img') && el.closest('.always-you-photo')) return true;
    if (el.matches('img') && el.closest('.marriage-trio-cell')) return true;
    const text = (el.textContent || '').trim();
    if (el.matches('p, span, li') && !text) return true;
    return false;
  }

  function insideMedia(el) {
    const host = el.closest(REVEAL_MEDIA);
    if (!host || host === el) return false;
    return true;
  }

  function variantFor(el, index, section) {
    const edge = isEdgeRevealSection(section);

    if (
      el.classList.contains('gallery-grid-item') ||
      el.classList.contains('album-section-title') ||
      el.classList.contains('album-more-link')
    ) {
      if (edge && section.classList.contains('gallery-canvas-section')) {
        return galleryRevealSide(el);
      }
      return el.classList.contains('gallery-grid-item') ? 'gallery' : 'text';
    }

    if (section.classList.contains('love-story-section')) {
      const side = loveStorySideFor(el);
      if (side) return side;
    }

    if (section.classList.contains('couple-polaroid-section')) {
      const side = polaroidSideFor(el);
      if (side) return side;
    }

    if (section.classList.contains('always-you-section')) {
      const side = alwaysYouSideFor(el);
      if (side) return side;
    }

    if (section.classList.contains('marriage-trio-section')) {
      const side = marriageTrioSideFor(el);
      if (side) return side;
    }

    const zoomLike =
      el.classList.contains('hero-arch-wrap') ||
      el.classList.contains('wedding-calendar-grid') ||
      el.classList.contains('polaroid-photo-box') ||
      el.classList.contains('formal-invite-schedule-illus') ||
      el.classList.contains('hero-signature-col') ||
      el.classList.contains('gift-envelope-wrap') ||
      el.classList.contains('love-story-photo') ||
      el.matches('img');

    if (edge) {
      return edgeSideByIndex(index);
    }
    if (zoomLike) return 'zoom';
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
      const title = section.querySelector('.album-section-title');
      const moreLink = section.querySelector('.album-more-link');
      const loiNgo = section.querySelector('.album-loi-ngo-title');
      const loiNgoLead = section.querySelector('.album-loi-ngo-lead');
      if (title) push(title);
      if (moreLink) push(moreLink);
      if (loiNgo) push(loiNgo);
      if (loiNgoLead) push(loiNgoLead);
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
    if (isEdgeRevealSection(section)) {
      section.classList.add(EDGE_SECTION_CLASS);
    }
    collectSection(section).forEach((el, i) => {
      if (el.classList.contains('scroll-reveal')) return;
      const variant = variantFor(el, i, section);
      el.classList.add('scroll-reveal', 'scroll-reveal--' + variant);
      if (section.classList.contains('gallery-canvas-section') || isHeroOpeningBlock(el)) {
        el.classList.add('scroll-reveal--persist');
      }
      const step = section.classList.contains('gallery-canvas-section') ? 0.1 : 0.06;
      setRevealDelay(el, i, step);
    });
  }

  function markOpening() {
    /* Hero mở đầu cố định — không gắn scroll-reveal (tránh giật SAVE THE DATE / ảnh vòm) */
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
    canvas.querySelectorAll('section, footer.canvas-footer-section').forEach((section) => {
      if (section.classList.contains('hero-canvas-section')) return;
      applyClasses(section);
    });
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isFullyOutOfView(rect) {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return rect.bottom <= 0 || rect.top >= vh;
  }

  function isGalleryReveal(el) {
    if (el.classList.contains('scroll-reveal--edge-left') || el.classList.contains('scroll-reveal--edge-right')) {
      return false;
    }
    return (
      el.classList.contains('gallery-grid-item') ||
      el.classList.contains('scroll-reveal--gallery') ||
      (el.classList.contains('album-section-title') && el.closest('.gallery-canvas-section'))
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
    openingDone = true;
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

  function refreshGallerySection() {
    const section = document.querySelector('.gallery-canvas-section');
    if (!section) return;
    if (
      !document.body.classList.contains('intro-complete') &&
      !document.body.classList.contains('intro-revealing')
    ) {
      return;
    }
    markAll();
    observeAll();
    setupGalleryLazyReveal();
  }

  function revealVisibleInViewport() {
    const canvas = document.getElementById('app-canvas');
    if (!canvas) return;
    canvas.querySelectorAll('.scroll-reveal:not(.is-visible)').forEach((el) => {
      if (isInViewport(el)) revealEl(el);
    });
  }

  function boot() {
    markAll();
    lockHeroOpeningVisible();
    playOpening();
    observeAll();
    setupGalleryLazyReveal();
    refreshGallerySection();
    lockHeroOpeningVisible();
    revealVisibleInViewport();
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

    window.addEventListener('load', () => {
      window.setTimeout(revealVisibleInViewport, 0);
    });

    window.addEventListener('pageshow', (event) => {
      if (!document.body.classList.contains('intro-complete')) return;
      window.setTimeout(() => {
        revealVisibleInViewport();
        observeAll();
      }, 0);
    });
  }

  window.WeddingScrollReveal = {
    boot,
    markAll,
    refresh: observeAll,
    refreshGallery: refreshGallerySection,
    freezeForAutoScroll,
    revealVisibleInViewport,
  };

  window.addEventListener('wedding:gallery-built', () => {
    if (document.body.classList.contains('intro-complete')) {
      refreshGallerySection();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireEvents);
  } else {
    wireEvents();
  }
})();

import { parseInviteFromLocation } from './invite-config.js';

window.__weddingEnvelopeModuleLoaded = true;

const INTRO_STORAGE_KEY = 'wedding_envelope_opened_v1';
const AUTO_OPEN_DELAY_MS = 15000;
const INTRO_SAFETY_TIMEOUT_MS = 22000;
/** Sau khi mở thiệp xong, chờ bao lâu rồi mới tự cuộn (ms) */
const IDLE_AUTO_SCROLL_DELAY_MS = 5000;

const PETAL_COLORS = [
  '#f5d0dc', '#e8a0b4', '#d44a66', '#c13a56', '#a82f48',
  '#ffb3c6', '#ff8fab', '#d8899f'
];

const HEART_PINKS = [
  '#ffc2d4', '#ff9ebb', '#f783a7', '#e85a8a', '#f5b8cc',
  '#ffb3c6', '#ff8fab', '#fce4ec'
];

const HEART_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

function initIntroHearts(layer) {
  if (!layer) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  layer.innerHTML = '';
  const count = 22 + Math.floor(Math.random() * 10);

  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.className = 'intro-heart';
    heart.innerHTML = HEART_SVG;

    const size = 10 + Math.random() * 22;
    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;
    heart.style.color = HEART_PINKS[Math.floor(Math.random() * HEART_PINKS.length)];

    // Vị trí ngẫu nhiên toàn màn (chỉ chừa mép an toàn)
    const padX = 4 + Math.random() * 4;
    const padY = 6 + Math.random() * 6;
    heart.style.left = `${padX + Math.random() * (100 - padX * 2)}%`;
    heart.style.top = `${padY + Math.random() * (100 - padY * 2)}%`;
    heart.style.setProperty('--delay', `${Math.random() * 2.2}s`);
    heart.style.setProperty('--dur', `${2.2 + Math.random() * 1.8}s`);
    heart.style.setProperty('--max-scale', `${0.85 + Math.random() * 0.45}`);

    layer.appendChild(heart);
  }
}

function getIntroMode() {
  const mode = window.WEDDING_ENVELOPE_MODE;
  if (mode === 'every-load' || mode === 'session' || mode === 'once') return mode;
  return 'every-load';
}

function shouldSkipIntro() {
  if (getIntroMode() === 'every-load') return false;
  try {
    if (getIntroMode() === 'session') {
      return sessionStorage.getItem(INTRO_STORAGE_KEY) === '1';
    }
    return localStorage.getItem(INTRO_STORAGE_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function markIntroDone() {
  if (getIntroMode() === 'every-load') return;
  try {
    if (getIntroMode() === 'session') {
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } else {
      localStorage.setItem(INTRO_STORAGE_KEY, '1');
    }
  } catch (_) { /* ignore */ }
}

function createPetalEl(color) {
  const el = document.createElement('div');
  el.className = 'envelope-petal';
  const w = 8 + Math.random() * 14;
  const h = w * (1.1 + Math.random() * 0.4);
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.background = `radial-gradient(ellipse at 30% 30%, #fff8, ${color})`;
  el.style.borderRadius = `${w}px ${w * 0.3}px ${w}px ${w * 0.3}px`;
  el.style.left = `${Math.random() * 100}%`;
  el.style.top = `${Math.random() * 100}%`;

  el.style.setProperty('--sx', `${(Math.random() - 0.5) * 80}px`);
  el.style.setProperty('--sy', `${(Math.random() - 0.5) * 60}px`);
  el.style.setProperty('--ex', `${(Math.random() - 0.5) * 280}px`);
  el.style.setProperty('--ey', `${-120 - Math.random() * 200}px`);
  el.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`);
  el.style.setProperty('--scale', `${0.6 + Math.random() * 0.8}`);
  el.style.setProperty('--dur', `${2 + Math.random() * 1.8}s`);
  el.style.setProperty('--delay', `${0.2 + Math.random() * 0.9}s`);
  return el;
}

function spawnFlyingFlowers(layer) {
  if (!layer) return;
  layer.innerHTML = '';
  const count = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 36;
  for (let i = 0; i < count; i++) {
    layer.appendChild(createPetalEl(PETAL_COLORS[i % PETAL_COLORS.length]));
  }
  const intro = document.getElementById('envelope-intro');
  for (let i = 0; i < 12; i++) {
    const sp = document.createElement('div');
    sp.className = 'envelope-sparkle';
    sp.style.left = `${35 + Math.random() * 30}%`;
    sp.style.top = `${38 + Math.random() * 25}%`;
    sp.style.setProperty('--delay', `${0.3 + Math.random() * 0.8}s`);
    intro?.appendChild(sp);
    setTimeout(() => sp.remove(), 2500);
  }
}

function lockIntroScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function startIdleAutoScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.__weddingIdleScrollStarted) return;
  window.__weddingIdleScrollStarted = true;

  let stopped = false;
  let rafId = null;
  let lastFrameTs = 0;
  let scrollPos = 0;
  /** px/giây — cuộn tự động khi khách không tương tác */
  const PX_PER_SEC = 72;

  const removeListeners = () => {
    window.removeEventListener('wheel', onUserIntent);
    window.removeEventListener('touchstart', onUserIntent);
    window.removeEventListener('mousedown', onUserIntent);
    window.removeEventListener('keydown', onUserIntent);
    window.removeEventListener('pointerdown', onUserIntent);
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.__weddingIdleScrollActive = false;
    document.documentElement.classList.remove('wedding-auto-scroll');
    document.body.classList.remove('wedding-idle-scroll');
    removeListeners();
  };

  function onUserIntent() {
    stop();
  }

  const tick = (ts) => {
    if (stopped) return;
    if (!lastFrameTs) lastFrameTs = ts;
    const deltaMs = Math.min(48, Math.max(8, ts - lastFrameTs));
    lastFrameTs = ts;

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    if (scrollPos >= maxScroll - 0.5) {
      window.scrollTo(0, maxScroll);
      stop();
      return;
    }

    const step = (PX_PER_SEC * deltaMs) / 1000;
    scrollPos = Math.min(maxScroll, scrollPos + step);
    window.scrollTo(0, scrollPos);
    rafId = requestAnimationFrame(tick);
  };

  const begin = () => {
    if (stopped) return;
    window.__weddingIdleScrollActive = true;
    document.documentElement.classList.add('wedding-auto-scroll');
    document.body.classList.add('wedding-idle-scroll');
    scrollPos = window.scrollY;
    lastFrameTs = 0;
    rafId = requestAnimationFrame(tick);
  };

  window.addEventListener('wheel', onUserIntent, { passive: true });
  window.addEventListener('touchstart', onUserIntent, { passive: true });
  window.addEventListener('mousedown', onUserIntent);
  window.addEventListener('pointerdown', onUserIntent);
  window.addEventListener('keydown', onUserIntent);

  setTimeout(begin, IDLE_AUTO_SCROLL_DELAY_MS);
}

function unlockPageInteraction() {
  document.documentElement.classList.remove('intro-active');
  document.body.classList.remove('intro-active', 'intro-revealing');
  document.body.classList.add('intro-complete');
  document.getElementById('wedding-envelope-boot')?.remove();
  const canvas = document.getElementById('app-canvas');
  if (canvas) {
    canvas.style.pointerEvents = '';
    canvas.style.opacity = '';
  }
}

function shouldSkipEnvelopeIntro() {
  if (typeof window.__weddingShouldSkipEnvelope === 'function') {
    return window.__weddingShouldSkipEnvelope();
  }
  if (shouldSkipIntro()) return true;
  try {
    return Boolean(parseInviteFromLocation(window.location).guestName);
  } catch {
    const params = new URLSearchParams(window.location.search);
    if (params.get('to') || params.get('guest')) return true;
    return /\/(0|1|9)\/[^/?#]+/.test(window.location.pathname);
  }
}

function scheduleWhenVisible(run) {
  if (document.visibilityState === 'visible') {
    run();
    return () => {};
  }
  const onVis = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onVis);
    run();
  };
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}

function finishIntro(intro) {
  intro.classList.add('is-complete');
  lockIntroScroll();
  unlockPageInteraction();
  markIntroDone();
  requestAnimationFrame(() => {
    lockIntroScroll();
    setTimeout(lockIntroScroll, 50);
  });
  setTimeout(() => {
    intro.remove();
    window.dispatchEvent(new Event('wedding:intro-complete'));
    startIdleAutoScroll();
  }, 700);
}

function startRevealTransition(intro) {
  lockIntroScroll();
  intro.classList.add('is-revealing');
  document.body.classList.add('intro-revealing');
  window.dispatchEvent(new Event('wedding:intro-revealing'));
}

function initEnvelopeIntro() {
  const intro = document.getElementById('envelope-intro');
  if (!intro || intro.dataset.bound) return;
  intro.dataset.bound = '1';

  if (shouldSkipEnvelopeIntro()) {
    intro.remove();
    document.documentElement.classList.remove('intro-active');
    unlockPageInteraction();
    lockIntroScroll();
    setTimeout(() => {
      window.dispatchEvent(new Event('wedding:first-open'));
      window.dispatchEvent(new Event('wedding:intro-complete'));
      startIdleAutoScroll();
    }, 100);
    return;
  }

  document.documentElement.classList.add('intro-active');
  document.body.classList.add('intro-active');
  lockIntroScroll();
  initIntroHearts(document.getElementById('intro-hearts-layer'));

  const wrap = document.getElementById('envelope-wrap');
  const scene = intro.querySelector('.envelope-scene');
  let opened = false;
  let lastOpenAt = 0;

  const openEnvelope = (e) => {
    if (e) {
      if (e.type === 'touchend') e.preventDefault();
      if (typeof e.button === 'number' && e.button !== 0) return;
    }
    const now = Date.now();
    if (opened || now - lastOpenAt < 400) return;
    lastOpenAt = now;
    opened = true;

    intro.classList.add('is-opening');
    spawnFlyingFlowers(document.getElementById('envelope-petal-layer'));
    window.dispatchEvent(new CustomEvent('wedding:first-open'));

    // Thiệp tản → crossfade → gỡ lớp intro (tránh giật một nhịp)
    setTimeout(() => startRevealTransition(intro), 850);
    setTimeout(() => finishIntro(intro), 2200);
  };

  const bind = (el) => {
    if (!el) return;
    el.addEventListener('click', openEnvelope);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEnvelope(e);
      }
    });
  };

  bind(intro);
  bind(scene);
  bind(wrap);

  if (wrap) {
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', 'Mở phong thiệp cưới');
  }

  intro.style.cursor = 'pointer';
  intro.setAttribute('role', 'button');
  intro.setAttribute('aria-label', 'Chạm để mở thiệp cưới');

  let autoOpenTimer = null;
  const clearAutoOpen = scheduleWhenVisible(() => {
    autoOpenTimer = window.setTimeout(() => {
      if (!intro.isConnected || opened) return;
      openEnvelope();
    }, AUTO_OPEN_DELAY_MS);
  });

  window.setTimeout(() => {
    if (!intro.isConnected) return;
    if (document.body.classList.contains('intro-active') && !opened) {
      openEnvelope();
    }
  }, INTRO_SAFETY_TIMEOUT_MS);

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted || !intro.isConnected || opened) return;
    if (autoOpenTimer) window.clearTimeout(autoOpenTimer);
    clearAutoOpen();
    scheduleWhenVisible(() => {
      autoOpenTimer = window.setTimeout(() => {
        if (!intro.isConnected || opened) return;
        openEnvelope();
      }, AUTO_OPEN_DELAY_MS);
    });
  });
}

window.startIdleAutoScroll = startIdleAutoScroll;
window.weddingForceUnlockPage = unlockPageInteraction;

document.addEventListener('DOMContentLoaded', initEnvelopeIntro);

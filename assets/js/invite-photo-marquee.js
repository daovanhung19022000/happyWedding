import { staticAlbumUrls, fetchUploadedAlbumUrls } from './album-store.js';

const MARQUEE_BASE = 'kimono_image/';
const UPLOAD_WAIT_MS = 2500;

function createMarqueeItem(src, index) {
  const fig = document.createElement('figure');
  fig.className = 'invite-photo-marquee__item';
  const frame = document.createElement('div');
  frame.className = 'invite-photo-marquee__frame';
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Ảnh cưới Văn Hùng và Thu Trang';
  img.loading = index < 6 ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.draggable = false;
  frame.appendChild(img);
  fig.appendChild(frame);
  return fig;
}

function waitForMarqueeImages(track) {
  return new Promise((resolve) => {
    const imgs = [...track.querySelectorAll('img')];
    let pending = imgs.filter((img) => !img.complete).length;
    if (!pending) {
      resolve();
      return;
    }
    const done = () => {
      pending -= 1;
      if (pending <= 0) resolve();
    };
    imgs.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
    window.setTimeout(resolve, 4500);
  });
}

async function resolveMarqueeUrls() {
  let urls = staticAlbumUrls(MARQUEE_BASE);
  try {
    const uploaded = await Promise.race([
      fetchUploadedAlbumUrls(),
      new Promise((resolve) => setTimeout(() => resolve([]), UPLOAD_WAIT_MS)),
    ]);
    if (uploaded.length) {
      const seen = new Set(urls);
      uploaded.forEach((url) => {
        if (url && !seen.has(url)) {
          seen.add(url);
          urls.push(url);
        }
      });
    }
  } catch {
    /* giữ ảnh static trong repo */
  }
  return urls;
}

function wireInvitePhotoMarqueeInteraction(root, viewport, track) {
  let rafId = 0;
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startOffset = 0;
  let touchActive = false;
  let resumeAutoTimer = null;
  let offsetPx = 0;
  let segmentHalf = 0;

  const speed = 0.42;

  const isUserBlockingAuto = () => dragging || touchActive;

  const applyTransform = () => {
    track.style.transform = `translate3d(${-offsetPx}px, 0, 0)`;
  };

  const normalizeOffset = () => {
    if (segmentHalf <= 0) return;
    while (offsetPx >= segmentHalf) offsetPx -= segmentHalf;
    while (offsetPx < 0) offsetPx += segmentHalf;
    applyTransform();
  };

  const measure = () => {
    segmentHalf = track.offsetWidth / 2;
    normalizeOffset();
  };

  const scheduleAutoResume = (delayMs = 550) => {
    clearTimeout(resumeAutoTimer);
    resumeAutoTimer = setTimeout(() => {
      touchActive = false;
    }, delayMs);
  };

  const tick = () => {
    if (!isUserBlockingAuto() && segmentHalf > 0) {
      offsetPx += speed;
      normalizeOffset();
    }
    rafId = requestAnimationFrame(tick);
  };

  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => measure())
      : null;
  if (resizeObserver) resizeObserver.observe(track);
  else window.addEventListener('resize', measure);

  viewport.addEventListener(
    'touchstart',
    () => {
      touchActive = true;
      clearTimeout(resumeAutoTimer);
    },
    { passive: true },
  );

  viewport.addEventListener('touchend', () => scheduleAutoResume(700), { passive: true });
  viewport.addEventListener('touchcancel', () => scheduleAutoResume(400), { passive: true });

  viewport.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startOffset = offsetPx;
      root.classList.add('is-dragging');
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        /* bỏ qua */
      }
    },
    { passive: true },
  );

  viewport.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      offsetPx = startOffset - (e.clientX - startX);
      normalizeOffset();
    },
    { passive: true },
  );

  const endDrag = (e) => {
    if (!dragging || (e.pointerId !== pointerId && e.type !== 'pointercancel')) return;
    dragging = false;
    pointerId = null;
    root.classList.remove('is-dragging');
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      /* bỏ qua */
    }
  };

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', () => {
    dragging = false;
    pointerId = null;
    root.classList.remove('is-dragging');
  });

  measure();
  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    clearTimeout(resumeAutoTimer);
    resizeObserver?.disconnect();
  };
}

/** Cuộn ngang — tự chạy + vuốt/kéo (album static + Firebase). */
export async function buildInvitePhotoMarquee(root) {
  if (!root) return;
  const viewport = root.querySelector('.invite-photo-marquee__viewport');
  const track = root.querySelector('.invite-photo-marquee__track');
  if (!viewport || !track) return;

  const urls = await resolveMarqueeUrls();
  if (!urls.length) return;

  track.replaceChildren();
  const appendPass = (offset) => {
    urls.forEach((src, index) => {
      track.appendChild(createMarqueeItem(src, offset + index));
    });
  };
  appendPass(0);
  appendPass(urls.length);

  await waitForMarqueeImages(track);
  requestAnimationFrame(() => {
    root.classList.add('is-ready');
    wireInvitePhotoMarqueeInteraction(root, viewport, track);
  });
}

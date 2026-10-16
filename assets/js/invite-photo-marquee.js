import { loadAllAlbumImageUrls } from './album-store.js';

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

function loopScroll(viewport, track) {
  const half = track.scrollWidth / 2;
  if (half <= 0) return;
  if (viewport.scrollLeft >= half) {
    viewport.scrollLeft -= half;
  } else if (viewport.scrollLeft < 0) {
    viewport.scrollLeft += half;
  }
}

function wireInvitePhotoMarqueeInteraction(root, viewport, track) {
  let rafId = 0;
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startScroll = 0;
  let touchActive = false;
  let resumeAutoTimer = null;

  const speed = 0.42;

  const isUserBlockingAuto = () => dragging || touchActive;

  const scheduleAutoResume = (delayMs = 550) => {
    clearTimeout(resumeAutoTimer);
    resumeAutoTimer = setTimeout(() => {
      touchActive = false;
    }, delayMs);
  };

  const tick = () => {
    if (!isUserBlockingAuto()) {
      viewport.scrollLeft += speed;
      loopScroll(viewport, track);
    }
    rafId = requestAnimationFrame(tick);
  };

  viewport.addEventListener(
    'scroll',
    () => {
      loopScroll(viewport, track);
    },
    { passive: true },
  );

  viewport.addEventListener(
    'touchstart',
    () => {
      touchActive = true;
      clearTimeout(resumeAutoTimer);
    },
    { passive: true },
  );

  viewport.addEventListener(
    'touchend',
    () => {
      scheduleAutoResume(700);
    },
    { passive: true },
  );

  viewport.addEventListener(
    'touchcancel',
    () => {
      scheduleAutoResume(400);
    },
    { passive: true },
  );

  viewport.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
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
      viewport.scrollLeft = startScroll - (e.clientX - startX);
      loopScroll(viewport, track);
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

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    clearTimeout(resumeAutoTimer);
  };
}

/** Cuộn ngang — tự chạy + vuốt/kéo (album static + Firebase). */
export async function buildInvitePhotoMarquee(root) {
  if (!root) return;
  const viewport = root.querySelector('.invite-photo-marquee__viewport');
  const track = root.querySelector('.invite-photo-marquee__track');
  if (!viewport || !track) return;

  let urls = [];
  try {
    urls = await loadAllAlbumImageUrls('kimono_image/');
  } catch {
    urls = [];
  }
  if (!urls.length) return;

  track.replaceChildren();
  const appendPass = (offset) => {
    urls.forEach((src, index) => {
      track.appendChild(createMarqueeItem(src, offset + index));
    });
  };
  appendPass(0);
  appendPass(urls.length);

  root.classList.add('is-ready');
  wireInvitePhotoMarqueeInteraction(root, viewport, track);
}

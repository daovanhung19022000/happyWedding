/**
 * Lightbox xem ảnh — prev/next + đếm (vd. 5 / 50).
 */
export function bindGalleryLightbox(
  root,
  {
    modal = document.getElementById('lightbox-modal'),
    imageEl = document.getElementById('lightbox-img'),
    closeBtn = document.getElementById('lightbox-close'),
    prevBtn = document.getElementById('lightbox-prev'),
    nextBtn = document.getElementById('lightbox-next'),
    counterEl = document.getElementById('lightbox-counter'),
    imageSelector = 'img',
  } = {},
) {
  if (!root || !modal || !imageEl) return;

  let slides = [];
  let index = 0;

  const collectSlides = () => {
    slides = [...root.querySelectorAll(imageSelector)].filter((img) => img.src);
  };

  const updateChrome = () => {
    const total = slides.length;
    const single = total <= 1;
    if (counterEl) {
      counterEl.hidden = single;
      counterEl.textContent = single ? '' : `${index + 1} / ${total}`;
    }
    if (prevBtn) {
      prevBtn.hidden = single;
      prevBtn.disabled = index <= 0;
    }
    if (nextBtn) {
      nextBtn.hidden = single;
      nextBtn.disabled = index >= total - 1;
    }
  };

  const showAt = (nextIndex) => {
    if (!slides.length) return;
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    const img = slides[index];
    imageEl.src = img.currentSrc || img.src;
    imageEl.alt = img.alt || 'Ảnh phóng to';
    updateChrome();
  };

  const openWith = (img) => {
    collectSlides();
    if (!slides.length) return;
    const hit = slides.indexOf(img);
    index = hit >= 0 ? hit : 0;
    showAt(index);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
  };

  const close = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    imageEl.removeAttribute('src');
  };

  const step = (delta) => {
    if (!slides.length) return;
    showAt(index + delta);
  };

  root.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const img = e.target.closest(imageSelector);
    if (!img || !root.contains(img)) return;
    e.preventDefault();
    openWith(img);
  });

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    step(-1);
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    step(1);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  if (!modal.dataset.lightboxKeysBound) {
    modal.dataset.lightboxKeysBound = '1';
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }
}

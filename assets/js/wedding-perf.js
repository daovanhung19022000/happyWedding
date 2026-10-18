/** Tiện ích nhẹ — giảm tải GPU/CPU trên điện thoại */
(function () {
  'use strict';

  function isCoarseMobile() {
    return (
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
    );
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Thiết bị yếu / mobile — giảm animation & vòng lặp liên tục */
  function isLiteDevice() {
    return prefersReducedMotion() || isCoarseMobile();
  }

  window.WeddingPerf = {
    isCoarseMobile,
    prefersReducedMotion,
    isLiteDevice,
  };
})();

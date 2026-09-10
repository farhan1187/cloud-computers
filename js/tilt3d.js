/**
 * CLOUD COMPUTERS - 3D Card Tilt & Holographic Specular Reflection Engine
 * Adds smooth 3D perspective mouse tilting and lighting glares to interactive cards.
 */

(function () {
  'use strict';

  function initTilt3D() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReduced) return;

    const cards = document.querySelectorAll('.tilt-card');
    const MAX_TILT = 10; // degrees

    cards.forEach((card) => {
      let bounds = null;
      let isHovered = false;

      const onMouseEnter = () => {
        bounds = card.getBoundingClientRect();
        isHovered = true;
        card.style.transition = 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)';
      };

      const onMouseMove = (e) => {
        if (!bounds) bounds = card.getBoundingClientRect();

        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        // Normalized between -1 and 1
        const normX = (x / bounds.width) * 2 - 1;
        const normY = (y / bounds.height) * 2 - 1;

        const tiltX = -normY * MAX_TILT;
        const tiltY = normX * MAX_TILT;

        // Dynamic light glare percentage
        const glareX = (x / bounds.width) * 100;
        const glareY = (y / bounds.height) * 100;

        card.style.setProperty('--glare-x', `${glareX}%`);
        card.style.setProperty('--glare-y', `${glareY}%`);
        card.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)`;
      };

      const onMouseLeave = () => {
        isHovered = false;
        bounds = null;
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      };

      card.addEventListener('mouseenter', onMouseEnter);
      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTilt3D);
  } else {
    initTilt3D();
  }
})();

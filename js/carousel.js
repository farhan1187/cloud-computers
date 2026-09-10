/**
 * CLOUD COMPUTERS - Product Carousel Controller
 * Touch/drag/swipe with momentum easing, auto-scroll, active card scaling
 */

document.addEventListener('DOMContentLoaded', () => {
  const viewport = document.querySelector('.carousel-viewport');
  const track = document.querySelector('.carousel-track');
  const cards = document.querySelectorAll('.product-card');
  const btnPrev = document.querySelector('.carousel-btn-prev');
  const btnNext = document.querySelector('.carousel-btn-next');
  const dots = document.querySelectorAll('.carousel-dot');

  if (!viewport || !track || cards.length === 0) return;

  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID = null;
  let autoScrollTimer = null;
  let isHovered = false;

  const cardWidth = () => cards[0].offsetWidth + 24; // width + gap
  const maxIndex = cards.length - 1;

  // Set position to index
  function setPositionByIndex(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    currentTranslate = -currentIndex * cardWidth();
    prevTranslate = currentTranslate;
    track.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
    track.style.transform = `translateX(${currentTranslate}px)`;
    updateActiveStates();
  }

  function updateActiveStates() {
    cards.forEach((card, i) => {
      card.classList.toggle('active-card', i === currentIndex);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  // Next / Prev button triggers
  function nextSlide() {
    if (currentIndex >= maxIndex) {
      setPositionByIndex(0);
    } else {
      setPositionByIndex(currentIndex + 1);
    }
  }

  function prevSlide() {
    if (currentIndex <= 0) {
      setPositionByIndex(maxIndex);
    } else {
      setPositionByIndex(currentIndex - 1);
    }
  }

  if (btnNext) btnNext.addEventListener('click', nextSlide);
  if (btnPrev) btnPrev.addEventListener('click', prevSlide);

  // Dots click
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => setPositionByIndex(i));
  });

  // Touch & Mouse Drag handlers
  function touchStart(e) {
    isDragging = true;
    startX = getPositionX(e);
    track.style.transition = 'none';
    stopAutoScroll();
    animationID = requestAnimationFrame(animation);
  }

  function touchMove(e) {
    if (!isDragging) return;
    const currentX = getPositionX(e);
    const diff = currentX - startX;
    currentTranslate = prevTranslate + diff;
  }

  function touchEnd() {
    isDragging = false;
    cancelAnimationFrame(animationID);

    const movedBy = currentTranslate - prevTranslate;

    // Swipe threshold
    if (movedBy < -50 && currentIndex < maxIndex) {
      currentIndex += 1;
    } else if (movedBy > 50 && currentIndex > 0) {
      currentIndex -= 1;
    }

    setPositionByIndex(currentIndex);
    if (!isHovered) startAutoScroll();
  }

  function getPositionX(e) {
    return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  }

  function animation() {
    track.style.transform = `translateX(${currentTranslate}px)`;
    if (isDragging) requestAnimationFrame(animation);
  }

  // Attach event listeners
  viewport.addEventListener('mousedown', touchStart);
  window.addEventListener('mousemove', touchMove);
  window.addEventListener('mouseup', touchEnd);

  viewport.addEventListener('touchstart', touchStart, { passive: true });
  viewport.addEventListener('touchmove', touchMove, { passive: true });
  viewport.addEventListener('touchend', touchEnd);

  // Auto-scroll when idle
  function startAutoScroll() {
    stopAutoScroll();
    autoScrollTimer = setInterval(() => {
      if (!isDragging && !isHovered) {
        nextSlide();
      }
    }, 3800);
  }

  function stopAutoScroll() {
    if (autoScrollTimer) clearInterval(autoScrollTimer);
  }

  viewport.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAutoScroll();
  });

  viewport.addEventListener('mouseleave', () => {
    isHovered = false;
    startAutoScroll();
  });

  // Init
  setPositionByIndex(0);
  startAutoScroll();
});

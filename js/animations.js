/**
 * CLOUD COMPUTERS - GSAP & ScrollTrigger Animation Controller
 * Living scroll animations, progress indicator, and section reveals
 */

document.addEventListener('DOMContentLoaded', () => {
  // Query params for testing / deep-linking
  const urlParams = new URLSearchParams(window.location.search);
  const targetSection = urlParams.get('section');
  const isInstant = urlParams.get('instant') === 'true' || urlParams.get('instant') === '1' || Boolean(targetSection);

  // 0. Real-Time Scroll Progress Indicator
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    const updateProgress = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(Math.max(scrollY / docHeight, 0), 1);
        progressBar.style.transform = `scaleX(${progress})`;
      }
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // Ensure GSAP and ScrollTrigger exist
  if (typeof gsap === 'undefined') {
    console.warn('GSAP is not loaded. Fallback CSS transitions will be active.');
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Check reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || isInstant;

  /* --------------------------------------------------------------------------
     1. Hero Section Animations
     -------------------------------------------------------------------------- */
  const heroContent = document.querySelector('.hero-content');
  const heroVisual = document.querySelector('.hero-visual-container');
  const heroGraphic = document.querySelector('.hero-graphic-wrapper');

  if (heroContent) {
    if (prefersReduced) {
      gsap.set(heroContent.children, { y: 0, opacity: 1 });
    } else {
      gsap.fromTo(heroContent.children,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power2.out', delay: 0.05 }
      );
    }
  }

  if (heroVisual) {
    if (prefersReduced) {
      gsap.set(heroVisual, { scale: 1, opacity: 1 });
    } else {
      gsap.fromTo(heroVisual,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out', delay: 0.1 }
      );
    }
  }

  // Hero Mouse Parallax Tilt (3D Effect)
  if (heroVisual && heroGraphic && !prefersReduced) {
    const handleMouseMove = (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle tilt angles (max ~8 degrees)
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      gsap.to(heroGraphic, {
        rotateX: rotateX,
        rotateY: rotateY,
        duration: 0.4,
        ease: 'power1.out',
        transformPerspective: 1000
      });
    };

    const handleMouseLeave = () => {
      gsap.to(heroGraphic, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    };

    heroVisual.addEventListener('mousemove', handleMouseMove);
    heroVisual.addEventListener('mouseleave', handleMouseLeave);
  }

  /* --------------------------------------------------------------------------
     2. Service Cards Scroll Reveal (Stagger ~100ms)
     -------------------------------------------------------------------------- */
  const serviceCards = document.querySelectorAll('.services-grid .tilt-card, .service-card');
  if (serviceCards.length > 0 && typeof ScrollTrigger !== 'undefined') {
    if (prefersReduced) {
      gsap.set(serviceCards, { y: 0, opacity: 1, scale: 1 });
    } else {
      gsap.fromTo(serviceCards,
        { y: 35, opacity: 0, scale: 0.96 },
        {
          scrollTrigger: {
            trigger: '.services-grid',
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power2.out'
        }
      );
    }
  }

  /* --------------------------------------------------------------------------
     2.5 Working Process S-Curve Journey Flow Animation
     -------------------------------------------------------------------------- */
  const journeyCards = document.querySelectorAll('.journey-step-card');
  const journeySection = document.getElementById('process');
  
  if (journeySection && typeof gsap !== 'undefined' && !prefersReduced) {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: journeySection,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.fromTo(journeyCards, 
            { opacity: 0, scale: 0.94 },
            { opacity: 1, scale: 1, duration: 0.65, stagger: 0.12, ease: 'power2.out' }
          );
          const pathEl = document.querySelector('.journey-track-path');
          if (pathEl) {
            const totalLen = Math.ceil(pathEl.getTotalLength ? pathEl.getTotalLength() : 3500) + 100;
            gsap.fromTo(pathEl, 
              { strokeDasharray: totalLen, strokeDashoffset: totalLen },
              { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut' }
            );
          }
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     3. Stats Section Count-Up Animation
     -------------------------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length > 0 && typeof ScrollTrigger !== 'undefined') {
    const runStatsCount = () => {
      statNumbers.forEach((stat) => {
        const targetValue = parseInt(stat.getAttribute('data-target'), 10);
        const suffix = stat.getAttribute('data-suffix') || '';
        
        if (isNaN(targetValue)) return;

        if (prefersReduced) {
          stat.textContent = targetValue + suffix;
          return;
        }

        const counterObj = { val: 0 };
        gsap.to(counterObj, {
          val: targetValue,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            stat.textContent = Math.floor(counterObj.val) + suffix;
          }
        });
      });
    };

    ScrollTrigger.create({
      trigger: '.about-stats-grid, .stats-cards-row',
      start: 'top 90%',
      once: true,
      onEnter: runStatsCount
    });

    if (isInstant) runStatsCount();
  }

  /* --------------------------------------------------------------------------
     4. Product Carousel Cards Scroll Reveal
     -------------------------------------------------------------------------- */
  const productCards = document.querySelectorAll('.product-card');
  if (productCards.length > 0 && typeof ScrollTrigger !== 'undefined' && !prefersReduced) {
    gsap.fromTo(productCards,
      { y: 30, opacity: 0, scale: 0.96 },
      {
        scrollTrigger: {
          trigger: '.products-section',
          start: 'top 85%',
          once: true
        },
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.09,
        ease: 'power2.out'
      }
    );
  }

  /* --------------------------------------------------------------------------
     5. General Section Headers Reveal
     -------------------------------------------------------------------------- */
  const allHeaders = document.querySelectorAll('.section-header, .process-header-simple, .network-info');
  allHeaders.forEach((header) => {
    if (typeof ScrollTrigger !== 'undefined') {
      if (prefersReduced) {
        gsap.set(header, { y: 0, opacity: 1 });
      } else {
        gsap.fromTo(header,
          { y: 25, opacity: 0 },
          {
            scrollTrigger: {
              trigger: header,
              start: 'top 90%',
              once: true
            },
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out'
          }
        );
      }
    }
  });

  /* --------------------------------------------------------------------------
     6. CTA Banner Scroll Scale Reveal
     -------------------------------------------------------------------------- */
  const ctaBanner = document.querySelector('.cta-banner');
  if (ctaBanner && typeof ScrollTrigger !== 'undefined' && !prefersReduced) {
    gsap.fromTo(ctaBanner,
      { y: 30, opacity: 0, scale: 0.96 },
      {
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 90%',
          once: true
        },
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out'
      }
    );
  }

  /* --------------------------------------------------------------------------
     7. Brand Logos Fade-In Stagger
     -------------------------------------------------------------------------- */
  const brandLogos = document.querySelectorAll('.brand-item');
  if (brandLogos.length > 0 && typeof ScrollTrigger !== 'undefined') {
    if (prefersReduced) {
      gsap.set(brandLogos, { y: 0, opacity: 0.85 });
    } else {
      gsap.fromTo(brandLogos,
        { y: 15, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.brands-marquee-wrap, .brands-row',
            start: 'top 92%',
            once: true
          },
          y: 0,
          opacity: 0.85,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power2.out'
        }
      );
    }
  }

  /* --------------------------------------------------------------------------
     8. Button Ripple & Interaction Setup
     -------------------------------------------------------------------------- */
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach((button) => {
    button.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple-wave');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  /* --------------------------------------------------------------------------
     9. Deep Linking & Section Scrolling
     -------------------------------------------------------------------------- */
  if (targetSection) {
    const el = document.getElementById(targetSection);
    if (el) {
      const top = el.offsetTop - 70;
      document.documentElement.scrollTop = top;
      document.body.scrollTop = top;
      window.scrollTo(0, top);
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }
  }
});

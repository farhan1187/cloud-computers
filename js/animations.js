/**
 * CLOUD COMPUTERS - GSAP & ScrollTrigger Animation Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Query params for testing / deep-linking
  const urlParams = new URLSearchParams(window.location.search);
  const targetSection = urlParams.get('section');
  const isInstant = urlParams.get('instant') === 'true' || urlParams.get('instant') === '1' || Boolean(targetSection);

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
      gsap.set(serviceCards, { y: 0, opacity: 1 });
    } else {
      gsap.fromTo(serviceCards,
        { y: 35, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.services-grid',
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true
          },
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power2.out'
        }
      );
    }
  }

  /* --------------------------------------------------------------------------
     2.5 Working Process Cinematic Scroll & Step Controller
     -------------------------------------------------------------------------- */
  const processSteps = document.querySelectorAll('.process-step-item');
  const processGlow = document.getElementById('process-timeline-progress');
  const holoPhaseName = document.getElementById('holo-phase-name');
  const holoPanels = document.querySelectorAll('.holo-panel');

  const phaseTitles = {
    1: 'PHASE 01: CONSULTATION & BLUEPRINT',
    2: 'PHASE 02: DEWA • SEWA • RTA • SIRA APPROVALS',
    3: 'PHASE 03: SITE EXECUTION & RACK DEPLOYMENT',
    4: 'PHASE 04: FLUKE TESTING & SYSTEM HANDOVER',
    5: 'PHASE 05: 24/7/365 NOC SUPPORT & RAPID DISPATCH',
    6: 'PHASE 06: ANNUAL MAINTENANCE CONTRACTS (AMC)'
  };

  let currentStep = 1;

  function setProcessStep(stepNum) {
    if (stepNum < 1 || stepNum > 6) return;
    currentStep = stepNum;

    // Update active classes on step list items
    processSteps.forEach(step => {
      const s = parseInt(step.getAttribute('data-step'), 10);
      if (s === stepNum) {
        step.classList.add('active');
        step.setAttribute('aria-selected', 'true');
      } else {
        step.classList.remove('active');
        step.setAttribute('aria-selected', 'false');
      }
    });

    // Update timeline glow progress line
    if (processGlow) {
      const pct = Math.max(16.66, Math.min(100, ((stepNum - 0.5) / 5.5) * 100));
      processGlow.style.height = `${pct}%`;
    }

    // Update HUD phase indicator text
    if (holoPhaseName && phaseTitles[stepNum]) {
      holoPhaseName.textContent = phaseTitles[stepNum];
    }

    // Update HUD Panels
    holoPanels.forEach(panel => {
      const p = parseInt(panel.getAttribute('data-panel'), 10);
      if (p === stepNum) {
        panel.classList.add('active');
        if (!prefersReduced && typeof gsap !== 'undefined') {
          gsap.fromTo(panel, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }
      } else {
        panel.classList.remove('active');
      }
    });
  }

  // Interactive Click & Keyboard selection on step items
  processSteps.forEach(step => {
    const s = parseInt(step.getAttribute('data-step'), 10);
    step.addEventListener('click', () => {
      setProcessStep(s);
    });

    step.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setProcessStep(s);
      }
    });
  });

  // Cinematic Pinned Scroll Scrubbing for Working Process
  const processSection = document.getElementById('process');
  if (processSection && typeof ScrollTrigger !== 'undefined' && !prefersReduced) {
    ScrollTrigger.matchMedia({
      // Desktop / Laptop: Pin the section below navbar so Phase 1 to 6 scrubs smoothly in place
      "(min-width: 992px)": function() {
        const pinST = ScrollTrigger.create({
          trigger: processSection,
          start: 'top 80px',
          end: '+=1400',
          pin: true,
          pinSpacing: true,
          scrub: 0.3,
          anticipatePin: 1,
          onUpdate: (self) => {
            const stepNum = Math.min(6, Math.max(1, Math.floor(self.progress * 6) + 1));
            setProcessStep(stepNum);
          }
        });
        return () => pinST.kill();
      },
      // Mobile / Tablet: standard scroll without pinning, with clean viewport triggers
      "(max-width: 991px)": function() {
        processSteps.forEach((step, idx) => {
          const stepNum = idx + 1;
          ScrollTrigger.create({
            trigger: step,
            start: 'top 70%',
            end: 'bottom 30%',
            onEnter: () => setProcessStep(stepNum),
            onEnterBack: () => setProcessStep(stepNum)
          });
        });
      }
    });
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
      trigger: '.stats-cards-row',
      start: 'top 90%',
      once: true,
      onEnter: runStatsCount
    });

    // If already scrolled into view on load
    if (isInstant) runStatsCount();
  }

  /* --------------------------------------------------------------------------
     4. Brand Logos Fade-In Stagger
     -------------------------------------------------------------------------- */
  const brandLogos = document.querySelectorAll('.brand-item');
  if (brandLogos.length > 0 && typeof ScrollTrigger !== 'undefined') {
    if (prefersReduced) {
      gsap.set(brandLogos, { y: 0, opacity: 0.6 });
    } else {
      gsap.fromTo(brandLogos,
        { y: 15, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.brands-row',
            start: 'top 92%',
            once: true
          },
          y: 0,
          opacity: 0.6,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power2.out'
        }
      );
    }
  }

  /* --------------------------------------------------------------------------
     5. General Section Headers Reveal
     -------------------------------------------------------------------------- */
  const sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach((header) => {
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
     6. Button Ripple & Interaction Setup
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
     7. Deep Linking & Section Scrolling
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

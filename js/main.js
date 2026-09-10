/**
 * CLOUD COMPUTERS - Main Script
 * Navbar behavior, mobile menu, smooth scrolling, active link tracking
 */

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  /* --------------------------------------------------------------------------
     1. Navbar Glassmorphism on Scroll
     -------------------------------------------------------------------------- */
  const handleNavbarScroll = () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // check on load

  /* --------------------------------------------------------------------------
     2. Mobile Menu Toggle
     -------------------------------------------------------------------------- */
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu on link click
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });

    // Close mobile menu on click outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('open');
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. Smooth Scrolling for Anchor Links
     -------------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 80;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

        // Immediately reflect the clicked link as active so there's no
        // flicker/mismatch while the smooth scroll is still animating.
        if (this.classList.contains('nav-link')) {
          navLinks.forEach((link) => link.classList.remove('active'));
          this.classList.add('active');
          suppressObserverUntil = Date.now() + 800; // ignore observer during the scroll animation
        }

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });

  /* --------------------------------------------------------------------------
     4. Active Navigation Link on Scroll (IntersectionObserver-based)
     -------------------------------------------------------------------------- */
  // Tracks which sections are currently intersecting the "active zone" and
  // how much of each is visible, so we always pick the single best match
  // instead of letting whichever section happens to be checked last win.
  let suppressObserverUntil = 0;
  const visibleSections = new Map(); // sectionId -> intersectionRatio

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });
  };

  const navHeightPx = navbar ? navbar.offsetHeight : 80;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      // Ignore observer updates while a click-triggered smooth scroll is
      // still animating, so the clicked link doesn't get overridden mid-flight.
      if (Date.now() < suppressObserverUntil) return;

      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id');
        if (entry.isIntersecting) {
          visibleSections.set(id, entry.intersectionRatio);
        } else {
          visibleSections.delete(id);
        }
      });

      if (visibleSections.size === 0) return;

      // Pick the section with the greatest visible ratio inside the active zone.
      let bestId = null;
      let bestRatio = -1;
      visibleSections.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });

      if (bestId) setActiveLink(bestId);
    },
    {
      // Shrink the observed viewport by the navbar height at the top,
      // and treat a section as "active" once it crosses the middle-ish
      // of the remaining viewport.
      rootMargin: `-${navHeightPx}px 0px -50% 0px`,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  // Handle the very top of the page (e.g. on load / after scrolling to #home)
  // where the hero section may not report a high intersection ratio.
  window.addEventListener(
    'scroll',
    () => {
      if (window.pageYOffset < 10) {
        setActiveLink('home');
      }
    },
    { passive: true }
  );
});
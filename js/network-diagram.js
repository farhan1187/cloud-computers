/**
 * CLOUD COMPUTERS - Interactive Network Topology Diagram
 * SVG Line drawing on scroll, continuous data packet flow, and node interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.network-diagram-container');
  const svgLines = document.querySelectorAll('.network-link-line');
  const packets = document.querySelectorAll('.data-packet');
  const nodes = document.querySelectorAll('.net-node, .node-switch');

  if (!container || svgLines.length === 0) return;

  // 1. Prepare SVG lines for stroke draw-in
  svgLines.forEach((line) => {
    const length = line.getTotalLength ? line.getTotalLength() : 300;
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;
  });

  // 2. Animate line drawing when entering viewport
  let animated = false;

  const triggerLineDrawing = () => {
    if (animated) return;
    animated = true;

    svgLines.forEach((line, idx) => {
      const length = line.getTotalLength ? line.getTotalLength() : 300;
      
      if (typeof gsap !== 'undefined') {
        gsap.to(line, {
          strokeDashoffset: 0,
          duration: 1.4,
          delay: idx * 0.12,
          ease: 'power2.inOut',
          onComplete: () => {
            // Once line is drawn, enable dashed pulse flow
            line.classList.add('path-pulse-flow');
          }
        });
      } else {
        line.style.transition = `stroke-dashoffset 1.4s ease ${idx * 0.12}s`;
        line.style.strokeDashoffset = '0';
        setTimeout(() => {
          line.classList.add('path-pulse-flow');
        }, 1600);
      }
    });

    // Fade in nodes with stagger
    if (typeof gsap !== 'undefined') {
      gsap.from('.net-node', {
        scale: 0.5,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        delay: 0.4
      });
    }
  };

  // Trigger via ScrollTrigger or IntersectionObserver
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '.network-diagram-container',
      start: 'top 80%',
      once: true,
      onEnter: triggerLineDrawing
    });
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerLineDrawing();
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(container);
  }

  // 3. Node Hover Highlights (glow corresponding line)
  nodes.forEach((node) => {
    const targetLineId = node.getAttribute('data-link');
    if (!targetLineId) return;

    const line = document.getElementById(targetLineId);

    node.addEventListener('mouseenter', () => {
      if (line) {
        line.style.stroke = '#00ffff';
        line.style.strokeWidth = '3.5';
        line.style.filter = 'drop-shadow(0 0 12px #00ffff)';
      }
    });

    node.addEventListener('mouseleave', () => {
      if (line) {
        line.style.stroke = '';
        line.style.strokeWidth = '';
        line.style.filter = '';
      }
    });
  });
});

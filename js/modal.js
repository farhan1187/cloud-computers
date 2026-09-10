/**
 * CLOUD COMPUTERS - Quote Modal & Toast Feedback Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('quote-modal');
  const openButtons = document.querySelectorAll('[data-open-modal="quote"]');
  const closeBtn = document.querySelector('.modal-close-btn');
  const form = document.getElementById('quote-form');
  const toast = document.getElementById('quote-toast');
  const toastMessage = document.getElementById('toast-message');

  if (!modalOverlay) return;

  function openModal(preselectedService = '') {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (preselectedService && form) {
      const select = form.querySelector('#service-select');
      if (select) select.value = preselectedService;
    }
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Open triggers
  openButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      openModal(service);
    });
  });

  // Close triggers
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Toast helper
  function showToast(msg) {
    if (!toast) return;
    if (toastMessage) toastMessage.textContent = msg;
    toast.classList.add('active');

    setTimeout(() => {
      toast.classList.remove('active');
    }, 4500);
  }

  // Form submit handler
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Request';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spinSlow 1s linear infinite; width: 16px; height: 16px; stroke: #fff;" viewBox="0 0 24 24" fill="none" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Submitting...
        `;
      }

      const formData = {
        name: document.getElementById('user-name')?.value.trim(),
        email: document.getElementById('user-email')?.value.trim(),
        phone: document.getElementById('user-phone')?.value.trim(),
        service: document.getElementById('service-select')?.value,
        notes: document.getElementById('user-notes')?.value.trim()
      };

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }

        // Dispatch via WhatsApp
        if (typeof dispatchQuoteViaWhatsApp === 'function') {
          dispatchQuoteViaWhatsApp(formData);
        }

        form.reset();
        closeModal();
        showToast('Connecting to WhatsApp... Your request has been compiled for direct dispatch.');
      }, 500);
    });
  }
});

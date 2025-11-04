// Wrap everything to ensure DOM is ready before running
document.addEventListener('DOMContentLoaded', () => {
    // ====== Data (JSON) ======
    const services = [
      {
        id: "painting",
        title: "Painting & Decorating",
        description: "Transform your space with our painting and decorating services.",
        subservices: [
          "Interior painting",
          "Exterior painting",
          "Wallpaper hanging",
          "Detailed trim work"
        ],
        image: "painter.png"
      },
      {
        id: "furniture",
        title: "Furniture Assembly",
        description: "Flat-pack furniture assembly made easy.",
        subservices: [
          "Bed frames",
          "Wardrobes",
          "Tables & chairs",
          "Shelving units"
        ],
        image: "funiture.png"
      },
      {
        id: "plumbing",
        title: "Minor Plumbing",
        description: "Quick fixes to keep things flowing smoothly.",
        subservices: [
          "Fix dripping taps",
          "Replace trap",
          "Install new faucet",
          "Unblock sink"
        ],
        image: "plumber.png"
      },
      {
        id: "electrical",
        title: "Minor Electrical",
        description: "Safe installs and replacements for small jobs.",
        subservices: [
          "Replace light fixtures",
          "Install dimmer switch",
          "Fit new sockets",
          "Test & troubleshoot"
        ],
        image: "electrician.png"
      }
    ];
  
    // ====== Populate service list ======
    const listServices = document.getElementById('servicesList');
    if (listServices) {
      services.forEach(service => {
        const li = document.createElement('li');
        li.className = 'service-item';
        li.innerHTML = `
          <div class="svc-icon"><img src="${service.image}" style="max-width: 90%;"></div>
          <h3 class="svc-title">${service.title}</h3>
          <label class="svc-check" for="chk-${service.id}">
            <input type="checkbox" id="chk-${service.id}" />
          </label>
          <button class="svc-more" data-id="${service.id}" aria-haspopup="dialog">More</button>
        `;
        listServices.appendChild(li);
      });
    }
  
    // ====== Modal elements ======
    const overlay    = document.getElementById('pdOverlay');
    const modal      = document.getElementById('pdModal');
    const closeBtn   = document.getElementById('pdClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc  = document.getElementById('modalDesc');
    const modalSubs  = document.getElementById('modalSubservices');
    const modalImage = document.getElementById('modalImage');
    const modalCta   = document.getElementById('modalCta');
  
    // Track last focused element for accessibility
    let lastFocused = null;
  
    function populateModal(service) {
      modalTitle.textContent = service.title || '';
      modalDesc.textContent  = service.description || '';
      modalImage.src         = service.image || 'pointer.png';
      modalImage.alt         = service.title ? `${service.title} illustration` : 'Service illustration';
  
      // Build subservices checklist
      modalSubs.innerHTML = '';
      if (Array.isArray(service.subservices) && service.subservices.length) {
        service.subservices.forEach((sub, i) => {
          const li = document.createElement('li');
          const id = `sub-${service.id}-${i}`;
          li.innerHTML = `
            <label for="${id}">
              <input type="checkbox" id="${id}" /> ${sub}
            </label>
          `;
          modalSubs.appendChild(li);
        });
      }
    }
  
    function openModal(service) {
      if (!overlay || !modal) return;
  
      // Save focus
      lastFocused = document.activeElement;
  
      // Populate
      populateModal(service);
  
      // Show
      overlay.classList.add('open');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
  
      // Focus modal for ESC/Tab handling
      modal.focus();
  
      // Key handling
      document.addEventListener('keydown', onKeyDown);
    }
  
    function closeModal() {
      if (!overlay || !modal) return;
  
      overlay.classList.remove('open');
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
  
      document.removeEventListener('keydown', onKeyDown);
  
      // Restore focus
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }
  
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
      // Basic focus trap (optional)
      if (e.key === 'Tab' && modal.classList.contains('open')) {
        const focusable = modal.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) {
          const first = focusable[0];
          const last  = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      }
    }
  
    // Wire close buttons/click outside
    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
  
    // CTA example action
    modalCta?.addEventListener('click', () => {
      alert('Thanks! We will contact you shortly.');
      closeModal();
    });
  
    // ====== Open modal on "More" clicks ======
    if (listServices) {
      listServices.addEventListener('click', (e) => {
        const btn = e.target.closest('button.svc-more');
        if (!btn) return;
        const id = btn.dataset.id;
        const svc = services.find(s => s.id === id);
        if (svc) openModal(svc);
      });
    }
  
  // Header hamburger toggle is handled globally in `main.js` to avoid duplicate listeners.
  // If you need page-specific behaviour, add a data attribute and handle it here *without*
  // toggling the core drawer state. Example pattern:
  //
  // 1) Add a modifier on the toggle in HTML: <button class="nav-toggle" data-page-nav="true">...
  // 2) In main.js, read that attribute if you need to apply page-specific styling or analytics,
  //    but keep the `open` class toggle centralized here in main.js.
  //
  // Avoid attaching additional click listeners that also toggle `.nav-links` or `#drawer`.
  });
  
document.addEventListener('DOMContentLoaded', () => {
  const tradesContainer = document.getElementById('tradesButtons');
  const toggleWrapId = 'tradesToggleWrap';
  let toggleBtn = null;
  const overlay = document.getElementById('pdOverlay');
  const modal = document.getElementById('pdModal');
  const closeBtn = document.getElementById('pdClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalSubs = document.getElementById('modalSubservices');
  const modalImage = document.getElementById('modalImage');
  const modalCta = document.getElementById('modalCta');
  const regionSelect = document.getElementById('regionSelect');
  const workDescription = document.getElementById('workDescription');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const photoMessages = document.getElementById('photoMessages');
  const loginWarning = document.getElementById('loginWarning');
  const bookingGuidance = document.getElementById('bookingGuidance');
  let photoDataUrls = [];
  let currentTrade = null; // { id, title }

  let tradesData = [];
  let showAll = false;
  let lastFocused = null;
  const MAX_PHOTOS = 6;
  const MAX_SIZE_MB = 10;

  function fetchTrades() {
    fetch('tradesmen.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load tradesmen.json');
        return r.json();
      })
      .then(data => {
        tradesData = Array.isArray(data) ? data : [];
        ensureToggle();
        renderTrades();
      })
      .catch(err => {
        console.error('Error loading tradesmen:', err);
        if (tradesContainer) {
          tradesContainer.innerHTML = '<p class="error">Unable to load trades list right now.</p>';
        }
      });
  }

  function renderTrades() {
    if (!tradesContainer) return;
    tradesContainer.innerHTML = '';
    const list = showAll ? tradesData : tradesData.filter(t => t.featured);
    list.forEach(trade => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'trade-btn';
      btn.setAttribute('data-id', trade.id);
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.innerHTML = `
        <span class="trade-emoji" aria-hidden="true">${trade.emoji || '🔧'}</span>
        <span class="trade-label">${trade.title}</span>
      `;
      btn.addEventListener('click', () => openModal(trade));
      tradesContainer.appendChild(btn);
    });
    updateToggleButtonState();
  }

  function ensureToggle() {
    if (!tradesContainer) return;
    if (!toggleBtn) {
      let wrap = document.getElementById(toggleWrapId);
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = toggleWrapId;
        wrap.className = 'trades-toggle-wrap';
        tradesContainer.parentElement.appendChild(wrap);
      }
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'trade-toggle-btn';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.addEventListener('click', onToggleClick);
      wrap.appendChild(toggleBtn);
    }
  }

  function onToggleClick() {
    showAll = !showAll;
    renderTrades();
  }

  function updateToggleButtonState() {
    if (!toggleBtn) return;
    const total = tradesData.length;
    const featuredCount = tradesData.filter(t => t.featured).length;
    if (showAll) {
      toggleBtn.textContent = 'Show less';
      toggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      const remaining = total - featuredCount;
      toggleBtn.textContent = remaining > 0 ? `Show more (${remaining})` : 'Show more';
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function isUserLoggedIn() {
    try {
      return !!sessionStorage.getItem('fitouthub_current_user');
    } catch { return false; }
  }

  function populateModal(trade) {
    currentTrade = { id: trade.id, title: trade.title };
    modalTitle.textContent = trade.title || '';
    modalDesc.textContent = trade.description || '';
    modalImage.src = trade.image || 'pointer.png';
    modalImage.alt = trade.title ? trade.title + ' illustration' : 'Trade illustration';
    
    // Show/hide login warning
    const loggedIn = isUserLoggedIn();
    if (loginWarning) {
      loginWarning.style.display = loggedIn ? 'none' : 'block';
    }

    modalSubs.innerHTML = '';
    if (Array.isArray(trade.jobs) && trade.jobs.length) {
      trade.jobs.forEach((job, i) => {
        const li = document.createElement('li');
        const id = `job-${trade.id}-${i}`;
        li.innerHTML = `
          <label for="${id}">
            <input type="checkbox" id="${id}" /> ${job}
          </label>
        `;
        modalSubs.appendChild(li);
      });
    }

    // Reset fields except region (keep user selection)
    workDescription.value = '';
    photoDataUrls = [];
    if (photoPreview) photoPreview.innerHTML = '';
    // Uncheck all jobs by default
    Array.from(modalSubs.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    // Disable CTA until valid and show guidance
    updateCtaDisabled();
    updateBookingGuidance();
  }

  function openModal(trade) {
    if (!modal || !overlay) return;
    lastFocused = document.activeElement;
    populateModal(trade);
    overlay.classList.add('open');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    modal.focus();
    document.addEventListener('keydown', onKeyDown);

    // Listen for changes to enable CTA when valid and update guidance
    modalSubs.addEventListener('change', () => { updateCtaDisabled(); updateBookingGuidance(); });
    regionSelect.addEventListener('change', () => { updateCtaDisabled(); updateBookingGuidance(); });
  }

  function closeModal() {
    if (!modal || !overlay) return;
    overlay.classList.remove('open');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeyDown);
    modalSubs.removeEventListener('change', updateCtaDisabled);
    regionSelect.removeEventListener('change', updateCtaDisabled);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
    if (e.key === 'Tab' && modal.classList.contains('open')) {
      const focusable = modal.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
  }

  function hasAtLeastOneJobSelected() {
    return Array.from(modalSubs.querySelectorAll('input[type="checkbox"]:checked')).length > 0;
  }

  function updateCtaDisabled() {
    const loggedIn = isUserLoggedIn();
    const valid = loggedIn && hasAtLeastOneJobSelected() && !!regionSelect.value;
    if (modalCta) {
      modalCta.disabled = !valid;
      modalCta.setAttribute('aria-disabled', String(!valid));
      modalCta.title = !loggedIn ? 'Please log in first' : (!regionSelect.value || !hasAtLeastOneJobSelected() ? 'Select region and at least one job' : '');
    }
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  // On submit: show summary modal and offer local save
  function updateBookingGuidance() {
    if (!bookingGuidance) return;
    const loggedIn = isUserLoggedIn();
    const hasJobs = hasAtLeastOneJobSelected();
    const hasRegion = !!regionSelect.value;
    
    if (!loggedIn) {
      bookingGuidance.textContent = 'ℹ️ Please log in to book a tradesman';
    } else if (!hasJobs) {
      bookingGuidance.textContent = 'ℹ️ Please select at least one job to continue';
    } else if (!hasRegion) {
      bookingGuidance.textContent = 'ℹ️ Please select your project region';
    } else {
      bookingGuidance.textContent = '';
    }
  }

  modalCta?.addEventListener('click', () => {
    const region = regionSelect.value;
    const selectedJobs = Array.from(modalSubs.querySelectorAll('input[type="checkbox"]:checked')).map(x => x.parentElement.textContent.trim());
    const photos = photoDataUrls.length ? photoDataUrls.slice() : [];
    
    // Get userId from session
    let userId = null;
    try {
      const currentUser = sessionStorage.getItem('fitouthub_current_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        userId = user.id || null;
      }
    } catch (e) {
      console.error('Failed to get user ID:', e);
    }
    
    const payload = {
      trade: modalTitle.textContent.trim(),
      region: region,
      description: workDescription.value.trim() || null,
      jobs: selectedJobs,
      photos,
      userId: userId
    };
    showSummary(payload);
  });

  photoInput?.addEventListener('change', async () => {
    photoDataUrls = [];
    photoPreview.innerHTML = '';
    let files = photoInput.files ? Array.from(photoInput.files) : [];
    // Enforce count limit
    if (files.length > MAX_PHOTOS) {
      files = files.slice(0, MAX_PHOTOS);
      setPhotoMessage(`Only ${MAX_PHOTOS} photos allowed. Extra files were ignored.`);
    } else {
      clearPhotoMessage();
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      // Enforce size limit
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_SIZE_MB) {
        setPhotoMessage(`Photo ${file.name} exceeds ${MAX_SIZE_MB} MB and was skipped.`);
        continue;
      }
      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result;
          photoDataUrls.push(url);
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Uploaded photo preview';
          img.style.maxWidth = '100%';
          img.style.borderRadius = '12px';
          img.style.boxShadow = '0 6px 18px -6px rgba(0,0,0,.3)';
          photoPreview.appendChild(img);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    if (!photoDataUrls.length) {
      setPhotoMessage('No valid photos added.');
    }
  });

  function setPhotoMessage(msg) { if (photoMessages) photoMessages.textContent = msg; }
  function clearPhotoMessage() { if (photoMessages) photoMessages.textContent = ''; }

  // Summary modal elements
  const summaryOverlay = document.getElementById('summaryOverlay');
  const summaryModal = document.getElementById('summaryModal');
  const summaryClose = document.getElementById('summaryClose');
  const summaryBody = document.getElementById('summaryBody');
  const summaryConfirm = document.getElementById('summaryConfirm');
  const summaryCancel = document.getElementById('summaryCancel');
  const userIdInput = document.getElementById('userIdInput');

  function showSummary(data) {
    closeModal();
    summaryBody.innerHTML = renderSummaryHtml(data);
    summaryOverlay.classList.add('open');
    summaryModal.classList.add('open');
    summaryModal.setAttribute('aria-hidden', 'false');
    summaryOverlay.setAttribute('aria-hidden', 'false');
    summaryModal.focus();
  }

  function closeSummary() {
    summaryOverlay.classList.remove('open');
    summaryModal.classList.remove('open');
    summaryModal.setAttribute('aria-hidden', 'true');
    summaryOverlay.setAttribute('aria-hidden', 'true');
  }

  function renderSummaryHtml(d) {
    const photoEl = (Array.isArray(d.photos) && d.photos.length)
      ? `<div class="photo-preview">${d.photos.map(p=>`<img src="${p}" alt="Submitted photo" style="max-width:100%; border-radius:12px;"/>`).join('')}</div>`
      : '<em>No photos provided</em>';
    const jobsEl = (d.jobs && d.jobs.length) ? `<ul>${d.jobs.map(j=>`<li>${j}</li>`).join('')}</ul>` : '<em>No jobs selected</em>';
    return `
      <p><strong>Trade:</strong> ${d.trade || ''}</p>
      <p><strong>Region:</strong> ${d.region || ''}</p>
      <p><strong>Description:</strong><br>${(d.description || '').replace(/</g,'&lt;')}</p>
      <p><strong>Selected jobs:</strong>${jobsEl}</p>
      <div><strong>Photo:</strong><br>${photoEl}</div>
    `;
  }

  summaryClose?.addEventListener('click', closeSummary);
  summaryCancel?.addEventListener('click', closeSummary);
  let lastSubmissionPayload = null;
  function showSummary(data) {
    lastSubmissionPayload = data;
    closeModal();
    summaryBody.innerHTML = renderSummaryHtml(data);
    summaryOverlay.classList.add('open');
    summaryModal.classList.add('open');
    summaryModal.setAttribute('aria-hidden', 'false');
    summaryOverlay.setAttribute('aria-hidden', 'false');
    summaryModal.focus();
  }

  summaryConfirm?.addEventListener('click', async () => {
    const payload = { ...lastSubmissionPayload, userId: (userIdInput?.value || '').trim() || null };
    try {
      // Front-end mock: persist to ProjectsDB so it surfaces in projects-admin
      if (window.ProjectsDB && typeof window.ProjectsDB.add === 'function') {
        const nowIso = new Date().toISOString();
        const id = 'project_' + Math.random().toString(36).slice(2, 10);
        const projectRecord = {
          id,
          projectName: `${payload.trade || 'Project'} • ${payload.region || ''}`.trim(),
          clientName: payload.userId ? `Client ${payload.userId}` : 'Anonymous Client',
          contractorName: '',
          registrationDate: nowIso,
          status: 'pending',
          data: {
            region: payload.region || '',
            budget: '',
            notes: payload.description || '',
            jobs: payload.jobs || [],
            photos: payload.photos || [],
            trade: payload.trade || '',
            userId: payload.userId || null
          }
        };
        window.ProjectsDB.add(projectRecord);
        // Optional: give a quick toast via console and proceed to matches
        console.log('[Projects] Saved to local DB:', projectRecord);
      } else {
        console.warn('ProjectsDB not available; skipping local save.');
      }
      closeSummary();
      showMatchesModal(payload);
    } catch (e) {
      console.error('Save error:', e);
      alert('Could not save locally: ' + e.message);
    }
  });

  function dataURLtoBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1] || 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  fetchTrades();

  // --- Matching Professionals ---
  const matchesOverlay = document.getElementById('matchesOverlay');
  const matchesModal = document.getElementById('matchesModal');
  const matchesClose = document.getElementById('matchesClose');
  const matchesOk = document.getElementById('matchesOk');
  const matchesMoreBtn = document.getElementById('matchesMore');
  const matchesBackBtn = document.getElementById('matchesBack');
  const matchesContactBtn = document.getElementById('matchesContact');
  const matchesList = document.getElementById('matchesList');
  const matchesSummary = document.getElementById('matchesSummary');
  let matchesMode = 'list';
  let currentMatches = [];
  let currentPayload = null;
  let currentDetail = null;

  function regionCodeToLabel(code) {
    switch (code) {
      case 'hong-kong-island': return 'Hong Kong Island';
      case 'kowloon': return 'Kowloon';
      case 'new-territories': return 'New Territories';
      case 'lantau': return 'Lantau Island';
      case 'outlying-islands': return 'Outlying Islands';
      default: return code || '';
    }
  }

  function normalize(str) {
    return (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Map trade titles/ids from tradesmen.json to primary_trade values in professionals DB
  function mapTradeToPrimary(trade) {
    const id = (currentTrade && currentTrade.id) ? currentTrade.id : null;
    const title = trade || (currentTrade ? currentTrade.title : '');
    const lutById = {
      'builder': 'Builder/General Contractor',
      'renovator': 'Renovator',
      'project-manager': 'Project Manager',
      'painting': 'Painting & Decorating',
      'plasterer': 'Plasterer',
      'tiler': 'Tiler',
      'flooring': 'Flooring Specialist',
      'roofer': 'Roofer',
      'landscaper': 'Landscaper',
      'fencer': 'Fencing',
      'window-door': 'Windows & Doors',
      'electrician': 'Electrician',
      'plumber': 'Plumber',
      'hvac': 'HVAC Technician',
      'smart-home': 'Smart Home Installer',
      'carpenter': 'Carpenter',
      'bricklayer': 'Bricklayer',
      'steelworker': 'Steel Worker',
      'insulation': 'Insulation Specialist',
    };
    if (id && lutById[id]) return lutById[id];
    // Fallback: fuzzy match on title
    const titleNorm = normalize(title);
    const candidates = Object.values(lutById);
    const found = candidates.find(c => normalize(c).includes(titleNorm) || titleNorm.includes(normalize(c)));
    return found || title;
  }

  function statusRank(s) {
    const v = String(s || '').toLowerCase();
    if (v === 'approved') return 0;
    if (v === 'pending') return 1;
    if (v === 'rejected') return 2;
    return 3;
  }

  function sortPreferred(list) {
    return list.slice().sort((a, b) => {
      const sr = statusRank(a.status) - statusRank(b.status);
      if (sr !== 0) return sr;
      const ar = (b.rating || 0) - (a.rating || 0);
      if (ar !== 0) return ar;
      return (a.data?.full_name || '').localeCompare(b.data?.full_name || '');
    });
  }

  function findProfessionals(tradeTitle, regionCode) {
    const targetTrade = mapTradeToPrimary(tradeTitle);
    const regionLabel = regionCodeToLabel(regionCode);
    const all = (window.ProfessionalsDB && typeof window.ProfessionalsDB.getAll === 'function')
      ? window.ProfessionalsDB.getAll() : [];
    const base = all
      .filter(p => p && p.type === 'contractor' && p.data && Array.isArray(p.data.service_area))
      .filter(p => normalize(p.data.primary_trade || '') === normalize(targetTrade));
    const regional = base.filter(p => p.data.service_area.includes(regionLabel));
    const candidates = regional.length ? regional : base; // fallback to trade-only
    return { list: sortPreferred(candidates), usedFallback: regional.length === 0 };
  }

  let matchesRenderCount = 0;
  function setMode(mode) {
    matchesMode = mode;
    if (mode === 'list') {
      matchesBackBtn && (matchesBackBtn.style.display = 'none');
      matchesContactBtn && (matchesContactBtn.style.display = 'none');
      matchesMoreBtn && (matchesMoreBtn.style.display = currentMatches.length > matchesRenderCount ? 'inline-block' : 'none');
      matchesOk && (matchesOk.style.display = 'inline-block');
    } else {
      matchesBackBtn && (matchesBackBtn.style.display = 'inline-block');
      matchesContactBtn && (matchesContactBtn.style.display = 'inline-block');
      matchesMoreBtn && (matchesMoreBtn.style.display = 'none');
      matchesOk && (matchesOk.style.display = 'none');
    }
  }

  function renderMatches(list, payload, resetCount = true) {
    matchesList.innerHTML = '';
    const regionLabel = regionCodeToLabel(payload.region);
    matchesSummary.textContent = `Trade: ${mapTradeToPrimary(payload.trade)} • Region: ${regionLabel}`;
    if (!list.length) {
      const li = document.createElement('li');
      li.innerHTML = '<em>No matching professionals found. Try another region or trade.</em>';
      matchesList.appendChild(li);
      setMode('list');
      return;
    }
    if (resetCount) matchesRenderCount = 10;
    const toShow = list.slice(0, matchesRenderCount);
    toShow.forEach(p => {
      const name = p.data.full_name || 'Anonymous Contractor';
      const rating = typeof p.rating === 'number' ? `${p.rating.toFixed(1)}★` : '—';
      const status = p.status || 'pending';
      const li = document.createElement('li');
      li.innerHTML = `<strong>${name}</strong><br><span class=\"small\">${p.data.primary_trade} • ${rating} • ${status}</span> <br>
        <button type=\"button\" class=\"btn btn-outline btn--sm\" data-id=\"${p.id}\">Show details</button>`;
      const btn = li.querySelector('button');
      btn.addEventListener('click', () => openContractorDetail(p));
      matchesList.appendChild(li);
    });
    if (matchesMoreBtn) {
      matchesMoreBtn.style.display = list.length > matchesRenderCount ? 'inline-block' : 'none';
      matchesMoreBtn.onclick = () => {
        matchesRenderCount += 10;
        renderMatches(list, payload, false);
      };
    }
    setMode('list');
  }

  function openMatches() {
    if (!matchesModal || !matchesOverlay) return;
    matchesOverlay.classList.add('open');
    matchesModal.classList.add('open');
    matchesModal.setAttribute('aria-hidden', 'false');
    matchesOverlay.setAttribute('aria-hidden', 'false');
    matchesModal.focus();
  }
  function closeMatches() {
    if (!matchesModal || !matchesOverlay) return;
    matchesOverlay.classList.remove('open');
    matchesModal.classList.remove('open');
    matchesModal.setAttribute('aria-hidden', 'true');
    matchesOverlay.setAttribute('aria-hidden', 'true');
  }
  matchesClose?.addEventListener('click', closeMatches);
  matchesOk?.addEventListener('click', closeMatches);
  matchesOverlay?.addEventListener('click', closeMatches);

  function showMatchesModal(payload) {
    try {
      const { list, usedFallback } = findProfessionals(payload.trade, payload.region);
      currentMatches = list;
      currentPayload = payload;
      renderMatches(currentMatches, currentPayload);
      if (usedFallback) {
        matchesSummary.textContent += ' • No regional matches found — showing all for trade';
      }
      openMatches();
    } catch (e) {
      console.error('Match error:', e);
    }
  }

  function openContractorDetail(p) {
    currentDetail = p;
    const name = p.data.full_name || 'Anonymous Contractor';
    const rating = typeof p.rating === 'number' ? `${p.rating.toFixed(1)}★` : '—';
    const trade = p.data.primary_trade || '';
    const areas = Array.isArray(p.data.service_area) ? p.data.service_area.join(', ') : '';
    matchesSummary.textContent = `${name} • ${trade} • ${rating}`;
    matchesList.innerHTML = `
      <li>
        <div class="card">
          <p><strong>ID:</strong> <code>${p.id}</code></p>
          <p><strong>Status:</strong> ${p.status || 'pending'}</p>
          <p><strong>Business Type:</strong> ${p.businessType || ''}</p>
          <p><strong>Registered:</strong> ${p.registrationDate ? new Date(p.registrationDate).toLocaleString() : ''}</p>
          <p><strong>Service Areas:</strong> ${areas}</p>
          <p><strong>Rating:</strong> ${rating}</p>
          <p><strong>Raw Data:</strong></p>
          <pre style="white-space:pre-wrap;">${escapeHtml(JSON.stringify(p.data || {}, null, 2))}</pre>
        </div>
      </li>
    `;
    setMode('detail');
  }

  matchesBackBtn?.addEventListener('click', () => {
    if (currentMatches && currentPayload) {
      renderMatches(currentMatches, currentPayload, false);
    } else {
      closeMatches();
    }
  });
  matchesContactBtn?.addEventListener('click', () => {
    // Unwired for now — placeholder
    alert('Contact flow coming soon.');
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});

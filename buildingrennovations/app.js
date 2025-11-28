// Building Renovations sub-app shared logic (non-invasive, relies on existing auth.js globals)
(function() {
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // Highlight active nav based on current filename
  function highlightNav() {
    const path = location.pathname.split('/').pop();
    $all('.nav-inline a').forEach(a => {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
  }

  // Cost estimator logic (estimator.html only)
  function updateEstimate() {
    if (!$('#estimateOutput')) return; // not on estimator page
    const area = parseFloat($('#floorArea').value) || 0;
    const floors = parseInt($('#floors').value, 10) || 0;
    const usage = $('#usage').value;
    const quality = $('#quality').value;
    const complexity = $('#complexity').value;
    const heritage = $('#heritage').checked;
    const phased = $('#phased').checked;

    if (!area || !floors) {
      $('#estimateOutput').textContent = 'Enter floor area and floors to calculate...';
      $('#estimatorMetrics').innerHTML = '';
      return;
    }

    // Base rates per m² (placeholder ROM figures) — purely illustrative
    const usageRate = {
      office: 1250,
      retail: 1375,
      mixed: 1325,
      industrial: 1150,
      hospitality: 1450
    }[usage] || 1250;

    const qualityFactor = { standard: 1.0, enhanced: 1.15, premium: 1.32 }[quality] || 1;
    const complexityFactor = { low: 0.95, medium: 1.0, high: 1.18 }[complexity] || 1;
    const heritageFactor = heritage ? 1.12 : 1;
    const phasedFactor = phased ? 1.08 : 1;

    const baseCost = area * usageRate * qualityFactor * complexityFactor * heritageFactor * phasedFactor;
    // Add allowance for vertical distribution / floors (simplistic): +0.6% per floor beyond 1
    const floorAdj = baseCost * (Math.max(0, floors - 1) * 0.006);
    const estimate = baseCost + floorAdj;

    // Derive some meta metrics
    const servicesAllow = estimate * 0.18; // placeholder proportion of budget
    const prelimsAllow = estimate * 0.07;  // prelims & site setup
    const contingency = estimate * 0.05;   // 5% contingency
    const professionalFees = estimate * 0.10; // design + PM fees

    $('#estimateOutput').textContent = 'Estimated Project Cost: £' + Math.round(estimate).toLocaleString();
    $('#estimatorMetrics').innerHTML = [
      metricBox('Services Allowance', servicesAllow),
      metricBox('Prelims', prelimsAllow),
      metricBox('Contingency (5%)', contingency),
      metricBox('Professional Fees (10%)', professionalFees),
      metricBox('Vertical Distribution Adj', floorAdj)
    ].join('');
  }

  function metricBox(label, value) {
    return '<div class="metric-box"><strong>£' + Math.round(value).toLocaleString() + '</strong>' + label + '</div>';
  }

  // Compliance hub panels (accordion-like)
  function initCompliancePanels() {
    const panelsRoot = $('#compliancePanels');
    if (!panelsRoot) return;
    const content = {
      fire: 'Fire strategy involves assessing compartmentation, protected routes, alarm integration, and passive/active systems.',
      structural: 'Structural considerations: load redistribution, reinforcement, survey of existing members, temporary works sequencing.',
      access: 'Accessibility ensures inclusive design: wayfinding, tactile surfaces, lift provision, sanitary accommodation compliance.',
      energy: 'Energy & HVAC: efficient plant selection, commissioning, airflow balancing, IAQ, heat recovery, BMS tuning.',
      water: 'Water hygiene: legionella risk assessment, temperature control, regular flushing and monitoring regimes.',
      waste: 'Waste & recycling: segregation strategy, responsible disposal tracking, circular material considerations.',
      permits: 'Permits & notices: planning, building control, landlord approvals, statutory notifications and inspections.',
      digital: 'Digital records: asset tag inventory, O&M manual collation, lifecycle maintenance scheduling.'
    };
    $all('.card[data-panel]').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-panel');
        const existing = panelsRoot.querySelector('[data-panel="' + key + '"]');
        if (existing) {
          existing.remove();
          return;
        }
        const div = document.createElement('div');
        div.className = 'accordion-panel show';
        div.setAttribute('data-panel', key);
        div.innerHTML = '<button class="close-btn" aria-label="Close">×</button><h3>' + card.querySelector('h3').textContent + '</h3><p>' + content[key] + '</p>';
        div.querySelector('.close-btn').addEventListener('click', () => div.remove());
        panelsRoot.appendChild(div);
      });
    });
  }

  // Material certification interactions
  function initCertificationUpload() {
    const drop = $('#certDrop');
    const input = $('#certFiles');
    const submit = $('#certSubmitBtn');
    const name = $('#materialName');
    const category = $('#materialCategory');
    const status = $('#certStatus');
    if (!drop || !input) return;

    function refreshState() {
      const files = Array.from(input.files || []);
      submit.disabled = !(name.value && files.length);
      status.textContent = files.length ? files.length + ' file(s) ready.' : '';
    }

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('dragover');
      input.files = e.dataTransfer.files; refreshState();
    });
    input.addEventListener('change', refreshState);
    name.addEventListener('input', refreshState);
    category.addEventListener('change', refreshState);
    submit.addEventListener('click', () => {
      status.textContent = 'Package staged locally (demo). Integration endpoint pending.';
    });
  }

  // Community reviews (fetch existing reviews.json and render subset)
  function initCommunityReviews() {
    const grid = $('#reviewsGrid');
    if (!grid) return;
    fetch('../reviews.json').then(r => r.json()).then(data => {
      grid.innerHTML = data.slice(0, 12).map(r => {
        return '<div class="community-review-card">' +
               '<h4>' + escapeHtml(r.title || 'Review') + '</h4>' +
               '<p>' + escapeHtml(r.content || '') + '</p>' +
               '<p class="small">Rating: ' + (r.rating || '-') + '/5</p>' +
               '</div>'; }).join('');
    }).catch(err => {
      grid.innerHTML = '<p class="small" style="color:#b00020">Failed to load reviews.</p>';
      console.error('Reviews load error', err);
    });
  }

  function escapeHtml(str){ return String(str).replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s])); }

  document.addEventListener('DOMContentLoaded', () => {
    highlightNav();
    updateEstimate();
    initCompliancePanels();
    initCertificationUpload();
    initCommunityReviews();

    // Ensure drawer has link to Renovation Registration
    try {
      const drawer = document.getElementById('drawer') || document.querySelector('.nav-links');
      if (drawer) {
        const exists = drawer.querySelector('a[href="renovations-register.html"]');
        if (!exists) {
          const divider = document.createElement('li');
          divider.className = 'divider';
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = 'renovations-register.html';
          a.textContent = 'Register Renovation';
          li.appendChild(a);
          drawer.appendChild(divider);
          drawer.appendChild(li);
        }
      }
    } catch (e) { /* no-op */ }
  });

  // Expose estimate update for form oninput
  window.updateEstimate = updateEstimate;
})();
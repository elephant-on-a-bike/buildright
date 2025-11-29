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
    const t = (k,f)=> (window.t ? window.t(k,f) : f);
    const area = parseFloat($('#floorArea').value) || 0;
    const floors = parseInt($('#floors').value, 10) || 0;
    const usage = $('#usage').value;
    const quality = $('#quality').value;
    const complexity = $('#complexity').value;
    const heritage = $('#heritage').checked;
    const phased = $('#phased').checked;

    if (!area || !floors) {
      $('#estimateOutput').textContent = t('estimator.prompt','Enter floor area and floors to calculate...');
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

    $('#estimateOutput').textContent = t('estimator.estimatedCost','Estimated Project Cost: £') + Math.round(estimate).toLocaleString();
    $('#estimatorMetrics').innerHTML = [
      metricBox(t('estimator.services','Services Allowance'), servicesAllow),
      metricBox(t('estimator.prelims','Prelims'), prelimsAllow),
      metricBox(t('estimator.contingency','Contingency (5%)'), contingency),
      metricBox(t('estimator.fees','Professional Fees (10%)'), professionalFees),
      metricBox(t('estimator.verticalAdj','Vertical Distribution Adj'), floorAdj)
    ].join('');
  }

  function metricBox(label, value) {
    return '<div class="metric-box"><strong>£' + Math.round(value).toLocaleString() + '</strong>' + label + '</div>';
  }

  // Compliance hub panels (accordion-like)
  function initCompliancePanels() {
    const t = (k,f)=> (window.t ? window.t(k,f) : f);
    const content = {
      fire: 'Fire strategy involves assessing compartmentation, protected routes, alarm integration, and passive/active systems. Include review of fire-stopping, passive protection, evacuation modelling and certification tracking.',
      structural: 'Structural considerations: load redistribution, reinforcement, survey of existing members, temporary works sequencing. Capture structural survey reports, design assumptions and temporary works registers.',
      access: 'Accessibility ensures inclusive design: wayfinding, tactile surfaces, lift provision, sanitary accommodation compliance. Maintain an accessibility checklist mapped to local statutory guidance.',
      energy: 'Energy & HVAC: efficient plant selection, commissioning, airflow balancing, IAQ, heat recovery, BMS tuning. Record commissioning certificates and performance benchmarks.',
      water: 'Water hygiene: legionella risk assessment, temperature control, regular flushing and monitoring regimes. Store risk assessments and ongoing monitoring logs.',
      waste: 'Waste & recycling: segregation strategy, responsible disposal tracking, circular material considerations. Track waste transfer notes and diversion metrics.',
      permits: 'Permits & notices: planning, building control, landlord approvals, statutory notifications and inspections. Maintain a master register with status, expiry and next actions.',
      digital: 'Digital records: asset tag inventory, O&M manual collation, lifecycle maintenance scheduling. Centralize asset tags and handover documentation for lifecycle planning.'
    };

    // Inject a reusable modal shell if not present
    if (!document.getElementById('complianceModal')) {
      const html = `\n        <div class="pd-overlay" id="complianceOverlay" aria-hidden="true"></div>\n        <section class="pd-modal" id="complianceModal" role="dialog" aria-modal="true" aria-labelledby="complianceTitle" aria-describedby="complianceBody" tabindex="-1">\n          <div class="pd-content">\n            <button class="pd-close" id="complianceClose" aria-label="Close">×</button>\n            <div class="pd-copy">\n              <h2 id="complianceTitle">Domain</h2>\n              <div id="complianceBody" class="modal-body"></div>\n            </div>\n            <div class="pd-art" aria-hidden="true">\n              <img src="../hero.png" alt="Compliance" />\n            </div>\n          </div>\n        </section>`;
      document.body.insertAdjacentHTML('beforeend', html);
    }
    const overlay = $('#complianceOverlay');
    const modal = $('#complianceModal');
    const titleEl = $('#complianceTitle');
    const bodyEl = $('#complianceBody');
    const closeBtn = $('#complianceClose');

    function openCompliance(key, heading){
      if(!overlay || !modal) return;
      titleEl.textContent = heading;
      const copy = {
        fire: t('compliance.fire', content.fire),
        structural: t('compliance.structural', content.structural),
        access: t('compliance.access', content.access),
        energy: t('compliance.energy', content.energy),
        water: t('compliance.water', content.water),
        waste: t('compliance.waste', content.waste),
        permits: t('compliance.permits', content.permits),
        digital: t('compliance.digital', content.digital)
      }[key];
      bodyEl.innerHTML = '<p>' + (copy || '') + '</p>';
      overlay.classList.add('open');
      modal.classList.add('open');
      setTimeout(()=> closeBtn.focus(), 50);
    }
    function closeCompliance(){
      overlay?.classList.remove('open');
      modal?.classList.remove('open');
    }
    closeBtn?.addEventListener('click', closeCompliance);
    overlay?.addEventListener('click', closeCompliance);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeCompliance(); });

    $all('.card[data-panel]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-panel');
        if(content[key]) openCompliance(key, card.querySelector('h3').textContent);
      });
    });
  }

  // Material certification interactions
  function initCertificationUpload() {
    const drop = $('#certDrop');
    const input = $('#certFiles');
    const certList = $('#certList');
    const envDrop = $('#envDrop');
    const envInput = $('#envFiles');
    const envList = $('#envList');
    const submit = $('#certSubmitBtn');
    const supplier = $('#supplierName');
    const name = $('#materialName');
    const category = $('#materialCategory');
    const status = $('#certStatus');
    const chFitout = $('#chFitout');
    const chRenov = $('#chRenovation');
    const deliveryUnit = $('#deliveryUnit');
    const price = $('#price');
    const leadTime = $('#leadTime');
    const linksRoot = $('#linkedProjects');
    const addLinkBtn = $('#addLink');
    if (!drop || !input) return;

    function listFiles(root, files) {
      if (!root) return;
      if (!files || !files.length) { root.innerHTML = ''; return; }
      root.innerHTML = Array.from(files).map(f => '- ' + f.name + ' (' + Math.round(f.size/1024) + ' KB)').join('<br>');
    }

    function loadDB(){
      try { return JSON.parse(localStorage.getItem('renovation_materials') || '[]'); } catch(e){ return []; }
    }
    function existsInDB(matName, matCategory, matSupplier){
      if(!matName) return false;
      const list = loadDB();
      const n = String(matName).trim().toLowerCase();
      const c = String(matCategory || '').trim().toLowerCase();
      const s = String(matSupplier || '').trim().toLowerCase();
      return list.some(x => String(x.name||'').trim().toLowerCase() === n && String(x.category||'').trim().toLowerCase() === c && String(x.supplier||'').trim().toLowerCase() === s);
    }

    function setStatus(msg, isError){
      if(!status) return;
      status.textContent = msg || '';
      status.style.color = isError ? '#b00020' : 'inherit';
    }

    function refreshState() {
      const t = (k,f)=> (window.t ? window.t(k,f) : f);
      const files = Array.from(input.files || []);
      const dup = existsInDB(name.value, category.value, supplier.value);
      submit.disabled = !(supplier.value && name.value && files.length) || dup;
      if (dup) {
        setStatus(t('materials.err.duplicate','A material with this name, category, and supplier is already saved locally.'), true);
      } else {
        setStatus(files.length ? (files.length + t('cert.readySuffix',' certification file(s) ready.')) : '', false);
      }
      listFiles(certList, input.files);
      listFiles(envList, envInput?.files || []);
    }

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('dragover');
      input.files = e.dataTransfer.files; refreshState();
    });
    input.addEventListener('change', refreshState);

    if (envDrop && envInput) {
      envDrop.addEventListener('click', () => envInput.click());
      envDrop.addEventListener('dragover', e => { e.preventDefault(); envDrop.classList.add('dragover'); });
      envDrop.addEventListener('dragleave', () => envDrop.classList.remove('dragover'));
      envDrop.addEventListener('drop', e => {
        e.preventDefault(); envDrop.classList.remove('dragover');
        envInput.files = e.dataTransfer.files; refreshState();
      });
      envInput.addEventListener('change', refreshState);
    }

    // Linked projects repeater (simple string list of project IDs)
    function addLink(val) {
      const row = document.createElement('div');
      row.className = 'repeater-row';
      const input = document.createElement('input');
      input.className = 'form-control';
      input.placeholder = (window.t?window.t('registration.projectPh','prj-XXXX or project identifier'):'prj-XXXX or project identifier');
      input.value = val || '';
      const rem = document.createElement('button');
      rem.type = 'button';
      rem.className = 'btn btn-outline';
      rem.textContent = (window.t?window.t('btn.remove','Remove'):'Remove');
      rem.addEventListener('click', () => row.remove());
      const wrap = document.createElement('div');
      wrap.className = 'section-grid';
      const fg = document.createElement('div');
      fg.className = 'form-group';
      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = (window.t?window.t('registration.projectId','Project ID'):'Project ID');
      fg.appendChild(label);
      fg.appendChild(input);
      wrap.appendChild(fg);
      row.appendChild(wrap);
      const actions = document.createElement('div');
      actions.className = 'row-actions';
      actions.appendChild(rem);
      row.appendChild(actions);
      linksRoot.appendChild(row);
    }
    addLinkBtn?.addEventListener('click', () => addLink(''));

    function filesToMeta(fileList) {
      return Array.from(fileList || []).map(f => ({ name: f.name, size: f.size, type: f.type }));
    }

    // Convert files to base64 for localStorage storage
    async function filesToBase64(fileList) {
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB per file limit
      const files = Array.from(fileList || []);
      const results = [];
      for (const file of files) {
        if (file.size > MAX_SIZE) {
          alert(`File "${file.name}" is too large (${Math.round(file.size/1024/1024)}MB). Maximum 2MB per file.`);
          continue;
        }
        const dataUrl = await readFileAsDataURL(file);
        results.push({ name: file.name, size: file.size, type: file.type, dataUrl });
      }
      return results;
    }

    function readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function uid(){ return Math.random().toString(36).slice(2,10); }

    async function buildPayload() {
      const linked = Array.from(linksRoot.querySelectorAll('.repeater-row input')).map(i => i.value.trim()).filter(Boolean);
      return {
        id: 'mat-' + uid(),
        supplier: supplier.value.trim(),
        name: name.value.trim(),
        category: category.value,
        delivery_unit: deliveryUnit.value.trim(),
        price: Number(price.value || 0),
        lead_time_days: Number(leadTime.value || 0),
        channels: { fitouthub: !!chFitout?.checked, renovationhub: !!chRenov?.checked },
        certifications: await filesToBase64(input.files),
        environmental_declarations: await filesToBase64(envInput?.files || []),
        linked_projects: linked,
        createdAt: new Date().toISOString()
      };
    }

    function saveLocal(pkg) {
      try {
        const key = 'renovation_materials';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push(pkg);
        localStorage.setItem(key, JSON.stringify(list));
      } catch(e) {
        console.warn('Local save failed', e);
      }
    }

    function download(filename, text){
      const a = document.createElement('a');
      a.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
      a.setAttribute('download', filename);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    supplier.addEventListener('input', refreshState);
    name.addEventListener('input', refreshState);
    category.addEventListener('change', refreshState);
    [deliveryUnit, price, leadTime, chFitout, chRenov].forEach(el => el && el.addEventListener('input', ()=>{}));

    submit.addEventListener('click', async () => {
      setStatus((window.t?window.t('materials.status.processing','Processing files...'):'Processing files...'), false);
      const pkg = await buildPayload();
      if (!pkg.supplier) { setStatus((window.t?window.t('materials.err.supplierReq','Please provide a supplier name.'):'Please provide a supplier name.'), true); return; }
      if (!pkg.name || !pkg.certifications.length) { setStatus((window.t?window.t('cert.err.req','Please provide a material name and at least one certification file.'):'Please provide a material name and at least one certification file.'), true); return; }
      if (existsInDB(pkg.name, pkg.category, pkg.supplier)) { setStatus((window.t?window.t('materials.err.duplicate','Duplicate: material already exists in local database. Update name, category, or supplier.'):'Duplicate: material already exists in local database. Update name, category, or supplier.'), true); return; }
      
      // Check localStorage size (rough estimate)
      const jsonSize = JSON.stringify(pkg).length;
      const currentSize = JSON.stringify(loadDB()).length;
      const totalSize = (jsonSize + currentSize) / 1024 / 1024;
      if (totalSize > 8) {
        const msg = (window.t?window.t('storage.warn','Warning: localStorage approaching limit (XMB). Continue?'):'Warning: localStorage approaching limit (XMB). Continue?').replace('X', totalSize.toFixed(1));
        if (!confirm(msg)) return;
      }
      
      saveLocal(pkg);
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      download('material-' + stamp + '.json', JSON.stringify(pkg, null, 2));
      setStatus((window.t?window.t('cert.saved','Package saved with embedded files. View in Materials Database.'):'Package saved with embedded files. View in Materials Database.'), false);
      setTimeout(()=>{ window.location.href = 'materials-database.html'; }, 1500);
    });
  }

  // Community reviews (localStorage database)
  function initCommunityReviews() {
    const grid = $('#reviewsGrid');
    const empty = $('#emptyState');
    const statTotal = $('#statTotal');
    const statAvg = $('#statAvgRating');
    const addBtn = $('#btnAddReview');
    const overlay = $('#reviewOverlay');
    const modal = $('#reviewModal');
    const closeBtn = $('#reviewClose');
    const cancelBtn = $('#reviewCancel');
    const form = $('#reviewForm');
    const errors = $('#reviewErrors');
    
    if (!grid) return;
    
    const DB_KEY = 'renovation_reviews';
    
    // Initialize with seed data if empty
    function initDB(){
      try {
        const existing = localStorage.getItem(DB_KEY);
        if(!existing){
          const seed = [
            {
              id: 'rev-' + Math.random().toString(36).slice(2,10),
              projectType: 'Office Renovation',
              title: 'Excellent outcome on Shoreditch office refurb',
              content: 'Completed a 3-floor office renovation with phased occupation. Used sustainable partition systems and energy-efficient HVAC. Contractor coordination was smooth, and we came in 5% under budget. The materials database helped us source certified low-VOC finishes.',
              rating: 5,
              author: 'GreenBuild Projects',
              location: 'London',
              status: 'approved',
              createdAt: new Date(Date.now() - 45*24*60*60*1000).toISOString()
            },
            {
              id: 'rev-' + Math.random().toString(36).slice(2,10),
              projectType: 'Heritage Restoration',
              title: 'Challenging but rewarding heritage conversion',
              content: 'Converted a listed Victorian warehouse into mixed-use space. Compliance requirements were extensive (fire, structural, conservation). Working with heritage officers added time but the end result respects the building character. Key lesson: allow extra contingency for unforeseen structural issues.',
              rating: 4,
              author: 'Period Properties Ltd',
              location: 'Manchester',
              status: 'approved',
              createdAt: new Date(Date.now() - 60*24*60*60*1000).toISOString()
            }
          ];
          localStorage.setItem(DB_KEY, JSON.stringify(seed));
        }
      } catch(e){ console.warn('initDB failed', e); }
    }
    
    function loadReviews(){
      try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch(e){ return []; }
    }
    
    function saveReviews(list){
      localStorage.setItem(DB_KEY, JSON.stringify(list));
    }
    
    function renderReviews(){
      const reviews = loadReviews().filter(r=> r.status === 'approved').sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
      if(statTotal) statTotal.textContent = reviews.length;
      if(statAvg){
        const avg = reviews.length ? (reviews.reduce((sum,r)=>sum+(r.rating||0),0)/reviews.length).toFixed(1) : '—';
        statAvg.textContent = avg;
      }
      if(!reviews.length){
        grid.innerHTML = '';
        if(empty) empty.style.display = 'block';
        return;
      }
      if(empty) empty.style.display = 'none';
      grid.innerHTML = reviews.map(r => {
        const date = new Date(r.createdAt).toLocaleDateString();
        return '<div class="community-review-card" style="background:var(--white);border:1px solid var(--gray-200);border-radius:12px;padding:16px;margin-bottom:12px">' +
               '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><strong style="color:var(--blue-900)">' + escapeHtml(r.projectType||'') + '</strong><span class="small" style="color:var(--orange-600)">★ ' + (r.rating||'-') + '/5</span></div>' +
               '<h4 style="margin:4px 0 8px">' + escapeHtml(r.title || 'Review') + '</h4>' +
               '<p style="color:var(--gray-700);margin-bottom:8px">' + escapeHtml(r.content || '') + '</p>' +
               '<p class="small" style="color:var(--gray-600)"><em>' + escapeHtml(r.author||'Anonymous') + (r.location ? ' • ' + escapeHtml(r.location) : '') + '</em> • ' + date + '</p>' +
               '</div>';
      }).join('');
    }
    
    function openModal(){
      overlay.classList.add('open');
      modal.classList.add('open');
      form.reset();
      errors.textContent = '';
    }
    
    function closeModal(){
      overlay.classList.remove('open');
      modal.classList.remove('open');
    }
    
    addBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal?.classList.contains('open')) closeModal(); });
    
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const projectType = $('#reviewProjectType').value;
      const title = $('#reviewTitleInput').value.trim();
      const content = $('#reviewContent').value.trim();
      const rating = parseInt($('#reviewRating').value, 10);
      const author = $('#reviewAuthor').value.trim();
      const location = $('#reviewLocation').value.trim();
      
      if(!projectType || !title || !content || !rating){
        errors.textContent = (window.t?window.t('community.err.required','Please complete all required fields.'):'Please complete all required fields.');
        errors.style.color = '#b00020';
        return;
      }
      
      const review = {
        id: 'rev-' + Math.random().toString(36).slice(2,10),
        projectType,
        title,
        content,
        rating,
        author: author || 'Anonymous',
        location,
        status: 'approved', // TODO: add vetting workflow
        createdAt: new Date().toISOString()
      };
      
      const list = loadReviews();
      list.push(review);
      saveReviews(list);
      closeModal();
      renderReviews();
    });
    
    initDB();
    renderReviews();
  }

  function escapeHtml(str){ return String(str).replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s])); }

  // Centralized navigation menu for Renovations Hub
  function injectNavigationMenu() {
    const drawer = document.getElementById('drawer') || document.querySelector('.nav-links');
    if (!drawer) return;
    
    const t = (k, f) => (window.t ? window.t(k, f) : f);
    const menuItems = [
      { href: 'index.html', text: t('nav.home','Home') },
      { href: 'estimator.html', text: t('nav.estimator','Cost Estimator') },
      { href: 'registration.html', text: t('nav.registration','Registration') },
      { href: 'renovations-register.html', text: t('nav.registerRenovation','Register Renovation') },
      { href: 'certification.html', text: t('nav.certification','Material Certification') },
      { href: 'materials-database.html', text: t('nav.materialsDb','Materials Database') },
      { href: 'compliance.html', text: t('nav.compliance','Safety & Compliance') },
      { href: 'community.html', text: t('nav.community','Community Reviews') },
      { divider: true },
      { href: '../index.html', text: t('nav.backFitout','← Back to FitOut Hub') }
    ];
    
    drawer.innerHTML = menuItems.map(item => {
      if (item.divider) return '<li class="divider"></li>';
      return `<li><a href="${item.href}">${item.text}</a></li>`;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectNavigationMenu();
    highlightNav();
    updateEstimate();
    initCompliancePanels();
    initCertificationUpload();
    initCommunityReviews();
  });

  // Re-inject menu when language changes
  document.addEventListener('i18n:ready', injectNavigationMenu);
  document.addEventListener('i18n:changed', injectNavigationMenu);

  // Expose estimate update for form oninput
  window.updateEstimate = updateEstimate;
})();
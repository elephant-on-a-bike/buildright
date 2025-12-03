(function(){
  // Path helpers
  function isSubfolder(){
    return window.location.pathname.includes('/buildingrennovations/');
  }
  function getJoinPath(role){
    const base = isSubfolder() ? '../join.html' : 'join.html';
    return role ? base + '?role=' + role : base;
  }
  // Page-level opt-out: set window.DISABLE_AUTH_MODAL or body[data-no-auth-inject]
  function shouldInjectAuth(){
    try {
      if (window.DISABLE_AUTH_MODAL) return false;
      const b = document.body;
      if (b && b.hasAttribute('data-no-auth-inject')) return false;
    } catch(e){}
    return true;
  }
  const JOIN_BTN = document.getElementById('openJoin');
  const LOGIN_BTN = document.getElementById('openLogin');
  const LOGOUT_BTN = document.getElementById('logoutBtn');
  const NEW_PROJECT_BTN = document.getElementById('newProjectBtn');
  const YOUR_PROJECTS_BTN = document.getElementById('yourProjectsBtn');
  const greetingEl = document.getElementById('greeting');
  const navEl = document.querySelector('nav.nav');
  const navToggle = document.querySelector('.nav-toggle');

  // Professional role selection modal elements
  const professionalRoleOverlay = document.getElementById('professionalRoleOverlay');
  const professionalRoleModal = document.getElementById('professionalRoleModal');
  const professionalRoleClose = document.getElementById('professionalRoleClose');
  const professionalContractor = document.getElementById('professionalContractor');
  const professionalReseller = document.getElementById('professionalReseller');
  const professionalCancel = document.getElementById('professionalCancel');

  // Role selection modal elements
  const roleOverlay = document.getElementById('roleOverlay');
  const roleModal = document.getElementById('roleModal');
  const roleClose = document.getElementById('roleClose');
  const roleClient = document.getElementById('roleClient');
  const roleContractor = document.getElementById('roleContractor');
  const roleReseller = document.getElementById('roleReseller');
  const roleInfo = document.getElementById('roleInfo');

  // Client join modal elements
  const joinOverlay = document.getElementById('joinOverlay');
  const joinModal = document.getElementById('joinModal');
  const joinClose = document.getElementById('joinClose');
  const joinForm = document.getElementById('joinForm');
  const joinErrors = document.getElementById('joinErrors');
  const joinSubmit = document.getElementById('joinSubmit');
  const joinToLogin = document.getElementById('joinToLogin');

  // Contractor modal elements
  const contractorOverlay = document.getElementById('contractorOverlay');
  const contractorModal = document.getElementById('contractorModal');
  const contractorClose = document.getElementById('contractorClose');
  const contractorCancel = document.getElementById('contractorCancel');

  // Reseller modal elements
  const resellerOverlay = document.getElementById('resellerOverlay');
  const resellerModal = document.getElementById('resellerModal');
  const resellerClose = document.getElementById('resellerClose');
  const resellerCancel = document.getElementById('resellerCancel');

  // Login modal elements - captured after injection
  let loginOverlay, loginModal, loginClose, loginForm, loginErrors, loginSubmit, loginToJoin;
  
  function captureLoginElements() {
    loginOverlay = document.getElementById('loginOverlay');
    loginModal = document.getElementById('loginModal');
    loginClose = document.getElementById('loginClose');
    loginForm = document.getElementById('loginForm');
    loginErrors = document.getElementById('loginErrors');
    loginSubmit = document.getElementById('loginSubmit');
    loginToJoin = document.getElementById('loginToJoin');
  }

  let users = []; // merged list (seed + local additions)
  let currentUser = null;
  const SESSION_KEY = 'fitouthub_current_user';

  // Gating modal elements
  let gateOverlay = null, gateModal = null, gateLoginBtn = null, gateJoinBtn = null, gateCancelBtn = null;
  function ensureGateModal(){
    // Check if modal already exists in DOM (not just our cached references)
    if (document.getElementById('gateOverlay') || document.getElementById('gateModal')) {
      gateOverlay = document.getElementById('gateOverlay');
      gateModal = document.getElementById('gateModal');
      gateLoginBtn = document.getElementById('gateLoginBtn');
      gateJoinBtn = document.getElementById('gateJoinBtn');
      gateCancelBtn = document.getElementById('gateCancelBtn');
      const gateClose = document.getElementById('gateClose');
      // Rebind if not bound
      if(gateOverlay && !gateOverlay.onclick) gateOverlay.addEventListener('click', closeGate);
      if(gateClose && !gateClose.onclick) gateClose.addEventListener('click', closeGate);
      if(gateCancelBtn && !gateCancelBtn.onclick) gateCancelBtn.addEventListener('click', closeGate);
      if(gateLoginBtn && !gateLoginBtn.onclick) gateLoginBtn.addEventListener('click', () => { closeGate(); openLogin(); });
      return;
    }
    if (gateOverlay && gateModal) return;
    const t = (k,f)=> (window.t?window.t(k,f):f);
    const heroImagePath = isSubfolder() ? '../hero.png' : 'hero.png';
    const joinHref = getJoinPath('client');
    const html = `
      <div class="pd-overlay" id="gateOverlay" aria-hidden="true"></div>
      <section class="pd-modal" id="gateModal" role="dialog" aria-modal="true" aria-labelledby="gateTitle" aria-describedby="gateDesc" tabindex="-1">
        <div class="pd-content">
          <button class="pd-close" id="gateClose" aria-label="Close">×</button>
          <div class="pd-copy">
            <h2 id="gateTitle">${t('auth.gate.title','Login required')}</h2>
            <p id="gateDesc">${t('auth.gate.desc','To start your project, please log in or create an account.')}</p>
            <div class="cta-actions" style="display:flex;gap:8px;margin-top:12px">
              <button type="button" id="gateLoginBtn" class="btn btn-primary">${t('btn.login','Login')}</button>
              <a id="gateJoinBtn" class="btn btn-secondary" href="${joinHref}">${t('btn.join','Join')}</a>
              <button type="button" id="gateCancelBtn" class="btn">${t('btn.cancel','Cancel')}</button>
            </div>
          </div>
          <div class="pd-art" aria-hidden="true">
            <img src="${heroImagePath}" alt="FitOut Hub" />
          </div>
        </div>
      </section>`;
    document.body.insertAdjacentHTML('beforeend', html);
    gateOverlay = document.getElementById('gateOverlay');
    gateModal = document.getElementById('gateModal');
    gateLoginBtn = document.getElementById('gateLoginBtn');
    gateJoinBtn = document.getElementById('gateJoinBtn');
    gateCancelBtn = document.getElementById('gateCancelBtn');
    const gateClose = document.getElementById('gateClose');
    gateOverlay?.addEventListener('click', closeGate);
    gateClose?.addEventListener('click', closeGate);
    gateCancelBtn?.addEventListener('click', closeGate);
    gateLoginBtn?.addEventListener('click', () => { closeGate(); openLogin(); });
  }
  function openGate(){ ensureGateModal(); openModal(gateOverlay, gateModal); }
  function closeGate(){ if(gateOverlay && gateModal) closeModal(gateOverlay, gateModal); }

  // Inject login modal if not present
  function injectLoginModal(override) {
    // Respect page-level opt-out unless override is true (lazy injection for gating)
    if(!override && !shouldInjectAuth()) { return; }
    // Double-check for existing modal to prevent duplicates
    if(document.getElementById('loginOverlay')) {
      console.log('Login modal already exists, skipping injection');
      return;
    }
    if(document.getElementById('loginForm')) {
      console.log('Login form already exists, skipping injection');
      return;
    }
    console.log('Injecting login modal');
    
    // Detect if we're in a subfolder (buildingrennovations) and adjust paths
    const heroImagePath = isSubfolder() ? '../hero.png' : 'hero.png';
    const joinHref = getJoinPath('client');
    
    const t = (k,f)=> (window.t?window.t(k,f):f);
    const modalHTML = `
      <div class="pd-overlay" id="loginOverlay" aria-hidden="true"></div>
      <section class="pd-modal" id="loginModal" role="dialog" aria-modal="true" aria-labelledby="loginModalTitle" aria-describedby="loginModalDesc" tabindex="-1">
        <div class="pd-content">
          <button class="pd-close" id="loginClose" aria-label="Close">×</button>
          <div class="pd-copy">
            <h2 id="loginModalTitle">${t('auth.login.title','Login to FitOut Hub')}</h2>
            <p id="loginModalDesc">${t('auth.login.desc','Access your projects, track progress, and manage your account.')}</p>
            <div id="loginErrors" class="auth-errors" aria-live="polite"></div>
            <form id="loginForm" novalidate>
              <div class="form-group">
                <label for="loginNickname" class="form-label">${t('auth.login.nickname','Nickname')}</label>
                <input id="loginNickname" name="loginNickname" class="form-control" required autocomplete="username">
              </div>
              <div class="form-group">
                <label for="loginPassword" class="form-label">${t('auth.login.password','Password')}</label>
                <input id="loginPassword" name="loginPassword" type="password" class="form-control" required autocomplete="current-password">
              </div>
              <div class="cta-actions" style="display: flex; gap: 12px; margin-top: 1.5em;">
                <button id="loginSubmit" type="submit" class="btn btn-primary" disabled>${t('btn.login','Login')}</button>
              </div>
              <div style="margin-top: 1em; text-align: center; font-size: 0.95rem;">
                ${t('auth.login.newHere','New here?')} <a href="${joinHref}" id="loginToJoin" style="color: #2563eb; font-weight: 600;">${t('btn.join','Join')}</a>
              </div>
            </form>
          </div>
          <div class="pd-art" aria-hidden="true">
            <img src="${heroImagePath}" alt="FitOut Hub" />
          </div>
        </div>
      </section>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function updateLoginModalTexts(){
    if(!window.t) return;
    const t = window.t;
    const title = document.getElementById('loginModalTitle');
    const desc = document.getElementById('loginModalDesc');
    const nickLabel = document.querySelector('label[for="loginNickname"]');
    const passLabel = document.querySelector('label[for="loginPassword"]');
    const submit = document.getElementById('loginSubmit');
    const joinLink = document.getElementById('loginToJoin');
    if(title) title.textContent = t('auth.login.title','Login to FitOut Hub');
    if(desc) desc.textContent = t('auth.login.desc','Access your projects, track progress, and manage your account.');
    if(nickLabel) nickLabel.textContent = t('auth.login.nickname','Nickname');
    if(passLabel) passLabel.textContent = t('auth.login.password','Password');
    if(submit) submit.textContent = t('btn.login','Login');
    if(joinLink) joinLink.textContent = t('btn.join','Join');
  }

  // Helper to ensure UsersDB is loaded
  async function ensureUsersDB(){
    if(!window.UsersDB){
      // Load users-db.js dynamically if not present
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = isSubfolder() ? '../users-db.js' : 'users-db.js';
        script.onload = () => {
          if(window.UsersDB) resolve();
          else reject(new Error('UsersDB not loaded'));
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return Promise.resolve();
  }

  function generateIdHex(len=64){
    const bytes = new Uint8Array(len/2); // 32 bytes for 64 hex chars
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function hashPassword(pw){
    const enc = new TextEncoder().encode(pw);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function openModal(overlay, modal){
    if(!overlay || !modal) return;
    overlay.classList.add('open');
    modal.classList.add('open');
    // Don't use aria-hidden when modal is open to avoid focus conflicts
    document.addEventListener('keydown', escListener);
    // Focus first input after a short delay
    setTimeout(() => {
      const firstInput = modal.querySelector('input');
      if(firstInput) firstInput.focus();
    }, 100);
  }
  function closeModal(overlay, modal){
    if(!overlay || !modal) return;
    overlay.classList.remove('open');
    modal.classList.remove('open');
    document.removeEventListener('keydown', escListener);
  }
  function escListener(e){ if(e.key==='Escape'){ [professionalRoleModal, roleModal, joinModal, contractorModal, resellerModal, loginModal].forEach(m=>{ if(m && m.classList.contains('open')){ if(m===professionalRoleModal) closeProfessionalRole(); else if(m===roleModal) closeRole(); else if(m===joinModal) closeJoin(); else if(m===contractorModal) closeContractor(); else if(m===resellerModal) closeReseller(); else if(m===loginModal) closeLogin(); }}); } }

  // Professional role modal helpers
  function openProfessionalRole(){ openModal(professionalRoleOverlay, professionalRoleModal); }
  function closeProfessionalRole(){ closeModal(professionalRoleOverlay, professionalRoleModal); }

  // Modal open/close helpers (restore missing definitions)
  function openRole(){ openModal(roleOverlay, roleModal); }
  function closeRole(){ closeModal(roleOverlay, roleModal); }
  function openJoin(){ openModal(joinOverlay, joinModal); }
  function closeJoin(){ closeModal(joinOverlay, joinModal); }

  // Role selection functions
  const roleDescriptions = {
    client: "Clients are individuals or businesses looking to hire contractors for fitout, renovation, or construction projects. As a client, you can browse tradesmen, request quotes, and manage your projects.",
    contractor: "Contractors provide services to clients including fitout, renovations, and trades work. Register to receive leads and manage job requests.",
    reseller: "Resellers partner with us to offer FitOut Hub services and products to their customers."
  };

  function openContractor(){ openModal(contractorOverlay, contractorModal); }
  function closeContractor(){ closeModal(contractorOverlay, contractorModal); }
  
  function openReseller(){ openModal(resellerOverlay, resellerModal); }
  function closeReseller(){ closeModal(resellerOverlay, resellerModal); }

  function openLogin(prefillNickname){
    // Ensure login modal exists even on pages that opted-out of auto injection
    if(!document.getElementById('loginModal')) {
      injectLoginModal(true);
      // Re-capture and bind after injection
      setTimeout(() => {
        captureLoginElements();
        bindLoginEvents();
        // Now open with prefill
        if(prefillNickname){
          const nick = loginForm?.loginNickname || loginForm?.querySelector('#loginNickname');
          if(nick) nick.value = prefillNickname;
        }
        const submit = loginSubmit || document.getElementById('loginSubmit');
        if(submit){
          const valid = validateLoginFields();
          submit.disabled = !valid;
          submit.setAttribute('aria-disabled', String(!valid));
        }
        openModal(loginOverlay, loginModal);
      }, 10);
      return;
    }
    if(!loginOverlay || !loginModal || !loginForm) captureLoginElements();
    const overlay = loginOverlay, modal = loginModal, form = loginForm;
    const submit = loginSubmit || document.getElementById('loginSubmit');
    if(!form || !overlay || !modal) return;
    clearLoginErrors();
    form.reset();
    if(prefillNickname){
      const nick = form.loginNickname || form.querySelector('#loginNickname');
      if(nick) nick.value = prefillNickname;
    }
    if(submit){
      const valid = validateLoginFields();
      submit.disabled = !valid;
      submit.setAttribute('aria-disabled', String(!valid));
    }
    openModal(overlay, modal);
  }
  function closeLogin(){ 
    if(loginOverlay && loginModal) closeModal(loginOverlay, loginModal);
  }

  function clearJoinErrors(){ joinErrors.textContent=''; }
  function setJoinError(msg){ joinErrors.textContent = msg; }
  function clearLoginErrors(){ if(loginErrors){ loginErrors.textContent=''; } }
  function setLoginError(msg){ if(loginErrors){ loginErrors.textContent = msg; } }

  function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validateMobile(v){ return /^[+\d\s-]{7,}$/.test(v); }

  function validateJoinFields(){
    const f = joinForm;
    if(!f) return false;
    const required = [f.joinNickname, f.joinFirst, f.joinSurname, f.joinEmail, f.joinMobile, f.joinPassword, f.joinConfirm];
    const emptyField = required.find(el => !el || !el.value || !el.value.trim());
    if(emptyField){ setJoinError(`Please fill in ${emptyField.name || 'all fields'}`); return false; }
    const email = f.joinEmail.value.trim();
    if(!validateEmail(email)) { setJoinError('Please enter a valid email address'); return false; }
    const mobile = f.joinMobile.value.trim();
    if(!validateMobile(mobile)) { setJoinError('Please enter a valid mobile number (at least 7 digits)'); return false; }
    if(f.joinPassword.value !== f.joinConfirm.value) { setJoinError('Passwords do not match'); return false; }
    if(f.joinPassword.value.length < 8) { setJoinError('Password must be at least 8 characters'); return false; }
    clearJoinErrors();
    return true;
  }

  function validateLoginFields(){
    const f = loginForm;
    if(!f) return false;
    const nicknameInput = f.loginNickname || f.querySelector('#loginNickname');
    const passwordInput = f.loginPassword || f.querySelector('#loginPassword');
    if(!nicknameInput || !passwordInput) return false;
    if(!nicknameInput.value.trim() || !passwordInput.value) return false;
    return true;
  }

  joinForm?.addEventListener('input', () => {
    clearJoinErrors(); // Clear errors while typing
    const valid = validateJoinFields();
    console.log('Join form valid:', valid);
    joinSubmit.disabled = !valid;
    joinSubmit.setAttribute('aria-disabled', String(!valid));
  });

  joinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearJoinErrors();
    if(!validateJoinFields()) { setJoinError('Please complete all required fields correctly.'); return; }
    const nick = joinForm.joinNickname.value.trim();
    
    // Use UsersDB if available
    await ensureUsersDB();
    if(window.UsersDB && window.UsersDB.getByNickname(nick)) { 
      setJoinError('Nickname already taken.'); 
      return; 
    }
    if(users.some(u=>u.nickname.toLowerCase()===nick.toLowerCase())) { 
      setJoinError('Nickname already taken.'); 
      return; 
    }
    
    try {
      const hashed = await hashPassword(joinForm.joinPassword.value);
      const user = {
        id: generateIdHex(64),
        nickname: nick,
        firstName: joinForm.joinFirst.value.trim(),
        surname: joinForm.joinSurname.value.trim(),
        chineseName: joinForm.joinChinese.value.trim() || null,
        email: joinForm.joinEmail.value.trim(),
        mobile: joinForm.joinMobile.value.trim(),
        passwordHash: hashed,
        createdAt: new Date().toISOString()
      };
      
      // Save to UsersDB if available
      if(window.UsersDB){
        const result = window.UsersDB.add(user);
        if(!result.success){ 
          setJoinError(result.error); 
          return; 
        }
      }
      
      users.push(user);
      closeJoin();
      // Open login prefilled
      openLogin(user.nickname);
    } catch(err){ setJoinError('Unexpected error creating account.'); console.error(err); }
  });

  // Separate function to bind login events after elements are captured
  function bindLoginEvents() {
    if(!loginForm) {
      // Silently skip if form not yet available; openLogin will inject and bind later
      return;
    }
    
    console.log('Binding login form events');
    
    loginForm.addEventListener('input', () => {
      const valid = validateLoginFields();
      if(loginSubmit){
        loginSubmit.disabled = !valid;
        loginSubmit.setAttribute('aria-disabled', String(!valid));
      }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearLoginErrors();
      if(!validateLoginFields()) { setLoginError('Enter nickname and password.'); return; }
      const nicknameInput = loginForm.loginNickname || loginForm.querySelector('#loginNickname');
      const passwordInput = loginForm.loginPassword || loginForm.querySelector('#loginPassword');
      const nick = nicknameInput.value.trim();
      const pw = passwordInput.value;
      const user = users.find(u=>u.nickname.toLowerCase()===nick.toLowerCase());
      if(!user){ setLoginError('User not found.'); return; }
      try {
        const hash = await hashPassword(pw);
        if(hash !== user.passwordHash){ setLoginError('Incorrect password.'); return; }
        currentUser = user;
        sessionStorage.setItem(SESSION_KEY, user.id);
        updateGreeting();
        closeLogin();
      } catch(err){ setLoginError('Login error.'); console.error(err); }
    });
    
    // Bind close handlers
    loginClose?.addEventListener('click', closeLogin);
    loginOverlay?.addEventListener('click', closeLogin);
  }

  function updateGreeting(){
    if(!greetingEl){ return; }
    // Build a unified header row that contains greeting, auth buttons and hamburger
    let headerRow = navEl?.querySelector('.header-row');
    if(!headerRow && navEl){
      headerRow = document.createElement('div');
      headerRow.className = 'header-row';
      // Insert at start of nav so drawer remains positioned relative to nav
      navEl.insertBefore(headerRow, navEl.firstChild);
    }
    if(currentUser){
      const nameEl = document.createElement('span');
      nameEl.textContent = `Hello ${currentUser.nickname}`;
      nameEl.style.fontSize = '0.95rem';
      nameEl.style.fontWeight = '600';
      nameEl.style.whiteSpace = 'nowrap';
      
      greetingEl.innerHTML = '';
      greetingEl.style.display = 'inline-flex';
      greetingEl.style.alignItems = 'center';
      greetingEl.appendChild(nameEl);
      
      if(YOUR_PROJECTS_BTN){
        YOUR_PROJECTS_BTN.style.display = 'inline-block';
        YOUR_PROJECTS_BTN.classList.add('header-button','btn');
      }
      if(NEW_PROJECT_BTN){
        NEW_PROJECT_BTN.style.display = 'inline-block';
        NEW_PROJECT_BTN.classList.add('header-button','btn');
      }
      if(LOGOUT_BTN){
        LOGOUT_BTN.style.display = 'inline-block';
        LOGOUT_BTN.classList.add('header-button','btn');
      }
      if(JOIN_BTN) JOIN_BTN.style.display = 'none';
      if(LOGIN_BTN) LOGIN_BTN.style.display = 'none';
      // Assemble header row
      if(headerRow){
        headerRow.innerHTML = '';
        headerRow.style.display = 'flex';
        headerRow.style.alignItems = 'center';
        headerRow.style.gap = '10px';
        headerRow.style.flexWrap = 'nowrap';
        headerRow.appendChild(greetingEl);
        if(YOUR_PROJECTS_BTN) headerRow.appendChild(YOUR_PROJECTS_BTN);
        if(NEW_PROJECT_BTN) headerRow.appendChild(NEW_PROJECT_BTN);
        if(LOGOUT_BTN) headerRow.appendChild(LOGOUT_BTN);
        if(navToggle) headerRow.appendChild(navToggle);
      }
    } else {
      greetingEl.innerHTML = '';
      greetingEl.style.display = 'none';
      if(NEW_PROJECT_BTN) NEW_PROJECT_BTN.style.display = 'none';
      if(YOUR_PROJECTS_BTN) YOUR_PROJECTS_BTN.style.display = 'none';
      if(LOGOUT_BTN) LOGOUT_BTN.style.display = 'none';
      if(JOIN_BTN){
        JOIN_BTN.style.display = 'inline-block';
        JOIN_BTN.classList.add('header-button','btn');
      }
      if(LOGIN_BTN){
        LOGIN_BTN.style.display = 'inline-block';
        LOGIN_BTN.classList.add('header-button','btn');
      }
      // Assemble header row with auth buttons + hamburger
      if(headerRow){
        headerRow.innerHTML = '';
        headerRow.style.display = 'flex';
        headerRow.style.alignItems = 'center';
        headerRow.style.gap = '10px';
        headerRow.style.flexWrap = 'nowrap';
        if(LOGIN_BTN) headerRow.appendChild(LOGIN_BTN);
        if(JOIN_BTN) headerRow.appendChild(JOIN_BTN);
        if(navToggle) headerRow.appendChild(navToggle);
      }
    }
  }

  // Role selection info buttons
  document.querySelectorAll('.btn-info[data-role]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const role = btn.getAttribute('data-role');
      if(roleInfo && roleDescriptions[role]){
        roleInfo.textContent = roleDescriptions[role];
        roleInfo.style.display = 'block';
      }
    });
  });

  // Professional role selection buttons
  professionalContractor?.addEventListener('click', () => { closeProfessionalRole(); openContractor(); });
  professionalReseller?.addEventListener('click', () => { closeProfessionalRole(); openReseller(); });
  professionalCancel?.addEventListener('click', closeProfessionalRole);
  
  // Professional role modal close
  professionalRoleClose?.addEventListener('click', closeProfessionalRole);
  professionalRoleOverlay?.addEventListener('click', closeProfessionalRole);

  // Role selection buttons
  roleClient?.addEventListener('click', () => { closeRole(); openJoin(); });
  roleContractor?.addEventListener('click', () => { closeRole(); openContractor(); });
  roleReseller?.addEventListener('click', () => { closeRole(); openReseller(); });
  
  // Role modal close
  roleClose?.addEventListener('click', closeRole);
  roleOverlay?.addEventListener('click', closeRole);

  // Contractor modal close
  contractorClose?.addEventListener('click', closeContractor);
  contractorCancel?.addEventListener('click', closeContractor);
  contractorOverlay?.addEventListener('click', closeContractor);

  // Reseller modal close
  resellerClose?.addEventListener('click', closeReseller);
  resellerCancel?.addEventListener('click', closeReseller);
  resellerOverlay?.addEventListener('click', closeReseller);

  // Navigation between modals - defer to ensure elements exist
  setTimeout(() => {
    joinToLogin?.addEventListener('click', () => { closeJoin(); openLogin(); });
    loginToJoin?.addEventListener('click', () => { closeLogin(); openRole(); });
  }, 0);

  // Open buttons - defer binding to ensure modal is injected
  function bindAuthButtons() {
    JOIN_BTN?.addEventListener('click', () => { window.location.href = getJoinPath(); });
    LOGIN_BTN?.addEventListener('click', () => openLogin());
    joinClose?.addEventListener('click', closeJoin);
    joinOverlay?.addEventListener('click', closeJoin);
    NEW_PROJECT_BTN?.addEventListener('click', () => { window.location.href = isSubfolder() ? '../expert3.html' : 'expert3.html'; });
  }

  // Logout
  LOGOUT_BTN?.addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    updateGreeting();
  });

  // Init - wrap in DOMContentLoaded to ensure single execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  function initAuth() {
    injectLoginModal(); // Ensure modal is available before any interactions
    // Update modal texts once i18n is ready, and on subsequent changes
    document.addEventListener('i18n:ready', updateLoginModalTexts);
    document.addEventListener('i18n:changed', updateLoginModalTexts);
    
    // Small delay to ensure DOM is fully updated after injection
    setTimeout(() => {
      captureLoginElements(); // Bind references after injection
      bindLoginEvents(); // Bind login form events
      bindAuthButtons(); // Bind auth buttons after modal is ready
    }, 10);
    
    // Load users from UsersDB if available, otherwise fallback to old method
    ensureUsersDB().then(() => {
      if(window.UsersDB){
        return window.UsersDB.init();
      } else {
        // Fallback to legacy method
        return loadSeed().then(seed => mergeUsers(seed, loadLocal()));
      }
    }).then(loadedUsers => {
      users = loadedUsers;
      // Restore session user if present
      const sid = sessionStorage.getItem(SESSION_KEY);
      if(sid){ 
        currentUser = users.find(u=>u.id===sid) || null;
        if(!currentUser && window.UsersDB){
          currentUser = window.UsersDB.getById(sid) || null;
        }
      }
      updateGreeting();
      // Ensure header buttons reflect i18n-applied texts
      document.addEventListener('i18n:ready', updateGreeting);
      document.addEventListener('i18n:changed', updateGreeting);
      // Expose globally for other scripts (non-secure demo)
      window.fitouthubUserId = currentUser ? currentUser.id : null;
      // Provide a global handler for inline onclick usage across pages
      window.openRole = function(){ window.location.href = getJoinPath(); };
      // Provide a global handler to open professional role selection
      window.openProfessionalRole = openProfessionalRole;
      // Provide a global gating helper for expert page access
      window.requireLoginForExpert = function(target){
        const dest = target || (isSubfolder() ? '../expert3.html' : 'expert3.html');
        if (currentUser) { window.location.href = dest; return true; }
        openGate();
        return false;
      };
      
      // Bind all "Join as professional" buttons to open professional role modal
      document.querySelectorAll('.professional-join').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openProfessionalRole();
        });
      });
    }).catch(err => {
      console.error('Error loading users:', err);
    });
  }
})();

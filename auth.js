(function(){
  const JOIN_BTN = document.getElementById('openJoin');
  const LOGIN_BTN = document.getElementById('openLogin');
  const LOGOUT_BTN = document.getElementById('logoutBtn');
  const NEW_PROJECT_BTN = document.getElementById('newProjectBtn');
  const YOUR_PROJECTS_BTN = document.getElementById('yourProjectsBtn');
  const greetingEl = document.getElementById('greeting');

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

  // Login modal elements
  const loginOverlay = document.getElementById('loginOverlay');
  const loginModal = document.getElementById('loginModal');
  const loginClose = document.getElementById('loginClose');
  const loginForm = document.getElementById('loginForm');
  const loginErrors = document.getElementById('loginErrors');
  const loginSubmit = document.getElementById('loginSubmit');
  const loginToJoin = document.getElementById('loginToJoin');

  let users = []; // merged list (seed + local additions)
  let currentUser = null;
  const LS_KEY = 'fitouthub_users';
  const SESSION_KEY = 'fitouthub_current_user';

  function loadSeed() {
    return fetch('users.json').then(r=>r.json()).catch(()=>[]);
  }
  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch(e){ return []; }
  }
  function saveLocal() { localStorage.setItem(LS_KEY, JSON.stringify(users)); }

  function mergeUsers(seed, local) {
    const byId = new Map();
    [...seed, ...local].forEach(u=>{ if(u && u.id) byId.set(u.id, u); });
    return Array.from(byId.values());
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
    overlay.setAttribute('aria-hidden','false');
    modal.setAttribute('aria-hidden','false');
    modal.focus();
    document.addEventListener('keydown', escListener);
  }
  function closeModal(overlay, modal){
    if(!overlay || !modal) return;
    overlay.classList.remove('open');
    modal.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    modal.setAttribute('aria-hidden','true');
    document.removeEventListener('keydown', escListener);
  }
  function escListener(e){ if(e.key==='Escape'){ [roleModal, joinModal, contractorModal, resellerModal, loginModal].forEach(m=>{ if(m && m.classList.contains('open')){ if(m===roleModal) closeRole(); else if(m===joinModal) closeJoin(); else if(m===contractorModal) closeContractor(); else if(m===resellerModal) closeReseller(); else if(m===loginModal) closeLogin(); }}); } }

  // Role selection functions
  const roleDescriptions = {
    client: "Clients are individuals or businesses looking to hire contractors for fitout, renovation, or construction projects. As a client, you can browse tradesmen, request quotes, and manage your projects.",
    contractor: "Contractors are skilled tradespeople and construction professionals who provide services to clients. As a contractor, you can showcase your skills, receive project requests, and grow your business.",
    reseller: "Resellers are suppliers and retailers who provide materials, fixtures, and products for fitout projects. As a reseller, you can list your products and connect with clients and contractors."
  };

  function openRole(){ roleInfo.style.display='none'; roleInfo.textContent=''; openModal(roleOverlay, roleModal); }
  function closeRole(){ closeModal(roleOverlay, roleModal); }
  
  function openJoin(){ clearJoinErrors(); joinForm.reset(); joinSubmit.disabled = true; joinSubmit.setAttribute('aria-disabled','true'); openModal(joinOverlay, joinModal); }
  function closeJoin(){ closeModal(joinOverlay, joinModal); }
  
  function openContractor(){ openModal(contractorOverlay, contractorModal); }
  function closeContractor(){ closeModal(contractorOverlay, contractorModal); }
  
  function openReseller(){ openModal(resellerOverlay, resellerModal); }
  function closeReseller(){ closeModal(resellerOverlay, resellerModal); }
  
  function openLogin(prefillNickname){ clearLoginErrors(); loginForm.reset(); if(prefillNickname){ loginForm.loginNickname.value = prefillNickname; } loginSubmit.disabled = true; loginSubmit.setAttribute('aria-disabled','true'); openModal(loginOverlay, loginModal); }
  function closeLogin(){ closeModal(loginOverlay, loginModal); }

  function clearJoinErrors(){ joinErrors.textContent=''; }
  function setJoinError(msg){ joinErrors.textContent = msg; }
  function clearLoginErrors(){ loginErrors.textContent=''; }
  function setLoginError(msg){ loginErrors.textContent = msg; }

  function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validateMobile(v){ return /^[+\d\s-]{7,}$/.test(v); }

  function validateJoinFields(){
    const f = joinForm;
    if(!f) { console.log('Join form not found'); return false; }
    
    const required = [f.joinNickname, f.joinFirst, f.joinSurname, f.joinEmail, f.joinMobile, f.joinPassword, f.joinConfirm];
    const emptyField = required.find(el => !el || !el.value.trim());
    if(emptyField) { 
      console.log('Empty field:', emptyField?.name || emptyField?.id); 
      setJoinError(`Please fill in ${emptyField?.name || 'all fields'}`);
      return false; 
    }
    
    const email = f.joinEmail.value.trim();
    if(!validateEmail(email)) { 
      console.log('Invalid email:', email); 
      setJoinError('Please enter a valid email address');
      return false; 
    }
    
    const mobile = f.joinMobile.value.trim();
    if(!validateMobile(mobile)) { 
      console.log('Invalid mobile:', mobile); 
      setJoinError('Please enter a valid mobile number (at least 7 digits)');
      return false; 
    }
    
    if(f.joinPassword.value !== f.joinConfirm.value) { 
      console.log('Password mismatch'); 
      setJoinError('Passwords do not match');
      return false; 
    }
    
    if(f.joinPassword.value.length < 8) { 
      console.log('Password too short:', f.joinPassword.value.length); 
      setJoinError('Password must be at least 8 characters');
      return false; 
    }
    
    clearJoinErrors();
    return true;
  }

  function validateLoginFields(){
    const f = loginForm;
    if(!f) return false;
    if(!f.loginNickname.value.trim() || !f.loginPassword.value) return false;
    return true;
  }

  joinForm?.addEventListener('input', () => {
    clearJoinErrors(); // Clear errors while typing
    const valid = validateJoinFields();
    console.log('Join form valid:', valid);
    joinSubmit.disabled = !valid;
    joinSubmit.setAttribute('aria-disabled', String(!valid));
  });

  loginForm?.addEventListener('input', () => {
    const valid = validateLoginFields();
    loginSubmit.disabled = !valid;
    loginSubmit.setAttribute('aria-disabled', String(!valid));
  });

  joinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearJoinErrors();
    if(!validateJoinFields()) { setJoinError('Please complete all required fields correctly.'); return; }
    const nick = joinForm.joinNickname.value.trim();
    if(users.some(u=>u.nickname.toLowerCase()===nick.toLowerCase())) { setJoinError('Nickname already taken.'); return; }
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
      users.push(user); saveLocal();
      closeJoin();
      // Open login prefilled
      openLogin(user.nickname);
    } catch(err){ setJoinError('Unexpected error creating account.'); console.error(err); }
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginErrors();
    if(!validateLoginFields()) { setLoginError('Enter nickname and password.'); return; }
    const nick = loginForm.loginNickname.value.trim();
    const pw = loginForm.loginPassword.value;
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

  function updateGreeting(){
    if(!greetingEl){ return; }
    if(currentUser){
      const h1 = document.createElement('h1');
      h1.textContent = `Hello ${currentUser.nickname}`;
      const btnContainer = document.createElement('div');
      btnContainer.className = 'greeting-buttons';
      
      greetingEl.innerHTML = '';
      greetingEl.appendChild(h1);
      greetingEl.appendChild(btnContainer);
      
      if(NEW_PROJECT_BTN){
        NEW_PROJECT_BTN.style.display = 'inline-block';
        btnContainer.appendChild(NEW_PROJECT_BTN);
      }
      if(YOUR_PROJECTS_BTN){
        YOUR_PROJECTS_BTN.style.display = 'inline-block';
        btnContainer.appendChild(YOUR_PROJECTS_BTN);
      }
      if(LOGOUT_BTN){
        LOGOUT_BTN.style.display = 'inline-block';
        btnContainer.appendChild(LOGOUT_BTN);
      }
      if(JOIN_BTN) JOIN_BTN.style.display = 'none';
      if(LOGIN_BTN) LOGIN_BTN.style.display = 'none';
    } else {
      greetingEl.innerHTML = '';
      if(NEW_PROJECT_BTN) NEW_PROJECT_BTN.style.display = 'none';
      if(YOUR_PROJECTS_BTN) YOUR_PROJECTS_BTN.style.display = 'none';
      if(LOGOUT_BTN) LOGOUT_BTN.style.display = 'none';
      if(JOIN_BTN) JOIN_BTN.style.display = 'inline-block';
      if(LOGIN_BTN) LOGIN_BTN.style.display = 'inline-block';
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

  // Navigation between modals
  joinToLogin?.addEventListener('click', () => { closeJoin(); openLogin(); });
  loginToJoin?.addEventListener('click', () => { closeLogin(); openRole(); });

  // Open buttons - Join now opens role selection
  JOIN_BTN?.addEventListener('click', openRole);
  LOGIN_BTN?.addEventListener('click', () => openLogin());
  joinClose?.addEventListener('click', closeJoin);
  loginClose?.addEventListener('click', closeLogin);
  joinOverlay?.addEventListener('click', closeJoin);
  loginOverlay?.addEventListener('click', closeLogin);

  // Logout
  LOGOUT_BTN?.addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    updateGreeting();
  });

  // Init
  loadSeed().then(seed => {
    users = mergeUsers(seed, loadLocal());
    // Restore session user if present
    const sid = sessionStorage.getItem(SESSION_KEY);
    if(sid){ currentUser = users.find(u=>u.id===sid) || null; }
    updateGreeting();
  });
})();

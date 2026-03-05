/* ═══════════════════════════════════════════
   SUBVERSE — Authentication Module
   Google Sign-In + Apple Sign-In
   
   ╔══════════════════════════════════════════╗
   ║  SETUP INSTRUCTIONS                      ║
   ╠══════════════════════════════════════════╣
   ║                                          ║
   ║  GOOGLE:                                 ║
   ║  1. Go to console.cloud.google.com       ║
   ║  2. Create project → APIs & Services     ║
   ║  3. Create OAuth 2.0 Client ID           ║
   ║  4. Add your domain to Authorized        ║
   ║     JavaScript origins                   ║
   ║  5. Copy Client ID below                 ║
   ║                                          ║
   ║  APPLE:                                  ║
   ║  1. Go to developer.apple.com            ║
   ║  2. Certificates → Services IDs          ║
   ║  3. Create Service ID, enable Sign In    ║
   ║  4. Add your domain & redirect URI       ║
   ║  5. Copy Service ID below                ║
   ║                                          ║
   ╚══════════════════════════════════════════╝
   ═══════════════════════════════════════════ */

const Auth = (function(){

  // ══════════════════════════════════════
  // ▸▸▸ PASTE YOUR KEYS HERE ◂◂◂
  // ══════════════════════════════════════
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  const APPLE_CLIENT_ID  = 'com.yourcompany.subverse'; // Your Apple Service ID
  const APPLE_REDIRECT   = 'https://yourdomain.com/auth/apple/callback';
  // ══════════════════════════════════════

  let currentUser = null;

  // Load saved session
  function init(){
    try {
      const saved = localStorage.getItem('sv_user');
      if(saved) {
        currentUser = JSON.parse(saved);
        updateUI();
      }
    } catch(e){}

    // Initialize Google Sign-In when SDK loads
    if(window.google?.accounts){
      initGoogle();
    }
  }

  // ─── GOOGLE SIGN-IN ───────────────────
  function initGoogle(){
    if(GOOGLE_CLIENT_ID.includes('YOUR_')) return; // Not configured

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
    });
  }

  function loginGoogle(){
    if(GOOGLE_CLIENT_ID.includes('YOUR_')){
      // Demo mode — show what would happen
      showToast('Google Sign-In: Set your GOOGLE_CLIENT_ID in auth.js');
      demoLogin('Google User', 'user@gmail.com', 'google');
      return;
    }

    // Real Google One Tap
    google.accounts.id.prompt((notification) => {
      if(notification.isNotDisplayed()){
        // Fallback: use popup
        google.accounts.id.renderButton(
          document.createElement('div'),
          { type: 'icon', shape: 'circle' }
        );
        // Trigger the popup flow
        google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          callback: (response) => {
            if(response.access_token){
              fetchGoogleProfile(response.access_token);
            }
          }
        }).requestAccessToken();
      }
    });
  }

  function handleGoogleResponse(response){
    // Decode JWT token from Google
    const payload = decodeJWT(response.credential);
    if(payload){
      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'google',
        token: response.credential
      });
    }
  }

  async function fetchGoogleProfile(accessToken){
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setUser({
        name: data.name,
        email: data.email,
        picture: data.picture,
        provider: 'google',
        token: accessToken
      });
    } catch(e){
      showToast('Google login failed');
    }
  }

  // ─── APPLE SIGN-IN ────────────────────
  function loginApple(){
    if(APPLE_CLIENT_ID.includes('yourcompany')){
      showToast('Apple Sign-In: Set your APPLE_CLIENT_ID in auth.js');
      demoLogin('Apple User', 'user@icloud.com', 'apple');
      return;
    }

    // Real Apple Sign-In via redirect
    // Apple JS SDK must be loaded: https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js
    if(window.AppleID){
      AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: 'name email',
        redirectURI: APPLE_REDIRECT,
        usePopup: true
      });

      AppleID.auth.signIn().then(response => {
        const user = response.user || {};
        setUser({
          name: user.name ? `${user.name.firstName} ${user.name.lastName}` : 'Apple User',
          email: user.email || '',
          provider: 'apple',
          token: response.authorization?.id_token
        });
      }).catch(err => {
        if(err.error !== 'popup_closed_by_user'){
          showToast('Apple login failed');
        }
      });
    } else {
      // Fallback redirect method
      const params = new URLSearchParams({
        client_id: APPLE_CLIENT_ID,
        redirect_uri: APPLE_REDIRECT,
        response_type: 'code id_token',
        scope: 'name email',
        response_mode: 'form_post'
      });
      window.location.href = `https://appleid.apple.com/auth/authorize?${params}`;
    }
  }

  // ─── EMAIL LOGIN ──────────────────────
  function loginEmail(email, password){
    if(!email || !password){
      showToast('Enter email and password');
      return;
    }

    /*
     * ═══════════════════════════════════════
     * CONNECT YOUR BACKEND HERE
     * ═══════════════════════════════════════
     * 
     * Example with your own API:
     * 
     *   const res = await fetch('/api/auth/login', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ email, password })
     *   });
     *   const data = await res.json();
     *   if(data.success) setUser(data.user);
     * 
     * Example with Firebase:
     *   firebase.auth().signInWithEmailAndPassword(email, password)
     *     .then(cred => setUser({ name: cred.user.displayName, email: cred.user.email }))
     * 
     * Example with Supabase:
     *   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
     */

    // Demo mode
    demoLogin(email.split('@')[0], email, 'email');
  }

  // ─── SESSION MANAGEMENT ───────────────
  function setUser(user){
    currentUser = user;
    localStorage.setItem('sv_user', JSON.stringify(user));
    updateUI();
    showToast(`Welcome, ${user.name}!`);
    closeLoginModal();
  }

  function logout(){
    currentUser = null;
    localStorage.removeItem('sv_user');

    // Revoke Google session if applicable
    if(window.google?.accounts){
      google.accounts.id.disableAutoSelect();
    }

    updateUI();
    showToast('Logged out');
  }

  function getUser(){ return currentUser; }
  function isLoggedIn(){ return !!currentUser; }

  // ─── UI UPDATES ───────────────────────
  function updateUI(){
    const btn = document.getElementById('accountToggle');
    if(!btn) return;

    if(currentUser){
      // Show user avatar or initial
      const initial = currentUser.name?.charAt(0).toUpperCase() || '?';
      btn.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#38bdf8);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff">${initial}</div>`;
      btn.title = `${currentUser.name} — Click to manage`;
    } else {
      btn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      btn.title = 'Account';
    }
  }

  // ─── HELPERS ──────────────────────────
  function demoLogin(name, email, provider){
    setUser({ name, email, provider, token: 'demo_' + Date.now() });
  }

  function decodeJWT(token){
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
    } catch(e){ return null; }
  }

  function closeLoginModal(){
    const m = document.getElementById('loginModal');
    if(m) m.classList.remove('active');
  }

  function showToast(msg){
    if(window.toast) window.toast(msg);
  }

  return { init, loginGoogle, loginApple, loginEmail, logout, getUser, isLoggedIn };
})();

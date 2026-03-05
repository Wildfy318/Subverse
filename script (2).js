/* ═══════════════════════════════════════════
   SUBVERSE — Main Application
   Imports: music.js, particles.js, auth.js, payments.js
   ═══════════════════════════════════════════ */

const ADMIN_PASSWORD = 'subverse2026';
let adminAuth = false;
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const LS = {
  get(k){ try { return JSON.parse(localStorage.getItem('sv_'+k)) } catch { return null } },
  set(k,v){ try { localStorage.setItem('sv_'+k, JSON.stringify(v)) } catch {} }
};

// Make toast globally accessible for modules
window.toast = msg => {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(window._tt); window._tt = setTimeout(() => t.classList.remove('show'), 2500);
};

/* ─── PRODUCTS ──────────────────────── */
const DEFS = [
  {id:'spotify',name:'Spotify Premium',desc:'Ad-free music, offline downloads, high-quality audio.',color:'#1DB954',icon:'🎵',label:'Music',prices:{1:9.99,3:26.99,6:49.99,12:89.99}},
  {id:'prime',name:'Prime Video',desc:'Movies, TV shows, Amazon Originals in 4K.',color:'#00A8E1',icon:'🎬',label:'Movies & TV',prices:{1:8.99,3:24.99,6:44.99,12:79.99}},
  {id:'crunchyroll',name:'Crunchyroll',desc:'Ultimate anime — simulcasts, manga, ad-free.',color:'#F47521',icon:'🎌',label:'Anime',prices:{1:7.99,3:22.99,6:39.99,12:69.99}},
  {id:'chatgpt',name:'ChatGPT Plus',desc:'GPT-4, data analysis, image gen, priority.',color:'#10a37f',icon:'🤖',label:'AI',prices:{1:20,3:54.99,6:99.99,12:179.99}},
  {id:'claude',name:'Claude Pro',desc:'Premium Claude — higher limits, early features.',color:'#a78bfa',icon:'🧠',label:'AI',prices:{1:20,3:54.99,6:99.99,12:179.99}},
  {id:'youtube',name:'YouTube Premium',desc:'Ad-free, background play, YouTube Music.',color:'#FF0000',icon:'▶️',label:'Video',prices:{1:13.99,3:37.99,6:69.99,12:129.99}}
];

let products = LS.get('products') || JSON.parse(JSON.stringify(DEFS));
let cart = [], dur = {}, custChat = LS.get('cc') || [], ownerConvos = LS.get('oc') || [], activeCv = null;
products.forEach(p => dur[p.id] = Number(Object.keys(p.prices).sort((a,b)=>a-b)[0]) || 1);

/* ─── INIT ──────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => $('#intro').classList.add('done'), 2500);

  // Init modules
  if(typeof Auth !== 'undefined') Auth.init();
  if(typeof Payments !== 'undefined') Payments.init();

  // Music toggle
  $('#musicToggle').addEventListener('click', async () => {
    if(typeof Music !== 'undefined'){
      const playing = await Music.toggle();
      $('#musicBars').classList.toggle('playing', playing);
    }
  });

  renderPlat(); renderShop(); loadChat(); seedDemos();
  initFAQ(); initNav(); initTabs();
  updateOwnerBadge();

  // Scroll reveal
  setTimeout(() => {
    $$('.pl-card,.t-card,.faq-i,.sh,.s-card').forEach(el => {
      el.style.opacity = '0'; el.style.transform = 'translateY(14px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      obs.observe(el);
    });
  }, 2600);
});

const obs = new IntersectionObserver(ents => {
  ents.forEach(e => { if(e.isIntersecting){ e.target.style.opacity='1'; e.target.style.transform='translateY(0)' }});
}, { threshold: .08, rootMargin: '0px 0px -30px 0px' });

/* ─── NAV ───────────────────────────── */
function initNav(){
  window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 40), { passive: true });
  $('#hamburger').addEventListener('click', () => { $('#hamburger').classList.toggle('active'); $('#navLinks').classList.toggle('mob') });
  $$('.n-links a').forEach(a => a.addEventListener('click', () => { $('#hamburger').classList.remove('active'); $('#navLinks').classList.remove('mob') }));
}

/* ─── PLATFORMS ─────────────────────── */
function renderPlat(){
  $('#platformGrid').innerHTML = products.map(p =>
    `<div class="pl-card" onclick="document.getElementById('shop').scrollIntoView({behavior:'smooth'})">
      <span class="pi">${p.icon}</span><h3>${p.name.split(' ')[0]}</h3><p>${p.label||''}</p>
    </div>`).join('');
}

/* ─── SHOP ──────────────────────────── */
function renderShop(){
  $('#shopGrid').innerHTML = products.map(p => {
    const d = dur[p.id]||1, pr = p.prices[d]||0, ks = Object.keys(p.prices).sort((a,b)=>a-b);
    return `<div class="s-card">
      <div class="sc-top"><div class="sc-ico" style="background:${p.color}">${p.icon}</div><div><h3>${p.name}</h3><p class="sub">${ks.length} plans</p></div></div>
      <p class="sc-desc">${p.desc}</p>
      <div class="dur-r">${ks.map(m=>`<button class="dr ${d==m?'on':''}" onclick="pickD('${p.id}',${m})">${m} mo</button>`).join('')}</div>
      <div class="sc-pr"><span class="v">$${pr.toFixed(2)}</span><span class="p">/ ${d==1?'month':d+' months'}</span></div>
      <button class="atc" id="atc-${p.id}" onclick="addC('${p.id}')">Add to cart</button>
    </div>`;
  }).join('');
}
function pickD(id, m){ dur[id] = Number(m); renderShop(); }

/* ─── CART ──────────────────────────── */
function addC(pid){
  const p = products.find(x=>x.id===pid); if(!p) return;
  const d = dur[pid]||1, pr = p.prices[d]||0;
  const ex = cart.find(x=>x.pid===pid && x.d===d);
  if(ex) ex.q++; else cart.push({ pid, d, pr, q:1 });
  const b = $(`#atc-${pid}`);
  if(b){ b.classList.add('ok'); b.textContent='✓ Added'; setTimeout(()=>{ b.classList.remove('ok'); b.textContent='Add to cart' },1000) }
  updCart(); toast(`${p.name} added`);
}
function rmC(i){ cart.splice(i,1); updCart(); }
function updCart(){
  const qty = cart.reduce((s,x)=>s+x.q, 0);
  const tot = cart.reduce((s,x)=>s+x.pr*x.q, 0);
  const b = $('#cartBadge');
  if(qty>0){ b.classList.add('show'); b.textContent=qty } else b.classList.remove('show');
  const box = $('#cartItems');
  box.querySelectorAll('.cart-item').forEach(e=>e.remove());
  if(!cart.length){ $('#cartEmpty').style.display='flex'; $('#cartFooter').style.display='none'; return }
  $('#cartEmpty').style.display='none'; $('#cartFooter').style.display='block';
  cart.forEach((it,i) => {
    const p = products.find(x=>x.id===it.pid); if(!p) return;
    const el = document.createElement('div'); el.className='cart-item';
    el.innerHTML = `<div class="ci-i" style="background:${p.color}">${p.icon}</div>
      <div class="ci-inf"><h4>${p.name}</h4><span>${it.d} mo × ${it.q}</span></div>
      <span class="ci-p">$${(it.pr*it.q).toFixed(2)}</span>
      <button class="ci-x" onclick="rmC(${i})"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    box.appendChild(el);
  });
  $('#cartTotal').textContent = `$${tot.toFixed(2)}`;
}

// Checkout — uses Payments module
function startCheckout(){
  if(typeof Payments !== 'undefined'){
    Payments.startCheckout(cart, products);
  } else {
    if(!cart.length) return toast('Cart is empty');
    toast(`$${cart.reduce((s,x)=>s+x.pr*x.q,0).toFixed(2)} — add payments.js for real checkout`);
  }
}

function openCart(){ $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('active'); document.body.style.overflow='hidden' }
function closeCart(){ $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('active'); document.body.style.overflow='' }
$('#cartToggle').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);

/* ─── LOGIN — uses Auth module ──────── */
$('#accountToggle').addEventListener('click', () => {
  if(typeof Auth !== 'undefined' && Auth.isLoggedIn()){
    if(confirm('Logout?')) Auth.logout();
  } else {
    $('#loginModal').classList.add('active');
  }
});
$('#loginClose').addEventListener('click', () => $('#loginModal').classList.remove('active'));
$('#loginModal').addEventListener('click', e => { if(e.target===$('#loginModal')) $('#loginModal').classList.remove('active') });

function loginWithEmail(){
  const em = $('#loginEmail').value, pw = $('#loginPass').value;
  if(typeof Auth !== 'undefined') Auth.loginEmail(em, pw);
  else { toast(`Login: ${em}`); $('#loginModal').classList.remove('active'); }
}
function loginWithGoogle(){
  if(typeof Auth !== 'undefined') Auth.loginGoogle();
  else toast('Add auth.js for Google login');
}
function loginWithApple(){
  if(typeof Auth !== 'undefined') Auth.loginApple();
  else toast('Add auth.js for Apple login');
}

/* ─── CUSTOMER CHAT ─────────────────── */
function loadChat(){
  if(!custChat.length) custChat.push({t:'seller',x:'Hey! 👋 Welcome to Subverse. How can I help?',tm:tNow()});
  renderCC();
}
function renderCC(){
  const c=$('#chatMessages');
  c.innerHTML=custChat.map(m=>`<div class="bub ${m.t}">${m.x}<span class="ts">${m.tm}</span></div>`).join('');
  c.scrollTop=c.scrollHeight;
}
function sendCC(){
  const inp=$('#chatInput'), txt=inp.value.trim(); if(!txt) return;
  const tm=tNow();
  custChat.push({t:'customer',x:txt,tm}); renderCC(); inp.value='';
  LS.set('cc',custChat); pushOC('Customer',txt,tm);
}
function pushOC(name,txt,tm){
  let c=ownerConvos.find(x=>x.n===name);
  if(!c){c={id:'c_'+Date.now(),n:name,m:[],u:0};ownerConvos.push(c)}
  c.m.push({t:'customer',x:txt,tm}); c.u++;
  LS.set('oc',ownerConvos); updateOwnerBadge(); renderCL();
  if(activeCv===c.id) renderAC();
}
function toggleCC(){
  $('#chatWindow').classList.toggle('open');
  $('#chatBadge').classList.remove('show');
  if($('#chatWindow').classList.contains('open')){$('#chatInput').focus();$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
}
$('#chatToggle').addEventListener('click', toggleCC);
$('#chatClose').addEventListener('click', toggleCC);
$('#chatSend').addEventListener('click', sendCC);
$('#chatInput').addEventListener('keydown', e => { if(e.key==='Enter') sendCC() });

/* ─── OWNER CHAT ────────────────────── */
function updateOwnerBadge(){
  const n=ownerConvos.reduce((s,c)=>s+(c.u||0),0);
  const b=$('#ownerChatBadge');
  if(n>0) b.classList.add('show'); else b.classList.remove('show');
}
function renderCL(){
  const el=$('#ownerConvoList'), em=$('#ownerConvoEmpty');
  if(!ownerConvos.length){em.style.display='flex';el.querySelectorAll('.cv-i').forEach(e=>e.remove());return}
  em.style.display='none';
  const sorted=[...ownerConvos].sort((a,b)=>(b.u||0)-(a.u||0));
  el.innerHTML=em.outerHTML+sorted.map(c=>{
    const last=c.m[c.m.length-1]; const pv=last?last.x.substring(0,34)+(last.x.length>34?'…':''):'';
    return`<div class="cv-i ${activeCv===c.id?'on':''}" onclick="openCV('${c.id}')"><div class="cv-av">${c.n.substring(0,2).toUpperCase()}</div><div class="cv-inf"><h4>${c.n}</h4><p>${pv}</p></div>${c.u>0?'<div class="cv-dot"></div>':''}</div>`
  }).join('');
}
function openCV(id){
  activeCv=id; const c=ownerConvos.find(x=>x.id===id); if(!c) return;
  c.u=0; LS.set('oc',ownerConvos); updateOwnerBadge(); renderCL();
  $('#ownerChatPlaceholder').style.display='none';
  const v=$('#ownerChatView'); v.style.display='flex'; v.classList.add('show');
  renderAC(); $('#ownerReplyInput').focus();
}
function renderAC(){
  const c=ownerConvos.find(x=>x.id===activeCv); if(!c) return;
  const el=$('#ownerChatMsgs');
  el.innerHTML=c.m.map(m=>`<div class="bub ${m.t}">${m.x}<span class="ts">${m.tm}</span></div>`).join('');
  el.scrollTop=el.scrollHeight;
}
function sendOR(){
  const inp=$('#ownerReplyInput'), txt=inp.value.trim(); if(!txt||!activeCv) return;
  const tm=tNow(), c=ownerConvos.find(x=>x.id===activeCv); if(!c) return;
  c.m.push({t:'seller',x:txt,tm}); LS.set('oc',ownerConvos); renderAC(); renderCL(); inp.value='';
  if(c.n==='Customer'){ custChat.push({t:'seller',x:txt,tm}); LS.set('cc',custChat); renderCC();
    if(!$('#chatWindow').classList.contains('open')) $('#chatBadge').classList.add('show'); }
}
$('#ownerReplySend').addEventListener('click', sendOR);
$('#ownerReplyInput').addEventListener('keydown', e => { if(e.key==='Enter') sendOR() });
$('#ownerChatToggle').addEventListener('click', () => { if(!adminAuth) return showAuth('chat'); toggleOP() });
$('#ownerChatClose').addEventListener('click', () => $('#ownerChatPanel').classList.remove('open'));
function toggleOP(){ $('#ownerChatPanel').classList.toggle('open'); if($('#ownerChatPanel').classList.contains('open')) renderCL() }

function seedDemos(){
  if(ownerConvos.length) return;
  ownerConvos=[
    {id:'d1',n:'Alex M.',u:2,m:[{t:'customer',x:'Hi! Just bought Spotify 3-month. When do I get credentials?',tm:'14:22'},{t:'seller',x:'Hey Alex! Check your email — sent instantly.',tm:'14:24'},{t:'customer',x:'Found it, thanks! Can I upgrade later?',tm:'14:25'},{t:'customer',x:'Also do you have Netflix?',tm:'14:26'}]},
    {id:'d2',n:'Sarah K.',u:1,m:[{t:'customer',x:'My ChatGPT Plus code says invalid.',tm:'15:01'},{t:'seller',x:'Hi Sarah! Can you share the code?',tm:'15:03'},{t:'customer',x:'CGPT-XXXX-YYYY',tm:'15:04'},{t:'customer',x:'Any update?',tm:'15:30'}]},
    {id:'d3',n:'Mike R.',u:0,m:[{t:'customer',x:'Do you offer bulk discounts?',tm:'12:15'},{t:'seller',x:'Yes! 10% off for 3+. Code: BULK10',tm:'12:18'},{t:'customer',x:'Awesome, thanks!',tm:'12:19'}]}
  ];
  LS.set('oc', ownerConvos);
}

/* ─── ADMIN ─────────────────────────── */
let pAuth = null;
function showAuth(a){ pAuth=a||'admin'; $('#adminAuthModal').classList.add('active'); setTimeout(()=>$('#adminPassInput').focus(),100) }
function verifyAdminPassword(){
  if($('#adminPassInput').value===ADMIN_PASSWORD){
    adminAuth=true; $('#adminAuthModal').classList.remove('active'); $('#adminPassInput').value=''; toast('Admin unlocked ✓');
    if(pAuth==='chat') toggleOP(); else openAdm();
  } else { toast('Wrong password'); $('#adminPassInput').value=''; $('#adminPassInput').focus() }
}
$('#adminToggle').addEventListener('click', () => { if(!adminAuth) return showAuth('admin'); openAdm() });
$('#adminClose').addEventListener('click', () => $('#adminPanel').classList.remove('open'));
$('#adminAuthClose').addEventListener('click', () => $('#adminAuthModal').classList.remove('active'));
$('#adminAuthModal').addEventListener('click', e => { if(e.target===$('#adminAuthModal')) $('#adminAuthModal').classList.remove('active') });
$('#adminPassInput').addEventListener('keydown', e => { if(e.key==='Enter') verifyAdminPassword() });

function initTabs(){
  $$('.pt').forEach(t => t.addEventListener('click', () => {
    $$('.pt').forEach(x=>x.classList.remove('active')); $$('.pt-c').forEach(x=>x.classList.remove('active'));
    t.classList.add('active'); $(`#tab-${t.dataset.tab}`).classList.add('active');
  }));
}
function openAdm(){ renderAdm(); $('#adminPanel').classList.add('open') }
function renderAdm(){
  $('#adminProducts').innerHTML = products.map(p => {
    const ks=Object.keys(p.prices).sort((a,b)=>a-b);
    return`<div class="a-card"><div class="ac-t"><div class="ac-i" style="background:${p.color}">${p.icon}</div><div class="ac-inf"><h3>${p.name}</h3><span>${p.label||''}</span></div></div>
    <div class="ac-pr">${ks.map(m=>`<label>${m} mo<input type="number" step="0.01" value="${p.prices[m]}" id="ap-${p.id}-${m}"/></label>`).join('')}</div>
    <div class="ac-b"><button class="sv" onclick="saveP('${p.id}')">Save</button><button class="dl" onclick="delP('${p.id}')">Delete</button></div></div>`;
  }).join('');
}
function saveP(pid){ const p=products.find(x=>x.id===pid);if(!p)return;Object.keys(p.prices).forEach(m=>{const inp=$(`#ap-${pid}-${m}`);if(inp){const v=parseFloat(inp.value);if(!isNaN(v)&&v>=0)p.prices[m]=v}});LS.set('products',products);renderShop();renderPlat();toast(`${p.name} updated ✓`) }
function delP(pid){ const p=products.find(x=>x.id===pid);if(!p||!confirm(`Delete "${p.name}"?`))return;products=products.filter(x=>x.id!==pid);LS.set('products',products);renderAdm();renderShop();renderPlat();toast(`${p.name} deleted`) }
function adminAddProduct(){
  const name=$('#newName').value.trim(),icon=$('#newIcon').value.trim()||'📦',color=$('#newColor').value,label=$('#newLabel').value.trim(),desc=$('#newDesc').value.trim();
  const p1=parseFloat($('#newP1').value),p3=parseFloat($('#newP3').value),p6=parseFloat($('#newP6').value),p12=parseFloat($('#newP12').value);
  if(!name) return toast('Enter product name'); if(isNaN(p1)||p1<=0) return toast('Enter 1-month price');
  const prices={}; if(p1>0)prices[1]=p1;if(p3>0)prices[3]=p3;if(p6>0)prices[6]=p6;if(p12>0)prices[12]=p12;
  const id=name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now();
  products.push({id,name,desc:desc||name,color,icon,label,prices}); dur[id]=Number(Object.keys(prices).sort((a,b)=>a-b)[0]);
  LS.set('products',products);
  ['newName','newIcon','newLabel','newDesc','newP1','newP3','newP6','newP12'].forEach(x=>{const el=$('#'+x);if(el)el.value=''});
  $('#newColor').value='#E50914';
  renderShop();renderPlat();renderAdm();toast(`${name} added ✓`);
  $$('.pt').forEach(t=>t.classList.remove('active'));$$('.pt-c').forEach(c=>c.classList.remove('active'));
  $$('.pt')[0].classList.add('active');$('#tab-products').classList.add('active');
}

/* ─── FAQ ───────────────────────────── */
function initFAQ(){ $$('.faq-q').forEach(b=>b.addEventListener('click',()=>{const it=b.parentElement,o=it.classList.contains('open');$$('.faq-i').forEach(x=>x.classList.remove('open'));if(!o)it.classList.add('open')})) }

/* ─── UTILS ─────────────────────────── */
function tNow(){ return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){closeCart();$('#loginModal').classList.remove('active');$('#adminAuthModal').classList.remove('active');$('#adminPanel').classList.remove('open');$('#ownerChatPanel').classList.remove('open');if($('#chatWindow').classList.contains('open'))toggleCC()}
});

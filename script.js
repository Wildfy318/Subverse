/* ═══════════════════════════════════════════
   SUBVERSE v3 — Luxury Noir · Full Logic
   ═══════════════════════════════════════════ */

const ADMIN_PASSWORD = 'subverse2026';
let adminAuth = false;
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const LS = {
  get(k){ try{return JSON.parse(localStorage.getItem('sv_'+k))}catch{return null} },
  set(k,v){ try{localStorage.setItem('sv_'+k,JSON.stringify(v))}catch{} }
};

// ─── PRODUCTS ──────────────────────────
const DEFAULTS = [
  {id:'spotify',name:'Spotify Premium',desc:'Ad-free music, offline downloads, and high-quality audio streaming.',color:'#1DB954',icon:'🎵',label:'Music Streaming',prices:{1:9.99,3:26.99,6:49.99,12:89.99}},
  {id:'prime',name:'Prime Video',desc:'Thousands of movies, TV shows, and exclusive Amazon Originals in 4K.',color:'#00A8E1',icon:'🎬',label:'Movies & TV',prices:{1:8.99,3:24.99,6:44.99,12:79.99}},
  {id:'crunchyroll',name:'Crunchyroll',desc:'The ultimate anime platform — simulcasts, manga, ad-free viewing.',color:'#F47521',icon:'🎌',label:'Anime',prices:{1:7.99,3:22.99,6:39.99,12:69.99}},
  {id:'chatgpt',name:'ChatGPT Plus',desc:'GPT-4 access, data analysis, image generation, priority access.',color:'#10a37f',icon:'🤖',label:'AI Assistant',prices:{1:20.00,3:54.99,6:99.99,12:179.99}},
  {id:'claude',name:'Claude Pro',desc:'Premium Claude AI — higher limits, priority access, early features.',color:'#c8956b',icon:'🧠',label:'AI Assistant',prices:{1:20.00,3:54.99,6:99.99,12:179.99}},
  {id:'youtube',name:'YouTube Premium',desc:'Ad-free videos, background play, YouTube Music, offline downloads.',color:'#FF0000',icon:'▶️',label:'Video',prices:{1:13.99,3:37.99,6:69.99,12:129.99}}
];

let products = LS.get('products') || JSON.parse(JSON.stringify(DEFAULTS));
let cart = [];
let durations = {};
let custChat = LS.get('cust_chat') || [];
let ownerConvos = LS.get('owner_convos') || [];
let activeConvo = null;

products.forEach(p => durations[p.id] = Number(Object.keys(p.prices).sort((a,b)=>a-b)[0]) || 1);

// ─── INIT ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => $('#intro').classList.add('done'), 2400);
  renderPlatforms();
  renderProducts();
  loadChat();
  seedDemos();
  initFAQ();
  initScroll();
  initHamburger();
  initTabs();
  updateOwnerBadge();
});

// ─── PLATFORMS ─────────────────────────
function renderPlatforms(){
  $('#platformGrid').innerHTML = products.map(p =>
    `<div class="platform-card" onclick="document.getElementById('shop').scrollIntoView({behavior:'smooth'})">
      <span class="p-icon">${p.icon}</span><h3>${p.name.split(' ')[0]}</h3><p>${p.label||''}</p>
    </div>`).join('');
}

// ─── SHOP ──────────────────────────────
function renderProducts(){
  $('#shopGrid').innerHTML = products.map(p => {
    const d = durations[p.id] || 1, pr = p.prices[d] || 0;
    const keys = Object.keys(p.prices).sort((a,b)=>a-b);
    return `<div class="prod-card">
      <div class="pc-top"><div class="pc-logo" style="background:${p.color}">${p.icon}</div><div><h3>${p.name}</h3><p class="sub">${keys.length} plans</p></div></div>
      <p class="pc-desc">${p.desc}</p>
      <div class="dur-row">${keys.map(m=>`<button class="dur ${d==m?'on':''}" onclick="pickDur('${p.id}',${m})">${m} mo</button>`).join('')}</div>
      <div class="pc-price"><span class="val">$${pr.toFixed(2)}</span><span class="per">/ ${d==1?'month':d+' months'}</span></div>
      <button class="atc" id="atc-${p.id}" onclick="addCart('${p.id}')">Add to cart</button>
    </div>`;
  }).join('');
}

function pickDur(id,m){ durations[id]=Number(m); renderProducts(); }

// ─── CART ──────────────────────────────
function addCart(pid){
  const p = products.find(x=>x.id===pid); if(!p) return;
  const d = durations[pid]||1, pr = p.prices[d]||0;
  const ex = cart.find(x=>x.pid===pid && x.dur===d);
  if(ex) ex.qty++; else cart.push({pid,dur:d,price:pr,qty:1});
  const btn=$(`#atc-${pid}`);
  if(btn){btn.classList.add('ok');btn.textContent='✓ Added';setTimeout(()=>{btn.classList.remove('ok');btn.textContent='Add to cart'},1000)}
  updateCart(); toast(`${p.name} added to cart`);
}
function rmCart(i){ cart.splice(i,1); updateCart(); }
function updateCart(){
  const qty = cart.reduce((s,x)=>s+x.qty,0);
  const total = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const b=$('#cartBadge');
  if(qty>0){b.classList.add('show');b.textContent=qty} else b.classList.remove('show');
  const box=$('#cartItems');
  box.querySelectorAll('.cart-item').forEach(e=>e.remove());
  if(!cart.length){$('#cartEmpty').style.display='flex';$('#cartFooter').style.display='none';return}
  $('#cartEmpty').style.display='none'; $('#cartFooter').style.display='block';
  cart.forEach((it,i)=>{
    const p=products.find(x=>x.id===it.pid); if(!p) return;
    const el=document.createElement('div'); el.className='cart-item';
    el.innerHTML=`<div class="ci-icon" style="background:${p.color}">${p.icon}</div>
      <div class="ci-info"><h4>${p.name}</h4><span>${it.dur} mo × ${it.qty}</span></div>
      <span class="ci-price">$${(it.price*it.qty).toFixed(2)}</span>
      <button class="ci-rm" onclick="rmCart(${i})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    box.appendChild(el);
  });
  $('#cartTotal').textContent=`$${total.toFixed(2)}`;
}
function startCheckout(){
  if(!cart.length) return toast('Cart is empty');
  toast(`Checkout $${cart.reduce((s,x)=>s+x.price*x.qty,0).toFixed(2)} — payment integration needed`);
}
function openCart(){$('#cartDrawer').classList.add('open');$('#overlay').classList.add('active');document.body.style.overflow='hidden'}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#overlay').classList.remove('active');document.body.style.overflow=''}
$('#cartToggle').addEventListener('click',openCart);
$('#cartClose').addEventListener('click',closeCart);
$('#overlay').addEventListener('click',closeCart);

// ─── LOGIN ─────────────────────────────
$('#accountToggle').addEventListener('click',()=>$('#loginModal').classList.add('active'));
$('#loginClose').addEventListener('click',()=>$('#loginModal').classList.remove('active'));
$('#loginModal').addEventListener('click',e=>{if(e.target===$('#loginModal'))$('#loginModal').classList.remove('active')});
function loginWithEmail(){
  const em=$('#loginEmail').value; if(!em) return toast('Enter your email');
  toast(`Login: ${em} — auth needed`); $('#loginModal').classList.remove('active');
}
function loginWithGoogle(){ toast('Google sign-in — OAuth needed'); $('#loginModal').classList.remove('active'); }

// ─── CUSTOMER CHAT ─────────────────────
function loadChat(){
  if(!custChat.length) custChat.push({type:'seller',text:'Hey! 👋 Welcome to Subverse. How can I help?',time:timeNow()});
  renderCustChat();
}
function renderCustChat(){
  const c=$('#chatMessages');
  c.innerHTML=custChat.map(m=>`<div class="bubble ${m.type}">${m.text}<span class="ts">${m.time}</span></div>`).join('');
  c.scrollTop=c.scrollHeight;
}
function sendCustMsg(){
  const inp=$('#chatInput'), txt=inp.value.trim(); if(!txt) return;
  const t=timeNow();
  custChat.push({type:'customer',text:txt,time:t}); renderCustChat(); inp.value='';
  LS.set('cust_chat',custChat); pushOwner('Customer',txt,t);
}
function pushOwner(name,text,time){
  let c=ownerConvos.find(x=>x.name===name);
  if(!c){c={id:'c_'+Date.now(),name,msgs:[],unread:0};ownerConvos.push(c)}
  c.msgs.push({type:'customer',text,time}); c.unread++;
  LS.set('owner_convos',ownerConvos); updateOwnerBadge(); renderConvoList();
  if(activeConvo===c.id) renderActiveChat();
}
function toggleCustChat(){
  $('#chatWindow').classList.toggle('open');
  $('#chatBadge').classList.remove('show');
  if($('#chatWindow').classList.contains('open')){$('#chatInput').focus();$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
}
$('#chatToggle').addEventListener('click',toggleCustChat);
$('#chatClose').addEventListener('click',toggleCustChat);
$('#chatSend').addEventListener('click',sendCustMsg);
$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter')sendCustMsg()});

// ─── OWNER CHAT ────────────────────────
function updateOwnerBadge(){
  const n=ownerConvos.reduce((s,c)=>s+(c.unread||0),0);
  const b=$('#ownerChatBadge');
  if(n>0) b.classList.add('show'); else b.classList.remove('show');
}
function renderConvoList(){
  const el=$('#ownerConvoList'), em=$('#ownerConvoEmpty');
  if(!ownerConvos.length){em.style.display='flex';el.querySelectorAll('.convo-item').forEach(e=>e.remove());return}
  em.style.display='none';
  const sorted=[...ownerConvos].sort((a,b)=>(b.unread||0)-(a.unread||0));
  el.innerHTML = em.outerHTML + sorted.map(c=>{
    const last=c.msgs[c.msgs.length-1];
    const preview=last?last.text.substring(0,36)+(last.text.length>36?'…':''):'';
    return `<div class="convo-item ${activeConvo===c.id?'on':''}" onclick="openConvo('${c.id}')">
      <div class="convo-av">${c.name.substring(0,2).toUpperCase()}</div>
      <div class="convo-info"><h4>${c.name}</h4><p>${preview}</p></div>
      ${c.unread>0?'<div class="convo-dot"></div>':''}
    </div>`;
  }).join('');
}
function openConvo(id){
  activeConvo=id;
  const c=ownerConvos.find(x=>x.id===id); if(!c) return;
  c.unread=0; LS.set('owner_convos',ownerConvos); updateOwnerBadge(); renderConvoList();
  $('#ownerChatPlaceholder').style.display='none';
  const v=$('#ownerChatView'); v.style.display='flex'; v.classList.add('show');
  renderActiveChat(); $('#ownerReplyInput').focus();
}
function renderActiveChat(){
  const c=ownerConvos.find(x=>x.id===activeConvo); if(!c) return;
  const el=$('#ownerChatMsgs');
  el.innerHTML=c.msgs.map(m=>`<div class="bubble ${m.type}">${m.text}<span class="ts">${m.time}</span></div>`).join('');
  el.scrollTop=el.scrollHeight;
}
function sendOwnerReply(){
  const inp=$('#ownerReplyInput'), txt=inp.value.trim(); if(!txt||!activeConvo) return;
  const t=timeNow(), c=ownerConvos.find(x=>x.id===activeConvo); if(!c) return;
  c.msgs.push({type:'seller',text:txt,time:t}); LS.set('owner_convos',ownerConvos);
  renderActiveChat(); renderConvoList(); inp.value='';
  if(c.name==='Customer'){
    custChat.push({type:'seller',text:txt,time:t}); LS.set('cust_chat',custChat); renderCustChat();
    if(!$('#chatWindow').classList.contains('open')) $('#chatBadge').classList.add('show');
  }
}
$('#ownerReplySend').addEventListener('click',sendOwnerReply);
$('#ownerReplyInput').addEventListener('keydown',e=>{if(e.key==='Enter')sendOwnerReply()});
$('#ownerChatToggle').addEventListener('click',()=>{if(!adminAuth)return showAuth('chat');toggleOwnerPanel()});
$('#ownerChatClose').addEventListener('click',()=>$('#ownerChatPanel').classList.remove('open'));
function toggleOwnerPanel(){$('#ownerChatPanel').classList.toggle('open');if($('#ownerChatPanel').classList.contains('open'))renderConvoList()}

function seedDemos(){
  if(ownerConvos.length) return;
  ownerConvos=[
    {id:'d1',name:'Alex M.',unread:2,msgs:[
      {type:'customer',text:'Hi! Just bought Spotify 3-month. When do I get credentials?',time:'14:22'},
      {type:'seller',text:'Hey Alex! Check your email — credentials are sent instantly.',time:'14:24'},
      {type:'customer',text:'Found it, thanks! Can I upgrade to 12 months later?',time:'14:25'},
      {type:'customer',text:'Also do you have Netflix?',time:'14:26'}]},
    {id:'d2',name:'Sarah K.',unread:1,msgs:[
      {type:'customer',text:'Hello, my ChatGPT Plus code says invalid.',time:'15:01'},
      {type:'seller',text:'Hi Sarah! Can you share the code you received?',time:'15:03'},
      {type:'customer',text:'Sure: CGPT-XXXX-YYYY',time:'15:04'},
      {type:'customer',text:'Any update?',time:'15:30'}]},
    {id:'d3',name:'Mike R.',unread:0,msgs:[
      {type:'customer',text:'Do you offer bulk discounts?',time:'12:15'},
      {type:'seller',text:'Yes! 10% off for 3+ subscriptions. Code: BULK10',time:'12:18'},
      {type:'customer',text:'Awesome, thanks!',time:'12:19'}]}
  ];
  LS.set('owner_convos',ownerConvos);
}

// ─── ADMIN ─────────────────────────────
let pendingAuth=null;
function showAuth(action){pendingAuth=action||'admin';$('#adminAuthModal').classList.add('active');setTimeout(()=>$('#adminPassInput').focus(),100)}
function verifyAdminPassword(){
  if($('#adminPassInput').value===ADMIN_PASSWORD){
    adminAuth=true;$('#adminAuthModal').classList.remove('active');$('#adminPassInput').value='';toast('Admin unlocked ✓');
    if(pendingAuth==='chat')toggleOwnerPanel();else openAdmin();
  }else{toast('Wrong password');$('#adminPassInput').value='';$('#adminPassInput').focus()}
}
$('#adminToggle').addEventListener('click',()=>{if(!adminAuth)return showAuth('admin');openAdmin()});
$('#adminClose').addEventListener('click',()=>$('#adminPanel').classList.remove('open'));
$('#adminAuthClose').addEventListener('click',()=>$('#adminAuthModal').classList.remove('active'));
$('#adminAuthModal').addEventListener('click',e=>{if(e.target===$('#adminAuthModal'))$('#adminAuthModal').classList.remove('active')});
$('#adminPassInput').addEventListener('keydown',e=>{if(e.key==='Enter')verifyAdminPassword()});
function openAdmin(){renderAdmin();$('#adminPanel').classList.add('open')}
function initTabs(){
  $$('.ptab').forEach(t=>t.addEventListener('click',()=>{
    $$('.ptab').forEach(x=>x.classList.remove('active'));
    $$('.ptab-content').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');$(`#tab-${t.dataset.tab}`).classList.add('active');
  }));
}
function renderAdmin(){
  $('#adminProducts').innerHTML=products.map(p=>{
    const keys=Object.keys(p.prices).sort((a,b)=>a-b);
    return `<div class="admin-card"><div class="ac-top"><div class="ac-icon" style="background:${p.color}">${p.icon}</div><div class="ac-info"><h3>${p.name}</h3><span>${p.label||''}</span></div></div>
    <div class="ac-prices">${keys.map(m=>`<label>${m} mo<input type="number" step="0.01" value="${p.prices[m]}" id="ap-${p.id}-${m}"/></label>`).join('')}</div>
    <div class="ac-btns"><button class="sv" onclick="saveP('${p.id}')">Save</button><button class="dl" onclick="delP('${p.id}')">Delete</button></div></div>`;
  }).join('');
}
function saveP(pid){
  const p=products.find(x=>x.id===pid);if(!p)return;
  Object.keys(p.prices).forEach(m=>{const inp=$(`#ap-${pid}-${m}`);if(inp){const v=parseFloat(inp.value);if(!isNaN(v)&&v>=0)p.prices[m]=v}});
  LS.set('products',products);renderProducts();renderPlatforms();toast(`${p.name} updated ✓`);
}
function delP(pid){
  const p=products.find(x=>x.id===pid);if(!p||!confirm(`Delete "${p.name}"?`))return;
  products=products.filter(x=>x.id!==pid);LS.set('products',products);renderAdmin();renderProducts();renderPlatforms();toast(`${p.name} deleted`);
}
function adminAddProduct(){
  const name=$('#newName').value.trim(),icon=$('#newIcon').value.trim()||'📦',color=$('#newColor').value,label=$('#newLabel').value.trim(),desc=$('#newDesc').value.trim();
  const p1=parseFloat($('#newP1').value),p3=parseFloat($('#newP3').value),p6=parseFloat($('#newP6').value),p12=parseFloat($('#newP12').value);
  if(!name)return toast('Enter a product name');if(isNaN(p1)||p1<=0)return toast('Enter 1-month price');
  const prices={};if(p1>0)prices[1]=p1;if(p3>0)prices[3]=p3;if(p6>0)prices[6]=p6;if(p12>0)prices[12]=p12;
  const id=name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now();
  products.push({id,name,desc:desc||name,color,icon,label,prices});
  durations[id]=Number(Object.keys(prices).sort((a,b)=>a-b)[0]);
  LS.set('products',products);
  ['newName','newIcon','newLabel','newDesc','newP1','newP3','newP6','newP12'].forEach(x=>{const el=$('#'+x);if(el)el.value=''});
  $('#newColor').value='#E50914';
  renderProducts();renderPlatforms();renderAdmin();toast(`${name} added ✓`);
  $$('.ptab').forEach(t=>t.classList.remove('active'));$$('.ptab-content').forEach(c=>c.classList.remove('active'));
  $$('.ptab')[0].classList.add('active');$('#tab-products').classList.add('active');
}

// ─── FAQ ───────────────────────────────
function initFAQ(){$$('.faq-q').forEach(b=>b.addEventListener('click',()=>{const it=b.parentElement,o=it.classList.contains('open');$$('.faq-item').forEach(x=>x.classList.remove('open'));if(!o)it.classList.add('open')}))}

// ─── NAV SCROLL ────────────────────────
function initScroll(){window.addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>50),{passive:true})}

// ─── HAMBURGER ─────────────────────────
function initHamburger(){
  $('#hamburger').addEventListener('click',()=>{$('#hamburger').classList.toggle('active');$('#navLinks').classList.toggle('mob')});
  $$('.nav-center a').forEach(a=>a.addEventListener('click',()=>{$('#hamburger').classList.remove('active');$('#navLinks').classList.remove('mob')}));
}

// ─── TOAST ─────────────────────────────
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}
function timeNow(){return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}

// ─── SCROLL REVEAL ─────────────────────
const obs=new IntersectionObserver(ents=>{ents.forEach(e=>{if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)'}})},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{$$('.platform-card,.trust-item,.faq-item,.sec-head').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(16px)';el.style.transition='opacity .6s ease,transform .6s ease';obs.observe(el)})},2500)});

// ─── KEYBOARD ──────────────────────────
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();$('#loginModal').classList.remove('active');$('#adminAuthModal').classList.remove('active');$('#adminPanel').classList.remove('open');$('#ownerChatPanel').classList.remove('open');if($('#chatWindow').classList.contains('open'))toggleCustChat()}});

/* ═══════════════════════════════════════════════════════
   SUBVERSE — Main Application Logic
   Handles: Products, Cart, Chat, Auth, FAQ, Navigation
   ═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────
// PRODUCT DATA
// Each product has pricing per duration (months)
// ─────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'spotify',
    name: 'Spotify Premium',
    desc: 'Ad-free music streaming with offline downloads and high-quality audio across all your devices.',
    color: '#1DB954',
    icon: '🎵',
    prices: { 1: 9.99, 3: 26.99, 6: 49.99, 12: 89.99 }
  },
  {
    id: 'prime',
    name: 'Prime Video',
    desc: 'Stream thousands of movies, TV shows, and exclusive Amazon Originals in 4K HDR.',
    color: '#00A8E1',
    icon: '🎬',
    prices: { 1: 8.99, 3: 24.99, 6: 44.99, 12: 79.99 }
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll Premium',
    desc: 'The ultimate anime streaming platform. Simulcasts, manga, and ad-free viewing.',
    color: '#F47521',
    icon: '🎌',
    prices: { 1: 7.99, 3: 22.99, 6: 39.99, 12: 69.99 }
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT Plus',
    desc: 'Access GPT-4, advanced data analysis, image generation, and priority access during peak times.',
    color: '#10a37f',
    icon: '🤖',
    prices: { 1: 20.00, 3: 54.99, 6: 99.99, 12: 179.99 }
  },
  {
    id: 'claude',
    name: 'Claude Pro',
    desc: 'Premium access to Claude AI with higher usage limits, priority access, and early feature releases.',
    color: '#d4a27f',
    icon: '🧠',
    prices: { 1: 20.00, 3: 54.99, 6: 99.99, 12: 179.99 }
  },
  {
    id: 'youtube',
    name: 'YouTube Premium',
    desc: 'Ad-free videos, background play, YouTube Music Premium, and offline downloads included.',
    color: '#FF0000',
    icon: '▶️',
    prices: { 1: 13.99, 3: 37.99, 6: 69.99, 12: 129.99 }
  }
];

// ─────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────
let cart = [];
let selectedDurations = {}; // productId -> months
let chatMessages = [];

// Initialize selected durations to 1 month for every product
PRODUCTS.forEach(p => { selectedDurations[p.id] = 1; });

// ─────────────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─────────────────────────────────────────────────────
// RENDER PRODUCT CARDS
// Generates shop product cards from PRODUCTS data
// ─────────────────────────────────────────────────────
function renderProducts() {
  const grid = $('#shopGrid');
  grid.innerHTML = PRODUCTS.map((p, i) => `
    <div class="product-card" style="animation-delay: ${i * 0.08}s">
      <div class="product-card-head">
        <div class="product-logo" style="background: ${p.color}">${p.icon}</div>
        <div>
          <h3>${p.name}</h3>
          <p>${Object.keys(p.prices).length} plans available</p>
        </div>
      </div>
      <p class="product-desc">${p.desc}</p>
      <div class="duration-selector">
        ${[1, 3, 6, 12].map(m => `
          <button class="dur-btn ${selectedDurations[p.id] === m ? 'active' : ''}"
                  onclick="selectDuration('${p.id}', ${m})">${m} mo</button>
        `).join('')}
      </div>
      <div class="product-price">
        <span class="amount" id="price-${p.id}">$${p.prices[selectedDurations[p.id]].toFixed(2)}</span>
        <span class="period">/ ${selectedDurations[p.id] === 1 ? 'month' : selectedDurations[p.id] + ' months'}</span>
      </div>
      <button class="add-to-cart" id="atc-${p.id}" onclick="addToCart('${p.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add to Cart
      </button>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────
// DURATION SELECTION
// Updates price display when user picks a duration
// ─────────────────────────────────────────────────────
function selectDuration(productId, months) {
  selectedDurations[productId] = months;
  renderProducts(); // Re-render to update active states
}

// ─────────────────────────────────────────────────────
// CART FUNCTIONALITY
// ─────────────────────────────────────────────────────
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  const duration = selectedDurations[productId];
  const price = product.prices[duration];

  // Check if same product + duration already in cart
  const existing = cart.find(item => item.productId === productId && item.duration === duration);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId, duration, price, qty: 1 });
  }

  // Visual feedback on the add-to-cart button
  const btn = $(`#atc-${productId}`);
  btn.classList.add('added');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Added!`;
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add to Cart`;
  }, 1200);

  updateCart();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function updateCart() {
  const itemsEl = $('#cartItems');
  const emptyEl = $('#cartEmpty');
  const footerEl = $('#cartFooter');
  const badgeEl = $('#cartBadge');
  const totalEl = $('#cartTotal');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Badge
  if (totalQty > 0) {
    badgeEl.style.display = 'flex';
    badgeEl.textContent = totalQty;
  } else {
    badgeEl.style.display = 'none';
  }

  // Items list
  if (cart.length === 0) {
    emptyEl.style.display = 'flex';
    footerEl.style.display = 'none';
    // Remove any cart item elements but keep the empty state
    itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = 'block';

  // Build cart items HTML
  const cartHTML = cart.map((item, i) => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return `
      <div class="cart-item">
        <div class="cart-item-icon" style="background: ${product.color}">${product.icon}</div>
        <div class="cart-item-info">
          <h4>${product.name}</h4>
          <span>${item.duration} month${item.duration > 1 ? 's' : ''} × ${item.qty}</span>
        </div>
        <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        <button class="cart-item-remove" onclick="removeFromCart(${i})" aria-label="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }).join('');

  // Replace cart items (preserve empty element)
  itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
  emptyEl.insertAdjacentHTML('afterend', cartHTML);

  totalEl.textContent = `$${totalPrice.toFixed(2)}`;
}

// ─────────────────────────────────────────────────────
// CHECKOUT (Payment Integration Ready)
// ─────────────────────────────────────────────────────
/**
 * startCheckout()
 * 
 * This is where you'd integrate your payment provider.
 * 
 * STRIPE EXAMPLE:
 *   const stripe = Stripe('pk_live_xxxx');
 *   const response = await fetch('/api/create-checkout-session', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ items: cart })
 *   });
 *   const session = await response.json();
 *   await stripe.redirectToCheckout({ sessionId: session.id });
 * 
 * PAYPAL EXAMPLE:
 *   paypal.Buttons({
 *     createOrder: (data, actions) => actions.order.create({ ... }),
 *     onApprove: (data, actions) => actions.order.capture().then(...)
 *   }).render('#paypal-button');
 * 
 * APPLE PAY / GOOGLE PAY:
 *   Use Stripe's PaymentRequest API for both.
 */
function startCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty');
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  showToast(`Checkout initiated — $${total.toFixed(2)} (Payment API integration needed)`);
  
  // In production, redirect to Stripe Checkout or show embedded payment form
  console.log('Checkout cart:', JSON.stringify(cart, null, 2));
}

// ─────────────────────────────────────────────────────
// CART DRAWER TOGGLE
// ─────────────────────────────────────────────────────
function openCart() {
  $('#cartDrawer').classList.add('open');
  $('#overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  $('#cartDrawer').classList.remove('open');
  $('#overlay').classList.remove('active');
  document.body.style.overflow = '';
}

$('#cartToggle').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
$('#overlay').addEventListener('click', closeCart);

// ─────────────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────────────
function openLogin() { $('#loginModal').classList.add('active'); }
function closeLogin() { $('#loginModal').classList.remove('active'); }

$('#accountToggle').addEventListener('click', openLogin);
$('#loginClose').addEventListener('click', closeLogin);
$('#loginModal').addEventListener('click', (e) => {
  if (e.target === $('#loginModal')) closeLogin();
});

/**
 * loginWithEmail()
 * Placeholder for email/password authentication.
 * 
 * Replace with:
 * - Firebase Auth: firebase.auth().signInWithEmailAndPassword(email, pass)
 * - Supabase: supabase.auth.signInWithPassword({ email, password })
 * - Auth0: auth0Client.loginWithRedirect()
 */
function loginWithEmail() {
  const email = $('#loginEmail').value;
  const pass = $('#loginPass').value;
  if (!email || !pass) {
    showToast('Please enter email and password');
    return;
  }
  showToast(`Login attempted with ${email} (Auth integration needed)`);
  closeLogin();
  console.log('Auth login:', { email });
}

/**
 * loginWithGoogle()
 * Placeholder for Google OAuth.
 * 
 * Replace with:
 * - Firebase: firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
 * - Supabase: supabase.auth.signInWithOAuth({ provider: 'google' })
 */
function loginWithGoogle() {
  showToast('Google Sign-In (OAuth integration needed)');
  closeLogin();
}

// ─────────────────────────────────────────────────────
// CHAT WIDGET
// Seller chat system with local message storage (MVP)
// ─────────────────────────────────────────────────────

// Load saved messages from localStorage (MVP persistence)
function loadChatMessages() {
  try {
    const saved = localStorage.getItem('subverse_chat');
    if (saved) chatMessages = JSON.parse(saved);
  } catch (e) { /* ignore */ }
  
  // Add welcome message if no messages
  if (chatMessages.length === 0) {
    chatMessages.push({
      type: 'seller',
      text: 'Hey there! 👋 Welcome to Subverse. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }
  renderChatMessages();
}

function renderChatMessages() {
  const container = $('#chatMessages');
  container.innerHTML = chatMessages.map(msg => `
    <div class="chat-msg ${msg.type}">
      ${msg.text}
      <span class="time">${msg.time}</span>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

/**
 * sendMessage()
 * Sends a customer message and stores it locally.
 * 
 * TO CONNECT TO A BACKEND:
 * - WebSocket: ws.send(JSON.stringify({ type: 'message', text }))
 * - Firebase Firestore: db.collection('chats').add({ text, timestamp, userId })
 * - REST API: fetch('/api/chat', { method: 'POST', body: JSON.stringify({ text }) })
 */
function sendMessage() {
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Customer message
  chatMessages.push({ type: 'customer', text, time });
  renderChatMessages();
  input.value = '';

  // Save to localStorage
  try { localStorage.setItem('subverse_chat', JSON.stringify(chatMessages)); } catch (e) { /* ignore */ }

  // Simulate seller auto-reply (in production, this comes from WebSocket/backend)
  simulateSellerReply(text);
}

/**
 * receiveMessage()
 * Called when a seller message arrives from the backend.
 * 
 * In production, this would be triggered by:
 * - WebSocket: ws.onmessage = (event) => receiveMessage(JSON.parse(event.data))
 * - Firebase: db.collection('chats').onSnapshot(snapshot => ...)
 * - Polling: setInterval(() => fetch('/api/chat/new').then(...), 5000)
 */
function receiveMessage(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chatMessages.push({ type: 'seller', text, time });
  renderChatMessages();
  
  try { localStorage.setItem('subverse_chat', JSON.stringify(chatMessages)); } catch (e) { /* ignore */ }

  // Show badge if chat is closed
  if (!$('#chatWindow').classList.contains('open')) {
    $('#chatBadge').style.display = 'flex';
    $('#chatBadge').textContent = '!';
  }
}

// Auto-reply simulator (remove in production)
function simulateSellerReply(customerText) {
  const replies = [
    "Thanks for reaching out! Let me check that for you.",
    "Great question! Our subscriptions are delivered instantly after payment.",
    "I'd be happy to help! Could you tell me more about what you're looking for?",
    "Sure thing! All our subscriptions come with a 24-hour satisfaction guarantee.",
    "That's a popular choice! Would you like me to walk you through the process?",
    "Absolutely! You can mix and match any subscriptions in your cart.",
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  
  setTimeout(() => receiveMessage(reply), 1200 + Math.random() * 1000);
}

// Chat toggle
function toggleChat() {
  const chatWindow = $('#chatWindow');
  chatWindow.classList.toggle('open');
  $('#chatBadge').style.display = 'none';
  if (chatWindow.classList.contains('open')) {
    $('#chatInput').focus();
    $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  }
}

$('#chatToggle').addEventListener('click', toggleChat);
$('#chatClose').addEventListener('click', toggleChat);
$('#chatSend').addEventListener('click', sendMessage);
$('#chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// ─────────────────────────────────────────────────────
// FAQ ACCORDION
// ─────────────────────────────────────────────────────
$$('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    // Close all
    $$('.faq-item').forEach(el => el.classList.remove('open'));
    // Toggle current
    if (!isOpen) item.classList.add('open');
  });
});

// ─────────────────────────────────────────────────────
// NAVBAR SCROLL EFFECT
// ─────────────────────────────────────────────────────
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const navbar = $('#navbar');
  const scrollY = window.scrollY;
  
  if (scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = scrollY;
}, { passive: true });

// ─────────────────────────────────────────────────────
// MOBILE HAMBURGER MENU
// ─────────────────────────────────────────────────────
$('#hamburger').addEventListener('click', () => {
  $('#hamburger').classList.toggle('active');
  $('#navLinks').classList.toggle('mobile-open');
});

// Close mobile menu on link click
$$('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    $('#hamburger').classList.remove('active');
    $('#navLinks').classList.remove('mobile-open');
  });
});

// ─────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─────────────────────────────────────────────────────
// SCROLL REVEAL ANIMATION
// Adds a fade-in effect to sections as they enter view
// ─────────────────────────────────────────────────────
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  // Render products
  renderProducts();
  
  // Load chat messages
  loadChatMessages();
  
  // Observe sections for scroll animations
  $$('.platform-card, .trust-card, .faq-item, .section-header').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// ─────────────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Escape closes modals/drawers
  if (e.key === 'Escape') {
    closeCart();
    closeLogin();
    if ($('#chatWindow').classList.contains('open')) toggleChat();
  }
});

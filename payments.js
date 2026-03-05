/* ═══════════════════════════════════════════
   SUBVERSE — Payment Module
   Stripe Checkout + PayPal + Apple Pay + Google Pay
   
   ╔══════════════════════════════════════════╗
   ║  SETUP INSTRUCTIONS                      ║
   ╠══════════════════════════════════════════╣
   ║                                          ║
   ║  STRIPE:                                 ║
   ║  1. Go to dashboard.stripe.com           ║
   ║  2. Developers → API Keys               ║
   ║  3. Copy Publishable Key below           ║
   ║  4. For Checkout: create products in     ║
   ║     Stripe Dashboard, or use the         ║
   ║     server-side session approach          ║
   ║                                          ║
   ║  PAYPAL:                                 ║
   ║  1. Go to developer.paypal.com           ║
   ║  2. Create App → get Client ID           ║
   ║  3. Copy Client ID below                 ║
   ║                                          ║
   ║  APPLE PAY / GOOGLE PAY:                 ║
   ║  Both work through Stripe automatically  ║
   ║  when using Stripe's Payment Request     ║
   ║  Button — no extra setup needed.         ║
   ║                                          ║
   ║  BACKEND REQUIRED:                       ║
   ║  You need a server endpoint to create    ║
   ║  Stripe Checkout Sessions. Never put     ║
   ║  your Secret Key in frontend code.       ║
   ║                                          ║
   ╚══════════════════════════════════════════╝
   ═══════════════════════════════════════════ */

const Payments = (function(){

  // ══════════════════════════════════════
  // ▸▸▸ PASTE YOUR KEYS HERE ◂◂◂
  // ══════════════════════════════════════
  const STRIPE_PK = 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXXX'; // Your Stripe publishable key
  const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID';
  const CHECKOUT_API_URL = '/api/create-checkout-session'; // Your backend endpoint
  // ══════════════════════════════════════

  let stripe = null;

  function init(){
    // Initialize Stripe if SDK is loaded and key is set
    if(window.Stripe && !STRIPE_PK.includes('XXXX')){
      stripe = Stripe(STRIPE_PK);
    }
  }

  // ─── STRIPE CHECKOUT ──────────────────
  //
  // This is the recommended approach:
  // 1. Frontend sends cart to your backend
  // 2. Backend creates a Stripe Checkout Session
  // 3. Frontend redirects to Stripe's hosted checkout
  // 4. Stripe handles all card/wallet payments
  //
  async function checkoutWithStripe(cartItems){
    if(!stripe){
      showToast('Stripe: Set your STRIPE_PK in payments.js');
      showDemo(cartItems);
      return;
    }

    try {
      // Send cart to your backend to create a Checkout Session
      const response = await fetch(CHECKOUT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            name: item.name,
            price: Math.round(item.price * 100), // Stripe uses cents
            quantity: item.qty,
            duration: item.duration + ' months'
          })),
          success_url: window.location.origin + '/success',
          cancel_url: window.location.origin + '/#shop'
        })
      });

      const session = await response.json();

      if(session.error){
        showToast('Payment error: ' + session.error);
        return;
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });

      if(result.error){
        showToast(result.error.message);
      }
    } catch(err){
      showToast('Payment failed — check console');
      console.error('Stripe error:', err);
    }
  }

  // ─── STRIPE PAYMENT REQUEST (Apple Pay / Google Pay) ────
  //
  // This creates a native Apple Pay / Google Pay button
  // Works automatically on supported devices
  //
  function createWalletButton(container, cartItems){
    if(!stripe){
      return false;
    }

    const total = cartItems.reduce((sum, item) => sum + Math.round(item.price * 100) * item.qty, 0);

    const paymentRequest = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Subverse Checkout',
        amount: total
      },
      requestPayerName: true,
      requestPayerEmail: true
    });

    const prButton = stripe.elements().create('paymentRequestButton', {
      paymentRequest
    });

    // Check if Apple Pay / Google Pay is available
    paymentRequest.canMakePayment().then(result => {
      if(result){
        prButton.mount(container);
      }
    });

    paymentRequest.on('paymentmethod', async (ev) => {
      // Send to your backend for confirmation
      try {
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodId: ev.paymentMethod.id,
            items: cartItems
          })
        });
        const data = await response.json();

        if(data.success){
          ev.complete('success');
          showToast('Payment successful!');
        } else {
          ev.complete('fail');
          showToast('Payment failed');
        }
      } catch(err){
        ev.complete('fail');
      }
    });

    return true;
  }

  // ─── PAYPAL ───────────────────────────
  //
  // Renders PayPal buttons (PayPal, Venmo, Pay Later)
  //
  function createPayPalButton(container, cartItems){
    if(!window.paypal || PAYPAL_CLIENT_ID.includes('YOUR_')){
      return false;
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'black',
        shape: 'rect',
        label: 'pay'
      },

      createOrder: function(data, actions){
        return actions.order.create({
          purchase_units: [{
            description: 'Subverse Subscriptions',
            amount: {
              currency_code: 'USD',
              value: total,
              breakdown: {
                item_total: { currency_code: 'USD', value: total }
              }
            },
            items: cartItems.map(item => ({
              name: item.name,
              unit_amount: { currency_code: 'USD', value: item.price.toFixed(2) },
              quantity: String(item.qty),
              description: item.duration + ' months'
            }))
          }]
        });
      },

      onApprove: async function(data, actions){
        const order = await actions.order.capture();
        showToast('PayPal payment successful!');
        console.log('PayPal order:', order);

        // Send order details to your backend
        // fetch('/api/paypal/complete', { method: 'POST', body: JSON.stringify(order) })
      },

      onError: function(err){
        showToast('PayPal error');
        console.error('PayPal error:', err);
      }
    }).render(container);

    return true;
  }

  // ─── MAIN CHECKOUT FUNCTION ───────────
  //
  // Called from the cart — orchestrates payment
  //
  function startCheckout(cart, products){
    if(!cart || !cart.length){
      showToast('Cart is empty');
      return;
    }

    // Build clean cart items for payment
    const items = cart.map(item => {
      const product = products.find(p => p.id === item.pid);
      return {
        id: item.pid,
        name: product ? product.name : 'Unknown',
        price: item.pr,
        qty: item.q,
        duration: item.d
      };
    });

    const total = items.reduce((s, x) => s + x.price * x.qty, 0);

    // If Stripe is configured, use it
    if(stripe){
      checkoutWithStripe(items);
      return;
    }

    // Otherwise show demo
    showDemo(items);
  }

  // ─── DEMO MODE ────────────────────────
  function showDemo(items){
    const total = items.reduce((s, x) => s + x.price * x.qty, 0);
    showToast(`Checkout: $${total.toFixed(2)} — Configure payment keys in payments.js`);
    console.log('═══ CHECKOUT ITEMS ═══');
    console.table(items);
    console.log('To enable real payments:');
    console.log('1. Set STRIPE_PK in payments.js');
    console.log('2. Create a backend endpoint for /api/create-checkout-session');
    console.log('3. Add Stripe.js SDK to index.html');
  }

  function showToast(msg){
    if(window.toast) window.toast(msg);
  }

  return { init, startCheckout, createPayPalButton, createWalletButton };
})();

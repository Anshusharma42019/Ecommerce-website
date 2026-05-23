/* ----------------------------------------------------------
   1. CART STATE — single source of truth
   ---------------------------------------------------------- */
const Cart = (() => {
  const STORAGE_KEY = 'triven_cart';

  // Load cart from localStorage (persists across page refreshes for guests)
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  // Save cart array to localStorage
  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  // Get current cart items
  function getItems() { return load(); }

  // Find item index by product id
  function findIndex(id) { return load().findIndex(i => i.id === id); }

  // Add item or increment quantity
  function add(product) {
    const items = load();
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) {
      items[idx].qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    save(items);
    syncAll();
  }

  // Set exact quantity; removes item if qty reaches 0
  function setQty(id, qty) {
    let items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    if (qty <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].qty = qty;
    }
    save(items);
    syncAll();
  }

  // Get quantity for a specific product (0 if not in cart)
  function getQty(id) {
    const item = load().find(i => i.id === id);
    return item ? item.qty : 0;
  }

  // Total item count across all products
  function totalCount() {
    return load().reduce((sum, i) => sum + i.qty, 0);
  }

  // Clear cart
  function clear() {
    save([]);
    syncAll();
  }

  return { getItems, add, setQty, getQty, totalCount, clear };
})();

/* ----------------------------------------------------------
   2. BADGE — updates all .cart-count elements on the page
   ---------------------------------------------------------- */
function updateBadge() {
  const count = Cart.totalCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    // Animate badge on change
    el.classList.remove('badge-bump');
    void el.offsetWidth; // reflow to restart animation
    el.classList.add('badge-bump');
  });
}


/* ----------------------------------------------------------
   3. TOAST NOTIFICATION
   ---------------------------------------------------------- */
function showToast(name) {
  document.querySelector('.cart-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.innerHTML = `<i class="fas fa-check-circle"></i> <span><strong>${name}</strong> added to cart!</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('cart-toast--show'));
  setTimeout(() => {
    toast.classList.remove('cart-toast--show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 2800);
}

function showOrderToast(orderNumber) {
  document.querySelector('.order-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'order-toast';
  toast.innerHTML = `
    <div class="order-toast__icon"><i class="fas fa-check"></i></div>
    <div class="order-toast__body">
      <p class="order-toast__title">Order Placed Successfully!</p>
      <p class="order-toast__sub">${orderNumber} &nbsp;·&nbsp; Payment Confirmed</p>
    </div>
    <button class="order-toast__close" aria-label="Close"><i class="fas fa-times"></i></button>
    <div class="order-toast__bar"></div>
  `;
  document.body.appendChild(toast);
  toast.querySelector('.order-toast__close').addEventListener('click', () => dismissOrderToast(toast));
  requestAnimationFrame(() => toast.classList.add('order-toast--show'));
  setTimeout(() => dismissOrderToast(toast), 5000);
}

function showCodOrderToast(orderNumber) {
  document.querySelector('.order-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'order-toast';
  toast.innerHTML = `
    <div class="order-toast__icon"><i class="fas fa-check"></i></div>
    <div class="order-toast__body">
      <p class="order-toast__title">COD Order Confirmed!</p>
      <p class="order-toast__sub">${orderNumber} &nbsp;·&nbsp; ₹100 charge paid &nbsp;·&nbsp; Pay rest on delivery</p>
    </div>
    <button class="order-toast__close" aria-label="Close"><i class="fas fa-times"></i></button>
    <div class="order-toast__bar"></div>
  `;
  document.body.appendChild(toast);
  toast.querySelector('.order-toast__close').addEventListener('click', () => dismissOrderToast(toast));
  requestAnimationFrame(() => toast.classList.add('order-toast--show'));
  setTimeout(() => dismissOrderToast(toast), 6000);
}

function showErrorToast(message) {
  document.querySelector('.order-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'order-toast order-toast--error';
  toast.innerHTML = `
    <div class="order-toast__icon"><i class="fas fa-times"></i></div>
    <div class="order-toast__body">
      <p class="order-toast__title">Checkout Failed</p>
      <p class="order-toast__sub">${message}</p>
    </div>
    <button class="order-toast__close" aria-label="Close"><i class="fas fa-times"></i></button>
    <div class="order-toast__bar"></div>
  `;
  document.body.appendChild(toast);
  toast.querySelector('.order-toast__close').addEventListener('click', () => dismissOrderToast(toast));
  requestAnimationFrame(() => toast.classList.add('order-toast--show'));
  setTimeout(() => dismissOrderToast(toast), 5000);
}

function dismissOrderToast(toast) {
  toast.classList.remove('order-toast--show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}


/* ----------------------------------------------------------
   4. BUTTON RENDERER
   Switches between "Add to Cart" button and qty selector
   based on current cart state.
   ---------------------------------------------------------- */
function renderCartControl(wrapper, product) {
  const qty = Cart.getQty(product.id);

  if (qty === 0) {
    // Show "Add to Cart" button
    wrapper.innerHTML = `
      <button class="card-add-btn add-to-cart-btn" data-id="${product.id}">
        <i class="fas fa-shopping-cart"></i> Add
      </button>`;

    wrapper.querySelector('.add-to-cart-btn').addEventListener('click', () => {
      Cart.add(product);
      renderCartControl(wrapper, product); // re-render to qty selector
      showToast(product.name);
      updateBadge();
    });

  } else {
    // Show quantity selector
    wrapper.innerHTML = `
      <div class="qty-selector">
        <button class="qty-btn qty-minus" data-id="${product.id}" aria-label="Decrease">−</button>
        <span class="qty-value">${qty}</span>
        <button class="qty-btn qty-plus" data-id="${product.id}" aria-label="Increase">+</button>
      </div>`;

    wrapper.querySelector('.qty-minus').addEventListener('click', () => {
      Cart.setQty(product.id, qty - 1);
      renderCartControl(wrapper, product); // re-render (may revert to Add button if qty=0)
      updateBadge();
    });

    wrapper.querySelector('.qty-plus').addEventListener('click', () => {
      Cart.setQty(product.id, qty + 1);
      renderCartControl(wrapper, product);
      updateBadge();
    });
  }
}


/* ----------------------------------------------------------
   5. INIT — runs on DOMContentLoaded
   Reads data attributes from each product card and wires up
   the cart controls. Restores state from localStorage.
   ---------------------------------------------------------- */
function initCart() {
  // Update badge on every page load
  updateBadge();

  // Wire up every product card that has data-id, data-name, data-price
  document.querySelectorAll('.product-card[data-id]').forEach(card => {
    const product = {
      id:    card.dataset.id,
      name:  card.dataset.name,
      price: parseFloat(card.dataset.price),
    };

    // The .card-bottom div holds the price + button area
    const wrapper = card.querySelector('.cart-control');
    if (wrapper) renderCartControl(wrapper, product);
  });

  // Open cart drawer when cart icon is clicked
  document.querySelectorAll('.cart-icon').forEach(icon => {
    icon.addEventListener('click', e => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  // Close drawer on overlay click
  document.getElementById('cartDrawerOverlay')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cartDrawerClose')?.addEventListener('click', closeCartDrawer);

  // Checkout button — redirects to contact page with cart summary as query param
  document.querySelectorAll('.cart-checkout-btn').forEach(btn => {
    btn.addEventListener('click', handleCheckout);
  });

  // Auto open cart drawer if query parameter is present
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('openCart') === 'true') {
    setTimeout(() => {
      openCartDrawer();
      // Remove openCart and redirect from URL query parameters cleanly
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }, 150);
  }
}


/* ----------------------------------------------------------
   6. CART DRAWER — slide-out panel showing cart items
   ---------------------------------------------------------- */
function openCartDrawer() {
  renderDrawerItems();
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartDrawerOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartDrawerOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Selected payment method — 'cod' or 'razorpay'
let selectedPaymentMethod = 'cod';

async function handleCheckout() {
  const items = Cart.getItems();
  if (items.length === 0) return;

  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert("Please log in to proceed to checkout.");
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}&openCart=true`;
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.addresses || user.addresses.length === 0) {
    showAddressModal();
    return;
  }

  const payload = {
    items: items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.qty })),
    shippingAddressId: user.addresses[0]._id,
    paymentMethod: selectedPaymentMethod
  };

  const btn = document.querySelector('.cart-checkout-btn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  try {
    // Step 1: Create order
    const res = await fetch(`${ENV.ORDERS_API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.errors?.[0]?.message || 'Failed to place order');

    const order = data.data;

    if (selectedPaymentMethod === 'razorpay') {
      // Step 2: Create Razorpay order for full amount
      const rzpRes = await fetch(`${ENV.ORDERS_API}/payments/razorpay/${order._id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) throw new Error(rzpData.message || 'Payment initiation failed');

      btn.innerHTML = originalHtml;
      btn.disabled = false;

      // Step 3: Open Razorpay checkout for full payment
      await openRazorpayCheckout(rzpData.data, order, token);
    } else {
      // COD — open Razorpay to collect ₹100 confirmation charge
      btn.innerHTML = originalHtml;
      btn.disabled = false;
      await openCodConfirmationCheckout(order, token);
    }
  } catch (err) {
    showErrorToast(err.message);
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

function openRazorpayCheckout(rzpData, order, token) {
  return new Promise((resolve, reject) => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '';
    const options = {
      key: rzpData.razorpayKeyId || 'rzp_test_SsJNs2keLQvXko',
      amount: rzpData.amount,
      currency: rzpData.currency || 'INR',
      name: 'Triven Ayurveda',
      description: `Order #${order.orderNumber}`,
      image: 'https://triven-ayurveda.vercel.app/Frontend/assets/Trivenlogo.png',
      order_id: rzpData.razorpayOrderId,
      prefill: { name: userName, email: user.email || '', contact: user.phone || '' },
      method: { upi: true, card: true, netbanking: true, wallet: true, emi: false, paylater: false },
      config: {
        display: {
          blocks: {
            upi_block: {
              name: 'Pay via UPI',
              instruments: [
                { method: 'upi', flows: ['intent'], apps: ['google_pay'] },
                { method: 'upi', flows: ['intent'], apps: ['phonepe'] },
                { method: 'upi', flows: ['intent'], apps: ['paytm'] },
                { method: 'upi', flows: ['qr'] },
                { method: 'upi', flows: ['collect'] }
              ]
            },
            other: { name: 'Other Methods' }
          },
          sequence: ['block.upi_block', 'block.other'],
          preferences: { show_default_blocks: true }
        }
      },
      theme: { color: '#1e4d2b' },
      handler: async function (response) {
        try {
          const verifyRes = await fetch(`${ENV.ORDERS_API}/payments/razorpay/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: order._id
            })
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment verification failed');

          Cart.clear();
          updateBadge();
          renderDrawerItems();
          closeCartDrawer();
          showOrderToast(order.orderNumber);
          resolve();
        } catch (err) {
          showErrorToast(err.message);
          reject(err);
        }
      },
      modal: {
        ondismiss: function () {
          showErrorToast('Payment cancelled. Your order is saved — retry from Order History.');
          resolve();
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      showErrorToast('Payment failed: ' + (resp.error?.description || 'Unknown error'));
      resolve();
    });
    rzp.open();
  });
}

function openCodConfirmationCheckout(order, token) {
  return new Promise((resolve) => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '';
    const options = {
      key: 'rzp_test_SsJNs2keLQvXko',
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      name: 'Triven Ayurveda',
      description: `COD Confirmation — Order #${order.orderNumber}`,
      image: 'https://triven-ayurveda.vercel.app/Frontend/assets/Trivenlogo.png',
      prefill: { name: userName, email: user.email || '', contact: user.phone || '' },
      notes: { orderId: order._id, type: 'cod_confirmation' },
      method: { upi: true, card: true, netbanking: true, wallet: true, emi: false, paylater: false },
      theme: { color: '#1e4d2b' },
      handler: async function () {
        try {
          const confirmRes = await fetch(`${ENV.ORDERS_API}/orders/${order._id}/cod-confirm`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const confirmData = await confirmRes.json();
          if (!confirmRes.ok) throw new Error(confirmData.message || 'COD confirmation failed');

          Cart.clear();
          updateBadge();
          renderDrawerItems();
          closeCartDrawer();
          showCodOrderToast(order.orderNumber);
          resolve();
        } catch (err) {
          showErrorToast(err.message);
          resolve();
        }
      },
      modal: {
        ondismiss: function () {
          showErrorToast('COD confirmation cancelled. Your order is saved — retry from Order History.');
          resolve();
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      showErrorToast('COD confirmation payment failed: ' + (resp.error?.description || 'Unknown error'));
      resolve();
    });
    rzp.open();
  });
}

function renderDrawerItems() {
  const items = Cart.getItems();
  const list  = document.getElementById('cartDrawerList');
  const total = document.getElementById('cartDrawerTotal');
  if (!list) return;

  const checkoutBtn = document.querySelector('.cart-checkout-btn');

  if (items.length === 0) {
    list.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>`;
    if (total) total.textContent = '₹0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const isLoggedIn = !!localStorage.getItem('accessToken');
  const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null;
  const hasAddress = user && user.addresses && user.addresses.length > 0;

  // Render a warning banner in the drawer if the logged-in user doesn't have an address
  let warningDiv = document.getElementById('cartDrawerAddressWarning');
  if (!warningDiv) {
    warningDiv = document.createElement('div');
    warningDiv.id = 'cartDrawerAddressWarning';
    const footer = document.getElementById('cartDrawerFooter');
    if (footer) {
      footer.parentNode.insertBefore(warningDiv, footer);
    }
  }

  if (isLoggedIn && !hasAddress) {
    warningDiv.innerHTML = `
      <div style="background: #fff8e1; border: 1px solid #ffe082; color: #b78103; padding: 12px 16px; border-radius: 12px; margin: 16px; font-size: 0.88rem; display: flex; align-items: flex-start; gap: 10px; box-shadow: var(--shadow-sm); cursor: pointer;" onclick="document.querySelector('[aria-label=\\'Account\\']')?.click()">
        <i class="fas fa-exclamation-triangle" style="margin-top: 2px; font-size: 1rem;"></i>
        <div style="text-align: left;">
          <strong style="display: block; margin-bottom: 2px;">Shipping Address Required</strong>
          Please add a shipping address in your profile to checkout. <span style="text-decoration: underline; font-weight: 600;">Add now</span>
        </div>
      </div>
    `;
    warningDiv.style.display = 'block';
  } else {
    warningDiv.style.display = 'none';
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    if (!isLoggedIn) {
      checkoutBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In to Checkout';
    } else {
      checkoutBtn.innerHTML = selectedPaymentMethod === 'razorpay'
        ? '<i class="fas fa-credit-card"></i> Pay Online'
        : '<i class="fas fa-truck"></i> Pay \u20b9100 & Confirm COD';
    }
  }

  // Render payment method selector — anchor before the total row
  let paySelector = document.getElementById('cartPaymentSelector');
  if (!paySelector) {
    paySelector = document.createElement('div');
    paySelector.id = 'cartPaymentSelector';
    const totalRow = document.querySelector('#cartDrawerFooter .cart-drawer-total');
    if (totalRow) totalRow.parentNode.insertBefore(paySelector, totalRow);
  }
  paySelector.innerHTML = `
    <div class="pay-method-label">Payment Method</div>
    <div class="pay-method-options">
      <button class="pay-method-btn ${selectedPaymentMethod === 'cod' ? 'active' : ''}" data-method="cod">
        <i class="fas fa-truck"></i> Cash on Delivery
      </button>
      <button class="pay-method-btn ${selectedPaymentMethod === 'razorpay' ? 'active' : ''}" data-method="razorpay">
        <i class="fas fa-bolt"></i> Pay Online
      </button>
    </div>
    ${selectedPaymentMethod === 'cod' ? '<div class="cod-charge-note"><i class="fas fa-info-circle"></i> \u20b9100 paid now via Razorpay · rest on delivery</div>' : ''}
  `;
  paySelector.querySelectorAll('.pay-method-btn').forEach(b => {
    b.addEventListener('click', () => {
      selectedPaymentMethod = b.dataset.method;
      renderDrawerItems();
    });
  });

  list.innerHTML = items.map(item => `
    <div class="drawer-item" data-id="${item.id}">
      <div class="drawer-item-info">
        <span class="drawer-item-name">${item.name}</span>
        <span class="drawer-item-price">₹${item.price}</span>
      </div>
      <div class="drawer-item-qty">
        <button class="qty-btn drawer-minus" data-id="${item.id}">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn drawer-plus" data-id="${item.id}">+</button>
      </div>
    </div>`).join('');

  // Drawer qty controls
  list.querySelectorAll('.drawer-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      Cart.setQty(id, Cart.getQty(id) - 1);
      updateBadge();
      renderDrawerItems();
      syncPageButtons(id); // sync any visible product card on the same page
    });
  });
  list.querySelectorAll('.drawer-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      Cart.setQty(id, Cart.getQty(id) + 1);
      updateBadge();
      renderDrawerItems();
      syncPageButtons(id);
    });
  });

  // Compute total — no extra charge for COD, ₹100 is deducted from total at delivery
  const sum = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  if (total) total.textContent = `\u20b9${sum.toLocaleString('en-IN')}`;

  // Show breakdown for COD
  let codBreakdown = document.getElementById('cartCodBreakdown');
  if (selectedPaymentMethod === 'cod' && sum > 0) {
    if (!codBreakdown) {
      codBreakdown = document.createElement('div');
      codBreakdown.id = 'cartCodBreakdown';
      const totalRow = document.querySelector('#cartDrawerFooter .cart-drawer-total');
      if (totalRow) totalRow.parentNode.insertBefore(codBreakdown, totalRow.nextSibling);
    }
    const remaining = Math.max(0, sum - 100);
    codBreakdown.innerHTML = `
      <div class="cod-breakdown">
        <span><i class="fas fa-bolt"></i> Pay now (Razorpay)</span><span>\u20b9100</span>
        <span><i class="fas fa-truck"></i> Pay on delivery</span><span>\u20b9${remaining.toLocaleString('en-IN')}</span>
      </div>`;
  } else if (codBreakdown) {
    codBreakdown.innerHTML = '';
  }
}

// Re-render a specific product card's button after drawer changes
function syncPageButtons(id) {
  const card = document.querySelector(`.product-card[data-id="${id}"]`);
  if (!card) return;
  const wrapper = card.querySelector('.cart-control');
  if (!wrapper) return;
  renderCartControl(wrapper, {
    id,
    name:  card.dataset.name,
    price: parseFloat(card.dataset.price),
  });
}

// Sync all cart controls (used after any cart mutation)
function syncAll() {
  document.querySelectorAll('.product-card[data-id]').forEach(card => {
    const wrapper = card.querySelector('.cart-control');
    if (!wrapper) return;
    renderCartControl(wrapper, {
      id:    card.dataset.id,
      name:  card.dataset.name,
      price: parseFloat(card.dataset.price),
    });
  });
}

/* ----------------------------------------------------------
   LOCATION CONFIRM DIALOG
   ---------------------------------------------------------- */
function showLocationConfirm(oldState, newState, newCity) {
  return new Promise(resolve => {
    document.getElementById('locConfirmDialog')?.remove();
    const d = document.createElement('div');
    d.id = 'locConfirmDialog';
    d.style.cssText = 'position:fixed;inset:0;z-index:999999999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;';
    d.innerHTML = `
      <div style="background:#fff;border-radius:16px;max-width:340px;width:100%;padding:28px 24px;box-shadow:0 20px 50px rgba(0,0,0,0.25);font-family:'DM Sans',sans-serif;text-align:center;">
        <div style="width:52px;height:52px;background:#fff8e1;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <i class="fas fa-map-marker-alt" style="color:#f59e0b;font-size:1.3rem;"></i>
        </div>
        <p style="font-size:1rem;font-weight:700;color:#0d2818;margin:0 0 8px;">Different Location Detected</p>
        <p style="font-size:0.88rem;color:#666;margin:0 0 20px;line-height:1.6;">
          Your current location is in <strong style="color:#0d2818;">${newCity}, ${newState}</strong>,
          but your address shows <strong style="color:#0d2818;">${oldState}</strong>.
          <br/><br/>Are you visiting another state? Update City, State & Pincode?
        </p>
        <div style="display:flex;gap:10px;">
          <button id="locConfirmNo" style="flex:1;padding:11px;border:1.5px solid #ddd;border-radius:10px;background:#fff;color:#555;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;">Keep Existing</button>
          <button id="locConfirmYes" style="flex:1;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,#0d2818,#1a3d2b);color:#fff;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;">Yes, Update</button>
        </div>
      </div>
    `;
    document.body.appendChild(d);
    document.getElementById('locConfirmYes').onclick = () => { d.remove(); resolve(true); };
    document.getElementById('locConfirmNo').onclick  = () => { d.remove(); resolve(false); };
    d.addEventListener('click', e => { if (e.target === d) { d.remove(); resolve(false); } });
  });
}

/* ----------------------------------------------------------
   ADDRESS MODAL — shown when user has no address at checkout
   ---------------------------------------------------------- */
function showAddressModal() {
  document.getElementById('addressModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'addressModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 99999999;
    background: rgba(13,40,24,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; opacity: 0; transition: opacity 0.3s ease;
  `;

  modal.innerHTML = `
    <div id="addressModalBox" style="
      background: #fff; border-radius: 20px; width: 100%; max-width: 460px;
      max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      transform: translateY(30px); transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
      font-family: 'DM Sans', sans-serif;
    ">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0d2818, #1a3d2b); padding: 24px 24px 20px; border-radius: 20px 20px 0 0; position: relative;">
        <button id="closeAddressModal" style="position:absolute;top:14px;right:16px;background:rgba(255,255,255,0.15);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-times"></i>
        </button>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;background:rgba(255,255,255,0.12);border-radius:12px;display:flex;align-items:center;justify-content:center;">
            <i class="fas fa-map-marker-alt" style="color:#e8d07a;font-size:1.1rem;"></i>
          </div>
          <div>
            <p style="margin:0;font-size:1.1rem;font-weight:700;color:#fff;">Add Shipping Address</p>
            <p style="margin:0;font-size:0.82rem;color:rgba(255,255,255,0.6);">Required to place your order</p>
          </div>
        </div>
      </div>

      <!-- Location Button -->
      <div style="padding: 16px 24px 0;">
        <button id="useLocationBtn" style="
          width:100%; padding:12px; border:1.5px dashed rgba(13,40,24,0.25);
          border-radius:12px; background:#f4f9f4; color:#1a3d2b;
          font-family:'DM Sans',sans-serif; font-size:0.9rem; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          gap:10px; transition:all 0.2s;
        ">
          <i class="fas fa-crosshairs" style="color:#2d6a4f;"></i>
          Use My Current Location
        </button>
        <div id="locationStatus" style="font-size:0.8rem;color:#666;text-align:center;margin-top:8px;min-height:18px;"></div>
      </div>

      <!-- Divider -->
      <div style="display:flex;align-items:center;gap:12px;padding:12px 24px;">
        <div style="flex:1;height:1px;background:#eee;"></div>
        <span style="font-size:0.78rem;color:#aaa;font-weight:600;">OR ENTER MANUALLY</span>
        <div style="flex:1;height:1px;background:#eee;"></div>
      </div>

      <!-- Form -->
      <form id="addressForm" style="padding: 0 24px 24px; display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex;gap:12px;">
          <div style="flex:1;">
            <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">Full Name *</label>
            <input id="addrFullName" type="text" required placeholder="John Doe"
              style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
          </div>
          <div style="flex:1;">
            <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">Phone *</label>
            <input id="addrPhone" type="tel" required placeholder="10-digit number" pattern="[6-9][0-9]{9}"
              style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
          </div>
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">Address Line 1 *</label>
          <input id="addrLine1" type="text" required placeholder="House/Flat No, Street Name"
            style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">Landmark <span style="color:#aaa;font-weight:400;">(optional)</span></label>
          <input id="addrLine2" type="text" placeholder="Near Apollo Hospital"
            style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
        </div>
        <div style="display:flex;gap:12px;">
          <div style="flex:1;">
            <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">City *</label>
            <input id="addrCity" type="text" required placeholder="Mumbai"
              style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
          </div>
          <div style="flex:1;">
            <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">State *</label>
            <input id="addrState" type="text" required placeholder="Maharashtra"
              style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
          </div>
        </div>
        <div>
          <label style="font-size:0.8rem;font-weight:600;color:#0d2818;display:block;margin-bottom:6px;">Pincode *</label>
          <input id="addrPincode" type="text" required placeholder="6-digit pincode" pattern="[0-9]{6}" maxlength="6"
            style="width:100%;padding:11px 14px;border:1.5px solid rgba(13,40,24,0.12);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:0.9rem;outline:none;box-sizing:border-box;" />
        </div>

        <div id="addrError" style="display:none;background:#fee2e2;color:#b91c1c;border:1px solid #f87171;padding:10px 14px;border-radius:10px;font-size:0.85rem;"></div>

        <button type="submit" id="saveAddressBtn" style="
          width:100%;padding:14px;background:linear-gradient(135deg,#0d2818,#1a3d2b);
          color:#fff;border:none;border-radius:12px;font-family:'DM Sans',sans-serif;
          font-size:0.95rem;font-weight:700;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:10px;
          box-shadow:0 4px 20px rgba(13,40,24,0.2);transition:all 0.25s;
        ">
          <i class="fas fa-check"></i> Save & Continue to Checkout
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    document.getElementById('addressModalBox').style.transform = 'translateY(0)';
  });

  const closeModal = () => {
    modal.style.opacity = '0';
    modal.addEventListener('transitionend', () => modal.remove(), { once: true });
  };

  document.getElementById('closeAddressModal').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Focus styles on inputs
  modal.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('focus', () => inp.style.borderColor = '#2d6a4f');
    inp.addEventListener('blur',  () => inp.style.borderColor = 'rgba(13,40,24,0.12)');
  });

  // Pre-fill name & phone from logged-in user
  const _u = JSON.parse(localStorage.getItem('user') || '{}');
  if (_u.firstName) document.getElementById('addrFullName').value = `${_u.firstName} ${_u.lastName || ''}`.trim();
  if (_u.phone)     document.getElementById('addrPhone').value    = _u.phone;

  // Use Current Location
  document.getElementById('useLocationBtn').addEventListener('click', () => {
    const statusEl = document.getElementById('locationStatus');
    const locBtn   = document.getElementById('useLocationBtn');

    if (!navigator.geolocation) {
      statusEl.style.color = '#b91c1c';
      statusEl.textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    locBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting location...';
    locBtn.disabled  = true;
    statusEl.style.color = '#666';
    statusEl.textContent = 'Requesting location permission...';

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        statusEl.textContent = `Location found (±${Math.round(accuracy)}m) — fetching address...`;

        try {
          // Use Google Maps Geocoding-style fallback via Nominatim with accept-language=en
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('Geocoding request failed');
          const geo = await res.json();
          const a   = geo.address || {};

          const detectedCity    = a.city || a.town || a.municipality || a.city_district || a.village || '';
          const detectedState   = a.state || '';
          const detectedPincode = (a.postcode || '').replace(/\s/g, '');

          const fillFields = () => {
            document.getElementById('addrCity').value    = detectedCity;
            document.getElementById('addrState').value   = detectedState;
            document.getElementById('addrPincode').value = detectedPincode;
            ['addrCity','addrState','addrPincode'].forEach(id => {
              const el = document.getElementById(id);
              if (el.value) {
                el.style.borderColor = '#2d6a4f';
                el.style.background  = '#f0fdf4';
                setTimeout(() => { el.style.background = ''; el.style.borderColor = 'rgba(13,40,24,0.12)'; }, 2000);
              }
            });
            statusEl.style.color = '#15803d';
            statusEl.textContent = '\u2713 City, State & Pincode filled \u2014 please enter your address manually.';
          };

          const existingState = document.getElementById('addrState').value.trim();
          if (existingState && detectedState && existingState.toLowerCase() !== detectedState.toLowerCase()) {
            showLocationConfirm(existingState, detectedState, detectedCity).then(confirmed => {
              if (confirmed) fillFields();
              else {
                statusEl.style.color = '#b78103';
                statusEl.textContent = 'Location update cancelled. Existing address unchanged.';
              }
            });
          } else {
            fillFields();
          }
        } catch (err) {
          statusEl.style.color = '#b91c1c';
          statusEl.textContent = 'Could not fetch address details. Please fill manually.';
        }

        locBtn.innerHTML = '<i class="fas fa-crosshairs" style="color:#2d6a4f;"></i> Use My Current Location';
        locBtn.disabled  = false;
      },
      (err) => {
        statusEl.style.color = '#b91c1c';
        statusEl.textContent =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access in your browser settings.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Location unavailable. Please fill the address manually.'
            : 'Location request timed out. Please fill manually.';
        locBtn.innerHTML = '<i class="fas fa-crosshairs" style="color:#2d6a4f;"></i> Use My Current Location';
        locBtn.disabled  = false;
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });

  // Save address form submit
  document.getElementById('addressForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const user  = JSON.parse(localStorage.getItem('user'));
    const errEl = document.getElementById('addrError');
    const saveBtn = document.getElementById('saveAddressBtn');
    const origHtml = saveBtn.innerHTML;

    errEl.style.display = 'none';
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    const payload = {
      fullName:     document.getElementById('addrFullName').value.trim(),
      phone:        document.getElementById('addrPhone').value.trim(),
      addressLine1: document.getElementById('addrLine1').value.trim(),
      addressLine2: document.getElementById('addrLine2').value.trim(),
      city:         document.getElementById('addrCity').value.trim(),
      state:        document.getElementById('addrState').value.trim(),
      pincode:      document.getElementById('addrPincode').value.trim(),
      isDefault:    true
    };

    try {
      const res = await fetch(`${ENV.PRODUCTS_API}/users/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0]?.message || data.message || 'Failed to save address');

      // Re-fetch user to get updated addresses
      const profileRes = await fetch(`${ENV.PRODUCTS_API}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileRes.ok) localStorage.setItem('user', JSON.stringify(profileData.data));

      closeModal();
      // Proceed to checkout automatically
      handleCheckout();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      saveBtn.innerHTML = origHtml;
      saveBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initCart);


/* ----------------------------------------------------------
   7. MOCK API STUBS (for future backend sync on login)
   ---------------------------------------------------------- */

/*
  POST   /api/cart/add
  Body:  { productId, qty }
  → Adds item to server-side cart for logged-in user

  PUT    /api/cart/update
  Body:  { productId, qty }
  → Updates quantity; qty=0 removes the item

  GET    /api/cart
  → Returns full cart array for the logged-in user
    Response: [{ productId, name, price, qty }, ...]

  DELETE /api/cart/clear
  → Empties the cart

  On login: call GET /api/cart, merge with localStorage cart,
  then clear localStorage and use server state going forward.

  Example merge-on-login:
  async function mergeCartOnLogin(userId) {
    const local = Cart.getItems();
    const res   = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
    const server = await res.json();
    // Merge: local qty takes precedence for existing items
    const merged = [...server];
    local.forEach(localItem => {
      const idx = merged.findIndex(s => s.productId === localItem.id);
      if (idx > -1) merged[idx].qty = Math.max(merged[idx].qty, localItem.qty);
      else merged.push({ productId: localItem.id, name: localItem.name, price: localItem.price, qty: localItem.qty });
    });
    await fetch('/api/cart/sync', { method: 'POST', body: JSON.stringify(merged), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    localStorage.removeItem('triven_cart'); // hand off to server
  }
*/

/* ----------------------------------------------------------
   CANCEL ORDER MODAL
   ---------------------------------------------------------- */
function showCancelModal(orderId, triggerBtn, refreshBtn) {
  document.querySelector('.cancel-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'cancel-modal-overlay';
  overlay.innerHTML = `
    <div class="cancel-modal" role="dialog" aria-modal="true">
      <div class="cancel-modal__header">
        <div class="cancel-modal__icon"><i class="fas fa-ban"></i></div>
        <div>
          <p class="cancel-modal__title">Cancel Order</p>
          <p class="cancel-modal__sub">Tell us why you want to cancel</p>
        </div>
      </div>
      <textarea class="cancel-modal__textarea" placeholder="e.g. Ordered by mistake, found a better price…" maxlength="300" rows="3"></textarea>
      <p class="cancel-modal__hint">Minimum 5 characters</p>
      <div class="cancel-modal__actions">
        <button class="cancel-modal__btn cancel-modal__btn--ghost">Keep Order</button>
        <button class="cancel-modal__btn cancel-modal__btn--danger" disabled>Confirm Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const textarea   = overlay.querySelector('.cancel-modal__textarea');
  const confirmBtn = overlay.querySelector('.cancel-modal__btn--danger');
  const keepBtn    = overlay.querySelector('.cancel-modal__btn--ghost');
  const hint       = overlay.querySelector('.cancel-modal__hint');

  requestAnimationFrame(() => overlay.classList.add('cancel-modal-overlay--show'));

  const close = () => {
    overlay.classList.remove('cancel-modal-overlay--show');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  };

  keepBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  textarea.addEventListener('input', () => {
    const valid = textarea.value.trim().length >= 5;
    confirmBtn.disabled = !valid;
    hint.style.color = valid ? 'var(--sage, #6b8f71)' : '';
  });

  confirmBtn.addEventListener('click', async () => {
    const reason = textarea.value.trim();
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling…';
    confirmBtn.disabled = true;
    keepBtn.disabled = true;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${ENV.ORDERS_API}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      close();
      if (res.ok) {
        showOrderToast('Order cancelled successfully.');
        refreshBtn.click();
      } else {
        showErrorToast(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      close();
      showErrorToast('An error occurred while cancelling.');
    }
  });
}

/* ----------------------------------------------------------
   Order History In-Drawer Logic
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    const orderHistoryBtn = document.getElementById('orderHistoryBtn');
    const orderHistoryBtnProd = document.getElementById('orderHistoryBtnProd');
    const btn = orderHistoryBtn || orderHistoryBtnProd;
    
    const cartDrawerList = document.getElementById('cartDrawerList');
    const cartDrawerFooter = document.getElementById('cartDrawerFooter');
    const cartDrawerHistory = document.getElementById('cartDrawerHistory');
    
    const closeHistoryDrawer = document.getElementById('close-user-history-drawer') || document.getElementById('close-user-history-drawer-prod');
    const historyBody = document.getElementById('user-history-body');
    const historyLoading = document.getElementById('history-loading-msg');
    const historyEmpty = document.getElementById('history-empty-msg');

    if (btn && cartDrawerHistory && cartDrawerList) {
        btn.addEventListener('click', async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('Please log in to view your order history.');
                return;
            }

            // Hide Cart contents, Show History contents
            cartDrawerList.style.display = 'none';
            cartDrawerFooter.style.display = 'none';
            cartDrawerHistory.style.display = 'flex';

            historyBody.innerHTML = '';
            historyLoading.style.display = 'block';
            historyEmpty.style.display = 'none';

            try {
                const res = await fetch(`${ENV.ORDERS_API}/orders/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                
                historyLoading.style.display = 'none';
                
                if (res.ok && data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                    data.data.forEach(order => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'order-history-card';
                        itemDiv.style.cursor = 'pointer';
                        
                        const cancelBtnHtml = '';

                        const orderDate = new Date(order.createdAt);
                        const deliveryDate = new Date(orderDate);
                        deliveryDate.setDate(deliveryDate.getDate() + 5);
                        const deliveryStr = deliveryDate.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
                        const showDelivery = !['cancelled','delivered','failed'].includes(order.status);

                        itemDiv.innerHTML = `
                            <div class="order-card-topbar"></div>
                            <div class="order-receipt-header">
                                <span class="order-receipt-brand">Triven Ayurveda</span>
                                <span class="order-receipt-type">Order Receipt</span>
                            </div>
                            <div class="order-card-inner">
                                <div class="order-card-header">
                                    <span class="order-card-id"><i class="fas fa-receipt"></i>${order.orderNumber || order._id.substring(18)}</span>
                                    <span class="order-card-date">${new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                                </div>
                                <div class="order-card-divider"></div>
                                <div class="order-card-body">
                                    <span class="order-card-price">₹${order.totalAmount.toLocaleString('en-IN')}</span>
                                    <span class="status-badge status-${order.status}"><i class="fas fa-circle"></i> ${order.status}</span>
                                </div>
                                ${showDelivery ? `<div style="display:flex;align-items:center;gap:6px;font-size:0.75rem;color:#16a34a;font-family:'DM Sans',sans-serif;font-weight:600;padding-bottom:4px;"><i class="fas fa-truck" style="font-size:0.7rem;"></i> Expected delivery by ${deliveryStr}</div>` : ''}
                                <div style="font-size:0.72rem;color:#94a3b8;font-family:'DM Sans',sans-serif;"><i class="fas fa-chevron-right" style="font-size:0.65rem;"></i> Tap for details</div>
                            </div>
                            ${cancelBtnHtml ? `<div class="order-tear-line"><span></span></div>${cancelBtnHtml}` : ''}
                        `;

                        // Click → show detail panel
                        itemDiv.addEventListener('click', (e) => {
                            if (e.target.classList.contains('cancel-order-btn') || e.target.closest('.cancel-order-btn')) return;
                            showOrderDetail(order);
                        });

                        historyBody.appendChild(itemDiv);
                    });
                } else {
                    historyEmpty.style.display = 'block';
                }
            } catch (error) {
                historyLoading.style.display = 'none';
                historyEmpty.style.display = 'block';
                historyEmpty.innerText = 'Failed to load order history.';
            }
        });
        
        // Handle Cancel Order
        historyBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-order-btn')) {
                const orderId = e.target.getAttribute('data-id');
                showCancelModal(orderId, e.target, btn);
            }
        });
    }

    if (closeHistoryDrawer) {
        closeHistoryDrawer.addEventListener('click', () => {
            cartDrawerHistory.style.display = 'none';
            cartDrawerList.style.display = 'flex';
            cartDrawerFooter.style.display = 'block';
        });
    }

    // ---- Order Detail Panel ----
    function showOrderDetail(order) {
        let panel = document.getElementById('orderDetailPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'orderDetailPanel';
            panel.style.cssText = 'position:absolute;inset:0;background:#f5f5f5;z-index:10;display:flex;flex-direction:column;overflow:hidden;font-family:"DM Sans",sans-serif;';
            document.getElementById('cartDrawer').appendChild(panel);
        }

        const subtotal = order.subtotal || 0;
        const discount = (order.discount || 0) + (order.couponDiscount || 0);
        const listingPrice = subtotal + discount;
        const shipping = order.shippingCharge || 0;
        const tax = order.taxAmount || 0;
        const fees = shipping + tax;
        const isUpi = order.paymentMethod === 'upi';
        const payLabel = isUpi ? 'UPI' : (order.paymentMethod || 'COD').toUpperCase().replace('_',' ');
        const orderId = order.orderNumber || order._id;

        const itemsHtml = (order.items || []).map(it => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #efefef;">
                ${it.thumbnail ? `<img src="${it.thumbnail}" alt="${it.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid #e0e0e0;">` : `<div style="width:48px;height:48px;border-radius:6px;background:#f5f5f5;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box" style="color:#ccc;"></i></div>`}
                <span style="font-size:0.88rem;color:#212121;flex:1;">${it.name}${it.quantity > 1 ? ` <span style="color:#878787;">×${it.quantity}</span>` : ''}</span>
                <span style="font-size:0.88rem;font-weight:600;color:#212121;">₹${(it.totalPrice || it.price * it.quantity).toLocaleString('en-IN')}</span>
            </div>`).join('');

        panel.innerHTML = `
            <!-- Header -->
            <div style="background:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #e0e0e0;flex-shrink:0;">
                <button id="closeOrderDetail" style="background:none;border:none;cursor:pointer;padding:4px;color:#212121;font-size:1.1rem;display:flex;align-items:center;">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <span style="font-size:1rem;font-weight:700;color:#212121;">Order Details</span>
            </div>

            <div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;">

                ${itemsHtml ? `
                <div style="background:#fff;border-radius:4px;padding:14px 16px;">
                    <div style="font-size:0.78rem;font-weight:700;color:#878787;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Items Ordered</div>
                    ${itemsHtml}
                </div>` : ''}

                <!-- Price Details card -->
                <div style="background:#fff;border-radius:4px;padding:16px;">
                    <div style="font-size:1rem;font-weight:700;color:#212121;margin-bottom:14px;">Price details</div>

                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#212121;">
                            <span>Listing price</span>
                            <span style="text-decoration:line-through;color:#878787;">₹${listingPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#212121;">
                            <span style="display:flex;align-items:center;gap:5px;">Special price <i class="fas fa-info-circle" style="color:#878787;font-size:0.75rem;"></i></span>
                            <span>₹${subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        ${fees > 0 ? `
                        <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#212121;">
                            <span style="display:flex;align-items:center;gap:5px;">Total fees <i class="fas fa-chevron-down" style="font-size:0.7rem;color:#878787;"></i></span>
                            <span>₹${fees.toLocaleString('en-IN')}</span>
                        </div>` : ''}
                    </div>

                    <div style="border-top:1px dashed #e0e0e0;margin:14px 0;"></div>

                    <div style="display:flex;justify-content:space-between;font-size:0.95rem;font-weight:700;color:#212121;">
                        <span>Total amount</span>
                        <span>₹${order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <!-- Paid By + Payment Status -->
                    <div style="margin-top:14px;background:#f5f5f5;border-radius:4px;overflow:hidden;">
                        <div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ebebeb;">
                            <span style="font-size:0.9rem;color:#212121;">Paid By</span>
                            <span style="font-size:0.9rem;font-weight:600;color:#212121;display:flex;align-items:center;gap:6px;">
                                ${isUpi ? `<span style="border:1.5px solid #424242;border-radius:3px;padding:1px 5px;font-size:0.7rem;font-weight:800;letter-spacing:0.5px;">UPI</span>` : `<i class="fas fa-money-bill-wave" style="color:#388e3c;"></i>`}
                                ${payLabel}
                            </span>
                        </div>
                        <div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:0.9rem;color:#212121;">Payment Status</span>
                            <span style="font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:0.4px;text-transform:uppercase;
                                ${order.paymentStatus === 'paid' || order.paymentStatus === 'captured' ? 'background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;' :
                                  order.paymentStatus === 'pending' ? 'background:#fffbeb;color:#b45309;border:1px solid #fde68a;' :
                                  order.paymentStatus === 'failed' ? 'background:#fef2f2;color:#991b1b;border:1px solid #fecaca;' :
                                  'background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;'}
                            ">
                                ${order.paymentStatus === 'paid' || order.paymentStatus === 'captured' ? '<i class="fas fa-check-circle" style="margin-right:4px;"></i>' :
                                  order.paymentStatus === 'pending' ? '<i class="fas fa-clock" style="margin-right:4px;"></i>' :
                                  order.paymentStatus === 'failed' ? '<i class="fas fa-times-circle" style="margin-right:4px;"></i>' :
                                  '<i class="fas fa-circle" style="margin-right:4px;"></i>'}
                                ${(order.paymentStatus || 'pending').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <!-- Download Invoice -->
                    ${order.invoiceUrl ? `
                    <a href="${order.invoiceUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;background:#f5f5f5;border-radius:4px;padding:13px;font-size:0.92rem;font-weight:600;color:#212121;text-decoration:none;border:1px solid #e0e0e0;">
                        <i class="fas fa-file-download" style="font-size:1rem;"></i> Download Invoice
                    </a>` : ''}

                    <!-- Retry Payment -->
                    ${(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && !['cancelled','delivered','returned','refunded'].includes(order.status) ? `
                    <button id="retryPaymentBtn" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;padding:13px;background:linear-gradient(135deg,#1e4d2b,#2d6a40);color:#fff;border:none;border-radius:4px;font-size:0.92rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">
                        <i class="fas fa-redo"></i> Retry Payment
                    </button>` : ''}
                </div>

                <!-- Offers earned -->
                <div style="background:#fff;border-radius:4px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span style="display:flex;align-items:center;gap:10px;font-size:0.9rem;color:#212121;">
                        <i class="fas fa-trophy" style="color:#878787;"></i> Offers earned
                    </span>
                    <i class="fas fa-chevron-down" style="color:#878787;font-size:0.8rem;"></i>
                </div>

                <!-- Expected Delivery -->
                ${(function() {
                    if (['cancelled','delivered','failed'].includes(order.status)) return '';
                    const d4 = new Date(order.createdAt); d4.setDate(d4.getDate() + 4);
                    const d5 = new Date(order.createdAt); d5.setDate(d5.getDate() + 5);
                    const fmt = d => d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
                    return '<div style="background:#f0fdf4;border-radius:4px;padding:14px 16px;border:1px solid #bbf7d0;display:flex;align-items:center;gap:12px;"><i class="fas fa-truck" style="color:#16a34a;font-size:1.1rem;flex-shrink:0;"></i><div><div style="font-size:0.72rem;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">Expected Delivery</div><div style="font-size:0.92rem;font-weight:700;color:#14532d;margin-top:3px;">' + fmt(d4) + ' – ' + fmt(d5) + '</div><div style="font-size:0.75rem;color:#16a34a;margin-top:1px;">4–5 business days from order date</div></div></div>';
                })()}

                <!-- Order ID -->
                <div style="background:#fff;border-radius:4px;padding:14px 16px;">
                    <div style="font-size:1rem;font-weight:700;color:#212121;margin-bottom:6px;">Order ID</div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:0.85rem;color:#878787;word-break:break-all;">${orderId}</span>
                        <button onclick="navigator.clipboard.writeText('${orderId}')" style="background:none;border:none;cursor:pointer;color:#2874f0;font-size:0.9rem;flex-shrink:0;" title="Copy"><i class="far fa-copy"></i></button>
                    </div>
                </div>

                ${order.shippingAddress ? `
                <div style="background:#fff;border-radius:4px;padding:14px 16px;">
                    <div style="font-size:0.78rem;font-weight:700;color:#878787;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Delivery Address</div>
                    <div style="font-size:0.88rem;color:#212121;line-height:1.6;">
                        ${order.shippingAddress.fullName ? `<strong>${order.shippingAddress.fullName}</strong><br>` : ''}
                        ${[order.shippingAddress.addressLine1, order.shippingAddress.addressLine2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')}
                    </div>
                </div>` : ''}

            </div>
        `;

        panel.style.display = 'flex';
        panel.querySelector('#closeOrderDetail').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // Retry Payment
        const retryBtn = panel.querySelector('#retryPaymentBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('accessToken');
                retryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initiating...';
                retryBtn.disabled = true;
                try {
                    const rzpRes = await fetch(`${ENV.ORDERS_API}/payments/razorpay/${order._id}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const rzpData = await rzpRes.json();
                    if (!rzpRes.ok) throw new Error(rzpData.message || 'Payment initiation failed');
                    retryBtn.innerHTML = '<i class="fas fa-redo"></i> Retry Payment';
                    retryBtn.disabled = false;
                    await openRazorpayCheckout(rzpData.data, order, token);
                    panel.style.display = 'none';
                } catch (err) {
                    showErrorToast(err.message);
                    retryBtn.innerHTML = '<i class="fas fa-redo"></i> Retry Payment';
                    retryBtn.disabled = false;
                }
            });
        }
    }
});

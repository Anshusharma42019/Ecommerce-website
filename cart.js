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
      <p class="order-toast__sub">${orderNumber} &nbsp;·&nbsp; Cash on Delivery</p>
    </div>
    <button class="order-toast__close" aria-label="Close"><i class="fas fa-times"></i></button>
    <div class="order-toast__bar"></div>
  `;
  document.body.appendChild(toast);
  toast.querySelector('.order-toast__close').addEventListener('click', () => dismissOrderToast(toast));
  requestAnimationFrame(() => toast.classList.add('order-toast--show'));
  setTimeout(() => dismissOrderToast(toast), 5000);
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
    alert("Please add a shipping address in your profile before checking out.");
    // Try to open the profile modal (works when logged in with modified class or original nav-icon class)
    const profileBtn = document.querySelector('[aria-label="Account"]') || document.querySelector('.nav-icon');
    if(profileBtn) profileBtn.click();
    return;
  }

  const payload = {
    items: items.map(i => ({
      productId: i.id,
      name: i.name,
      price: i.price,
      quantity: i.qty
    })),
    shippingAddressId: user.addresses[0]._id,
    paymentMethod: 'cod'
  };

  const btn = document.querySelector('.cart-checkout-btn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  try {
    const res = await fetch(`${ENV.ORDERS_API}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.errors?.[0]?.message || 'Failed to place order');

    // Success! Clear cart.
    Cart.clear();
    updateBadge();
    renderDrawerItems();
    closeCartDrawer();
    
    showOrderToast(data.data.orderNumber);
  } catch (err) {
    showErrorToast(err.message);
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
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
      checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Proceed to Checkout';
    }
  }

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

  // Compute total
  const sum = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  if (total) total.textContent = `₹${sum.toLocaleString('en-IN')}`;
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

                    <!-- Paid By -->
                    <div style="margin-top:14px;background:#f5f5f5;border-radius:4px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:0.9rem;color:#212121;">Paid By</span>
                        <span style="font-size:0.9rem;font-weight:600;color:#212121;display:flex;align-items:center;gap:6px;">
                            ${isUpi ? `<span style="border:1.5px solid #424242;border-radius:3px;padding:1px 5px;font-size:0.7rem;font-weight:800;letter-spacing:0.5px;">UPI</span>` : `<i class="fas fa-money-bill-wave" style="color:#388e3c;"></i>`}
                            ${payLabel}
                        </span>
                    </div>

                    <!-- Download Invoice -->
                    ${order.invoiceUrl ? `
                    <a href="${order.invoiceUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;background:#f5f5f5;border-radius:4px;padding:13px;font-size:0.92rem;font-weight:600;color:#212121;text-decoration:none;border:1px solid #e0e0e0;">
                        <i class="fas fa-file-download" style="font-size:1rem;"></i> Download Invoice
                    </a>` : ''}
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
    }
});

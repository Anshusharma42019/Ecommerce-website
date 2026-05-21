// ===== SCROLL PROGRESS BAR =====
const progressBar = document.getElementById('scroll-progress');

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  // Progress bar
  if (progressBar) progressBar.style.width = (scrollY / docHeight * 100) + '%';

  // Navbar glass effect
  if (navbar) navbar.classList.toggle('scrolled', scrollY > 60);

  // Back to top
  if (backToTop) backToTop.classList.toggle('visible', scrollY > 500);
}, { passive: true });

// ===== HAMBURGER (new 3-bar design) =====
if (hamburger && navLinks) {
  // Create Drawer Header for mobile and desktop (hidden/shown via CSS media queries)
  const drawerHeader = document.createElement('div');
  drawerHeader.className = 'drawer-header';
  
  // Close button (X)
  const closeBtn = document.createElement('div');
  closeBtn.className = 'drawer-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.onclick = () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  };
  drawerHeader.appendChild(closeBtn);

  // Logo
  const originalLogo = document.querySelector('.logo');
  if (originalLogo) {
    const drawerLogo = originalLogo.cloneNode(true);
    drawerLogo.classList.add('drawer-logo-inner');
    const logoText = drawerLogo.querySelector('.logo-text');
    if (logoText) logoText.style.display = 'block';
    drawerHeader.appendChild(drawerLogo);
  }

  // Tools (User + Cart)
  const originalTools = document.querySelector('.nav-tools');
  if (originalTools) {
    const navTools = originalTools.cloneNode(true);
    navTools.classList.add('drawer-tools');
    drawerHeader.appendChild(navTools);
  }
  
  navLinks.prepend(drawerHeader);

  // Add icons to nav links (hidden/shown via CSS media queries)
  const iconMap = {
    'Home': 'fa-house',
    'Shop All': 'fa-bag-shopping',
    'Categories': 'fa-layer-group',
    'Our Story': 'fa-leaf',
    'Contact': 'fa-envelope'
  };
  navLinks.querySelectorAll('a').forEach(a => {
    const text = a.textContent.trim();
    if (iconMap[text] && !a.querySelector('.mobile-link-icon')) {
      const icon = document.createElement('i');
      icon.className = `fas ${iconMap[text]} mobile-link-icon`;
      a.prepend(icon);
    }
  });

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// ===== SMOOTH SCROLL for anchor links =====
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth' });
  if (navLinks) navLinks.classList.remove('open');
  if (hamburger) hamburger.classList.remove('open');
});

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 90);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ===== HERO IMAGE SLIDESHOW =====
const heroImgs = document.querySelectorAll('.hero-img');
if (heroImgs.length > 1) {
  let heroIdx = 0;
  setInterval(() => {
    heroImgs[heroIdx].classList.remove('active');
    heroIdx = (heroIdx + 1) % heroImgs.length;
    heroImgs[heroIdx].classList.add('active');
  }, 4500);
}

// ===== COUNTER ANIMATION =====
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.target;
    const step = target / (1800 / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.4 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ===== TESTIMONIAL SLIDER =====
const track = document.getElementById('testimonialTrack');
if (track) {
  const cards = track.querySelectorAll('.testimonial-card');
  const dotsContainer = document.getElementById('dots');
  let current = 0;
  let autoSlide;

  if (dotsContainer) {
    cards.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => { goTo(i); resetAuto(); });
      dotsContainer.appendChild(dot);
    });
  }

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
    }
  }

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function resetAuto() {
    clearInterval(autoSlide);
    autoSlide = setInterval(() => goTo(current + 1), 5000);
  }
  resetAuto();

  // Touch/swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
  });
}

// ===== CONTACT FORM =====
const API_URL = ENV.LEADS_API;

function setLoading(btn, loading, originalHTML) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fas fa-spinner fa-spin"></i> भेज रहे हैं...'
    : originalHTML;
  btn.style.opacity = loading ? '0.8' : '1';
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const success = document.getElementById('formSuccess');
    const error = document.getElementById('formError');
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalHTML = btn ? btn.innerHTML : '';

    setLoading(btn, true, originalHTML);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('leadName').value,
          phone: document.getElementById('leadPhone').value,
          problem: document.getElementById('leadProblem').value
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Server returned an error');
      }
      if (success) success.classList.add('show');
      if (error) error.style.display = 'none';
      e.target.reset();
      setTimeout(() => { if (success) success.classList.remove('show'); }, 5000);
    } catch (err) {
      if (error) {
        error.textContent = '❌ कुछ गलत हुआ। कृपया पुनः प्रयास करें।';
        error.style.display = 'block';
      }
      setTimeout(() => { if (error) error.style.display = 'none'; }, 6000);
    } finally {
      setLoading(btn, false, originalHTML);
    }
  });
}

// ===== AUTO POPUP MODAL ON LOAD =====
window.addEventListener('load', () => {
  const modal = document.getElementById('leadModal');
  const closeModal = document.getElementById('closeModal');
  
  if (modal) {
    function closeIt() { modal.classList.remove('show'); }
    if (closeModal) closeModal.addEventListener('click', closeIt);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeIt(); });
    document.querySelectorAll('a[href]').forEach(a => {
      if (!a.getAttribute('href').startsWith('#')) a.addEventListener('click', closeIt);
    });
  }
});

// ===== MODAL FORM SUBMIT =====
const modalForm = document.getElementById('modalForm');
if (modalForm) {
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const success = document.getElementById('modalSuccess');
    const btn = modalForm.querySelector('button[type="submit"]');
    const originalHTML = btn ? btn.innerHTML : '';

    setLoading(btn, true, originalHTML);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('modalName').value,
          phone: document.getElementById('modalPhone').value,
          problem: document.getElementById('modalProblem').value
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Server rejected request');
      }
      if (success) success.style.display = 'block';
      e.target.reset();
      setTimeout(() => { 
        const modal = document.getElementById('leadModal');
        if (modal) modal.classList.remove('show');
        if (success) success.style.display = 'none';
      }, 3000);
    } catch (err) {
      const modal = document.getElementById('leadModal');
      const errEl = document.createElement('p');
      errEl.style.cssText = 'color:#e74c3c;font-size:0.88rem;margin-top:8px;text-align:center;';
      errEl.textContent = '❌ कुछ गलत हुआ। कृपया पुनः प्रयास करें।';
      modalForm.appendChild(errEl);
      setTimeout(() => errEl.remove(), 5000);
    } finally {
      setLoading(btn, false, originalHTML);
    }
  });
}

// ===== PRODUCT FILTERING & DYNAMIC LOADING =====
window.addEventListener('DOMContentLoaded', async () => {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  function formatImageUrl(url) {
      if (!url) return 'assets/productimg2.png';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '<i class="fas fa-star"></i>'.repeat(full)
      + (half ? '<i class="fas fa-star-half-alt"></i>' : '')
      + '<i class="far fa-star"></i>'.repeat(empty);
  }

  const PRODUCTS_API = ENV.PRODUCTS_API;
  const urlParams = new URLSearchParams(window.location.search);
  const activeCategory = urlParams.get('filter') || '';

  // Load categories into filter sidebar
  const catFilterGroup = document.getElementById('category-filter-group');
  if (catFilterGroup) {
    try {
      const catRes = await fetch(`${PRODUCTS_API}/categories`);
      const catData = await catRes.json();
      const cats = catRes.ok && Array.isArray(catData.data) ? catData.data.filter(c => c.isActive) : [];
      if (cats.length > 0) {
        catFilterGroup.innerHTML = '<h4>Categories</h4>' + cats.map(cat =>
          `<label class="filter-label">
            <input type="checkbox" class="filter-checkbox category-filter" value="${cat.slug}"${activeCategory === cat.slug ? ' checked' : ''} />
            ${cat.name}
          </label>`
        ).join('');
      } else {
        catFilterGroup.innerHTML = '<h4>Categories</h4><p style="color:var(--text-muted);font-size:0.85rem;margin:0;">No categories found.</p>';
      }
    } catch {
      catFilterGroup.innerHTML = '<h4>Categories</h4>';
    }
  }

  // Dynamic Fetch
  try {
    const res = await fetch(`${PRODUCTS_API}/products?limit=100`);
    const data = await res.json();
    const products = res.ok && data?.data && Array.isArray(data.data) ? data.data.filter(p => p.isActive) : [];
    if (products.length > 0) {
      productsGrid.innerHTML = '';
      products.forEach(product => {
        if (!product.isActive) return;

        // Compute price range
        let priceRange = 'under500';
        if (product.price >= 500 && product.price <= 1000) priceRange = '500-1000';
        else if (product.price > 1000) priceRange = 'over1000';

        const stockStatus = product.stock > 0 ? 'in-stock' : 'out-of-stock';
        const categorySlug = product.category ? product.category.slug : 'ayurveda';
        const categoryName = product.category ? product.category.name : 'AYURVEDA';
        const imageUrl = product.thumbnail ? formatImageUrl(product.thumbnail.url) : 'assets/productimg2.png';

        const card = document.createElement('div');
        card.className = 'product-card reveal visible';
        card.setAttribute('data-category', categorySlug);
        card.setAttribute('data-price-range', priceRange);
        card.setAttribute('data-stock', stockStatus);
        card.setAttribute('data-id', product._id);
        card.setAttribute('data-name', product.name);
        card.setAttribute('data-price', product.price);

        const badgeHtml = product.isFeatured ? `<span class="product-badge">Featured</span>` : '';

        const rating = product.averageRating || 0;
        const reviewCount = product.ratingCount || 0;
        const ratingHtml = rating > 0
          ? renderStars(rating) + `<span>(${reviewCount})</span>`
          : '<span style="color:var(--text-muted);font-size:0.8rem;">No reviews yet</span>';

        card.innerHTML = `
          <div class="product-img">
            ${badgeHtml}
            <img src="${imageUrl}" alt="${product.name}" />
            <div class="product-actions">
              <button class="product-action-btn"><i class="far fa-eye"></i></button>
              <button class="product-action-btn"><i class="far fa-heart"></i></button>
            </div>
          </div>
          <div class="product-info">
            <div class="card-category">${categoryName.toUpperCase()}</div>
            <h3>${product.name}</h3>
            <div class="card-rating">${ratingHtml}</div>
            <div class="card-bottom">
              <div class="card-price">₹${product.price}</div>
              <div class="cart-control"></div>
            </div>
          </div>
        `;
        productsGrid.appendChild(card);
      });

      if (typeof syncAll === 'function') syncAll();
      applyFilters();
    }
  } catch (err) {
    console.warn('Failed to fetch dynamic products, falling back to static HTML:', err);
  }

  // Filters — re-query after potential dynamic rebuild
  const categoryFilters = () => document.querySelectorAll('.category-filter');
  const priceFilters = document.querySelectorAll('.price-filter');
  const stockFilters = document.querySelectorAll('.stock-filter');

  function applyFilters() {
    const selectedCategories = Array.from(categoryFilters()).filter(cb => cb.checked).map(cb => cb.value);
    const selectedPrices = Array.from(priceFilters).filter(cb => cb.checked).map(cb => cb.value);
    const selectedStocks = Array.from(stockFilters).filter(cb => cb.checked).map(cb => cb.value);

    // Re-query each time so dynamically added cards are included
    let visibleCount = 0;
    productsGrid.querySelectorAll('.product-card').forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const priceRange = card.getAttribute('data-price-range') || '';
      const stock = card.getAttribute('data-stock') || 'in-stock';

      const matchCategory = selectedCategories.length === 0 || selectedCategories.some(cat => category.includes(cat));
      const matchPrice = selectedPrices.length === 0 || selectedPrices.includes(priceRange);
      const matchStock = selectedStocks.length === 0 || selectedStocks.includes(stock);

      const show = matchCategory && matchPrice && matchStock;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });

    // Show/hide empty state
    let emptyMsg = productsGrid.querySelector('.no-products-msg');
    if (visibleCount === 0) {
      if (!emptyMsg) {
        emptyMsg = document.createElement('p');
        emptyMsg.className = 'no-products-msg';
        emptyMsg.style.cssText = 'grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);font-size:1.1rem;';
        emptyMsg.textContent = 'No products match the selected filters.';
        productsGrid.appendChild(emptyMsg);
      }
      emptyMsg.style.display = '';
    } else if (emptyMsg) {
      emptyMsg.style.display = 'none';
    }
  }

  // Use event delegation on the sidebar so dynamically rebuilt checkboxes are covered
  const filterSidebar = document.querySelector('.filter-sidebar');
  if (filterSidebar) filterSidebar.addEventListener('change', applyFilters);
  priceFilters.forEach(cb => cb.addEventListener('change', applyFilters));
  stockFilters.forEach(cb => cb.addEventListener('change', applyFilters));

  // Mobile Filter Toggle
  const filterToggle = document.getElementById('mobileFilterToggle');
  const sidebar = document.querySelector('.filter-sidebar');
  if (filterToggle && sidebar) {
    filterToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      filterToggle.innerHTML = sidebar.classList.contains('active') 
        ? '<i class="fas fa-times"></i> Close Filters' 
        : '<i class="fas fa-filter"></i> Filters';
    });
  }
});

// ===== ADD TO CART LOGIC =====
window.addEventListener('DOMContentLoaded', () => {
  const cartBtns = document.querySelectorAll('.add-to-cart-btn');
  const cartCounts = document.querySelectorAll('.cart-count');
  let currentCartCount = 0;

  cartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Update count
      currentCartCount++;
      
      // Update all cart count badges on the page
      cartCounts.forEach(c => {
        c.textContent = currentCartCount;
        c.style.transition = 'transform 0.2s ease';
        c.style.transform = 'scale(1.5)';
        setTimeout(() => c.style.transform = 'scale(1)', 200);
      });
      
      // Button animation
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Added';
      btn.style.background = 'var(--forest)';
      
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = '';
      }, 2000);
    });
  });
});

// ===== HOME FEATURED PRODUCTS LOADING =====
window.addEventListener('DOMContentLoaded', async () => {
  const featuredGrid = document.getElementById('featuredProductsGrid');
  if (!featuredGrid) return;

  function formatImageUrl(url) {
      if (!url) return 'assets/productimg2.png';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '<i class="fas fa-star"></i>'.repeat(full)
      + (half ? '<i class="fas fa-star-half-alt"></i>' : '')
      + '<i class="far fa-star"></i>'.repeat(empty);
  }

  const staticFallback = [
    { id: 'ayushira', name: 'Ayushira', price: 499, category: 'MIGRAINE & HEADACHE', img: 'assets/productimg2.png', badge: 'Best Seller', rating: 5, reviews: 124 },
    { id: 'migraine-kit', name: 'Migraine Kit', price: 1999, category: 'WELLNESS KITS', img: 'assets/productimg3.png', badge: 'New Combo', rating: 5, reviews: 89 },
    { id: 'manasvini', name: 'Manasvini', price: 699, category: 'STRESS & SLEEP', img: 'assets/productimgimg4.png', badge: 'Popular', rating: 5, reviews: 210 },
    { id: 'sirohara', name: 'Sirohara', price: 199, category: 'HAIR & SCALP', img: 'assets/productimg5.png', badge: '', rating: 5, reviews: 45 },
    { id: 'amrit-kalash', name: 'Amrit Kalash', price: 899, category: 'IMMUNITY', img: 'assets/amrit_kalash.png', badge: 'Top Rated', rating: 5, reviews: 67 },
    { id: 'triphala', name: 'Triphala Powder', price: 349, category: 'DIGESTION', img: 'assets/triphala_powder.png', badge: 'Herbal', rating: 5, reviews: 38 },
  ];

  function renderFeaturedCard(id, name, price, category, img, badge, rating, reviews, isApi = false) {
    const card = document.createElement('div');
    card.className = 'product-card reveal visible';
    card.setAttribute('data-id', id);
    card.setAttribute('data-name', name);
    card.setAttribute('data-price', price);
    const badgeHtml = badge ? `<span class="product-badge">${badge}</span>` : '';
    const starsHtml = renderStars(rating) + `<span>(${reviews})</span>`;
    card.innerHTML = `
      <div class="product-img">
        ${badgeHtml}
        <img src="${img}" alt="${name}" />
        <div class="product-actions">
          <button class="product-action-btn"><i class="far fa-eye"></i></button>
          <button class="product-action-btn"><i class="far fa-heart"></i></button>
        </div>
      </div>
      <div class="product-info">
        <div class="card-category">${category}</div>
        <h3>${name}</h3>
        <div class="card-rating">${starsHtml}</div>
        <div class="card-bottom">
          <div class="card-price">₹${price}</div>
          <div class="cart-control"></div>
        </div>
      </div>
    `;
    return card;
  }

  async function loadAndRender(products) {
    featuredGrid.innerHTML = '';
    products.forEach(product => {
      const imageUrl = product.thumbnail ? formatImageUrl(product.thumbnail.url) : 'assets/productimg2.png';
      const fRating = product.averageRating || 5;
      const fReviewCount = product.ratingCount || 0;
      const catName = (product.category?.name || 'Ayurveda').toUpperCase();
      const badge = product.isFeatured ? 'Featured' : (fRating >= 5 ? 'Top Rated' : '');
      featuredGrid.appendChild(renderFeaturedCard(product._id, product.name, product.price, catName, imageUrl, badge, fRating, fReviewCount));
    });
    if (typeof syncAll === 'function') syncAll();
  }

  try {
    // 1st: try featured products
    let res = await fetch(`${ENV.PRODUCTS_API}/products/featured?limit=6`);
    let data = await res.json();
    if (res.ok && data.data && data.data.length > 0) { loadAndRender(data.data); return; }

    // 2nd: fallback to top-rated active products
    res = await fetch(`${ENV.PRODUCTS_API}/products?limit=6&sort=-averageRating`);
    data = await res.json();
    if (res.ok && data.data && data.data.length > 0) { loadAndRender(data.data); return; }
  } catch (err) {
    console.warn('API unavailable, using static fallback.');
  }

  // Final static fallback
  featuredGrid.innerHTML = '';
  staticFallback.forEach(p => featuredGrid.appendChild(renderFeaturedCard(p.id, p.name, p.price, p.category, p.img, p.badge, p.rating, p.reviews)));
  if (typeof syncAll === 'function') syncAll();
});

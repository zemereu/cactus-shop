// shared.ts: API_BASE, escapeHtml, authFetch, starsDisplay, CART_STORAGE_KEY, CUSTOMER_NAME_KEY

const produsParams = new URLSearchParams(window.location.search);
const productId = produsParams.get('id');

// showToast, wishlist, toggleWishlist, isWishlisted, escapeHtml, starsDisplay, CART_STORAGE_KEY vin din shared.ts

interface ProdCactus { id: number; name: string; price: number; stock: number; description: string; imageUrl: string; category: string; mainCategory: string; productType: string; active: boolean; }
interface ProdReview { id: number; customerName: string; rating: number; comment: string; createdAt: string; }

// --- Coș ---
function produsLoadCart(): ProdCactus[] {
    try {
        const data = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        return Array.isArray(data) ? data.filter(item => item &&
            Number.isSafeInteger(item.id) && item.id > 0 && typeof item.name === 'string' &&
            Number.isFinite(item.price) && item.price >= 0 &&
            Number.isSafeInteger(item.stock) && item.stock >= 0) : [];
    } catch {
        return [];
    }
}
function produsSaveCart(cart: ProdCactus[]) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

async function loadProduct() {
    if (!productId) { showError(); return; }

    try {
        const response = await fetch(`${API_BASE}/api/cacti/${productId}`);
        if (!response.ok) { showError(); return; }
        const product: ProdCactus = await response.json();

        // Fetch all for similar products (lightweight — just this category)
        const allResponse = await fetch(`${API_BASE}/api/cacti?mainCategory=${encodeURIComponent(product.mainCategory)}&category=${encodeURIComponent(product.category)}&size=50`);
        const allData = await allResponse.json();
        const allProducts: ProdCactus[] = allData.content || allData;

        if (!product) { showError(); return; }

        document.title = `${product.name} - Cactus Shop`;
        // Dynamic SEO
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', `${product.name} — ${product.price} RON. ${product.description || 'Cactus Shop'}`);
        const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title'); ogTitle.setAttribute('content', product.name);
        if (!ogTitle.parentNode) document.head.appendChild(ogTitle);
        const ogDesc = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description'); ogDesc.setAttribute('content', `${product.price} RON — ${product.description || ''}`);
        if (!ogDesc.parentNode) document.head.appendChild(ogDesc);
        const ogImg = document.querySelector('meta[property="og:image"]') || document.createElement('meta');
        ogImg.setAttribute('property', 'og:image'); ogImg.setAttribute('content', product.imageUrl || '');
        if (!ogImg.parentNode) document.head.appendChild(ogImg);

        // Fill product details
        (document.getElementById('product-image') as HTMLImageElement).src = product.imageUrl || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80';
        document.getElementById('product-name')!.innerText = product.name;
        document.getElementById('product-category')!.innerText = `${product.mainCategory} — ${product.category}`;
        document.getElementById('product-price')!.innerText = `${product.price} RON`;
        document.getElementById('product-desc')!.innerText = product.description || 'Fără descriere.';

        const stockEl = document.getElementById('product-stock')!;
        if (product.stock > 0) {
            stockEl.innerHTML = `<i class="fa-solid fa-check" style="color:#2f694b;"></i> <strong style="color:#2f694b;">${product.stock} în stoc</strong>`;
        } else {
            stockEl.innerHTML = `<i class="fa-solid fa-xmark" style="color:#d32f2f;"></i> <strong style="color:#d32f2f;">Stoc epuizat</strong>`;
        }

        // Add to cart
        const addBtn = document.getElementById('product-add-cart')!;
        if (product.stock <= 0) {
            addBtn.style.backgroundColor = '#999';
            addBtn.style.cursor = 'not-allowed';
            addBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Stoc epuizat';
        } else {
            addBtn.addEventListener('click', () => {
                const cart = produsLoadCart();
                const inCart = cart.filter(c => c.id === product.id).length;
                if (inCart >= product.stock) {
                    showToast('<i class="fa-solid fa-triangle-exclamation" style="color:#FF9800;"></i> Stoc insuficient!');
                    return;
                }
                cart.push(product);
                produsSaveCart(cart);
                showToast('<i class="fa-solid fa-check" style="color:#2f694b;"></i> Adăugat în coș!');
            });
        }

        // Wishlist
        const wishBtn = document.getElementById('product-wishlist')!;
        updateWishBtn(wishBtn, product.id);
        wishBtn.addEventListener('click', () => {
            toggleWishlist(product.id);
            updateWishBtn(wishBtn, product.id);
        });

        // Zoom
        const prodImg = document.getElementById('product-image')!;
        prodImg.addEventListener('click', () => {
            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img') as HTMLImageElement;
            if (modal && zoomImg) { zoomImg.src = (prodImg as HTMLImageElement).src; modal.style.display = 'flex'; }
        });

        // Reviews
        loadProductReviews(product.id);

        // Similar products (same category, exclude current)
        const similar = allProducts.filter(p => p.id !== product.id && p.category === product.category && p.active).slice(0, 4);
        renderSimilar(similar);

        // Recently viewed — salvează în localStorage
        const RECENT_KEY = 'recentlyViewed';
        let recent: number[] = readStoredProductIds(RECENT_KEY);
        recent = recent.filter(id => id !== product.id);
        recent.unshift(product.id);
        if (recent.length > 8) recent = recent.slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));

        // Breadcrumbs
        document.getElementById('product-content')!.insertAdjacentHTML('afterbegin', `
            <div class="breadcrumbs">
                <a href="index.html">Acasă</a><span>›</span>
                <a href="shop.html">Magazin</a><span>›</span>
                <a href="shop.html">${escapeHtml(product.mainCategory)}</a><span>›</span>
                <a href="shop.html">${escapeHtml(product.category)}</a><span>›</span>
                <strong style="color:#333;">${escapeHtml(product.name)}</strong>
            </div>`);

        // Show content
        document.getElementById('product-loading')!.style.display = 'none';
        document.getElementById('product-content')!.style.display = 'block';

    } catch (e) {
        console.error(e);
        showError();
    }
}

function updateWishBtn(btn: HTMLElement, id: number) {
    const liked = wishlist.includes(id);
    btn.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart" style="color: ${liked ? '#d32f2f' : '#666'};"></i>`;
}

function showError() {
    document.getElementById('product-loading')!.style.display = 'none';
    document.getElementById('product-error')!.style.display = 'block';
}

async function loadProductReviews(cactusId: number) {
    const container = document.getElementById('product-reviews')!;
    try {
        const response = await fetch(`${API_BASE}/api/reviews/product/${cactusId}`);
        const reviews: ProdReview[] = await response.json();
        if (reviews.length === 0) {
            container.innerHTML = '<p style="color:#999; font-style:italic;">Nicio recenzie pentru acest produs.</p>';
            return;
        }
        container.innerHTML = reviews.map(r => `
            <div style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="color:#FF9800; font-size:1.1em;">${starsDisplay(r.rating)}</div>
                <p style="font-style:italic; color:#333; margin:8px 0;">"${escapeHtml(r.comment)}"</p>
                <span style="font-weight:bold; color:#2f694b;">${escapeHtml(r.customerName)}</span>
                <span style="color:#999; font-size:0.8em; margin-left:8px;">${escapeHtml(r.createdAt)}</span>
            </div>`).join('');
    } catch {
        container.innerHTML = '<p style="color:#d32f2f;">Nu am putut încărca recenziile.</p>';
    }
}

function renderSimilar(products: ProdCactus[]) {
    const container = document.getElementById('similar-products')!;
    if (products.length === 0) {
        container.innerHTML = '<p style="color:#999; font-style:italic; grid-column: span 4;">Niciun produs similar găsit.</p>';
        return;
    }
    container.innerHTML = products.map(p => {
        const img = p.imageUrl || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80';
        return `
        <a href="product.html?id=${p.id}" style="text-decoration:none; border:2px solid #2f694b; border-radius:8px; padding:10px; text-align:center; display:block;">
            <img loading="lazy" src="${escapeHtml(img)}" style="width:100%; height:120px; object-fit:cover; border-radius:6px;">
            <p style="color:#2f694b; font-weight:bold; margin:8px 0 4px; font-size:0.9em;">${escapeHtml(p.name)}</p>
            <p style="color:#d32f2f; font-weight:bold; margin:0;">${p.price} RON</p>
        </a>`;
    }).join('');
}

// Zoom close
const prodZoomModal = document.getElementById('zoom-modal');
const prodZoomClose = document.getElementById('zoom-close');
if (prodZoomModal) prodZoomModal.addEventListener('click', (e) => { if (e.target === prodZoomModal) prodZoomModal.style.display = 'none'; });
if (prodZoomClose) prodZoomClose.addEventListener('click', () => { if (prodZoomModal) prodZoomModal.style.display = 'none'; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && prodZoomModal) prodZoomModal.style.display = 'none'; });

loadProduct();
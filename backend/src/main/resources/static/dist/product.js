"use strict";
// Funcțiile și constantele comune vin din shared.ts.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const produsParams = new URLSearchParams(window.location.search);
const productId = produsParams.get('id');
function loadProduct() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!productId) {
            showError();
            return;
        }
        try {
            const response = yield fetch(`${API_BASE}/api/cacti/${productId}`);
            if (!response.ok) {
                showError();
                return;
            }
            const product = yield response.json();
            if (!product) {
                showError();
                return;
            }
            const reviewLink = document.getElementById('product-review-link');
            if (reviewLink) {
                reviewLink.href = `reviews.html?cactusId=${encodeURIComponent(String(product.id))}`;
                reviewLink.hidden = false;
            }
            document.title = `${product.name} - Cactus Shop`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', `${product.name} — ${formatPrice(product.price)} RON. ${product.description || 'Cactus Shop'}`);
            }
            const ogTitle = document.querySelector('meta[property="og:title"]') ||
                document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            ogTitle.setAttribute('content', product.name);
            if (!ogTitle.parentNode)
                document.head.appendChild(ogTitle);
            const ogDesc = document.querySelector('meta[property="og:description"]') ||
                document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            ogDesc.setAttribute('content', `${formatPrice(product.price)} RON — ${product.description || ''}`);
            if (!ogDesc.parentNode)
                document.head.appendChild(ogDesc);
            const ogImg = document.querySelector('meta[property="og:image"]') ||
                document.createElement('meta');
            ogImg.setAttribute('property', 'og:image');
            ogImg.setAttribute('content', product.imageUrl || '');
            if (!ogImg.parentNode)
                document.head.appendChild(ogImg);
            const productImage = document.getElementById('product-image');
            productImage.src = product.imageUrl ||
                'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80';
            productImage.alt = product.name;
            document.getElementById('product-name').innerText = product.name;
            const categoryEl = document.getElementById('product-category');
            categoryEl.textContent = [
                product.productType,
                product.mainCategory,
                product.category
            ].filter(value => value === null || value === void 0 ? void 0 : value.trim()).join(' · ') || 'Categorie nespecificată';
            categoryEl.insertAdjacentHTML('afterend', hybridBadge(product));
            categoryEl.style.display = 'inline-block';
            categoryEl.style.maxWidth = '100%';
            categoryEl.style.overflowWrap = 'anywhere';
            document.getElementById('product-price').innerText =
                `${formatPrice(product.price)} RON`;
            document.getElementById('product-location').textContent =
                `Locație: ${((_a = product.location) === null || _a === void 0 ? void 0 : _a.trim()) || 'Nespecificată'}`;
            const descriptionEl = document.getElementById('product-desc');
            descriptionEl.textContent = ((_b = product.description) === null || _b === void 0 ? void 0 : _b.trim()) || 'Fără descriere.';
            descriptionEl.style.whiteSpace = 'pre-line';
            const stockEl = document.getElementById('product-stock');
            if (product.stock > 0) {
                stockEl.innerHTML = `
                <i class="fa-solid fa-check" style="color:#2f694b;"></i>
                <strong style="color:#2f694b;">${product.stock} în stoc</strong>`;
            }
            else {
                stockEl.innerHTML = `
                <i class="fa-solid fa-xmark" style="color:#b32626;"></i>
                <strong style="color:#b32626;">Stoc epuizat</strong>`;
            }
            // Adăugare în coș cu verificarea stocului actual.
            const addBtn = document.getElementById('product-add-cart');
            if (product.stock <= 0) {
                addBtn.style.backgroundColor = '#999';
                addBtn.style.cursor = 'not-allowed';
                addBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Stoc epuizat';
            }
            else {
                let adding = false;
                addBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                    if (adding)
                        return;
                    adding = true;
                    addBtn.setAttribute('aria-busy', 'true');
                    try {
                        const response = yield fetch(`${API_BASE}/api/cacti/${product.id}`);
                        if (!response.ok)
                            throw new Error();
                        const fresh = yield response.json();
                        if (!Number.isSafeInteger(fresh.stock) || fresh.stock < 0) {
                            throw new Error();
                        }
                        const cart = loadCartFromStorage();
                        const inCart = cart.filter(c => c.id === product.id).length;
                        if (fresh.active === false || inCart >= fresh.stock) {
                            showToast('Stoc insuficient!');
                            return;
                        }
                        cart.push(product);
                        if (!saveCartToStorage(cart))
                            return;
                        showToast('Adăugat în coș!');
                    }
                    catch (_a) {
                        showToast('Nu am putut verifica stocul. Reîncearcă.');
                    }
                    finally {
                        adding = false;
                        addBtn.removeAttribute('aria-busy');
                    }
                }));
            }
            // Favorite
            const wishBtn = document.getElementById('product-wishlist');
            updateWishBtn(wishBtn, product.id);
            wishBtn.addEventListener('click', () => {
                toggleWishlist(product.id);
                updateWishBtn(wishBtn, product.id);
            });
            // Zoom accesibil și din tastatură.
            const prodImg = document.getElementById('product-image');
            prodImg.setAttribute('tabindex', '0');
            prodImg.setAttribute('role', 'button');
            prodImg.setAttribute('aria-label', 'Mărește imaginea produsului');
            prodImg.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    prodImg.click();
                }
            });
            prodImg.addEventListener('click', () => {
                const modal = document.getElementById('zoom-modal');
                const zoomImg = document.getElementById('zoom-img');
                if (modal && zoomImg) {
                    prodImg.focus();
                    zoomImg.src = prodImg.src;
                    modal.style.display = 'flex';
                    modal.dispatchEvent(new Event('zoom-open'));
                }
            });
            loadProductReviews(product.id);
            // Produse vizualizate recent
            const RECENT_KEY = 'recentlyViewed';
            let recent = readStoredProductIds(RECENT_KEY);
            recent = recent.filter(id => id !== product.id);
            recent.unshift(product.id);
            if (recent.length > 8)
                recent = recent.slice(0, 8);
            saveLocalValue(RECENT_KEY, JSON.stringify(recent));
            document.getElementById('product-content').insertAdjacentHTML('afterbegin', `
            <div class="breadcrumbs">
                <a href="index.html">Acasă</a><span>›</span>
                <a href="shop.html">Magazin</a><span>›</span>
                <a href="shop.html">${escapeHtml(product.mainCategory)}</a><span>›</span>
                <a href="shop.html">${escapeHtml(product.category)}</a><span>›</span>
                <strong style="color:#333;">${escapeHtml(product.name)}</strong>
            </div>`);
            document.getElementById('product-loading').style.display = 'none';
            document.getElementById('product-content').style.display = 'block';
            void loadSimilarProducts(product);
        }
        catch (e) {
            console.error(e);
            showError();
        }
    });
}
function updateWishBtn(btn, id) {
    const liked = wishlist.includes(id);
    btn.innerHTML = `
        <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"
           style="color: ${liked ? '#d32f2f' : '#666'};"></i>`;
}
function showError() {
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-error').style.display = 'block';
}
function loadProductReviews(cactusId) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('product-reviews');
        if (!container)
            return;
        container.innerHTML = '<p role="status">Se încarcă recenziile...</p>';
        try {
            const response = yield fetch(`${API_BASE}/api/reviews/product/${cactusId}`);
            if (!response.ok)
                throw new Error(yield responseError(response));
            const reviews = yield response.json();
            if (!Array.isArray(reviews))
                throw new Error('Răspuns de recenzii invalid.');
            if (reviews.length === 0) {
                container.innerHTML =
                    '<p style="color:#59645c; font-style:italic;">Nicio recenzie pentru acest produs.</p>';
                return;
            }
            container.innerHTML = reviews.map(r => `
            <div style="background:white; padding:15px; border-radius:8px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="color:#FF9800; font-size:1.1em;">${starsDisplay(r.rating)}</div>
                <p style="font-style:italic; color:#333; margin:8px 0;">"${escapeHtml(r.comment)}"</p>
                <span style="font-weight:bold; color:#2f694b;">${escapeHtml(r.customerName)}</span>
                <span style="color:#59645c; font-size:0.8em; margin-left:8px;">${escapeHtml(r.createdAt)}</span>
            </div>`).join('');
        }
        catch (_a) {
            container.innerHTML =
                '<p style="color:#b32626;">Nu am putut încărca recenziile.</p>';
        }
    });
}
function loadSimilarProducts(product) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${API_BASE}/api/cacti?productType=${encodeURIComponent(product.productType)}&mainCategory=${encodeURIComponent(product.mainCategory)}&category=${encodeURIComponent(product.category)}&size=50`);
            if (!response.ok)
                throw new Error('Similar products unavailable');
            const data = yield response.json();
            const products = data.content || data;
            renderSimilar(products.filter(p => p.id !== product.id &&
                p.category === product.category &&
                p.productType === product.productType &&
                p.active).slice(0, 4));
        }
        catch (_a) {
            const container = document.getElementById('similar-products');
            if (container) {
                container.textContent = 'Nu am putut încărca produsele similare.';
            }
        }
    });
}
function renderSimilar(products) {
    const container = document.getElementById('similar-products');
    if (products.length === 0) {
        container.innerHTML =
            '<p style="color:#59645c; font-style:italic; grid-column: span 4;">Niciun produs similar găsit.</p>';
        return;
    }
    container.innerHTML = products.map(p => {
        const img = p.imageUrl ||
            'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80';
        return `
            <a href="product.html?id=${p.id}" style="text-decoration:none; border:2px solid #2f694b; border-radius:8px; padding:10px; text-align:center; display:block;">
                <img loading="lazy" alt="${escapeHtml(p.name)}" src="${escapeHtml(img)}" style="width:100%; height:120px; object-fit:cover; border-radius:6px;">
                <p style="color:#2f694b; font-weight:bold; margin:8px 0 4px; font-size:0.9em;">${escapeHtml(p.name)}</p>
                <p style="color:#b32626; font-weight:bold; margin:0;">${formatPrice(p.price)} RON</p>
                ${hybridBadge(p)}
            </a>`;
    }).join('');
}
initImageZoom();
loadProduct();

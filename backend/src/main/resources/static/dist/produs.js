"use strict";
// shared.ts: API_BASE, escapeHtml, authFetch, starsDisplay, CART_STORAGE_KEY, CUSTOMER_NAME_KEY
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
const WISHLIST_KEY_P = 'wishlist';
let produsWishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY_P) || '[]');
function produsShowToast(message) {
    const container = document.getElementById('toast-container');
    if (!container)
        return;
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = 'background:#2f694b; color:#fdf2b8; padding:12px 20px; border-radius:8px; font-weight:bold; box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}
// --- Coș ---
function produsLoadCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    }
    catch (_a) {
        return [];
    }
}
function produsSaveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}
function loadProduct() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!productId) {
            showError();
            return;
        }
        try {
            const response = yield fetch(`${API_BASE}/api/cacti?size=1000`);
            if (!response.ok)
                throw new Error();
            const data = yield response.json();
            const allProducts = data.content || data;
            const product = allProducts.find(p => p.id === Number(productId));
            if (!product) {
                showError();
                return;
            }
            document.title = `${product.name} - Cactus Shop`;
            // Fill product details
            document.getElementById('product-image').src = product.imageUrl || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=600&q=80';
            document.getElementById('product-name').innerText = product.name;
            document.getElementById('product-category').innerText = `${product.mainCategory} — ${product.category}`;
            document.getElementById('product-price').innerText = `${product.price} RON`;
            document.getElementById('product-desc').innerText = product.description || 'Fără descriere.';
            const stockEl = document.getElementById('product-stock');
            if (product.stock > 0) {
                stockEl.innerHTML = `<i class="fa-solid fa-check" style="color:#2f694b;"></i> <strong style="color:#2f694b;">${product.stock} în stoc</strong>`;
            }
            else {
                stockEl.innerHTML = `<i class="fa-solid fa-xmark" style="color:#d32f2f;"></i> <strong style="color:#d32f2f;">Stoc epuizat</strong>`;
            }
            // Add to cart
            const addBtn = document.getElementById('product-add-cart');
            if (product.stock <= 0) {
                addBtn.style.backgroundColor = '#999';
                addBtn.style.cursor = 'not-allowed';
                addBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Stoc epuizat';
            }
            else {
                addBtn.addEventListener('click', () => {
                    const cart = produsLoadCart();
                    const inCart = cart.filter(c => c.id === product.id).length;
                    if (inCart >= product.stock) {
                        produsShowToast('<i class="fa-solid fa-triangle-exclamation" style="color:#FF9800;"></i> Stoc insuficient!');
                        return;
                    }
                    cart.push(product);
                    produsSaveCart(cart);
                    produsShowToast('<i class="fa-solid fa-check" style="color:#2f694b;"></i> Adăugat în coș!');
                });
            }
            // Wishlist
            const wishBtn = document.getElementById('product-wishlist');
            updateWishBtn(wishBtn, product.id);
            wishBtn.addEventListener('click', () => {
                const idx = produsWishlist.indexOf(product.id);
                if (idx === -1) {
                    produsWishlist.push(product.id);
                }
                else {
                    produsWishlist.splice(idx, 1);
                }
                localStorage.setItem(WISHLIST_KEY_P, JSON.stringify(produsWishlist));
                updateWishBtn(wishBtn, product.id);
            });
            // Zoom
            const prodImg = document.getElementById('product-image');
            prodImg.addEventListener('click', () => {
                const modal = document.getElementById('zoom-modal');
                const zoomImg = document.getElementById('zoom-img');
                if (modal && zoomImg) {
                    zoomImg.src = prodImg.src;
                    modal.style.display = 'flex';
                }
            });
            // Reviews
            loadProductReviews(product.id);
            // Similar products (same category, exclude current)
            const similar = allProducts.filter(p => p.id !== product.id && p.category === product.category && p.active).slice(0, 4);
            renderSimilar(similar);
            // Show content
            document.getElementById('product-loading').style.display = 'none';
            document.getElementById('product-content').style.display = 'block';
        }
        catch (e) {
            console.error(e);
            showError();
        }
    });
}
function updateWishBtn(btn, id) {
    const liked = produsWishlist.includes(id);
    btn.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart" style="color: ${liked ? '#d32f2f' : '#666'};"></i>`;
}
function showError() {
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-error').style.display = 'block';
}
function loadProductReviews(cactusId) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('product-reviews');
        try {
            const response = yield fetch(`${API_BASE}/api/reviews/product/${cactusId}`);
            const reviews = yield response.json();
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
        }
        catch (_a) {
            container.innerHTML = '<p style="color:#d32f2f;">Nu am putut încărca recenziile.</p>';
        }
    });
}
function renderSimilar(products) {
    const container = document.getElementById('similar-products');
    if (products.length === 0) {
        container.innerHTML = '<p style="color:#999; font-style:italic; grid-column: span 4;">Niciun produs similar găsit.</p>';
        return;
    }
    container.innerHTML = products.map(p => {
        const img = p.imageUrl || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80';
        return `
        <a href="produs.html?id=${p.id}" style="text-decoration:none; border:2px solid #2f694b; border-radius:8px; padding:10px; text-align:center; display:block;">
            <img src="${escapeHtml(img)}" style="width:100%; height:120px; object-fit:cover; border-radius:6px;">
            <p style="color:#2f694b; font-weight:bold; margin:8px 0 4px; font-size:0.9em;">${escapeHtml(p.name)}</p>
            <p style="color:#d32f2f; font-weight:bold; margin:0;">${p.price} RON</p>
        </a>`;
    }).join('');
}
// Zoom close
const prodZoomModal = document.getElementById('zoom-modal');
const prodZoomClose = document.getElementById('zoom-close');
if (prodZoomModal)
    prodZoomModal.addEventListener('click', (e) => { if (e.target === prodZoomModal)
        prodZoomModal.style.display = 'none'; });
if (prodZoomClose)
    prodZoomClose.addEventListener('click', () => { if (prodZoomModal)
        prodZoomModal.style.display = 'none'; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && prodZoomModal)
    prodZoomModal.style.display = 'none'; });
loadProduct();

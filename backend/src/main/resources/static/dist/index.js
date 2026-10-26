"use strict";
// Interfetele Cactus si Category vin din shared.ts.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let cactiForSale = [];
let allCategories = [];
let selectedProductType = "";
let selectedMainCategory = "";
let selectedSubCategory = "Toți";
let expandedMainCategory = "";
let searchQuery = "";
let currentPage = 0;
let totalPages = 0;
let totalProducts = 0;
const PAGE_SIZE = 20;
let shoppingCart = loadCartFromStorage();
let catalogRequestId = 0;
function fetchCacti() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        var _c;
        renderActiveFilters();
        const requestId = ++catalogRequestId;
        const count = document.getElementById('products-count');
        if (count)
            count.textContent = 'Se încarcă…';
        const container = document.getElementById('cacti-list');
        if (container) {
            container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2em; color:#2f694b;"></i>
                <p style="color:#666; margin-top:10px;">Se încarcă produsele...</p>
            </div>`;
        }
        try {
            const params = new URLSearchParams();
            params.append('productType', selectedProductType);
            params.append('mainCategory', selectedMainCategory);
            params.append('category', selectedSubCategory);
            params.append('search', searchQuery);
            const priceMin = (_a = document.getElementById('price-min')) === null || _a === void 0 ? void 0 : _a.value;
            const priceMax = (_b = document.getElementById('price-max')) === null || _b === void 0 ? void 0 : _b.value;
            if (priceMin)
                params.append('priceMin', priceMin);
            if (priceMax)
                params.append('priceMax', priceMax);
            params.append('page', currentPage.toString());
            params.append('size', PAGE_SIZE.toString());
            params.append('sort', currentSort);
            if (currentSort === 'favorites') {
                params.append('ids', wishlist.join(','));
            }
            const response = yield fetch(`${API_BASE}/api/cacti?${params.toString()}`);
            if (!response.ok)
                throw new Error('Eroare conectare server!');
            const data = yield response.json();
            if (requestId !== catalogRequestId)
                return;
            cactiForSale = data.content;
            totalPages = data.totalPages;
            totalProducts = (_c = data.totalElements) !== null && _c !== void 0 ? _c : cactiForSale.length;
            renderCacti();
            renderPagination();
        }
        catch (error) {
            if (requestId !== catalogRequestId)
                return;
            console.error("Eroare:", error);
            if (count)
                count.textContent = 'Produsele nu au putut fi încărcate';
            if (container) {
                container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2em; color:#d32f2f;"></i>
                    <p style="color:#d32f2f; margin-top:10px;">Nu am putut încărca produsele.</p>
                    <button onclick="fetchCacti()" style="margin-top:10px; padding:8px 20px;
                        background:#2f694b; color:#fdf2b8; border:none; border-radius:6px;
                        cursor:pointer; font-weight:bold;">
                        <i class="fa-solid fa-rotate-right"></i> Încearcă din nou
                    </button>
                </div>`;
            }
        }
    });
}
function updateCartUI(persist = true) {
    const saved = !persist || saveCartToStorage(shoppingCart);
    if (!saved)
        shoppingCart = loadCartFromStorage();
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = shoppingCart.length.toString();
    }
    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
        cartBtn.style.transform = 'scale(1.15)';
        cartBtn.style.transition = 'transform 0.15s ease';
        setTimeout(() => { cartBtn.style.transform = 'scale(1)'; }, 200);
    }
    renderCartItems();
    return saved;
}
function fetchAndRenderCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${API_BASE}/api/categories`);
            allCategories = yield response.json();
            renderSidebar();
        }
        catch (error) {
            console.error("Eroare la categorii:", error);
        }
    });
}
function renderSidebar() {
    const container = document.getElementById('sidebar-categories-list');
    if (!container)
        return;
    let html = `<div style="display:flex; gap:8px; margin-bottom:15px;">`;
    for (const type of PRODUCT_TYPES) {
        const isActive = selectedProductType === type;
        html += `
            <button class="product-type-btn" data-type="${escapeHtml(type)}"
                style="flex:1; background:${isActive ? '#FF9800' : 'transparent'};
                color:${isActive ? '#fdf2b8' : '#2f694b'};
                border:2px solid #FF9800; padding:10px; border-radius:5px;
                cursor:pointer; font-weight:bold;">
                ${escapeHtml(type)}
            </button>`;
    }
    html += `</div>`;
    for (const main of MAIN_CATEGORIES) {
        const isMainActive = selectedMainCategory === main;
        const isExpanded = expandedMainCategory === main;
        const subcats = allCategories
            .filter(c => c.mainCategory === main)
            .sort((a, b) => a.name.localeCompare(b.name));
        html += `
            <button class="main-cat-btn" data-main="${escapeHtml(main)}"
                style="background:${isMainActive ? '#2f694b' : 'transparent'};
                color:${isMainActive ? '#fdf2b8' : '#2f694b'};
                border:2px solid #2f694b; padding:10px; border-radius:5px;
                cursor:pointer; font-weight:bold; text-align:left;
                display:flex; justify-content:space-between; align-items:center;">
                <span>${escapeHtml(main)}</span>
                <span>${isExpanded ? '▾' : '▸'}</span>
            </button>`;
        if (isExpanded) {
            html += `<div style="display:flex; flex-direction:column; gap:6px; margin:4px 0 8px 15px;">`;
            const isAllActive = isMainActive && selectedSubCategory === 'Toți';
            html += `
                <button class="sub-cat-btn" data-main="${escapeHtml(main)}" data-sub="Toți"
                    style="background:${isAllActive ? '#2f694b' : 'transparent'};
                    color:${isAllActive ? '#fdf2b8' : '#2f694b'};
                    border:1px solid #2f694b; padding:8px; border-radius:5px;
                    cursor:pointer; font-weight:normal; text-align:left; font-size:0.9em;">
                    Toate
                </button>`;
            if (subcats.length === 0) {
                html += `<span style="color:#999; font-style:italic; font-size:0.85em; padding:4px;">Momentan nimic aici</span>`;
            }
            else {
                for (const sub of subcats) {
                    const isSubActive = isMainActive && selectedSubCategory === sub.name;
                    html += `
                        <button class="sub-cat-btn"
                            data-main="${escapeHtml(main)}"
                            data-sub="${escapeHtml(sub.name)}"
                            style="background:${isSubActive ? '#2f694b' : 'transparent'};
                            color:${isSubActive ? '#fdf2b8' : '#2f694b'};
                            border:1px solid #2f694b; padding:8px; border-radius:5px;
                            cursor:pointer; font-weight:normal; text-align:left; font-size:0.9em;">
                            ${escapeHtml(sub.name)}
                        </button>`;
                }
            }
            html += `</div>`;
        }
    }
    container.innerHTML = html;
    document.querySelectorAll('.product-type-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            selectedProductType =
                event.currentTarget.getAttribute('data-type') || "Plante";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });
    document.querySelectorAll('.main-cat-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const main = event.currentTarget.getAttribute('data-main') || "Cactuși";
            expandedMainCategory = expandedMainCategory === main ? "" : main;
            selectedMainCategory = main;
            selectedSubCategory = "Toți";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });
    document.querySelectorAll('.sub-cat-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const target = event.currentTarget;
            selectedMainCategory = target.getAttribute('data-main') || "Cactuși";
            selectedSubCategory = target.getAttribute('data-sub') || "Toți";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
            closeSidebar();
        });
    });
}
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.style.transform = "translateX(-100%)";
        sidebar.style.visibility = "hidden";
        sidebarOverlay.style.display = "none";
        menuBtn === null || menuBtn === void 0 ? void 0 : menuBtn.setAttribute("aria-expanded", "false");
        menuBtn === null || menuBtn === void 0 ? void 0 : menuBtn.focus();
    }
}
if (menuBtn && sidebarOverlay && closeSidebarBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.style.transform = "translateX(0)";
        sidebar.style.visibility = "visible";
        sidebarOverlay.style.display = "block";
        menuBtn.setAttribute("aria-expanded", "true");
        closeSidebarBtn.focus();
    });
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
}
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && (sidebar === null || sidebar === void 0 ? void 0 : sidebar.style.visibility) === 'visible') {
        closeSidebar();
    }
});
fetchAndRenderCategories();
const VIEW_MODE_KEY = 'cactusViewMode';
let viewMode = localStorage.getItem(VIEW_MODE_KEY) || 'grid';
const viewTogglesContainer = document.getElementById('view-toggles');
if (viewTogglesContainer) {
    const views = [
        { key: 'grid', icon: 'fa-table-cells-large', title: 'Grilă normală' },
        { key: 'compact', icon: 'fa-grip', title: 'Grilă compactă' },
        { key: 'list', icon: 'fa-list', title: 'Listă' }
    ];
    viewTogglesContainer.innerHTML = views.map(view => `
        <button class="view-toggle-btn" data-view="${view.key}" title="${view.title}"
            style="background:transparent; border:2px solid #2f694b; color:#2f694b;
            padding:8px 12px; border-radius:6px; cursor:pointer; font-size:16px;">
            <i class="fa-solid ${view.icon}"></i>
        </button>`).join('');
}
function applyViewMode() {
    document.body.classList.remove('view-grid', 'view-compact', 'view-list');
    document.body.classList.add(`view-${viewMode}`);
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-view') === viewMode;
        btn.style.backgroundColor = isActive ? '#2f694b' : 'transparent';
        btn.style.color = isActive ? '#fdf2b8' : '#2f694b';
    });
}
document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        viewMode = btn.getAttribute('data-view');
        saveLocalValue(VIEW_MODE_KEY, viewMode);
        applyViewMode();
    });
});
applyViewMode();
let currentSort = 'name-asc';
const sortSelect = document.getElementById('sort-select');
if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        currentPage = 0;
        fetchCacti();
    });
}
function renderCacti() {
    const container = document.getElementById('cacti-list');
    if (!container)
        return;
    const countEl = document.getElementById('products-count');
    let htmlContent = "";
    if (cactiForSale.length === 0) {
        if (countEl)
            countEl.innerText = '0 produse';
        htmlContent = `
            <p class="catalog-empty" role="status">
                Nu am găsit niciun produs conform căutării.
            </p>`;
    }
    else {
        if (countEl) {
            const pageInfo = totalPages > 1 ? ` (pagina ${currentPage + 1} din ${totalPages})` : '';
            countEl.innerText =
                `${cactiForSale.length} din ${totalProducts} ${totalProducts === 1 ? 'produs' : 'produse'}${pageInfo}`;
        }
        htmlContent = cactiForSale.map(cactus => renderProductCard(cactus, isWishlisted(cactus.id))).join('');
    }
    container.innerHTML = htmlContent;
    bindProductCards(container, cactiForSale);
}
function bindProductCards(container, products) {
    container.querySelectorAll('.cactus-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', event => {
            var _a;
            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img');
            if (modal && zoomImg) {
                event.preventDefault();
                zoomImg.src = img.src;
                modal.style.display = 'flex';
                (_a = img.closest('a')) === null || _a === void 0 ? void 0 : _a.focus();
                modal.dispatchEvent(new Event('zoom-open'));
            }
        });
    });
    container.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            var _a;
            event.preventDefault();
            event.stopPropagation();
            const src = (_a = event.target
                .closest('[data-img]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-img');
            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img');
            if (modal && zoomImg && src) {
                zoomImg.src = src;
                modal.style.display = 'flex';
                btn.focus();
                modal.dispatchEvent(new Event('zoom-open'));
            }
        });
    });
    container.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            var _a;
            const id = Number((_a = event.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            if (!id)
                return;
            toggleWishlist(id);
            const liked = isWishlisted(id);
            document.querySelectorAll(`.wishlist-btn[data-id="${id}"]`).forEach(heart => {
                heart.style.color = liked ? '#d32f2f' : '#607568';
                heart.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>`;
                heart.setAttribute('aria-pressed', String(liked));
            });
            if (currentSort === 'favorites') {
                currentPage = 0;
                fetchCacti();
            }
        });
    });
    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', event => {
            const clickedButton = event.currentTarget;
            const cactusId = Number(clickedButton.getAttribute('data-id'));
            const cactusToAdd = products.find(c => c.id === cactusId);
            if (!cactusToAdd)
                return;
            shoppingCart = loadCartFromStorage();
            const alreadyInCart = shoppingCart.filter(c => c.id === cactusId).length;
            if (alreadyInCart >= cactusToAdd.stock) {
                showToast(`Nu mai sunt suficiente exemplare din ${cactusToAdd.name}!`);
                return;
            }
            shoppingCart.push(cactusToAdd);
            if (!updateCartUI())
                return;
            showToast(`${cactusToAdd.name} a fost adăugat în coș!`);
        });
    });
}
const pendingCartAdds = new Set();
function renderCartItems() {
    var _a;
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer || !cartTotalElement)
        return;
    const focused = document.activeElement;
    const focusedId = focused === null || focused === void 0 ? void 0 : focused.getAttribute('data-id');
    const focusedClass = ['cart-minus-btn', 'cart-plus-btn', 'cart-remove-btn']
        .find(name => focused === null || focused === void 0 ? void 0 : focused.classList.contains(name));
    const focusSelector = focusedId && focusedClass && cartItemsContainer.contains(focused)
        ? `.${focusedClass}[data-id="${Number(focusedId)}"]`
        : null;
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <i class="fa-solid fa-cart-shopping" style="font-size:2em; color:#ccc;"></i>
                <p style="color:#999; margin-top:8px;">
                    Coșul e gol. Explorează
                    <a href="shop.html" style="color:#2f694b; font-weight:bold;">magazinul</a>!
                </p>
            </div>`;
        cartTotalElement.innerText = formatPrice(0);
        if (focusSelector)
            (_a = document.getElementById('cart-button')) === null || _a === void 0 ? void 0 : _a.focus();
        return;
    }
    const grouped = groupCartItems(shoppingCart);
    let htmlContent = "";
    let totalPrice = 0;
    grouped.forEach(({ item, qty }) => {
        const lineTotal = Math.round(item.price * 100) * qty;
        totalPrice += lineTotal;
        htmlContent += `
            <div style="display:flex; justify-content:space-between; align-items:center;
                margin-bottom:8px; font-size:0.9em; border-bottom:1px dashed #eee; padding-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <i class="fa-solid fa-leaf" style="color:#2f694b; margin-right:4px;"></i>
                    <span style="font-weight:600;">${escapeHtml(item.name)}</span> ${hybridBadge(item)}
                </div>
                <div style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                    <button class="cart-minus-btn" data-id="${item.id}"
                        style="width:26px; height:26px; border:1px solid #2f694b;
                        background:transparent; border-radius:4px; cursor:pointer;
                        color:#2f694b; font-weight:bold; font-size:1em;">−</button>
                    <span style="min-width:20px; text-align:center; font-weight:bold;">${qty}</span>
                    <button class="cart-plus-btn" data-id="${item.id}"
                        style="width:26px; height:26px; border:1px solid #2f694b;
                        background:transparent; border-radius:4px; cursor:pointer;
                        color:#2f694b; font-weight:bold; font-size:1em;">+</button>
                    <strong style="min-width:55px; text-align:right;">${formatPrice(lineTotal / 100)}</strong>
                    <button class="cart-remove-btn" data-id="${item.id}"
                        style="background:#d32f2f; color:white; border:none; border-radius:4px;
                        padding:2px 6px; cursor:pointer; font-size:0.8em;" title="Elimină tot">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
    });
    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.innerText = formatPrice(totalPrice / 100);
    if (focusSelector) {
        const next = cartItemsContainer.querySelector(focusSelector)
            || cartItemsContainer.querySelector('button')
            || document.getElementById('cart-button');
        next === null || next === void 0 ? void 0 : next.focus();
    }
    cartItemsContainer.querySelectorAll('.cart-minus-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            var _a;
            event.stopPropagation();
            const id = Number((_a = event.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            shoppingCart = loadCartFromStorage();
            const idx = shoppingCart.findIndex(c => c.id === id);
            if (idx !== -1) {
                shoppingCart.splice(idx, 1);
                updateCartUI();
            }
        });
    });
    cartItemsContainer.querySelectorAll('.cart-plus-btn').forEach(btn => {
        btn.addEventListener('click', (event) => __awaiter(this, void 0, void 0, function* () {
            event.stopPropagation();
            const id = Number(btn.getAttribute('data-id'));
            shoppingCart = loadCartFromStorage();
            const item = shoppingCart.find(c => c.id === id);
            if (!item || pendingCartAdds.has(id))
                return;
            pendingCartAdds.add(id);
            btn.setAttribute('aria-busy', 'true');
            try {
                const response = yield fetch(`${API_BASE}/api/cacti/${id}`);
                if (!response.ok) {
                    throw new Error('Nu am putut verifica stocul. Reîncearcă.');
                }
                const fresh = yield response.json();
                shoppingCart = loadCartFromStorage();
                if (!shoppingCart.some(c => c.id === id))
                    return;
                if (!Number.isSafeInteger(fresh.stock) || fresh.stock < 0) {
                    throw new Error('Nu am putut verifica stocul. Reîncearcă.');
                }
                const qty = shoppingCart.filter(c => c.id === id).length;
                if (fresh.active === false || qty >= fresh.stock) {
                    showToast('Stoc insuficient pentru încă o bucată.');
                    return;
                }
                shoppingCart.push(item);
                updateCartUI();
            }
            catch (_a) {
                showToast('Nu am putut verifica stocul. Reîncearcă.');
            }
            finally {
                pendingCartAdds.delete(id);
                btn.removeAttribute('aria-busy');
            }
        }));
    });
    cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            var _a;
            event.stopPropagation();
            const id = Number((_a = event.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            shoppingCart = loadCartFromStorage().filter(c => c.id !== id);
            updateCartUI();
        });
    });
}
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
if (cartButton && cartModal) {
    cartButton.addEventListener('click', event => {
        event.stopPropagation();
        cartModal.style.display =
            cartModal.style.display === "none" ? "block" : "none";
        cartButton.setAttribute("aria-expanded", String(cartModal.style.display === "block"));
    });
    window.addEventListener('click', event => {
        if (cartModal.style.display !== "block")
            return;
        const target = event.target;
        if (!cartModal.contains(target) && !cartButton.contains(target)) {
            cartModal.style.display = "none";
            cartButton.setAttribute("aria-expanded", "false");
        }
    });
    cartModal.addEventListener('click', event => {
        event.stopPropagation();
    });
}
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && (cartModal === null || cartModal === void 0 ? void 0 : cartModal.style.display) === 'block') {
        cartModal.style.display = 'none';
        cartButton === null || cartButton === void 0 ? void 0 : cartButton.setAttribute('aria-expanded', 'false');
        cartButton === null || cartButton === void 0 ? void 0 : cartButton.focus();
    }
});
const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (shoppingCart.length === 0) {
            showToast('Coșul este gol!');
            return;
        }
        window.location.href = 'checkout.html';
    });
}
function renderPagination() {
    let container = document.getElementById('pagination-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination-container';
        container.style.cssText =
            'display:flex; justify-content:center; align-items:center; gap:10px; margin-top:30px; margin-bottom:20px;';
        const cactiList = document.getElementById('cacti-list');
        if (cactiList === null || cactiList === void 0 ? void 0 : cactiList.parentNode) {
            cactiList.parentNode.insertBefore(container, cactiList.nextSibling);
        }
    }
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = `
        <button class="page-btn" data-page="${currentPage - 1}"
            ${currentPage === 0 ? 'disabled' : ''}
            style="padding:8px 15px; border:2px solid #2f694b; border-radius:5px;
            background:${currentPage === 0 ? '#e0e0e0' : 'transparent'};
            color:#2f694b; font-weight:bold;
            cursor:${currentPage === 0 ? 'not-allowed' : 'pointer'};">
            ◀ Înapoi
        </button>
        <span style="color:#2f694b; font-weight:bold;">
            Pagina ${currentPage + 1} din ${totalPages}
        </span>
        <button class="page-btn" data-page="${currentPage + 1}"
            ${currentPage >= totalPages - 1 ? 'disabled' : ''}
            style="padding:8px 15px; border:2px solid #2f694b; border-radius:5px;
            background:${currentPage >= totalPages - 1 ? '#e0e0e0' : 'transparent'};
            color:#2f694b; font-weight:bold;
            cursor:${currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'};">
            Înainte ▶
        </button>`;
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const target = event.currentTarget;
            if (target.disabled)
                return;
            currentPage = Number(target.getAttribute('data-page'));
            fetchCacti();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}
const searchBar = document.getElementById('search-bar');
let searchTimeout;
if (searchBar) {
    searchBar.addEventListener('input', event => {
        catalogRequestId++;
        searchQuery = event.target.value.toLowerCase();
        currentPage = 0;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => fetchCacti(), 300);
    });
}
let priceTimeout;
const priceMinInput = document.getElementById('price-min');
const priceMaxInput = document.getElementById('price-max');
[priceMinInput, priceMaxInput].forEach(input => {
    input === null || input === void 0 ? void 0 : input.addEventListener('input', () => {
        catalogRequestId++;
        currentPage = 0;
        clearTimeout(priceTimeout);
        priceTimeout = setTimeout(() => fetchCacti(), 500);
    });
});
function renderActiveFilters() {
    const toolbar = document.querySelector('.catalog-toolbar');
    if (!toolbar)
        return;
    let chips = document.getElementById('active-filters');
    if (!chips) {
        chips = document.createElement('div');
        chips.id = 'active-filters';
        chips.setAttribute('aria-label', 'Filtre active');
        toolbar.after(chips);
    }
    const filters = [];
    if (selectedProductType) {
        filters.push({
            label: selectedProductType,
            clear: () => { selectedProductType = ''; }
        });
    }
    if (selectedMainCategory) {
        filters.push({
            label: selectedMainCategory,
            clear: () => {
                selectedMainCategory = '';
                selectedSubCategory = 'Toți';
            }
        });
    }
    if (selectedSubCategory !== 'Toți') {
        filters.push({
            label: selectedSubCategory,
            clear: () => { selectedSubCategory = 'Toți'; }
        });
    }
    const categoryFilterCount = filters.length;
    if (searchQuery) {
        filters.push({
            label: `Căutare: ${searchQuery}`,
            clear: () => {
                searchQuery = '';
                searchBar.value = '';
            }
        });
    }
    const min = priceMinInput;
    const max = priceMaxInput;
    if ((min === null || min === void 0 ? void 0 : min.value) || (max === null || max === void 0 ? void 0 : max.value)) {
        const label = (min === null || min === void 0 ? void 0 : min.value) && (max === null || max === void 0 ? void 0 : max.value)
            ? `${formatPrice(Number(min.value))}–${formatPrice(Number(max.value))} RON`
            : (min === null || min === void 0 ? void 0 : min.value)
                ? `De la ${formatPrice(Number(min.value))} RON`
                : `Până la ${formatPrice(Number(max.value))} RON`;
        filters.push({
            label,
            clear: () => {
                if (min)
                    min.value = '';
                if (max)
                    max.value = '';
            }
        });
    }
    if (currentSort === 'favorites') {
        filters.push({
            label: 'Favorite',
            clear: () => {
                currentSort = 'name-asc';
                sortSelect.value = currentSort;
            }
        });
    }
    chips.replaceChildren();
    chips.hidden = filters.length === 0;
    const refresh = () => {
        var _a;
        clearTimeout(searchTimeout);
        clearTimeout(priceTimeout);
        currentPage = 0;
        const priceDetails = document.getElementById('price-disclosure');
        const priceActive = Boolean((min === null || min === void 0 ? void 0 : min.value) || (max === null || max === void 0 ? void 0 : max.value));
        priceDetails === null || priceDetails === void 0 ? void 0 : priceDetails.classList.toggle('has-active-filter', priceActive);
        const label = priceDetails === null || priceDetails === void 0 ? void 0 : priceDetails.querySelector('summary span');
        if (label)
            label.textContent = priceActive ? 'Filtre •' : 'Filtre';
        (_a = document.getElementById('search-disclosure')) === null || _a === void 0 ? void 0 : _a.classList.toggle('has-active-filter', searchQuery !== '');
        renderSidebar();
        fetchCacti();
        const next = document.querySelector('#active-filters button')
            || document.querySelector('#price-disclosure summary');
        next === null || next === void 0 ? void 0 : next.focus();
    };
    for (const [index, filter] of filters.entries()) {
        if (index > 0 && index < categoryFilterCount) {
            const arrow = document.createElement('span');
            arrow.className = 'breadcrumb-arrow';
            arrow.textContent = '›';
            arrow.setAttribute('aria-hidden', 'true');
            chips.appendChild(arrow);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = index < categoryFilterCount
            ? 'filter-chip breadcrumb-filter'
            : 'filter-chip';
        button.textContent = `${filter.label} ×`;
        button.setAttribute('aria-label', `Elimină filtrul ${filter.label}`);
        button.addEventListener('click', () => {
            filter.clear();
            refresh();
        });
        chips.appendChild(button);
    }
    if (filters.length) {
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'filter-reset';
        reset.textContent = 'Resetează';
        reset.addEventListener('click', () => {
            filters.forEach(filter => filter.clear());
            refresh();
        });
        chips.appendChild(reset);
    }
}
function renderRecentlyViewed() {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('recent-products');
        const wrapper = document.getElementById('recently-viewed');
        if (!container || !wrapper)
            return;
        const ids = readStoredProductIds('recentlyViewed').slice(0, 5);
        const results = yield Promise.all(ids.map((id) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${API_BASE}/api/cacti/${id}`);
                if (!response.ok)
                    return null;
                const product = yield response.json();
                return product && product.id === id && product.active !== false ? product : null;
            }
            catch (_a) {
                return null;
            }
        })));
        const products = results.filter((product) => product !== null);
        container.innerHTML = products.map(product => renderProductCard(product, isWishlisted(product.id))).join('');
        bindProductCards(container, products);
        wrapper.hidden = products.length === 0;
    });
}
renderRecentlyViewed();
initImageZoom();
window.addEventListener('storage', event => {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
        shoppingCart = loadCartFromStorage();
        updateCartUI(false);
    }
});
fetchCacti();
updateCartUI(false);

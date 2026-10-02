"use strict";
// Interfețele Cactus și Category vin din shared.ts
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
let selectedProductType = "Plante";
let selectedMainCategory = "Cactuși";
let selectedSubCategory = "Toți";
let expandedMainCategory = "Cactuși"; // care secțiune e deschisă în sidebar
let searchQuery = "";
let currentPage = 0;
let totalPages = 0;
const PAGE_SIZE = 12;
// showToast, wishlist, toggleWishlist, isWishlisted vin din shared.ts
// Coșul se încarcă din localStorage la pornire, ca să nu dispară
// când navighezi pe altă pagină (ex: cont.html) și te întorci.
function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch (_a) {
        return [];
    }
}
function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(shoppingCart));
}
let shoppingCart = loadCartFromStorage();
// PRODUCT_TYPES, MAIN_CATEGORIES, escapeHtml, API_BASE, CART_STORAGE_KEY,
// CUSTOMER_NAME_KEY, authFetch vin din shared.ts
// 1. Fetch de la Backend (Filtrare aplicată pe server, cu paginare)
function fetchCacti() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const container = document.getElementById('cacti-list');
        if (container) {
            container.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 40px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2em; color: #2f694b;"></i>
            <p style="color: #666; margin-top: 10px;">Se încarcă produsele...</p>
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
            const response = yield fetch(`${API_BASE}/api/cacti?${params.toString()}`);
            if (!response.ok)
                throw new Error('Eroare conectare server!');
            const data = yield response.json();
            cactiForSale = data.content;
            totalPages = data.totalPages;
            renderCacti();
            renderPagination();
        }
        catch (error) {
            console.error("Eroare:", error);
            if (container) {
                container.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 40px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2em; color: #d32f2f;"></i>
                <p style="color: #d32f2f; margin-top: 10px;">Nu am putut încărca produsele.</p>
                <button onclick="fetchCacti()" style="margin-top: 10px; padding: 8px 20px; background: #2f694b; color: #fdf2b8; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    <i class="fa-solid fa-rotate-right"></i> Încearcă din nou
                </button>
            </div>`;
            }
        }
    });
}
// Cont dropdown — vine din shared.ts
initAccountDropdown();
// 2. UI Coș & Notificări
function updateCartUI() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = shoppingCart.length.toString();
    }
    // Bounce pe butonul de coș
    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
        cartBtn.style.transform = 'scale(1.15)';
        cartBtn.style.transition = 'transform 0.15s ease';
        setTimeout(() => { cartBtn.style.transform = 'scale(1)'; }, 200);
    }
    saveCartToStorage();
    renderCartItems();
}
// showToast vine din shared.ts
// 3. Randare Sidebar — toggle Plante/Semințe sus, apoi Cactuși/Suculente expandabile cu genurile lor
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
    let html = "";
    // --- Toggle Plantă / Semințe (nivelul de sus) ---
    html += `<div style="display: flex; gap: 8px; margin-bottom: 15px;">`;
    for (const type of PRODUCT_TYPES) {
        const isActive = selectedProductType === type;
        html += `
            <button class="product-type-btn" data-type="${escapeHtml(type)}"
                style="flex: 1; background: ${isActive ? '#FF9800' : 'transparent'}; color: ${isActive ? '#fdf2b8' : '#2f694b'};
                       border: 2px solid #FF9800; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                ${escapeHtml(type)}
            </button>
        `;
    }
    html += `</div>`;
    for (const main of MAIN_CATEGORIES) {
        const isMainActive = selectedMainCategory === main;
        const isExpanded = expandedMainCategory === main;
        const subcats = allCategories.filter(c => c.mainCategory === main).sort((a, b) => a.name.localeCompare(b.name));
        // Butonul categoriei principale (click = selectează + expandează/restrânge)
        html += `
            <button class="main-cat-btn" data-main="${escapeHtml(main)}"
                style="background: ${isMainActive ? '#2f694b' : 'transparent'}; color: ${isMainActive ? '#fdf2b8' : '#2f694b'};
                       border: 2px solid #2f694b; padding: 10px; border-radius: 5px; cursor: pointer;
                       font-weight: bold; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                <span>${escapeHtml(main)}</span>
                <span>${isExpanded ? '▾' : '▸'}</span>
            </button>
        `;
        // Subcategoriile — vizibile doar dacă secțiunea e expandată
        if (isExpanded) {
            html += `<div style="display: flex; flex-direction: column; gap: 6px; margin: 4px 0 8px 15px;">`;
            const isAllActive = isMainActive && selectedSubCategory === 'Toți';
            html += `
                <button class="sub-cat-btn" data-main="${escapeHtml(main)}" data-sub="Toți"
                    style="background: ${isAllActive ? '#2f694b' : 'transparent'}; color: ${isAllActive ? '#fdf2b8' : '#2f694b'};
                           border: 1px solid #2f694b; padding: 8px; border-radius: 5px; cursor: pointer;
                           font-weight: normal; text-align: left; font-size: 0.9em;">
                    Toate
                </button>
            `;
            if (subcats.length === 0) {
                html += `<span style="color: #999; font-style: italic; font-size: 0.85em; padding: 4px;">Momentan nimic aici</span>`;
            }
            else {
                for (const sub of subcats) {
                    const isSubActive = isMainActive && selectedSubCategory === sub.name;
                    html += `
                        <button class="sub-cat-btn" data-main="${escapeHtml(main)}" data-sub="${escapeHtml(sub.name)}"
                            style="background: ${isSubActive ? '#2f694b' : 'transparent'}; color: ${isSubActive ? '#fdf2b8' : '#2f694b'};
                                   border: 1px solid #2f694b; padding: 8px; border-radius: 5px; cursor: pointer;
                                   font-weight: normal; text-align: left; font-size: 0.9em;">
                            ${escapeHtml(sub.name)}
                        </button>
                    `;
                }
            }
            html += `</div>`;
        }
    }
    container.innerHTML = html;
    // Click pe Plante/Semințe -> schimbă tipul de produs, păstrează gen/categorie selectate
    document.querySelectorAll('.product-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedProductType = e.currentTarget.getAttribute('data-type') || "Plante";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });
    // Click pe categorie principală -> selectează + expandează secțiunea (sau o restrânge dacă era deja deschisă)
    document.querySelectorAll('.main-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const main = e.currentTarget.getAttribute('data-main') || "Cactuși";
            if (expandedMainCategory === main) {
                expandedMainCategory = ""; // restrânge dacă era deja deschisă
            }
            else {
                expandedMainCategory = main;
            }
            selectedMainCategory = main;
            selectedSubCategory = "Toți";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });
    // Click pe subcategorie -> selectează gen specific + închide sidebar-ul
    document.querySelectorAll('.sub-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            selectedMainCategory = target.getAttribute('data-main') || "Cactuși";
            selectedSubCategory = target.getAttribute('data-sub') || "Toți";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
            closeSidebar();
        });
    });
}
// Logica de deschidere/închidere
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.style.left = "-300px";
        sidebarOverlay.style.display = "none";
    }
}
if (menuBtn && sidebarOverlay && closeSidebarBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.style.left = "0";
        sidebarOverlay.style.display = "block";
    });
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
}
// Adaugă apelul în zona de inițializare de la finalul fișierului
fetchAndRenderCategories();
const VIEW_MODE_KEY = 'cactusViewMode';
let viewMode = localStorage.getItem(VIEW_MODE_KEY) || 'grid';
// Generează butoanele de view toggle în #view-toggles
const viewTogglesContainer = document.getElementById('view-toggles');
if (viewTogglesContainer) {
    const views = [
        { key: 'grid', icon: 'fa-table-cells-large', title: 'Grilă normală' },
        { key: 'compact', icon: 'fa-grip', title: 'Grilă compactă' },
        { key: 'list', icon: 'fa-list', title: 'Listă' }
    ];
    viewTogglesContainer.innerHTML = views.map(v => `
        <button class="view-toggle-btn" data-view="${v.key}" title="${v.title}" style="background: transparent; border: 2px solid #2f694b; color: #2f694b; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 16px;">
            <i class="fa-solid ${v.icon}"></i>
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
        localStorage.setItem(VIEW_MODE_KEY, viewMode);
        applyViewMode();
    });
});
applyViewMode();
// --- Sortare produse ---
let currentSort = 'name-asc';
function sortCacti(cacti) {
    let sorted = [...cacti];
    if (currentSort === 'favorites') {
        sorted = sorted.filter(c => isWishlisted(c.id));
    }
    switch (currentSort) {
        case 'name-asc':
        case 'favorites':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'stock-desc':
            sorted.sort((a, b) => b.stock - a.stock);
            break;
    }
    return sorted;
}
const sortSelect = document.getElementById('sort-select');
if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderCacti();
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
            countEl.innerText = '';
        htmlContent = `<p style="grid-column: span 3; color: red; font-size: 1.2em;">Nu am găsit niciun cactus conform căutării.</p>`;
    }
    else {
        const sorted = sortCacti(cactiForSale);
        if (countEl) {
            const showing = sorted.length;
            const pageInfo = totalPages > 1 ? ` (pagina ${currentPage + 1} din ${totalPages})` : '';
            countEl.innerText = `${showing} produse afișate${pageInfo}`;
        }
        for (let cactus of sorted) {
            // Categoria acum are bordură verde și text verde, fără fundal plin
            const categoryTag = `<span style="border: 1px solid #2f694b; color: #2f694b; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">${escapeHtml(cactus.category)}</span>`;
            const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
            const hearted = isWishlisted(cactus.id);
            htmlContent += `
                <div class="cactus-card" style="border: 2px solid #2f694b; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background-color: transparent; position: relative;">
                    <button class="wishlist-btn" data-id="${cactus.id}" style="position: absolute; top: 10px; right: 10px; background: white; border: none; cursor: pointer; font-size: 1.3em; padding: 6px 8px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.15); z-index: 2; color: ${hearted ? '#d32f2f' : '#ccc'};">
                        <i class="fa-${hearted ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <button class="zoom-btn" data-img="${escapeHtml(validImage)}" style="position: absolute; top: 10px; left: 10px; background: white; border: none; cursor: pointer; font-size: 1.1em; padding: 6px 8px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.15); z-index: 2; color: #2f694b;">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </button>
                    <a href="produs.html?id=${cactus.id}"><img class="cactus-image" src="${escapeHtml(validImage)}" alt="${escapeHtml(cactus.name)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;"></a>
                    <div class="cactus-details">
                        ${categoryTag}
                        <a href="produs.html?id=${cactus.id}" style="text-decoration:none;"><h2 style="color: #2f694b; margin-top: 10px;"><i class="fa-solid fa-leaf" style="margin-right: 6px;"></i>${escapeHtml(cactus.name)}</h2></a>
                        <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.price} RON</span></p>
                        <p class="cactus-stock" style="color: ${cactus.stock > 0 ? '#2f694b' : '#d32f2f'}; font-weight: bold; font-size: 0.9em;">
                            ${cactus.stock > 0 ? `${cactus.stock} exemplare rămase` : 'Stoc epuizat'}
                        </p>
                        <p class="cactus-desc"><em>${escapeHtml(cactus.description)}</em></p>
                    </div>
                    ${cactus.stock > 0
                ? `<button class="add-to-cart-btn" data-id="${cactus.id}" style="background-color: #2f694b; color: #fdf2b8; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; font-weight: bold;">
                            Adaugă în coș
                          </button>`
                : `<button disabled style="background-color: #999; color: white; padding: 10px; border: none; border-radius: 4px; width: 100%; margin-top: 15px; font-weight: bold; cursor: not-allowed;">
                            Stoc epuizat
                          </button>`}
                </div>
            `;
        }
    }
    container.innerHTML = htmlContent;
    // Zoom pe imagine
    document.querySelectorAll('.cactus-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img');
            if (modal && zoomImg) {
                zoomImg.src = img.src;
                modal.style.display = 'flex';
            }
        });
    });
    // Zoom buttons
    document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            var _a;
            e.preventDefault();
            e.stopPropagation();
            const src = (_a = e.target.closest('[data-img]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-img');
            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img');
            if (modal && zoomImg && src) {
                zoomImg.src = src;
                modal.style.display = 'flex';
            }
        });
    });
    // Wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            var _a;
            const id = Number((_a = e.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            if (id)
                toggleWishlist(id);
        });
    });
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target;
            const cactusId = Number(clickedButton.getAttribute('data-id'));
            const cactusToAdd = cactiForSale.find(c => c.id === cactusId);
            if (cactusToAdd) {
                const alreadyInCart = shoppingCart.filter(c => c.id === cactusId).length;
                if (alreadyInCart >= cactusToAdd.stock) {
                    showToast(`<i class="fa-solid fa-triangle-exclamation" style="color: #FF9800;"></i> Nu mai sunt suficiente exemplare din ${cactusToAdd.name}!`);
                    return;
                }
                shoppingCart.push(cactusToAdd);
                updateCartUI();
                showToast(`<i class="fa-solid fa-check" style="color: #2f694b;"></i> ${cactusToAdd.name} a fost adăugat în coș!`);
            }
        });
    });
}
// 5. Randare elemente coș modal (Acum cu buton de ștergere)
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer || !cartTotalElement)
        return;
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = '<div style="text-align:center; padding:15px;"><i class="fa-solid fa-cart-shopping" style="font-size:2em; color:#ccc;"></i><p style="color:#999; margin-top:8px;">Coșul e gol. Explorează <a href="shop.html" style="color:#2f694b; font-weight:bold;">magazinul</a>!</p></div>';
        cartTotalElement.innerText = "0";
        return;
    }
    // Grupare pe produs (id → {item, qty})
    const grouped = new Map();
    shoppingCart.forEach(item => {
        const existing = grouped.get(item.id);
        if (existing)
            existing.qty++;
        else
            grouped.set(item.id, { item, qty: 1 });
    });
    let htmlContent = "";
    let totalPrice = 0;
    grouped.forEach(({ item, qty }) => {
        const lineTotal = item.price * qty;
        totalPrice += lineTotal;
        htmlContent += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.9em; border-bottom: 1px dashed #eee; padding-bottom: 8px;">
                <div style="flex: 1; min-width: 0;">
                    <i class="fa-solid fa-leaf" style="color: #2f694b; margin-right: 4px;"></i>
                    <span style="font-weight: 600;">${escapeHtml(item.name)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <button class="cart-minus-btn" data-id="${item.id}" style="width:26px; height:26px; border:1px solid #2f694b; background:transparent; border-radius:4px; cursor:pointer; color:#2f694b; font-weight:bold; font-size:1em;">−</button>
                    <span style="min-width:20px; text-align:center; font-weight:bold;">${qty}</span>
                    <button class="cart-plus-btn" data-id="${item.id}" style="width:26px; height:26px; border:1px solid #2f694b; background:transparent; border-radius:4px; cursor:pointer; color:#2f694b; font-weight:bold; font-size:1em;">+</button>
                    <strong style="min-width:55px; text-align:right;">${lineTotal.toFixed(2)}</strong>
                    <button class="cart-remove-btn" data-id="${item.id}" style="background:#d32f2f; color:white; border:none; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8em;" title="Elimină tot"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    });
    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.innerText = totalPrice.toFixed(2);
    // − buton: scoate 1 bucată
    cartItemsContainer.querySelectorAll('.cart-minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            var _a;
            e.stopPropagation();
            const id = Number((_a = e.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            const idx = shoppingCart.findIndex(c => c.id === id);
            if (idx !== -1) {
                shoppingCart.splice(idx, 1);
                updateCartUI();
            }
        });
    });
    // + buton: adaugă 1 bucată (dacă stocul permite)
    cartItemsContainer.querySelectorAll('.cart-plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            var _a;
            e.stopPropagation();
            const id = Number((_a = e.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            const item = shoppingCart.find(c => c.id === id);
            if (!item)
                return;
            const currentQty = shoppingCart.filter(c => c.id === id).length;
            const stockItem = cactiForSale.find(c => c.id === id);
            if (stockItem && currentQty >= stockItem.stock) {
                showToast('<i class="fa-solid fa-triangle-exclamation" style="color:#FF9800;"></i> Stoc maxim atins');
                return;
            }
            shoppingCart.push(item);
            updateCartUI();
        });
    });
    // Trash: elimină toate bucățile
    cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            var _a;
            e.stopPropagation();
            const id = Number((_a = e.target.closest('[data-id]')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-id'));
            shoppingCart = shoppingCart.filter(c => c.id !== id);
            updateCartUI();
        });
    });
}
// 6. Logica Închidere/Deschidere Coș (Click în afară)
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
if (cartButton && cartModal) {
    // Deschide/Închide la click pe butonul de sus
    cartButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Oprim propagarea pentru a nu declanșa imediat 'window.click'
        cartModal.style.display = cartModal.style.display === "none" ? "block" : "none";
    });
    // Închide fereastra dacă utilizatorul dă click oriunde altundeva pe pagină
    window.addEventListener('click', (event) => {
        if (cartModal.style.display === "block") {
            const target = event.target;
            // Dacă click-ul NU s-a efectuat în interiorul ferestrei modale și NU pe butonul de coș
            if (!cartModal.contains(target) && !cartButton.contains(target)) {
                cartModal.style.display = "none";
            }
        }
    });
    // Oprim propagarea click-urilor din interiorul ferestrei modale (ca să nu se închidă accidental când scrii în input)
    cartModal.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}
// 7. Checkout Process
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const submitOrderBtn = document.getElementById('submit-order-btn');
if (checkoutBtn && checkoutForm && submitOrderBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (shoppingCart.length === 0) {
            alert("Coșul este gol! Adaugă un cactus mai întâi.");
            return;
        }
        checkoutBtn.style.display = 'none';
        checkoutForm.style.display = 'block';
    });
    submitOrderBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const nameInput = document.getElementById('customer-name').value.trim();
        const emailInput = document.getElementById('customer-email').value.trim();
        const addressInput = document.getElementById('customer-address').value.trim();
        if (!nameInput || !emailInput || !addressInput) {
            alert("Te rog să completezi numele, emailul și adresa de livrare!");
            return;
        }
        // Refresh stoc înainte de submit — verifică doar produsele din coș
        try {
            const cartCounts = new Map();
            shoppingCart.forEach(item => cartCounts.set(item.id, (cartCounts.get(item.id) || 0) + 1));
            const problems = [];
            for (const [id, qty] of cartCounts) {
                const r = yield fetch(`${API_BASE}/api/cacti/${id}`);
                if (!r.ok) {
                    problems.push(`Produsul #${id} nu mai este disponibil.`);
                    continue;
                }
                const fresh = yield r.json();
                if (fresh.stock < qty)
                    problems.push(`"${fresh.name}" — doar ${fresh.stock} în stoc, ai ${qty} în coș.`);
            }
            if (problems.length > 0) {
                alert("Stocul s-a schimbat:\n\n" + problems.join("\n") + "\n\nActualizează coșul.");
                return;
            }
        }
        catch (e) { /* continuă cu submit-ul, backend-ul verifică oricum */ }
        const cactusIds = shoppingCart.map(item => item.id);
        const newOrder = {
            customerName: nameInput,
            email: emailInput,
            address: addressInput,
            cactusIds: cactusIds
        };
        try {
            const response = yield fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });
            if (!response.ok) {
                const errorMsg = yield response.text();
                throw new Error(errorMsg || "Eroare la procesarea comenzii.");
            }
            const savedOrder = yield response.json();
            shoppingCart = [];
            updateCartUI();
            document.getElementById('customer-name').value = "";
            document.getElementById('customer-email').value = "";
            document.getElementById('customer-address').value = "";
            checkoutForm.style.display = 'none';
            // Afișăm confirmarea cu nr. comandă + detaliile de plată prin transfer bancar
            const confirmationDiv = document.getElementById('order-confirmation');
            if (confirmationDiv) {
                confirmationDiv.style.display = 'block';
                confirmationDiv.innerHTML = `
                    <p style="color: #2f694b; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Comanda a fost plasată!</p>
                    <p><strong>Codul comenzii:</strong> <code style="background: #e8f5e9; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; word-break: break-all;">${escapeHtml(savedOrder.orderToken)}</code></p>
                    <p>Notează acest cod — ai nevoie de el ca să verifici statusul mai târziu.</p>
                    <p style="margin-top: 10px;"><strong>Total de plată: ${savedOrder.totalPrice} RON</strong></p>
                    <div style="background: #fdf2b8; border: 1px solid #2f694b; border-radius: 4px; padding: 10px; margin-top: 10px;">
                        <p style="margin: 0 0 5px 0; font-weight: bold;">Plată prin transfer bancar:</p>
                        <p style="margin: 2px 0;">IBAN: ${escapeHtml(BANK_TRANSFER_INFO.iban)}</p>
                        <p style="margin: 2px 0;">Bancă: ${escapeHtml(BANK_TRANSFER_INFO.bank)}</p>
                        <p style="margin: 2px 0;">Titular: ${escapeHtml(BANK_TRANSFER_INFO.holder)}</p>
                        <p style="margin: 8px 0 0 0; font-style: italic;">Menționează codul comenzii la detalii transfer.</p>
                    </div>
                    <p style="margin-top: 10px;">Comanda ta va apărea ca „plătită" după ce confirmăm transferul.
                       Poți verifica oricând statusul pe pagina <a href="comenzi.html" style="color: #2f694b; font-weight: bold;">Verifică Comanda</a>.</p>
                `;
            }
            checkoutBtn.style.display = 'block';
        }
        catch (error) {
            console.error(error);
            alert(error.message || "A apărut o eroare la salvarea comenzii.");
        }
    }));
}
// 8. Paginare
function renderPagination() {
    let container = document.getElementById('pagination-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination-container';
        container.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 30px; margin-bottom: 20px;';
        const cactiList = document.getElementById('cacti-list');
        if (cactiList && cactiList.parentNode) {
            cactiList.parentNode.insertBefore(container, cactiList.nextSibling);
        }
    }
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    let html = '';
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 0 ? 'disabled' : ''}
        style="padding: 8px 15px; border: 2px solid #2f694b; border-radius: 5px; background: ${currentPage === 0 ? '#e0e0e0' : 'transparent'}; color: #2f694b; font-weight: bold; cursor: ${currentPage === 0 ? 'not-allowed' : 'pointer'};">
        ◀ Înapoi
    </button>`;
    html += `<span style="color: #2f694b; font-weight: bold;">Pagina ${currentPage + 1} din ${totalPages}</span>`;
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages - 1 ? 'disabled' : ''}
        style="padding: 8px 15px; border: 2px solid #2f694b; border-radius: 5px; background: ${currentPage >= totalPages - 1 ? '#e0e0e0' : 'transparent'}; color: #2f694b; font-weight: bold; cursor: ${currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'};">
        Înainte ▶
    </button>`;
    container.innerHTML = html;
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            if (target.disabled)
                return;
            currentPage = Number(target.getAttribute('data-page'));
            fetchCacti();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}
// 9. Căutare (Apelează Java automat)
const searchBar = document.getElementById('search-bar');
let searchTimeout;
if (searchBar) {
    searchBar.addEventListener('input', (event) => {
        searchQuery = event.target.value.toLowerCase();
        currentPage = 0;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => fetchCacti(), 300);
    });
}
// 9. Filtru preț
let priceTimeout;
const priceMinInput = document.getElementById('price-min');
const priceMaxInput = document.getElementById('price-max');
[priceMinInput, priceMaxInput].forEach(input => {
    if (input)
        input.addEventListener('input', () => {
            currentPage = 0;
            clearTimeout(priceTimeout);
            priceTimeout = setTimeout(() => fetchCacti(), 500);
        });
});
// 10. Recently viewed
function renderRecentlyViewed() {
    const container = document.getElementById('recent-products');
    const wrapper = document.getElementById('recently-viewed');
    if (!container || !wrapper)
        return;
    const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (recent.length === 0) {
        wrapper.style.display = 'none';
        return;
    }
    // Fetch doar produsele recente
    Promise.all(recent.slice(0, 4).map(id => fetch(`${API_BASE}/api/cacti/${id}`).then(r => r.ok ? r.json() : null))).then(products => {
        const valid = products.filter(Boolean);
        if (valid.length === 0) {
            wrapper.style.display = 'none';
            return;
        }
        wrapper.style.display = 'block';
        container.innerHTML = valid.map((p) => {
            const img = p.imageUrl || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80';
            return `<a href="produs.html?id=${p.id}" style="flex: 0 0 140px; text-decoration:none; border:2px solid #2f694b; border-radius:8px; padding:8px; text-align:center;">
                <img src="${escapeHtml(img)}" style="width:100%; height:80px; object-fit:cover; border-radius:4px;">
                <p style="color:#2f694b; font-weight:bold; margin:6px 0 2px; font-size:0.8em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name)}</p>
                <p style="color:#d32f2f; font-weight:bold; margin:0; font-size:0.85em;">${p.price} RON</p>
            </a>`;
        }).join('');
    });
}
renderRecentlyViewed();
// 11. Zoom modal close
const zoomModal = document.getElementById('zoom-modal');
const zoomClose = document.getElementById('zoom-close');
if (zoomModal) {
    zoomModal.addEventListener('click', (e) => {
        if (e.target === zoomModal)
            zoomModal.style.display = 'none';
    });
}
if (zoomClose) {
    zoomClose.addEventListener('click', () => {
        if (zoomModal)
            zoomModal.style.display = 'none';
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && zoomModal)
        zoomModal.style.display = 'none';
});
// 10. Inițializare
fetchCacti();
updateCartUI();

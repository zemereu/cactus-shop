"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const BANK_TRANSFER_INFO = {
    iban: "RO00 XXXX 0000 0000 0000 0000",
    bank: "Numele Băncii",
    holder: "Numele Titularului / Firmei"
};
const ORDER_STATUSES = [
    "Neplătită", "Plătită - în pregătire",
    "Expediată", "Livrată", "Anulată"
];
const CUSTOMER_NAME_KEY = "customerName";
const CART_STORAGE_KEY = "shoppingCart";
const PRODUCT_TYPES = ["Plante", "Semințe"];
const MAIN_CATEGORIES = ["Cactuși", "Suculente"];
const API_BASE = '';
function authFetch(url, options = {}) {
    return fetch(url, Object.assign(Object.assign({}, options), { credentials: 'include', headers: Object.assign({}, options.headers) }));
}
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined)
        return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function starsDisplay(rating) {
    const full = '<i class="fa-solid fa-star" style="color:#FF9800;"></i>';
    const empty = '<i class="fa-regular fa-star" style="color:#ccc;"></i>';
    return full.repeat(rating) + empty.repeat(5 - rating);
}
function responseError(response) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = yield response.text();
        try {
            const body = JSON.parse(text);
            const details = body.details && typeof body.details === 'object'
                ? Object.keys(body.details)
                    .map(key => body.details[key])
                    .filter(value => typeof value === 'string')
                : [];
            return [
                typeof body.error === 'string'
                    ? body.error
                    : `Eroare HTTP ${response.status}.`,
                ...details
            ].join('\n');
        }
        catch (_a) {
            return text || `Eroare HTTP ${response.status}.`;
        }
    });
}
function formatPrice(value) {
    return Number(value).toLocaleString('ro-RO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function formatOrderDate(value) {
    if (!value)
        return '';
    const date = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z');
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('ro-RO', {
            timeZone: 'Europe/Bucharest'
        });
}
function initAccountDropdown() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (document.getElementById('login-container') || document.getElementById('tab-login'))
            return;
        let accountLink = document.getElementById('account-link');
        if (!accountLink) {
            const header = document.querySelector('header');
            if (!header)
                return;
            accountLink = document.createElement('a');
            accountLink.id = 'account-link';
            accountLink.href = 'account.html';
            header.appendChild(accountLink);
        }
        const link = accountLink;
        link.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i>';
        link.setAttribute('aria-label', 'Cont');
        link.title = 'Cont';
        const dropdown = document.getElementById('account-dropdown');
        let authenticated = false;
        const refresh = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield authFetch(`${API_BASE}/api/customers/me`);
                if (!response.ok && response.status !== 401 && response.status !== 403) {
                    return;
                }
                authenticated = response.ok;
                if (authenticated) {
                    link.title = 'Contul meu';
                }
                else {
                    link.title = 'Autentificare';
                    if (dropdown)
                        dropdown.style.display = 'none';
                    try {
                        localStorage.removeItem(CUSTOMER_NAME_KEY);
                    }
                    catch (_a) { }
                }
                const lookup = document.getElementById('header-verifica-btn');
                if (lookup)
                    lookup.style.display = authenticated ? 'none' : '';
            }
            catch (_b) {
                // O eroare de retea nu inseamna deconectare.
            }
        });
        link.addEventListener('click', event => {
            if (!authenticated || !dropdown)
                return;
            event.preventDefault();
            event.stopPropagation();
            dropdown.style.display =
                dropdown.style.display === 'block' ? 'none' : 'block';
        });
        window.addEventListener('click', event => {
            if (dropdown &&
                !dropdown.contains(event.target) &&
                !link.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
        (_a = document.getElementById('dropdown-logout-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            try {
                const response = yield authFetch(`${API_BASE}/api/customers/logout`, {
                    method: 'POST'
                });
                if (!response.ok)
                    throw new Error(yield responseError(response));
                try {
                    localStorage.removeItem(CUSTOMER_NAME_KEY);
                }
                catch (_a) { }
                yield refresh();
            }
            catch (_b) {
                showToast('Deconectarea nu a putut fi confirmată. Reîncearcă.');
            }
        }));
        window.addEventListener('focus', refresh);
        yield refresh();
    });
}
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText =
            'position:fixed; top:20px; right:20px; z-index:1000; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText =
        'background:#2f694b; color:#fdf2b8; padding:12px 20px; border-radius:8px; font-weight:bold; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation:slideIn 0.3s ease;';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}
function readStoredProductIds(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(data)
            ? [...new Set(data.filter((id) => Number.isSafeInteger(id) && id > 0))]
            : [];
    }
    catch (_a) {
        return [];
    }
}
const WISHLIST_KEY = 'wishlist';
let wishlist = readStoredProductIds(WISHLIST_KEY);
function toggleWishlist(id) {
    const next = readStoredProductIds(WISHLIST_KEY);
    const idx = next.indexOf(id);
    if (idx === -1)
        next.push(id);
    else
        next.splice(idx, 1);
    if (!saveLocalValue(WISHLIST_KEY, JSON.stringify(next)))
        return;
    wishlist = next;
    showToast(idx === -1 ? 'Adăugat la favorite' : 'Eliminat din favorite');
}
function isWishlisted(id) {
    return wishlist.includes(id);
}
function saveLocalValue(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    }
    catch (_a) {
        showToast('Nu am putut salva în browser. Verifică setările de stocare și reîncearcă.');
        return false;
    }
}
// Keep repeated entries: each occurrence represents one unit in the cart.
function loadCartFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        return Array.isArray(data) ? data.filter(item => item &&
            Number.isSafeInteger(item.id) && item.id > 0 &&
            typeof item.name === 'string' &&
            Number.isFinite(item.price) && item.price >= 0 &&
            Number.isSafeInteger(item.stock) && item.stock >= 0) : [];
    }
    catch (_a) {
        return [];
    }
}
function saveCartToStorage(items) {
    return saveLocalValue(CART_STORAGE_KEY, JSON.stringify(items));
}
function groupCartItems(items) {
    const grouped = new Map();
    for (const item of items) {
        const existing = grouped.get(item.id);
        if (existing)
            existing.qty++;
        else
            grouped.set(item.id, { item, qty: 1 });
    }
    return grouped;
}
function initImageZoom() {
    const modal = document.getElementById('zoom-modal');
    const close = document.getElementById('zoom-close');
    if (!modal || !close)
        return;
    let opener = null;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Imagine mărită');
    close.setAttribute('aria-label', 'Închide imaginea');
    const hide = () => {
        modal.style.display = 'none';
        if (opener === null || opener === void 0 ? void 0 : opener.isConnected)
            opener.focus();
    };
    modal.addEventListener('zoom-open', () => {
        opener = document.activeElement;
        close.focus();
    });
    close.addEventListener('click', hide);
    modal.addEventListener('click', event => {
        if (event.target === modal)
            hide();
    });
    document.addEventListener('keydown', event => {
        if (modal.style.display !== 'flex')
            return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hide();
        }
        if (event.key === 'Tab') {
            event.preventDefault();
            close.focus();
        }
    });
}
function initCompactShopControls() {
    var _a;
    const cart = document.getElementById('cart-button');
    if (cart) {
        const count = document.getElementById('cart-count');
        cart.innerHTML = '<i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>';
        if (count) {
            count.hidden = true;
            cart.appendChild(count);
        }
        cart.setAttribute('aria-label', 'Deschide coșul');
        cart.title = 'Coș';
    }
    const search = document.getElementById('search-bar');
    if (search && !document.getElementById('search-disclosure')) {
        const host = search.parentElement;
        const header = search.closest('header');
        const actions = header === null || header === void 0 ? void 0 : header.lastElementChild;
        if (header && actions && actions !== host) {
            const toggle = document.createElement('button');
            toggle.id = 'search-disclosure';
            toggle.type = 'button';
            toggle.className = 'shop-icon-button';
            toggle.innerHTML =
                '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';
            toggle.setAttribute('aria-label', 'Caută produse');
            toggle.setAttribute('aria-controls', 'search-bar');
            toggle.title = 'Caută produse';
            actions.prepend(toggle);
            host.classList.add('compact-search-host');
            header.classList.add('compact-shop-header');
            search.setAttribute('aria-label', 'Caută produse după nume');
            const setOpen = (open) => {
                host.hidden = !open;
                toggle.setAttribute('aria-expanded', String(open));
                if (open)
                    search.focus();
            };
            setOpen(false);
            toggle.addEventListener('click', () => {
                setOpen(Boolean(host.hidden));
            });
            search.addEventListener('input', () => {
                toggle.classList.toggle('has-active-filter', search.value.trim() !== '');
            });
            search.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    setOpen(false);
                    toggle.focus();
                }
            });
            document.addEventListener('click', event => {
                if (!host.contains(event.target) &&
                    !toggle.contains(event.target)) {
                    setOpen(false);
                }
            });
        }
    }
    const min = document.getElementById('price-min');
    const max = document.getElementById('price-max');
    if (min && max && !document.getElementById('price-disclosure')) {
        const fields = min.parentElement;
        const details = document.createElement('details');
        details.id = 'price-disclosure';
        details.className = 'shop-disclosure price-disclosure';
        details.innerHTML = `
            <summary>
                <i class="fa-solid fa-sliders" aria-hidden="true"></i>
                <span>Filtre</span>
            </summary>
        `;
        const toolbar = fields.parentElement;
        toolbar.classList.add('catalog-toolbar');
        toolbar.prepend(details);
        const sort = document.getElementById('sort-select');
        (_a = sort === null || sort === void 0 ? void 0 : sort.parentElement) === null || _a === void 0 ? void 0 : _a.classList.add('catalog-sort');
        const count = document.getElementById('products-count');
        if (count) {
            count.setAttribute('role', 'status');
            count.setAttribute('aria-live', 'polite');
            details.after(count);
        }
        details.appendChild(fields);
        fields.classList.add('shop-control-panel', 'price-fields');
        min.setAttribute('aria-label', 'Preț minim în RON');
        max.setAttribute('aria-label', 'Preț maxim în RON');
        const update = () => {
            const active = min.value !== '' || max.value !== '';
            details.classList.toggle('has-active-filter', active);
            details.querySelector('summary span').textContent =
                active ? 'Filtre •' : 'Filtre';
        };
        min.addEventListener('input', update);
        max.addEventListener('input', update);
        update();
    }
    document.querySelectorAll('.shop-disclosure').forEach(details => {
        document.addEventListener('click', event => {
            if (details.open && !details.contains(event.target)) {
                details.open = false;
            }
        });
        details.addEventListener('keydown', event => {
            var _a;
            if (event.key === 'Escape' && details.open) {
                details.open = false;
                (_a = details.querySelector('summary')) === null || _a === void 0 ? void 0 : _a.focus();
            }
        });
    });
}
void initAccountDropdown();
initCompactShopControls();
// Only a confirmed hybrid gets a badge; older products remain unmarked.
function hybridBadge(product) {
    return product.hybrid === true
        ? '<span class="hybrid-badge"><i class="fa-solid fa-seedling" aria-hidden="true"></i> Hibrid</span>'
        : '';
}
// Shared markup for catalog and recently viewed product cards.
function renderProductCard(cactus, hearted = false) {
    const validImage = cactus.imageUrl ||
        "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
    const stockLabel = cactus.stock === 1
        ? '1 exemplar rămas'
        : cactus.stock > 1
            ? `${cactus.stock} exemplare rămase`
            : 'Stoc epuizat';
    return `
        <article class="cactus-card">
            <div class="card-actions">
                <button class="wishlist-btn card-action-btn"
                    data-id="${cactus.id}"
                    style="color:${hearted ? '#d32f2f' : '#607568'};"
                    title="Favorite"
                    aria-label="Favorite"
                    aria-pressed="${hearted}">
                    <i class="fa-${hearted ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
                </button>
                <button class="zoom-btn card-action-btn"
                    data-img="${escapeHtml(validImage)}"
                    title="Mărește imaginea"
                    aria-label="Mărește imaginea">
                    <i class="fa-solid fa-expand" aria-hidden="true"></i>
                </button>
            </div>

            <a class="cactus-photo" href="product.html?id=${cactus.id}">
                <img loading="lazy"
                    class="cactus-image"
                    src="${escapeHtml(validImage)}"
                    alt="${escapeHtml(cactus.name)}">
            </a>

            <div class="cactus-details">
                <span class="cactus-category">${escapeHtml(cactus.category)}</span>
                ${hybridBadge(cactus)}
                <a class="cactus-name-link" href="product.html?id=${cactus.id}">
                    <h2 title="${escapeHtml(cactus.name)}">${escapeHtml(cactus.name)}</h2>
                </a>
                <p class="cactus-price">${formatPrice(cactus.price)} <span>RON</span></p>
                <p class="cactus-stock ${cactus.stock > 0 ? '' : 'is-unavailable'}">${stockLabel}</p>
            </div>

            <button class="${cactus.stock > 0 ? 'add-to-cart-btn' : 'sold-out-btn'}"
                data-id="${cactus.id}" ${cactus.stock > 0 ? '' : 'disabled'}>
                ${cactus.stock > 0 ? 'Adaugă în coș' : 'Stoc epuizat'}
            </button>
        </article>`;
}

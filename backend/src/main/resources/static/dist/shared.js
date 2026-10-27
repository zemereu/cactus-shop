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
// Keep aligned with OrderService.STATUS_TRANSITIONS; the server enforces the rules.
const ORDER_STATUS_TRANSITIONS = {
    'Neplătită': ['Plătită - în pregătire', 'Anulată'],
    'Plătită - în pregătire': ['Expediată', 'Anulată'],
    'Expediată': ['Livrată'],
    'Livrată': [],
    'Anulată': []
};
const CUSTOMER_NAME_KEY = "customerName";
const CART_STORAGE_KEY = "shoppingCart";
const PRODUCT_TYPES = ["Plante", "Semințe"];
const MAIN_CATEGORIES = ["Cactuși", "Suculente"];
const API_BASE = '';
function authFetch(url, options = {}) {
    return fetch(url, Object.assign(Object.assign({}, options), { credentials: 'include', headers: Object.assign({}, options.headers) }));
}
// Share concurrent checks, but always recheck after a request has finished.
let customerProfileRequest = null;
function getCustomerProfile() {
    if (customerProfileRequest)
        return customerProfileRequest;
    customerProfileRequest = (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/me`);
            if (response.status === 401 || response.status === 403) {
                try {
                    localStorage.removeItem(CUSTOMER_NAME_KEY);
                }
                catch (_a) { }
                return null;
            }
            if (!response.ok)
                throw new Error(yield responseError(response));
            const profile = yield response.json();
            if (!profile || typeof profile.name !== 'string' || typeof profile.email !== 'string') {
                throw new Error('Răspuns de cont invalid.');
            }
            return profile;
        }
        finally {
            customerProfileRequest = null;
        }
    }))();
    return customerProfileRequest;
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
        const text = (yield response.text()).trim();
        const fallback = `Eroare HTTP ${response.status}.`;
        if (!text)
            return fallback;
        let body;
        try {
            body = JSON.parse(text);
        }
        catch (_a) {
            // A proxy may return an HTML error page instead of an API message.
            return text.startsWith('<') ? fallback : text;
        }
        if (typeof body === 'string')
            return body.trim() || fallback;
        if (!body || typeof body !== 'object' || Array.isArray(body))
            return fallback;
        const error = body;
        const message = [error.error, error.message, error.detail]
            .find((value) => typeof value === 'string' && value.trim() !== '');
        const details = error.details && typeof error.details === 'object'
            ? Object.keys(error.details).map(key => error.details[key])
                .filter((value) => typeof value === 'string' && value.trim() !== '')
            : [];
        return [message || fallback, ...details].join('\n');
    });
}
const priceFormatter = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
function formatPrice(value) {
    return priceFormatter.format(Number(value));
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
                authenticated = (yield getCustomerProfile()) !== null;
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
void initAccountDropdown();
// Only a confirmed hybrid gets a badge; older products remain unmarked.
function hybridBadge(product) {
    return product.hybrid === true
        ? '<span class="hybrid-badge"><i class="fa-solid fa-seedling" aria-hidden="true"></i> Hibrid</span>'
        : '';
}

"use strict";
// --- shared.ts ---
// Cod comun folosit atât de index.ts (magazin) cât și de admin.ts (panou admin).
// Acest fișier trebuie încărcat ÎNAINTE de index.js / admin.js în HTML,
// altfel API_BASE și escapeHtml nu vor exista încă atunci când sunt apelate.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Detaliile de plată prin transfer bancar, afișate la checkout.
// ÎNLOCUIEȘTE cu datele tale reale înainte de a activa plățile live.
const BANK_TRANSFER_INFO = {
    iban: "RO00 XXXX 0000 0000 0000 0000",
    bank: "Numele Băncii",
    holder: "Numele Titularului / Firmei"
};
const ORDER_STATUSES = ["Neplătită", "Plătită - în pregătire", "Expediată", "Livrată"];
// Tokenurile JWT sunt în HttpOnly cookies.
const CUSTOMER_NAME_KEY = "customerName";
const CART_STORAGE_KEY = "shoppingCart";
const PRODUCT_TYPES = ["Plante", "Semințe"];
const MAIN_CATEGORIES = ["Cactuși", "Suculente"];
// Frontendul si API-ul sunt servite de aceeasi aplicatie pe Railway.
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
    const full = '<i class="fa-solid fa-star" style="color: #FF9800;"></i>';
    const empty = '<i class="fa-regular fa-star" style="color: #ccc;"></i>';
    return full.repeat(rating) + empty.repeat(5 - rating);
}
function initAccountDropdown() {
    const accountLink = document.getElementById('account-link');
    const dropdown = document.getElementById('account-dropdown');
    const logoutBtn = document.getElementById('dropdown-logout-btn');
    if (!accountLink)
        return;
    const customerName = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (customerName) {
        accountLink.innerHTML = `<i class="fa-solid fa-user" style="margin-right: 4px;"></i> ${escapeHtml(customerName)}`;
        accountLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
        const verificaBtn = document.getElementById('header-verifica-btn');
        if (verificaBtn)
            verificaBtn.style.display = 'none';
    }
    if (dropdown) {
        window.addEventListener('click', (event) => {
            if (dropdown.style.display === 'block') {
                const target = event.target;
                if (!dropdown.contains(target) && target !== accountLink) {
                    dropdown.style.display = 'none';
                }
            }
        });
        dropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            yield authFetch(`${API_BASE}/api/customers/logout`, { method: 'POST' });
            localStorage.removeItem(CUSTOMER_NAME_KEY);
            window.location.reload();
        }));
    }
}
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:1000; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = 'background:#2f694b; color:#fdf2b8; padding:12px 20px; border-radius:8px; font-weight:bold; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation:slideIn 0.3s ease;';
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

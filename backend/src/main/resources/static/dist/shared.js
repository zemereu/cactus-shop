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
// ⚠️ ÎNLOCUIEȘTE cu datele tale reale (IBAN, banca, titular) înainte de a activa plățile live.
const BANK_TRANSFER_INFO = {
    iban: "RO00 XXXX 0000 0000 0000 0000", // TODO: pune IBAN-ul tău real
    bank: "Numele Băncii", // TODO
    holder: "Numele Titularului / Firmei" // TODO
};
const ORDER_STATUSES = ["Neplătită", "Plătită - în pregătire", "Expediată", "Livrată"];
// Tokenurile JWT sunt acum în HttpOnly cookies — nu mai stocăm nimic
// legat de autentificare în localStorage.
const CUSTOMER_NAME_KEY = "customerName";
const CART_STORAGE_KEY = "shoppingCart";
// Nivelul de sus: tipul de produs — orizontal, se aplică peste orice gen.
const PRODUCT_TYPES = ["Plantă", "Semințe"];
// Nivelul din mijloc, fix. Genurile (nivelul de jos) sunt adăugate
// dinamic din admin, sub una din aceste 2 categorii.
const MAIN_CATEGORIES = ["Cactuși", "Suculente"];
// Gol — request-urile merg prin proxy-ul Netlify (same origin),
// care le redirecționează către Railway. Asta permite cookie-uri
// first-party (HttpOnly, Secure, SameSite=Lax).
const API_BASE = '';
// Fetch cu credentials incluse — browserul trimite automat cookie-ul JWT.
function authFetch(url, options = {}) {
    return fetch(url, Object.assign(Object.assign({}, options), { credentials: 'include', headers: Object.assign({}, options.headers) }));
}
// Scapă orice text ce ar putea proveni din date introduse de utilizator
// înainte de a-l pune în innerHTML (nume produs, descriere, categorie,
// nume client, adresă, etc.) — previne XSS stocat.
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
// Inițializează dropdown-ul de cont — folosit pe orice pagină care are
// #account-link, #account-dropdown și #dropdown-logout-btn în header.
function initAccountDropdown() {
    const accountLink = document.getElementById('account-link');
    const dropdown = document.getElementById('account-dropdown');
    const logoutBtn = document.getElementById('dropdown-logout-btn');
    if (!accountLink)
        return;
    const customerName = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (customerName) {
        accountLink.innerHTML = `<i class="fa-solid fa-user" style="margin-right: 4px;"></i> ${customerName}`;
        accountLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
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

// --- shared.ts ---
// Cod comun folosit atât de index.ts (magazin) cât și de admin.ts (panou admin).
// Acest fișier trebuie încărcat ÎNAINTE de index.js / admin.js în HTML,
// altfel API_BASE și escapeHtml nu vor exista încă atunci când sunt apelate.

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
const PRODUCT_TYPES = ["Plante", "Semințe"];

// Nivelul din mijloc, fix. Genurile (nivelul de jos) sunt adăugate
// dinamic din admin, sub una din aceste 2 categorii.
const MAIN_CATEGORIES = ["Cactuși", "Suculente"];

// Gol — request-urile merg prin proxy-ul Netlify (same origin),
// care le redirecționează către Railway. Asta permite cookie-uri
// first-party (HttpOnly, Secure, SameSite=Lax).
const API_BASE = '';

// Fetch cu credentials incluse — browserul trimite automat cookie-ul JWT.
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers
        }
    });
}

// --- Interfețe comune (folosite de index.ts, admin.ts, etc.) ---
interface Cactus {
    id: number;
    name: string;
    price: number;
    description: string;
    productType: string;
    category: string;
    mainCategory: string;
    imageUrl: string;
    stock: number;
    active: boolean;
}

interface Category {
    id: number;
    name: string;
    mainCategory: string;
}

interface Order {
    id: number;
    customerName: string;
    email: string;
    address: string;
    totalPrice: number;
    purchasedItems: string;
    status: string;
}

// Scapă orice text ce ar putea proveni din date introduse de utilizator
// înainte de a-l pune în innerHTML (nume produs, descriere, categorie,
// nume client, adresă, etc.) — previne XSS stocat.
function escapeHtml(unsafe: string | null | undefined): string {
    if (unsafe === null || unsafe === undefined) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function starsDisplay(rating: number): string {
    const full = '<i class="fa-solid fa-star" style="color: #FF9800;"></i>';
    const empty = '<i class="fa-regular fa-star" style="color: #ccc;"></i>';
    return full.repeat(rating) + empty.repeat(5 - rating);
}

// Inițializează dropdown-ul de cont — folosit pe orice pagină care are
// #account-link, #account-dropdown și #dropdown-logout-btn în header.
function initAccountDropdown() {
    const accountLink = document.getElementById('account-link') as HTMLAnchorElement | null;
    const dropdown = document.getElementById('account-dropdown');
    const logoutBtn = document.getElementById('dropdown-logout-btn');
    if (!accountLink) return;

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

        // Ascunde butonul "Verifică Comanda" din header când ești logat
        const verificaBtn = document.getElementById('header-verifica-btn');
        if (verificaBtn) verificaBtn.style.display = 'none';
    }

    if (dropdown) {
        window.addEventListener('click', (event) => {
            if (dropdown.style.display === 'block') {
                const target = event.target as Node;
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
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            await authFetch(`${API_BASE}/api/customers/logout`, { method: 'POST' });
            localStorage.removeItem(CUSTOMER_NAME_KEY);
            window.location.reload();
        });
    }
}
// --- Toast global ---
function showToast(message: string) {
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

// --- Wishlist global ---
const WISHLIST_KEY = 'wishlist';
let wishlist: number[] = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');

function toggleWishlist(id: number) {
    const idx = wishlist.indexOf(id);
    if (idx === -1) {
        wishlist.push(id);
        showToast('<i class="fa-solid fa-heart" style="color: #d32f2f;"></i> Adăugat la favorite');
    } else {
        wishlist.splice(idx, 1);
        showToast('<i class="fa-regular fa-heart"></i> Eliminat din favorite');
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
}

function isWishlisted(id: number): boolean {
    return wishlist.includes(id);
}
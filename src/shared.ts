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
const PRODUCT_TYPES = ["Plantă", "Semințe"];

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
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}
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

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: { ...options.headers }
    });
}

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
    location?: string | null;
    version: number;
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
    createdAt?: string;
}

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

async function responseError(response: Response): Promise<string> {
    const text = await response.text();
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
    } catch {
        return text || `Eroare HTTP ${response.status}.`;
    }
}

function formatPrice(value: number): string {
    return Number(value).toFixed(2);
}

function formatOrderDate(value?: string): string {
    if (!value) return '';
    const date = new Date(
        /Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z'
    );
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' });
}

async function initAccountDropdown() {
    if (document.getElementById('login-container')) return;

    let accountLink = document.getElementById('account-link') as HTMLAnchorElement | null;
    if (!accountLink) {
        const header = document.querySelector('header');
        if (!header) return;
        accountLink = document.createElement('a');
        accountLink.id = 'account-link';
        accountLink.href = 'account.html';
        accountLink.textContent = 'Cont';
        header.appendChild(accountLink);
    }

    const link = accountLink;
    const dropdown = document.getElementById('account-dropdown');
    let authenticated = false;

    const refresh = async () => {
        try {
            const response = await authFetch(`${API_BASE}/api/customers/me`);
            if (!response.ok && response.status !== 401 && response.status !== 403) return;

            authenticated = response.ok;
            if (authenticated) {
                const profile = await response.json();
                link.textContent = profile.name;
            } else {
                link.textContent = 'Cont';
                if (dropdown) dropdown.style.display = 'none';
                try { localStorage.removeItem(CUSTOMER_NAME_KEY); } catch {}
            }

            const lookup = document.getElementById('header-verifica-btn');
            if (lookup) lookup.style.display = authenticated ? 'none' : '';
        } catch {
            // O eroare de retea nu inseamna deconectare.
        }
    };

    link.addEventListener('click', event => {
        if (!authenticated || !dropdown) return;
        event.preventDefault();
        event.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', event => {
        if (dropdown
            && !dropdown.contains(event.target as Node)
            && !link.contains(event.target as Node)) {
            dropdown.style.display = 'none';
        }
    });

    document.getElementById('dropdown-logout-btn')?.addEventListener('click', async event => {
        event.preventDefault();
        try {
            const response = await authFetch(`${API_BASE}/api/customers/logout`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error(await responseError(response));
            try { localStorage.removeItem(CUSTOMER_NAME_KEY); } catch {}
            await refresh();
        } catch {
            showToast('Deconectarea nu a putut fi confirmată. Reîncearcă.');
        }
    });

    window.addEventListener('focus', refresh);
    await refresh();
}

function showToast(message: string) {
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

function readStoredProductIds(key: string): number[] {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(data)
            ? [...new Set(data.filter(
                (id): id is number => Number.isSafeInteger(id) && id > 0
            ))]
            : [];
    } catch {
        return [];
    }
}

const WISHLIST_KEY = 'wishlist';
let wishlist: number[] = readStoredProductIds(WISHLIST_KEY);

function toggleWishlist(id: number) {
    const next = readStoredProductIds(WISHLIST_KEY);
    const idx = next.indexOf(id);
    if (idx === -1) next.push(id);
    else next.splice(idx, 1);

    if (!saveLocalValue(WISHLIST_KEY, JSON.stringify(next))) return;
    wishlist = next;
    showToast(idx === -1 ? 'Adăugat la favorite' : 'Eliminat din favorite');
}

function isWishlisted(id: number): boolean {
    return wishlist.includes(id);
}

function saveLocalValue(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        showToast('Nu am putut salva în browser. Verifică setările de stocare și reîncearcă.');
        return false;
    }
}

function initImageZoom() {
    const modal = document.getElementById('zoom-modal');
    const close = document.getElementById('zoom-close');
    if (!modal || !close) return;

    let opener: HTMLElement | null = null;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Imagine mărită');
    close.setAttribute('aria-label', 'Închide imaginea');

    const hide = () => {
        modal.style.display = 'none';
        if (opener?.isConnected) opener.focus();
    };

    modal.addEventListener('zoom-open', () => {
        opener = document.activeElement as HTMLElement | null;
        close.focus();
    });

    close.addEventListener('click', hide);
    modal.addEventListener('click', event => {
        if (event.target === modal) hide();
    });

    document.addEventListener('keydown', event => {
        if (modal.style.display !== 'flex') return;
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
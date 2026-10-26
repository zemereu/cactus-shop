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

interface CustomerProfile {
    name: string;
    email: string;
    address: string;
    verified: boolean;
}

// Share concurrent checks, but always recheck after a request has finished.
let customerProfileRequest: Promise<CustomerProfile | null> | null = null;
function getCustomerProfile(): Promise<CustomerProfile | null> {
    if (customerProfileRequest) return customerProfileRequest;
    customerProfileRequest = (async () => {
        try {
            const response = await authFetch(`${API_BASE}/api/customers/me`);
            if (response.status === 401 || response.status === 403) {
                try { localStorage.removeItem(CUSTOMER_NAME_KEY); } catch {}
                return null;
            }
            if (!response.ok) throw new Error(await responseError(response));
            const profile = await response.json();
            if (!profile || typeof profile.name !== 'string' || typeof profile.email !== 'string') {
                throw new Error('Răspuns de cont invalid.');
            }
            return profile as CustomerProfile;
        } finally {
            customerProfileRequest = null;
        }
    })();
    return customerProfileRequest;
}

interface CartItem {
    id: number;
    name: string;
    price: number;
    stock: number;
    hybrid?: boolean;
}

interface Cactus extends CartItem {
    description: string;
    productType: string;
    category: string;
    mainCategory: string;
    imageUrl: string;
    active: boolean;
    location?: string | null;
    version: number;
}

interface ReviewResponse {
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
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
    const full = '<i class="fa-solid fa-star" style="color:#FF9800;"></i>';
    const empty = '<i class="fa-regular fa-star" style="color:#ccc;"></i>';
    return full.repeat(rating) + empty.repeat(5 - rating);
}

async function responseError(response: Response): Promise<string> {
    const text = (await response.text()).trim();
    const fallback = `Eroare HTTP ${response.status}.`;
    if (!text) return fallback;

    let body: unknown;
    try {
        body = JSON.parse(text);
    } catch {
        // A proxy may return an HTML error page instead of an API message.
        return text.startsWith('<') ? fallback : text;
    }
    if (typeof body === 'string') return body.trim() || fallback;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fallback;

    const error = body as Record<string, unknown>;
    const message = [error.error, error.message, error.detail]
        .find((value): value is string => typeof value === 'string' && value.trim() !== '');
    const details = error.details && typeof error.details === 'object'
        ? Object.keys(error.details).map(key => (error.details as Record<string, unknown>)[key])
            .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
        : [];
    return [message || fallback, ...details].join('\n');
}

const priceFormatter = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatPrice(value: number): string {
    return priceFormatter.format(Number(value));
}

function formatOrderDate(value?: string): string {
    if (!value) return '';

    const date = new Date(
        /Z$|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z'
    );

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('ro-RO', {
            timeZone: 'Europe/Bucharest'
        });
}

async function initAccountDropdown() {
    if (document.getElementById('login-container') || document.getElementById('tab-login')) return;

    let accountLink = document.getElementById('account-link') as HTMLAnchorElement | null;

    if (!accountLink) {
        const header = document.querySelector('header');
        if (!header) return;

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

    const refresh = async () => {
        try {
            authenticated = (await getCustomerProfile()) !== null;

            if (authenticated) {
                link.title = 'Contul meu';
            } else {
                link.title = 'Autentificare';
                if (dropdown) dropdown.style.display = 'none';

                try {
                    localStorage.removeItem(CUSTOMER_NAME_KEY);
                } catch {}
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
        dropdown.style.display =
            dropdown.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', event => {
        if (
            dropdown &&
            !dropdown.contains(event.target as Node) &&
            !link.contains(event.target as Node)
        ) {
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

            try {
                localStorage.removeItem(CUSTOMER_NAME_KEY);
            } catch {}

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

// Keep repeated entries: each occurrence represents one unit in the cart.
function loadCartFromStorage(): CartItem[] {
    try {
        const data = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        return Array.isArray(data) ? data.filter(item => item &&
            Number.isSafeInteger(item.id) && item.id > 0 &&
            typeof item.name === 'string' &&
            Number.isFinite(item.price) && item.price >= 0 &&
            Number.isSafeInteger(item.stock) && item.stock >= 0) : [];
    } catch {
        return [];
    }
}

function saveCartToStorage(items: readonly CartItem[]): boolean {
    return saveLocalValue(CART_STORAGE_KEY, JSON.stringify(items));
}

function groupCartItems(items: readonly CartItem[]): Map<number, { item: CartItem; qty: number }> {
    const grouped = new Map<number, { item: CartItem; qty: number }>();
    for (const item of items) {
        const existing = grouped.get(item.id);
        if (existing) existing.qty++;
        else grouped.set(item.id, { item, qty: 1 });
    }
    return grouped;
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

// Only a confirmed hybrid gets a badge; older products remain unmarked.
function hybridBadge(product: { hybrid?: boolean }): string {
    return product.hybrid === true
        ? '<span class="hybrid-badge"><i class="fa-solid fa-seedling" aria-hidden="true"></i> Hibrid</span>'
        : '';
}
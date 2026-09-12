// API_BASE, CUSTOMER_JWT_KEY, CUSTOMER_NAME_KEY vin din shared.ts

interface CustomerProfile {
    name: string;
    email: string;
    address: string;
}

// Reținem de unde a venit clientul (ex: shop.html), ca să-l trimitem
// automat înapoi acolo după login/înregistrare reușite, în loc să-l
// lăsăm blocat pe pagina de cont.
const REDIRECT_FALLBACK = "shop.html";
function getRedirectTarget(): string {
    const referrer = document.referrer;
    if (referrer && !referrer.includes('cont.html')) {
        try {
            const referrerUrl = new URL(referrer);
            if (referrerUrl.origin === window.location.origin) {
                return referrer;
            }
        } catch {
            // referrer invalid, ignorăm
        }
    }
    return REDIRECT_FALLBACK;
}

// --- Comutare între tab-uri Login / Înregistrare ---
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginPanel = document.getElementById('login-panel');
const registerPanel = document.getElementById('register-panel');

function activateTab(tab: 'login' | 'register') {
    if (!tabLogin || !tabRegister || !loginPanel || !registerPanel) return;

    const isLogin = tab === 'login';
    loginPanel.style.display = isLogin ? 'block' : 'none';
    registerPanel.style.display = isLogin ? 'none' : 'block';

    tabLogin.style.color = isLogin ? '#2f694b' : '#999';
    tabLogin.style.borderBottom = isLogin ? '3px solid #2f694b' : '3px solid transparent';
    tabRegister.style.color = isLogin ? '#999' : '#2f694b';
    tabRegister.style.borderBottom = isLogin ? '3px solid transparent' : '3px solid #2f694b';
}

if (tabLogin) tabLogin.addEventListener('click', () => activateTab('login'));
if (tabRegister) tabRegister.addEventListener('click', () => activateTab('register'));

// --- Dacă e deja logat la încărcarea paginii, arată panoul de cont cu datele reale ---
async function checkLoggedInState() {
    const token = localStorage.getItem(CUSTOMER_JWT_KEY);
    if (!token) return;

    const loggedInPanel = document.getElementById('logged-in-panel');
    const loggedInName = document.getElementById('logged-in-name');
    const tabsContainer = tabLogin?.parentElement;

    try {
        const response = await fetch(`${API_BASE}/api/customers/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            // Token expirat sau invalid — curățăm și lăsăm formularul de login
            localStorage.removeItem(CUSTOMER_JWT_KEY);
            localStorage.removeItem(CUSTOMER_NAME_KEY);
            return;
        }

        const profile: CustomerProfile = await response.json();

        if (loginPanel) loginPanel.style.display = 'none';
        if (registerPanel) registerPanel.style.display = 'none';
        if (tabsContainer) tabsContainer.style.display = 'none';
        if (loggedInPanel) loggedInPanel.style.display = 'block';
        if (loggedInName) loggedInName.innerText = profile.name;

        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileAddress = document.getElementById('profile-address') as HTMLInputElement;

        if (profileName) profileName.innerText = profile.name;
        if (profileEmail) profileEmail.innerText = profile.email;
        if (profileAddress) profileAddress.value = profile.address;

    } catch (error) {
        console.error("Eroare la încărcarea contului:", error);
    }
}
checkLoggedInState();

// --- Login ---
const loginSubmitBtn = document.getElementById('login-submit-btn');
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
        const email = (document.getElementById('login-email') as HTMLInputElement).value.trim();
        const password = (document.getElementById('login-password') as HTMLInputElement).value;
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            if (errorEl) { errorEl.innerText = "Completează emailul și parola."; errorEl.style.display = 'block'; }
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/customers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const message = await response.text();
                if (errorEl) { errorEl.innerText = message || "Email sau parolă incorecte."; errorEl.style.display = 'block'; }
                return;
            }

            const data = await response.json();
            localStorage.setItem(CUSTOMER_JWT_KEY, data.token);
            localStorage.setItem(CUSTOMER_NAME_KEY, data.name);

            // Ne întoarcem automat de unde a venit clientul, nu rămânem pe cont.html
            window.location.href = getRedirectTarget();
        } catch (error) {
            console.error(error);
            if (errorEl) { errorEl.innerText = "Nu am putut contacta serverul."; errorEl.style.display = 'block'; }
        }
    });
}

// --- Înregistrare ---
const registerSubmitBtn = document.getElementById('register-submit-btn');
if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener('click', async () => {
        const name = (document.getElementById('register-name') as HTMLInputElement).value.trim();
        const email = (document.getElementById('register-email') as HTMLInputElement).value.trim();
        const password = (document.getElementById('register-password') as HTMLInputElement).value;
        const address = (document.getElementById('register-address') as HTMLInputElement).value.trim();
        const errorEl = document.getElementById('register-error');

        if (!name || !email || !password || !address) {
            if (errorEl) { errorEl.innerText = "Completează toate câmpurile."; errorEl.style.display = 'block'; }
            return;
        }
        if (password.length < 8) {
            if (errorEl) { errorEl.innerText = "Parola trebuie să aibă cel puțin 8 caractere."; errorEl.style.display = 'block'; }
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/customers/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, address })
            });

            if (!response.ok) {
                const message = await response.text();
                if (errorEl) { errorEl.innerText = message || "Nu am putut crea contul."; errorEl.style.display = 'block'; }
                return;
            }

            const data = await response.json();
            localStorage.setItem(CUSTOMER_JWT_KEY, data.token);
            localStorage.setItem(CUSTOMER_NAME_KEY, data.name);

            window.location.href = getRedirectTarget();
        } catch (error) {
            console.error(error);
            if (errorEl) { errorEl.innerText = "Nu am putut contacta serverul."; errorEl.style.display = 'block'; }
        }
    });
}

// --- Salvare adresă (din panoul de cont, când ești deja logat) ---
const saveAddressBtn = document.getElementById('save-address-btn');
if (saveAddressBtn) {
    saveAddressBtn.addEventListener('click', async () => {
        const token = localStorage.getItem(CUSTOMER_JWT_KEY);
        const addressInput = document.getElementById('profile-address') as HTMLInputElement;
        const messageEl = document.getElementById('profile-message');
        if (!token || !addressInput || !messageEl) return;

        try {
            const response = await fetch(`${API_BASE}/api/customers/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ address: addressInput.value.trim() })
            });

            messageEl.style.display = 'block';
            if (response.ok) {
                messageEl.style.color = '#2f694b';
                messageEl.innerText = "Adresa a fost salvată.";
            } else {
                messageEl.style.color = '#d32f2f';
                messageEl.innerText = "Nu am putut salva adresa.";
            }
        } catch (error) {
            console.error(error);
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Eroare de conexiune.";
        }
    });
}

// --- Deconectare ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(CUSTOMER_JWT_KEY);
        localStorage.removeItem(CUSTOMER_NAME_KEY);
        window.location.href = REDIRECT_FALLBACK;
    });
}
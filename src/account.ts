// API_BASE, CUSTOMER_JWT_KEY, CUSTOMER_NAME_KEY vin din shared.ts

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

// --- Verifică dacă e deja logat, la încărcarea paginii ---
function checkLoggedInState() {
    const token = localStorage.getItem(CUSTOMER_JWT_KEY);
    const name = localStorage.getItem(CUSTOMER_NAME_KEY);

    const loggedInPanel = document.getElementById('logged-in-panel');
    const loggedInName = document.getElementById('logged-in-name');
    const tabsContainer = tabLogin?.parentElement;

    if (token && name && loggedInPanel && loggedInName) {
        if (loginPanel) loginPanel.style.display = 'none';
        if (registerPanel) registerPanel.style.display = 'none';
        if (tabsContainer) tabsContainer.style.display = 'none';
        loggedInPanel.style.display = 'block';
        loggedInName.innerText = name;
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
            checkLoggedInState();
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
            checkLoggedInState();
        } catch (error) {
            console.error(error);
            if (errorEl) { errorEl.innerText = "Nu am putut contacta serverul."; errorEl.style.display = 'block'; }
        }
    });
}

// --- Deconectare ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(CUSTOMER_JWT_KEY);
        localStorage.removeItem(CUSTOMER_NAME_KEY);
        window.location.reload();
    });
}
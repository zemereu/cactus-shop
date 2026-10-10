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
const REDIRECT_FALLBACK = "shop.html";
function getRedirectTarget() {
    const referrer = document.referrer;
    if (referrer && !referrer.includes('account.html')) {
        try {
            const referrerUrl = new URL(referrer);
            if (referrerUrl.origin === window.location.origin) {
                return referrer;
            }
        }
        catch (_a) { }
    }
    return REDIRECT_FALLBACK;
}
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginPanel = document.getElementById('login-panel');
const registerPanel = document.getElementById('register-panel');
function activateTab(tab) {
    if (!tabLogin || !tabRegister || !loginPanel || !registerPanel)
        return;
    const isLogin = tab === 'login';
    loginPanel.style.display = isLogin ? 'block' : 'none';
    registerPanel.style.display = isLogin ? 'none' : 'block';
    tabLogin.style.color = isLogin ? '#2f694b' : '#999';
    tabLogin.style.borderBottom = isLogin ? '3px solid #2f694b' : '3px solid transparent';
    tabRegister.style.color = isLogin ? '#999' : '#2f694b';
    tabRegister.style.borderBottom = isLogin ? '3px solid transparent' : '3px solid #2f694b';
}
if (tabLogin)
    tabLogin.addEventListener('click', () => activateTab('login'));
if (tabRegister)
    tabRegister.addEventListener('click', () => activateTab('register'));
function checkLoggedInState() {
    return __awaiter(this, void 0, void 0, function* () {
        const loggedInPanel = document.getElementById('logged-in-panel');
        const loggedInName = document.getElementById('logged-in-name');
        const tabsContainer = tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.parentElement;
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/me`);
            if (!response.ok) {
                localStorage.removeItem(CUSTOMER_NAME_KEY);
                return;
            }
            const profile = yield response.json();
            if (loginPanel)
                loginPanel.style.display = 'none';
            if (registerPanel)
                registerPanel.style.display = 'none';
            if (tabsContainer)
                tabsContainer.style.display = 'none';
            if (loggedInPanel)
                loggedInPanel.style.display = 'block';
            if (loggedInName)
                loggedInName.innerText = profile.name;
            saveLocalValue(CUSTOMER_NAME_KEY, profile.name);
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const profileAddress = document.getElementById('profile-address');
            if (profileName)
                profileName.innerText = profile.name;
            if (profileEmail)
                profileEmail.innerText = profile.email;
            if (profileAddress)
                profileAddress.value = profile.address;
            const verifyBanner = document.getElementById('verify-banner');
            if (verifyBanner) {
                if (profile.verified) {
                    verifyBanner.innerHTML = `
                    <div style="background:#e8f5e9; color:#2f694b; padding:12px; border-radius:8px; margin-bottom:15px; text-align:center;">
                        <i class="fa-solid fa-circle-check"></i> Cont verificat
                    </div>`;
                }
                else {
                    verifyBanner.innerHTML = `
                    <div style="background:#fff3e0; color:#e65100; padding:12px; border-radius:8px; margin-bottom:15px; text-align:center;">
                        <i class="fa-solid fa-triangle-exclamation"></i> Contul nu este verificat.
                        <button id="resend-verify-btn" style="margin-left:8px; background:#e65100; color:white; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85em;">
                            Retrimite codul
                        </button>
                    </div>`;
                    const resendBtn = document.getElementById('resend-verify-btn');
                    if (resendBtn) {
                        resendBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                            resendBtn.setAttribute('disabled', 'true');
                            try {
                                const response = yield authFetch(`${API_BASE}/api/customers/resend-verification`, { method: 'POST' });
                                if (!response.ok)
                                    throw new Error(yield responseError(response));
                                const data = yield response.json();
                                showToast(data.message);
                            }
                            catch (error) {
                                showToast(error instanceof Error
                                    ? error.message
                                    : 'Nu am putut trimite emailul.');
                            }
                            finally {
                                resendBtn.removeAttribute('disabled');
                            }
                        }));
                    }
                }
            }
        }
        catch (error) {
            console.error("Eroare la incarcarea contului:", error);
        }
    });
}
checkLoggedInState();
const loginSubmitBtn = document.getElementById('login-submit-btn');
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        if (!email || !password) {
            if (errorEl) {
                errorEl.innerText = "Completeaza emailul si parola.";
                errorEl.style.display = 'block';
            }
            return;
        }
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const message = yield responseError(response);
                if (errorEl) {
                    errorEl.innerText = message || "Email sau parola incorecte.";
                    errorEl.style.display = 'block';
                }
                return;
            }
            const data = yield response.json();
            saveLocalValue(CUSTOMER_NAME_KEY, data.name);
            window.location.href = getRedirectTarget();
        }
        catch (error) {
            console.error(error);
            if (errorEl) {
                errorEl.innerText = "Nu am putut contacta serverul.";
                errorEl.style.display = 'block';
            }
        }
    }));
}
const registerSubmitBtn = document.getElementById('register-submit-btn');
if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const address = document.getElementById('register-address').value.trim();
        const errorEl = document.getElementById('register-error');
        if (!name || !email || !password || !address) {
            if (errorEl) {
                errorEl.innerText = "Completeaza toate campurile.";
                errorEl.style.display = 'block';
            }
            return;
        }
        if (password.length < 8) {
            if (errorEl) {
                errorEl.innerText = "Parola trebuie sa aiba cel putin 8 caractere.";
                errorEl.style.display = 'block';
            }
            return;
        }
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, address })
            });
            if (!response.ok) {
                const message = yield responseError(response);
                if (errorEl) {
                    errorEl.innerText = message || "Nu am putut crea contul.";
                    errorEl.style.display = 'block';
                }
                return;
            }
            const data = yield response.json();
            saveLocalValue(CUSTOMER_NAME_KEY, data.name);
            window.location.href = getRedirectTarget();
        }
        catch (error) {
            console.error(error);
            if (errorEl) {
                errorEl.innerText = "Nu am putut contacta serverul.";
                errorEl.style.display = 'block';
            }
        }
    }));
}
const saveAddressBtn = document.getElementById('save-address-btn');
if (saveAddressBtn) {
    saveAddressBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const addressInput = document.getElementById('profile-address');
        const messageEl = document.getElementById('profile-message');
        if (!addressInput || !messageEl)
            return;
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressInput.value.trim() })
            });
            messageEl.style.display = 'block';
            if (response.ok) {
                messageEl.style.color = '#2f694b';
                messageEl.innerText = "Adresa a fost salvata.";
            }
            else {
                messageEl.style.color = '#d32f2f';
                messageEl.innerText = "Nu am putut salva adresa.";
            }
        }
        catch (error) {
            console.error(error);
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Eroare de conexiune.";
        }
    }));
}
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        yield authFetch(`${API_BASE}/api/customers/logout`, { method: 'POST' });
        localStorage.removeItem(CUSTOMER_NAME_KEY);
        window.location.href = REDIRECT_FALLBACK;
    }));
}
const verifyToken = new URLSearchParams(window.location.search).get('verify');
if (verifyToken) {
    window.history.replaceState(null, '', 'account.html');
    authFetch(`${API_BASE}/api/customers/verify?token=${encodeURIComponent(verifyToken)}`)
        .then((response) => __awaiter(void 0, void 0, void 0, function* () {
        if (!response.ok)
            throw new Error(yield responseError(response));
        showToast('Adresa de email a fost verificată.');
        yield checkLoggedInState();
    }))
        .catch(error => showToast(error instanceof Error ? error.message : 'Verificarea a eșuat.'));
}

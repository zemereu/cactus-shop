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
let passwordResetToken = new URLSearchParams(window.location.hash.slice(1)).get('reset');
if (passwordResetToken)
    window.history.replaceState(null, '', 'account.html');
// API_BASE, CUSTOMER_NAME_KEY, authFetch vin din shared.ts
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
// --- Comutare tab-uri Login / Inregistrare ---
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
    tabLogin.setAttribute('aria-pressed', String(isLogin));
    tabRegister.setAttribute('aria-pressed', String(!isLogin));
}
if (tabLogin)
    tabLogin.addEventListener('click', () => activateTab('login'));
if (tabRegister)
    tabRegister.addEventListener('click', () => activateTab('register'));
// --- Daca e deja logat, arata panoul de cont ---
let currentAccountProfile = null;
function checkLoggedInState() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const loggedInPanel = document.getElementById('logged-in-panel');
        const loggedInName = document.getElementById('logged-in-name');
        const tabsContainer = tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.parentElement;
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/me`);
            if (!response.ok) {
                if (response.status !== 401)
                    throw new Error(yield responseError(response));
                saveLocalValue(CUSTOMER_NAME_KEY, '');
                return;
            }
            const profile = yield response.json();
            currentAccountProfile = profile;
            if (loginPanel)
                loginPanel.style.display = 'none';
            if (registerPanel)
                registerPanel.style.display = 'none';
            if (tabsContainer)
                tabsContainer.style.display = 'none';
            if (loggedInPanel)
                loggedInPanel.style.display = 'block';
            document.getElementById('account-auth').hidden = true;
            document.getElementById('account-description').textContent = 'Găsești aici datele contului, adresa de livrare și accesul la comenzi.';
            const recovery = document.getElementById('password-recovery');
            document.getElementById('account-security-body').appendChild(recovery);
            recovery.querySelector('summary').textContent = 'Schimbă parola prin email';
            const recoveryEmail = document.getElementById('recovery-email');
            recoveryEmail.value = profile.email;
            recoveryEmail.readOnly = true;
            if (loggedInName)
                loggedInName.innerText = profile.name;
            saveLocalValue(CUSTOMER_NAME_KEY, profile.name);
            const values = {
                'profile-first-name': (_a = profile.firstName) !== null && _a !== void 0 ? _a : profile.name,
                'profile-last-name': profile.lastName || 'De completat',
                'profile-phone': profile.phone || 'Nespecificat',
                'profile-salutation': profile.salutation || 'Nespecificată',
                'profile-email': profile.email,
                'profile-address-summary': profile.address
            };
            Object.keys(values).forEach(id => {
                const value = values[id];
                document.getElementById(id).textContent = value;
            });
            const verifyBanner = document.getElementById('verify-banner');
            if (verifyBanner) {
                if (profile.verified) {
                    verifyBanner.innerHTML = `<span class="account-status"><span aria-hidden="true">✓</span> Email verificat</span>`;
                }
                else {
                    verifyBanner.innerHTML = `<div class="account-status account-status-pending"><span>Email neverificat</span>
                    <button id="resend-verify-btn" type="button">Retrimite emailul</button></div>`;
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
                                showToast(error instanceof Error ? error.message : 'Nu am putut trimite emailul.');
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
            showToast('Nu am putut încărca datele contului. Reîncearcă.');
        }
        finally {
            document.getElementById('account-loading').hidden = true;
            document.getElementById('account-content').hidden = false;
        }
    });
}
if (!passwordResetToken)
    checkLoggedInState();
else {
    document.getElementById('account-loading').hidden = true;
    document.getElementById('account-content').hidden = false;
}
// --- Login ---
const loginSubmitBtn = document.getElementById('login-submit-btn');
if (loginSubmitBtn) {
    document.getElementById('login-form').addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        if (loginSubmitBtn.hasAttribute('disabled'))
            return;
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
        loginSubmitBtn.setAttribute('disabled', 'true');
        if (errorEl)
            errorEl.style.display = 'none';
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
        finally {
            loginSubmitBtn.removeAttribute('disabled');
        }
    }));
}
// --- Inregistrare ---
const registerSubmitBtn = document.getElementById('register-submit-btn');
if (registerSubmitBtn) {
    document.getElementById('register-form').addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        event.preventDefault();
        if (registerSubmitBtn.hasAttribute('disabled'))
            return;
        const firstName = document.getElementById('register-first-name').value.trim();
        const lastName = document.getElementById('register-last-name').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const salutation = document.getElementById('register-salutation').value;
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const address = document.getElementById('register-address').value.trim();
        const errorEl = document.getElementById('register-error');
        if (!firstName || !lastName || !email || !password || !address) {
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
        registerSubmitBtn.setAttribute('disabled', 'true');
        if (errorEl)
            errorEl.style.display = 'none';
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, phone, salutation, email, password, address })
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
            let notice = document.getElementById('registration-notice');
            if (!notice) {
                notice = document.createElement('p');
                notice.id = 'registration-notice';
                notice.setAttribute('role', 'status');
                (_a = document.getElementById('logged-in-panel')) === null || _a === void 0 ? void 0 : _a.prepend(notice);
            }
            notice.style.cssText = 'padding:12px; border-radius:8px; background:#fff3e0; color:#333; margin-bottom:15px;';
            notice.textContent = data.message || 'Cont creat. Verifică emailul sau cere retrimiterea din cont.';
            document.getElementById('register-password').value = '';
            yield checkLoggedInState();
            window.dispatchEvent(new Event('focus'));
        }
        catch (error) {
            console.error(error);
            if (errorEl) {
                errorEl.innerText = "Nu am putut contacta serverul.";
                errorEl.style.display = 'block';
            }
        }
        finally {
            registerSubmitBtn.removeAttribute('disabled');
        }
    }));
}
const profileEditForm = document.getElementById('profile-edit-form');
const editProfileButton = document.getElementById('edit-profile-btn');
function setProfileEditing(open) {
    var _a;
    profileEditForm.hidden = !open;
    editProfileButton.setAttribute('aria-expanded', String(open));
    if (open && currentAccountProfile) {
        const p = currentAccountProfile;
        const values = { 'edit-first-name': (_a = p.firstName) !== null && _a !== void 0 ? _a : p.name,
            'edit-last-name': p.lastName || '', 'edit-phone': p.phone || '',
            'edit-salutation': p.salutation || '', 'edit-email': p.email, 'profile-address': p.address };
        Object.keys(values).forEach(id => {
            const value = values[id];
            document.getElementById(id).value = value;
        });
        document.getElementById('profile-message').style.display = 'none';
        document.getElementById('edit-first-name').focus();
    }
    else if (!open)
        editProfileButton.focus();
}
editProfileButton.addEventListener('click', () => setProfileEditing(profileEditForm.hidden === true));
document.getElementById('cancel-profile-btn').addEventListener('click', () => {
    if (!document.getElementById('save-address-btn').hasAttribute('disabled'))
        setProfileEditing(false);
});
// --- Salvare adresa ---
const saveAddressBtn = document.getElementById('save-address-btn');
if (saveAddressBtn) {
    document.getElementById('profile-edit-form').addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        if (saveAddressBtn.hasAttribute('disabled'))
            return;
        const addressInput = document.getElementById('profile-address');
        const messageEl = document.getElementById('profile-message');
        if (!addressInput || !messageEl)
            return;
        if (!addressInput.value.trim()) {
            addressInput.focus();
            return;
        }
        saveAddressBtn.setAttribute('disabled', 'true');
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressInput.value.trim(),
                    firstName: document.getElementById('edit-first-name').value.trim(),
                    lastName: document.getElementById('edit-last-name').value.trim(),
                    phone: document.getElementById('edit-phone').value.trim(),
                    salutation: document.getElementById('edit-salutation').value
                })
            });
            messageEl.style.display = 'block';
            if (response.ok) {
                messageEl.style.color = '#2f694b';
                messageEl.innerText = "Datele contului au fost salvate.";
                yield checkLoggedInState();
                setProfileEditing(false);
            }
            else {
                messageEl.style.color = '#d32f2f';
                messageEl.innerText = yield responseError(response);
            }
        }
        catch (error) {
            console.error(error);
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Eroare de conexiune.";
        }
        finally {
            saveAddressBtn.removeAttribute('disabled');
        }
    }));
}
// --- Deconectare ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        if (logoutBtn.hasAttribute('disabled'))
            return;
        logoutBtn.setAttribute('disabled', 'true');
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/logout`, { method: 'POST' });
            if (!response.ok)
                throw new Error(yield responseError(response));
            saveLocalValue(CUSTOMER_NAME_KEY, '');
            window.location.href = REDIRECT_FALLBACK;
        }
        catch (error) {
            showToast(error instanceof Error ? error.message : 'Deconectarea a eșuat. Reîncearcă.');
            logoutBtn.removeAttribute('disabled');
        }
    }));
}
// --- Verificare email ---
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
// --- Cerere resetare parola ---
const recoveryForm = document.getElementById('forgot-password-form');
recoveryForm === null || recoveryForm === void 0 ? void 0 : recoveryForm.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
    event.preventDefault();
    const button = recoveryForm.querySelector('button');
    const message = document.getElementById('recovery-message');
    if (button.disabled)
        return;
    button.disabled = true;
    try {
        const response = yield authFetch(`${API_BASE}/api/customers/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('recovery-email').value.trim()
            })
        });
        if (!response.ok)
            throw new Error(yield responseError(response));
        message.textContent = (yield response.json()).message;
    }
    catch (error) {
        message.textContent = error instanceof Error ? error.message : 'Nu am putut contacta serverul.';
    }
    finally {
        button.disabled = false;
    }
}));
// --- Parola noua ---
const resetForm = document.getElementById('reset-password-form');
if (passwordResetToken && resetForm) {
    resetForm.style.display = 'block';
    if (loginPanel)
        loginPanel.style.display = 'none';
    if (registerPanel)
        registerPanel.style.display = 'none';
    if (tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.parentElement)
        tabLogin.parentElement.style.display = 'none';
    resetForm.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        const button = resetForm.querySelector('button');
        if (button.disabled)
            return;
        const password = document.getElementById('reset-password');
        const confirm = document.getElementById('reset-password-confirm');
        const message = document.getElementById('reset-message');
        if (password.value !== confirm.value) {
            message.textContent = 'Parolele nu coincid.';
            return;
        }
        if (new TextEncoder().encode(password.value).length > 72) {
            message.textContent = 'Parola poate avea maximum 72 de octeți UTF-8.';
            return;
        }
        button.disabled = true;
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: passwordResetToken,
                    password: password.value
                })
            });
            if (!response.ok)
                throw new Error(yield responseError(response));
            message.textContent = (yield response.json()).message;
            passwordResetToken = null;
            password.value = confirm.value = '';
            resetForm.querySelectorAll('input, label, button')
                .forEach(el => el.style.display = 'none');
            localStorage.removeItem(CUSTOMER_NAME_KEY);
            if (tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.parentElement)
                tabLogin.parentElement.style.display = 'flex';
            activateTab('login');
            window.dispatchEvent(new Event('focus'));
        }
        catch (error) {
            message.textContent = error instanceof Error ? error.message : 'Nu am putut contacta serverul.';
            button.disabled = false;
        }
    }));
}

// shared.ts: API_BASE, CART_STORAGE_KEY, CUSTOMER_NAME_KEY, escapeHtml, authFetch, showToast, BANK_TRANSFER_INFO

interface CheckoutCactus { id: number; name: string; price: number; stock: number; }

function loadCart(): CheckoutCactus[] {
    try { return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]'); } catch { return []; }
}

const cart = loadCart();

// Redirect dacă coșul e gol
if (cart.length === 0) {
    window.location.href = 'shop.html';
}

// Grupare + render sumar
function renderCheckoutItems() {
    const container = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    if (!container || !totalEl) return;

    const grouped = new Map<number, { item: CheckoutCactus; qty: number }>();
    cart.forEach(item => {
        const e = grouped.get(item.id);
        if (e) e.qty++; else grouped.set(item.id, { item, qty: 1 });
    });

    let total = 0;
    container.innerHTML = '';
    grouped.forEach(({ item, qty }) => {
        const line = item.price * qty;
        total += line;
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 0.95em;">
                <div>
                    <i class="fa-solid fa-leaf" style="color: #2f694b; margin-right: 4px;"></i>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span style="color: #999; margin-left: 4px;">×${qty}</span>
                </div>
                <strong style="color: #d32f2f;">${line.toFixed(2)} RON</strong>
            </div>`;
    });
    totalEl.innerText = total.toFixed(2);
}
renderCheckoutItems();

// Pre-fill dacă logat — ascunde formularul, arată rezumatul
let isLoggedIn = false;
async function prefillFromAccount() {
    const name = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (!name) return;

    try {
        const response = await authFetch(`${API_BASE}/api/customers/me`);
        if (!response.ok) return;
        const profile = await response.json();
        isLoggedIn = true;

        (document.getElementById('checkout-name') as HTMLInputElement).value = profile.name || '';
        (document.getElementById('checkout-email') as HTMLInputElement).value = profile.email || '';
        (document.getElementById('checkout-address') as HTMLInputElement).value = profile.address || '';

        // Ascunde câmpurile, arată rezumatul
        const formFields = document.getElementById('checkout-fields')!;
        const info = document.getElementById('logged-in-info')!;
        const loggedName = document.getElementById('checkout-logged-name')!;

        formFields.style.display = 'none';
        loggedName.innerText = profile.name;
        info.style.display = 'block';
        info.innerHTML = `
            <div style="margin-bottom: 12px;">
                <i class="fa-solid fa-circle-check" style="color: #2f694b; font-size: 1.2em;"></i>
                <strong style="color: #2f694b;"> Logat ca ${escapeHtml(profile.name)}</strong>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.95em;">
                <div><i class="fa-solid fa-envelope" style="color: #2f694b; width: 20px;"></i> ${escapeHtml(profile.email)}</div>
                <div><i class="fa-solid fa-location-dot" style="color: #2f694b; width: 20px;"></i> ${escapeHtml(profile.address || 'Fără adresă salvată')}</div>
            </div>
            ${!profile.address ? '<p style="color: #d32f2f; margin: 8px 0 0; font-size: 0.85em;"><i class="fa-solid fa-triangle-exclamation"></i> Adaugă o adresă în <a href="cont.html" style="color: #2f694b; font-weight: bold;">contul tău</a> înainte de a comanda.</p>' : ''}
        `;
    } catch (e) { /* nu e logat, form-ul rămâne vizibil */ }
}
prefillFromAccount();

// Submit comandă
const checkoutSubmitBtn = document.getElementById('submit-order-btn');
if (checkoutSubmitBtn) {
    checkoutSubmitBtn.addEventListener('click', async () => {
        const nameVal = (document.getElementById('checkout-name') as HTMLInputElement).value.trim();
        const emailVal = (document.getElementById('checkout-email') as HTMLInputElement).value.trim();
        const addressVal = (document.getElementById('checkout-address') as HTMLInputElement).value.trim();
        const errorEl = document.getElementById('checkout-error');

        if (!nameVal || !emailVal || !addressVal) {
            if (errorEl) {
                errorEl.innerHTML = isLoggedIn && !addressVal
                    ? 'Adaugă o adresă în <a href="cont.html" style="color:#2f694b; font-weight:bold;">contul tău</a> mai întâi.'
                    : 'Completează toate câmpurile.';
                errorEl.style.display = 'block';
            }
            return;
        }
        if (errorEl) errorEl.style.display = 'none';

        // Verificare stoc
        const cartCounts = new Map<number, number>();
        cart.forEach(item => cartCounts.set(item.id, (cartCounts.get(item.id) || 0) + 1));
        const problems: string[] = [];
        for (const [id, qty] of cartCounts) {
            try {
                const r = await fetch(`${API_BASE}/api/cacti/${id}`);
                if (!r.ok) { problems.push(`Produsul #${id} nu mai este disponibil.`); continue; }
                const fresh = await r.json();
                if (fresh.stock < qty) problems.push(`"${fresh.name}" — doar ${fresh.stock} în stoc, ai ${qty} în coș.`);
            } catch { /* skip */ }
        }
        if (problems.length > 0) {
            if (errorEl) { errorEl.innerHTML = problems.join('<br>'); errorEl.style.display = 'block'; }
            return;
        }

        // Trimite comanda
        checkoutSubmitBtn.setAttribute('disabled', 'true');
        checkoutSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Se procesează...';

        try {
            const cactusIds = cart.map(item => item.id);
            const response = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerName: nameVal, email: emailVal, address: addressVal, cactusIds })
            });

            if (!response.ok) {
                const errText = await response.text();
                if (errorEl) { errorEl.innerText = errText || 'Eroare la plasarea comenzii.'; errorEl.style.display = 'block'; }
                checkoutSubmitBtn.removeAttribute('disabled');
                checkoutSubmitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Trimite Comanda';
                return;
            }

            const order = await response.json();
            localStorage.setItem(CART_STORAGE_KEY, '[]');

            // Ascunde formularul, arată confirmare
            (document.querySelector('main > div > div[style*="display: flex"]') as HTMLElement).style.display = 'none';
            const confirm = document.getElementById('order-confirmation')!;
            confirm.style.display = 'block';
            confirm.innerHTML = `
                <i class="fa-solid fa-circle-check" style="font-size: 3em; color: #2f694b; margin-bottom: 15px;"></i>
                <h3 style="color: #2f694b; margin: 0 0 10px;">Comanda a fost plasată!</h3>
                <p style="color: #555; margin: 0 0 15px;">Codul comenzii tale:</p>
                <code style="background: #f0edd4; padding: 8px 16px; border-radius: 6px; font-size: 1.2em; font-weight: bold; display: inline-block; margin-bottom: 15px;">${escapeHtml(order.orderToken)}</code>
                <p style="color: #555; font-size: 0.9em;">Salvează codul pentru verificare ulterioară.</p>
                <div style="background: #f8f4e0; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: left; font-size: 0.9em;">
                    <p style="margin: 0 0 8px; font-weight: bold; color: #2f694b;"><i class="fa-solid fa-building-columns"></i> Date transfer bancar:</p>
                    <p style="margin: 0;">IBAN: <strong>${BANK_TRANSFER_INFO.iban}</strong></p>
                    <p style="margin: 4px 0;">Banca: ${BANK_TRANSFER_INFO.bank}</p>
                    <p style="margin: 4px 0;">Titular: ${BANK_TRANSFER_INFO.holder}</p>
                    <p style="margin: 8px 0 0; color: #666;">Menționează codul <strong>${escapeHtml(order.orderToken)}</strong> în detaliile plății.</p>
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <a href="comenzi.html" style="background: #2f694b; color: #fdf2b8; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        <i class="fa-solid fa-box"></i> Vezi comenzile
                    </a>
                    <a href="shop.html" style="background: #FF9800; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        <i class="fa-solid fa-cart-shopping"></i> Continuă cumpărăturile
                    </a>
                </div>`;
        } catch (e) {
            if (errorEl) { errorEl.innerText = 'Eroare de conexiune.'; errorEl.style.display = 'block'; }
            checkoutSubmitBtn.removeAttribute('disabled');
            checkoutSubmitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Trimite Comanda';
        }
    });
}
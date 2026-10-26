// API_BASE, CUSTOMER_NAME_KEY, escapeHtml, authFetch, starsDisplay vin din shared.ts

// --- Tab switching ---
const tabHistory = document.getElementById('tab-history');
const tabLookup = document.getElementById('tab-lookup');
const historyPanel = document.getElementById('history-panel');
const lookupPanel = document.getElementById('lookup-panel');

function setComeziTab(tab: 'history' | 'lookup') {
    if (!tabHistory || !tabLookup || !historyPanel || !lookupPanel) return;
    const isHistory = tab === 'history';
    historyPanel.style.display = isHistory ? 'block' : 'none';
    lookupPanel.style.display = isHistory ? 'none' : 'block';
    tabHistory.style.background = isHistory ? '#2f694b' : 'transparent';
    tabHistory.style.color = isHistory ? '#fdf2b8' : '#999';
    tabLookup.style.background = isHistory ? 'transparent' : '#2f694b';
    tabLookup.style.color = isHistory ? '#999' : '#fdf2b8';
}

if (tabHistory) tabHistory.addEventListener('click', () => setComeziTab('history'));
if (tabLookup) tabLookup.addEventListener('click', () => setComeziTab('lookup'));

const orderStatusAppearance: Record<string, {color: string; icon: string}> = {
    'Neplătită': {color: '#d32f2f', icon: 'fa-clock'},
    'Plătită - în pregătire': {color: '#FF9800', icon: 'fa-box'},
    'Expediată': {color: '#1976d2', icon: 'fa-truck'},
    'Livrată': {color: '#2f694b', icon: 'fa-circle-check'},
    'Anulată': {color: '#666', icon: 'fa-circle-xmark'}
};

function orderStatusBadge(status: string): string {
    const appearance = orderStatusAppearance[status] || {color: '#666', icon: 'fa-circle-question'};
    return `<span class="order-status-badge" style="background:${appearance.color}">
        <i class="fa-solid ${appearance.icon}" aria-hidden="true"></i> ${escapeHtml(status)}
    </span>`;
}

interface CustomerOrder {
    id: number;
    orderToken: string;
    status: string;
    purchasedItems: string;
    totalPrice: number;
}

// --- Istoric comenzi (client logat) ---
async function loadOrderHistory() {
    const loggedIn = document.getElementById('history-logged-in');
    const notLogged = document.getElementById('history-not-logged');
    const ordersList = document.getElementById('orders-list');
    if (!loggedIn || !notLogged || !ordersList) return;

    loggedIn.style.display = 'block';
    ordersList.innerHTML = `<div style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5em; color: #2f694b;"></i><p style="color: #666; margin-top: 8px;">Se încarcă comenzile...</p></div>`;

    notLogged.style.display = 'none';
    try {
        const profile = await getCustomerProfile();
        if (!profile) {
            notLogged.style.display = 'block';
            loggedIn.style.display = 'none';
            return;
        }
        const response = await authFetch(`${API_BASE}/api/orders/my`);
        if (response.status === 401 || response.status === 403) {
            notLogged.style.display = 'block';
            loggedIn.style.display = 'none';
            return;
        }

        if (!response.ok) throw new Error(await responseError(response));
        const orders: CustomerOrder[] = await response.json();
        if (!Array.isArray(orders)) throw new Error('Răspuns de comenzi invalid.');
        notLogged.style.display = 'none';
        loggedIn.style.display = 'block';

        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fa-solid fa-bag-shopping" style="font-size: 2.5em; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="color: #666;">Nu ai nicio comanda inca.</p>
                    <a href="shop.html" style="background-color: #2f694b; color: #fdf2b8; padding: 10px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 10px;">
                        <i class="fa-solid fa-cart-shopping"></i> Intra in magazin
                    </a>
                </div>`;
            return;
        }

        ordersList.innerHTML = orders.map(o => `
            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 2px solid #eee; margin-bottom: 15px;">
                <div class="order-summary-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <span style="color: #999; font-size: 0.85em;">Comanda</span>
                        <code style="background: #f5f0d8; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 4px;">${escapeHtml(o.orderToken)}</code>
                    </div>
                    ${orderStatusBadge(o.status)}
                </div>
                <div class="order-summary-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="color: #555; font-size: 0.95em;">
                        <i class="fa-solid fa-leaf" style="color: #2f694b;"></i> ${escapeHtml(o.purchasedItems)}
                    </div>
                    <div style="font-weight: bold; color: #d32f2f; font-size: 1.1em;">
                        ${formatPrice(o.totalPrice)} RON
                    </div>
                </div>
            </div>
        `).join("");

    } catch (error) {
        console.error("Eroare la incarcarea comenzilor:", error);
        notLogged.style.display = 'none';
        loggedIn.style.display = 'block';
        ordersList.innerHTML = '<p role="alert">Nu am putut încărca comenzile. Reîncearcă mai târziu.</p>';
    }
}
loadOrderHistory();

// --- Verificare comanda (guest) ---
const comenziLookupBtn = document.getElementById('lookup-btn');
if (comenziLookupBtn) {
    comenziLookupBtn.addEventListener('click', async () => {
        const tokenInput = (document.getElementById('lookup-order-token') as HTMLInputElement).value.trim();
        const emailInput = (document.getElementById('lookup-email') as HTMLInputElement).value.trim();
        const resultDiv = document.getElementById('lookup-result');
        if (!resultDiv) return;

        if (!tokenInput || !emailInput) {
            resultDiv.innerHTML = `<p style="color: #d32f2f; text-align: center; margin-top: 15px;">Completeaza ambele campuri.</p>`;
            return;
        }

        resultDiv.innerHTML = `<p style="color: #555; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Se verifica...</p>`;

        try {
            const params = new URLSearchParams();
            params.append('orderToken', tokenInput);
            params.append('email', emailInput);

            const response = await fetch(`${API_BASE}/api/orders/lookup?${params.toString()}`);

            if (response.status === 404) {
                resultDiv.innerHTML = `<p style="color: #d32f2f; text-align: center;"><i class="fa-solid fa-xmark"></i> Nu am gasit nicio comanda cu aceste date.</p>`;
                return;
            }

            if (!response.ok) throw new Error(await responseError(response));
            const order: CustomerOrder = await response.json();
            resultDiv.innerHTML = `
                <div style="background: #f8f4e0; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <strong style="color: #2f694b;">Comanda #${order.id}</strong>
                        ${orderStatusBadge(order.status)}
                    </div>
                    <p style="margin: 0 0 8px 0; color: #555;"><i class="fa-solid fa-leaf" style="color: #2f694b;"></i> ${escapeHtml(order.purchasedItems)}</p>
                    <p style="margin: 0; font-weight: bold; color: #d32f2f;"><i class="fa-solid fa-tag"></i> ${formatPrice(order.totalPrice)} RON</p>
                </div>`;
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: #d32f2f; text-align: center;">Eroare de conexiune.</p>`;
        }
    });
}
// Interfetele Cactus, Order, Category + constantele vin din shared.ts
// authFetch, escapeHtml, starsDisplay vin din shared.ts

// --- 1. LOGIN ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const userInput = (document.getElementById('admin-user') as HTMLInputElement).value;
        const passInput = (document.getElementById('admin-pass') as HTMLInputElement).value;
        try {
            const response = await authFetch(`${API_BASE}/api/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userInput, password: passInput })
            });
            if (response.ok) {
                document.getElementById('login-container')!.style.display = "none";
                document.getElementById('admin-panel')!.style.display = "block";
                fetchAdminCategories();
                fetchAdminCacti();
                fetchAdminOrders();
                fetchPendingReviews();
            } else {
                alert("Date de autentificare incorecte!");
            }
        } catch (error) {
            alert("Nu am putut contacta serverul.");
        }
    });
}

// --- 2. CATEGORII ---
async function fetchAdminCategories() {
    try {
        const response = await authFetch(`${API_BASE}/api/categories`);
        const categories: Category[] = await response.json();
        const container = document.getElementById('admin-categories-list');
        if (!container) return;
        container.innerHTML = categories.map(cat => `
            <span style="background: #2f694b; color: #fdf2b8; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; display: inline-flex; align-items: center; gap: 8px; margin: 3px;">
                ${escapeHtml(cat.name)} <em style="opacity: 0.7; font-size: 0.85em;">(${escapeHtml(cat.mainCategory)})</em>
                <button class="delete-category-btn" data-id="${cat.id}" style="background: none; border: none; color: #fdf2b8; cursor: pointer; font-size: 1.1em; padding: 0;">✕</button>
            </span>
        `).join("");
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = (e.target as HTMLButtonElement).getAttribute('data-id');
                if (confirm("Stergi aceasta subcategorie?")) {
                    await authFetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE' });
                    fetchAdminCategories();
                }
            });
        });
    } catch (error) { console.error("Eroare categorii:", error); }
}

const addCategoryBtn = document.getElementById('add-category-btn');
if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', async () => {
        const name = (document.getElementById('new-category-name') as HTMLInputElement).value.trim();
        const main = (document.getElementById('new-category-main') as HTMLSelectElement).value;
        if (!name) { alert("Introdu un nume."); return; }
        await authFetch(`${API_BASE}/api/categories`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mainCategory: main })
        });
        (document.getElementById('new-category-name') as HTMLInputElement).value = "";
        fetchAdminCategories();
    });
}

// Sincronizeaza subcategoriile cu categoria principala selectata
const mainCatSelect = document.getElementById('new-cactus-main-category') as HTMLSelectElement;
if (mainCatSelect) {
    async function refreshSubcategories() {
        const main = (document.getElementById('new-cactus-main-category') as HTMLSelectElement).value;
        const response = await authFetch(`${API_BASE}/api/categories?mainCategory=${encodeURIComponent(main)}`);
        const categories: Category[] = await response.json();
        const subSelect = document.getElementById('new-cactus-category') as HTMLSelectElement;
        subSelect.innerHTML = categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("");
    }
    mainCatSelect.addEventListener('change', refreshSubcategories);
    refreshSubcategories();
}

// --- 3. PRODUSE ---
let allCactiCache: Cactus[] = [];
let allOrdersCache: Order[] = [];
let pendingReviewsCount: number = 0;

function updateStats() {
    const active = allCactiCache.filter(c => c.active).length;
    const oos = allCactiCache.filter(c => c.active && c.stock <= 0).length;
    const el = (id: string) => document.getElementById(id);
    if (el('stat-products')) el('stat-products')!.innerText = String(active);
    if (el('stat-orders')) el('stat-orders')!.innerText = String(allOrdersCache.length);
    if (el('stat-out-of-stock')) el('stat-out-of-stock')!.innerText = String(oos);
    if (el('stat-reviews')) el('stat-reviews')!.innerText = String(pendingReviewsCount);
    const badge = el('reviews-badge');
    if (badge) { badge.style.display = pendingReviewsCount > 0 ? 'inline' : 'none'; badge.innerText = String(pendingReviewsCount); }
}

function getFilteredCacti(): Cactus[] {
    const q = (document.getElementById('admin-search') as HTMLInputElement)?.value.toLowerCase() || '';
    const f = (document.getElementById('admin-filter-status') as HTMLSelectElement)?.value || 'all';
    return allCactiCache.filter(c => {
        const matchQ = c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
        let matchF = true;
        if (f === 'active') matchF = c.active;
        else if (f === 'inactive') matchF = !c.active;
        else if (f === 'nostock') matchF = c.active && c.stock <= 0;
        return matchQ && matchF;
    });
}

function renderAdminCacti(cacti: Cactus[]) {
    const container = document.getElementById('admin-cacti-list');
    const countEl = document.getElementById('products-count');
    if (!container) return;
    if (countEl) countEl.innerText = `${cacti.length} din ${allCactiCache.length} produse`;
    if (cacti.length === 0) { container.innerHTML = '<p style="color:#999; font-style:italic; grid-column:1/-1;">Niciun produs gasit.</p>'; return; }

    container.innerHTML = cacti.map(c => {
        const img = c.imageUrl || "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
        return `
        <div class="product-card ${c.active ? '' : 'inactive'}">
            ${c.active ? '' : '<p style="margin:0 0 5px 0; color:#d32f2f; font-weight:bold; font-size:0.8em;">DEZACTIVAT</p>'}
            <img src="${escapeHtml(img)}" alt="${escapeHtml(c.name)}">
            <h4 style="margin:8px 0 4px; color:#2f694b; font-size:0.95em;">${escapeHtml(c.name)}</h4>
            <p style="margin:0; color:#d32f2f; font-weight:bold;">${c.price} RON</p>
            <p style="margin:4px 0 0; color:${c.stock > 0 ? '#2f694b' : '#d32f2f'}; font-size:0.85em; font-weight:bold;">Stoc: ${c.stock}</p>
            <div class="edit-panel" data-id="${c.id}" style="display:none; margin-top:8px; text-align:left; font-size:0.85em;">
                <input type="text" class="edit-name admin-input" value="${escapeHtml(c.name)}" style="width:100%; margin-bottom:4px;">
                <input type="number" class="edit-price admin-input" value="${c.price}" style="width:48%; margin-bottom:4px;">
                <input type="number" class="edit-stock admin-input" value="${c.stock}" min="0" style="width:48%; margin-bottom:4px; float:right;">
                <input type="text" class="edit-desc admin-input" value="${escapeHtml(c.description)}" style="width:100%; margin-bottom:4px;">
                <input type="text" class="edit-image admin-input" value="${escapeHtml(c.imageUrl)}" style="width:100%; margin-bottom:6px;">
                <input type="hidden" class="edit-product-type" value="${escapeHtml(c.productType)}">
                <input type="hidden" class="edit-main-category" value="${escapeHtml(c.mainCategory)}">
                <input type="hidden" class="edit-category" value="${escapeHtml(c.category)}">
                <button class="save-edit-btn admin-btn btn-primary btn-sm" data-id="${c.id}" style="width:100%;">Salveaza</button>
            </div>
            <div style="display:flex; gap:4px; margin-top:8px;">
                <button class="edit-cactus-btn admin-btn btn-warning btn-sm" data-id="${c.id}" style="flex:1;">✏️</button>
                ${c.active
            ? `<button class="delete-cactus-btn admin-btn btn-danger btn-sm" data-id="${c.id}" style="flex:1;">🗑️</button>`
            : `<button class="reactivate-cactus-btn admin-btn btn-success btn-sm" data-id="${c.id}" style="flex:1;">✅</button>
                       <button class="hard-delete-btn admin-btn btn-dark btn-sm" data-id="${c.id}" style="flex:1;">⛔</button>`}
            </div>
        </div>`;
    }).join("");

    container.querySelectorAll('.edit-cactus-btn').forEach(b => b.addEventListener('click', (e) => {
        const id = (e.target as HTMLButtonElement).getAttribute('data-id');
        const p = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
        if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
    }));
    container.querySelectorAll('.save-edit-btn').forEach(b => b.addEventListener('click', async (e) => {
        const id = (e.target as HTMLButtonElement).getAttribute('data-id');
        const p = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
        if (!p) return;
        const u = { name: (p.querySelector('.edit-name') as HTMLInputElement).value.trim(), price: Number((p.querySelector('.edit-price') as HTMLInputElement).value), stock: Number((p.querySelector('.edit-stock') as HTMLInputElement).value)||0, description: (p.querySelector('.edit-desc') as HTMLInputElement).value.trim(), imageUrl: (p.querySelector('.edit-image') as HTMLInputElement).value.trim(), productType: (p.querySelector('.edit-product-type') as HTMLInputElement).value, mainCategory: (p.querySelector('.edit-main-category') as HTMLInputElement).value, category: (p.querySelector('.edit-category') as HTMLInputElement).value };
        const r = await authFetch(`${API_BASE}/api/cacti/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u) });
        if (r.ok) fetchAdminCacti(); else alert("Eroare la salvare.");
    }));
    container.querySelectorAll('.delete-cactus-btn').forEach(b => b.addEventListener('click', async (e) => {
        const id = (e.target as HTMLButtonElement).getAttribute('data-id');
        if (confirm("Dezactivezi acest produs?")) { await authFetch(`${API_BASE}/api/cacti/${id}`, {method:'DELETE'}); fetchAdminCacti(); }
    }));
    container.querySelectorAll('.reactivate-cactus-btn').forEach(b => b.addEventListener('click', async (e) => {
        const id = (e.target as HTMLButtonElement).getAttribute('data-id');
        await authFetch(`${API_BASE}/api/cacti/${id}/reactivate`, {method:'PUT'}); fetchAdminCacti();
    }));
    container.querySelectorAll('.hard-delete-btn').forEach(b => b.addEventListener('click', async (e) => {
        const id = (e.target as HTMLButtonElement).getAttribute('data-id');
        if (!confirm("ATENTIE: Stergere definitiva?")) return;
        if (!confirm("Absolut sigur? Ireversibil.")) return;
        await authFetch(`${API_BASE}/api/cacti/${id}/permanent`, {method:'DELETE'}); fetchAdminCacti();
    }));
}

async function fetchAdminCacti() {
    try {
        const r = await authFetch(`${API_BASE}/api/cacti/all`);
        allCactiCache = await r.json();
        renderAdminCacti(getFilteredCacti());
        updateStats();
    } catch (e) { console.error("Eroare produse:", e); }
}

const adminSearch = document.getElementById('admin-search');
const adminFilter = document.getElementById('admin-filter-status');
if (adminSearch) adminSearch.addEventListener('input', () => renderAdminCacti(getFilteredCacti()));
if (adminFilter) adminFilter.addEventListener('change', () => renderAdminCacti(getFilteredCacti()));

// --- ADAUGARE PRODUS ---
const addCactusBtn = document.getElementById('add-new-cactus-btn');
if (addCactusBtn) {
    addCactusBtn.addEventListener('click', async () => {
        let imageUrl = (document.getElementById('new-cactus-image') as HTMLInputElement).value.trim();
        const fileInput = document.getElementById('new-cactus-file') as HTMLInputElement;
        if (fileInput.files && fileInput.files.length > 0) {
            const fd = new FormData(); fd.append('file', fileInput.files[0]);
            const ur = await authFetch(`${API_BASE}/api/images/upload`, { method:'POST', body:fd });
            if (!ur.ok) { alert("Eroare upload: " + await ur.text()); return; }
            imageUrl = (await ur.json()).imageUrl;
        }
        const newCactus = {
            name: (document.getElementById('new-cactus-name') as HTMLInputElement).value.trim(),
            price: Number((document.getElementById('new-cactus-price') as HTMLInputElement).value),
            productType: (document.getElementById('new-cactus-product-type') as HTMLSelectElement).value,
            mainCategory: (document.getElementById('new-cactus-main-category') as HTMLSelectElement).value,
            category: (document.getElementById('new-cactus-category') as HTMLSelectElement).value,
            description: (document.getElementById('new-cactus-desc') as HTMLInputElement).value.trim(),
            imageUrl, stock: Number((document.getElementById('new-cactus-stock') as HTMLInputElement).value) || 0
        };
        if (!newCactus.name || !newCactus.price || !newCactus.category) { alert("Completeaza campurile obligatorii!"); return; }
        await authFetch(`${API_BASE}/api/cacti`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newCactus) });
        ['new-cactus-name','new-cactus-price','new-cactus-desc','new-cactus-image','new-cactus-stock'].forEach(id => (document.getElementById(id) as HTMLInputElement).value = "");
        if (fileInput) fileInput.value = "";
        fetchAdminCacti();
    });
}

// --- 4. COMENZI ---
function renderOrderRows(orders: Order[]) {
    const tb = document.getElementById('admin-orders-list');
    if (!tb) return;
    if (orders.length === 0) { tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Nicio comanda.</td></tr>`; return; }
    tb.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${escapeHtml(o.customerName)}<br><span style="font-size:0.8em; color:#999;">${escapeHtml(o.email)}</span></td>
            <td>${escapeHtml(o.address)}</td>
            <td>${escapeHtml(o.purchasedItems)}</td>
            <td style="color:#d32f2f; font-weight:bold;">${o.totalPrice} RON</td>
            <td><select class="order-status-select admin-input" data-id="${o.id}" style="padding:6px;">
                ${ORDER_STATUSES.map(s => `<option value="${escapeHtml(s)}" ${s===o.status?'selected':''}>${escapeHtml(s)}</option>`).join("")}
            </select></td>
        </tr>`).join("");
    tb.querySelectorAll('.order-status-select').forEach(s => s.addEventListener('change', async (e) => {
        const t = e.target as HTMLSelectElement;
        const r = await authFetch(`${API_BASE}/api/orders/${t.getAttribute('data-id')}/status`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:t.value}) });
        if (!r.ok) { alert("Eroare status."); fetchAdminOrders(); }
    }));
}

async function fetchAdminOrders() {
    try {
        const r = await authFetch(`${API_BASE}/api/orders`);
        if (!r.ok) throw new Error('Neautorizat');
        allOrdersCache = await r.json();
        renderOrderRows(allOrdersCache);
        updateStats();
    } catch (e) { console.error("Eroare comenzi:", e); }
}

const orderSearch = document.getElementById('admin-order-search');
if (orderSearch) orderSearch.addEventListener('input', () => {
    const q = (orderSearch as HTMLInputElement).value.toLowerCase();
    renderOrderRows(allOrdersCache.filter(o => o.customerName.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.purchasedItems.toLowerCase().includes(q) || String(o.id).includes(q)));
});

// --- 5. RECENZII ---
interface PendingReview { id:number; customerName:string; customerEmail:string; cactusId:number|null; rating:number; comment:string; createdAt:string; }

async function fetchPendingReviews() {
    const container = document.getElementById('admin-reviews-list');
    if (!container) return;
    try {
        const r = await authFetch(`${API_BASE}/api/reviews/pending`);
        const reviews: PendingReview[] = await r.json();
        pendingReviewsCount = reviews.length;
        updateStats();
        if (reviews.length === 0) { container.innerHTML = '<p style="color:#999; font-style:italic;">Nicio recenzie in asteptare.</p>'; return; }
        container.innerHTML = reviews.map(rv => `
            <div class="review-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div><strong style="color:#2f694b;">${escapeHtml(rv.customerName)}</strong> <span style="color:#999; font-size:0.85em;">(${escapeHtml(rv.customerEmail)})</span>
                    ${rv.cactusId ? `<span style="color:#666; font-size:0.85em;"> — Produs #${rv.cactusId}</span>` : '<span style="color:#666; font-size:0.85em;"> — Generala</span>'}</div>
                    <div style="color:#FF9800; font-size:1.2em;">${starsDisplay(rv.rating)}</div>
                </div>
                <p style="margin:10px 0; color:#333; font-style:italic;">"${escapeHtml(rv.comment)}"</p>
                <div style="display:flex; gap:8px;">
                    <button class="approve-review-btn admin-btn btn-success btn-sm" data-id="${rv.id}">✅ Aproba</button>
                    <button class="reject-review-btn admin-btn btn-danger btn-sm" data-id="${rv.id}">❌ Respinge</button>
                </div>
            </div>`).join("");
        container.querySelectorAll('.approve-review-btn').forEach(b => b.addEventListener('click', async (e) => {
            await authFetch(`${API_BASE}/api/reviews/${(e.target as HTMLButtonElement).getAttribute('data-id')}/approve`, {method:'PUT'}); fetchPendingReviews();
        }));
        container.querySelectorAll('.reject-review-btn').forEach(b => b.addEventListener('click', async (e) => {
            if (confirm("Respingi recenzia?")) { await authFetch(`${API_BASE}/api/reviews/${(e.target as HTMLButtonElement).getAttribute('data-id')}`, {method:'DELETE'}); fetchPendingReviews(); }
        }));
    } catch (e) { console.error("Eroare recenzii:", e); }
}
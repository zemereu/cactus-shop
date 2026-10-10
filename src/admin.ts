function adminToast(msg: string) {
    showToast(msg);
}

async function adminRequest(url: string, options: RequestInit = {}): Promise<Response | null> {
    try {
        const response = await authFetch(url, options);
        if (response.ok) return response;
        alert(await responseError(response));
    } catch {
        alert('Operația nu a putut fi confirmată. Verifică rezultatul înainte de reîncercare.');
    }
    return null;
}

async function showAdminPanel() {
    document.getElementById('login-container')!.style.display = 'none';
    document.getElementById('admin-panel')!.style.display = 'block';
    await fetchAdminCategories();
    await Promise.all([fetchAdminCacti(), fetchAdminOrders(), fetchPendingReviews()]);
}

const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const userInput = (document.getElementById('admin-user') as HTMLInputElement).value;
        const passInput = (document.getElementById('admin-pass') as HTMLInputElement).value;
        try {
            const response = await authFetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: userInput, password: passInput})
            });
            if (response.ok) await showAdminPanel();
            else alert(await responseError(response));
        } catch {
            alert("Nu am putut contacta serverul.");
        }
    });
}

let allCategoriesCache: Category[] = [];

function renderFilteredCategories() {
    const main = (document.getElementById('new-category-main') as HTMLSelectElement)?.value || 'Cactuși';
    const filtered = allCategoriesCache.filter(c => c.mainCategory === main)
        .sort((a, b) => a.name.localeCompare(b.name));
    const container = document.getElementById('admin-categories-list');
    if (!container) return;
    if (filtered.length === 0) {
        container.innerHTML = '<span style="color:#999; font-style:italic;">Nicio subcategorie.</span>';
        return;
    }

    container.innerHTML = filtered.map(cat => `
        <span style="background:#2f694b; color:#fdf2b8; padding:6px 12px; border-radius:20px; font-size:0.85em; display:inline-flex; align-items:center; gap:8px;">
            ${escapeHtml(cat.name)}
            <button class="delete-category-btn" data-id="${cat.id}" style="background:none; border:none; color:#fdf2b8; cursor:pointer; font-size:1.1em; padding:0;">✕</button>
        </span>`).join("");

    container.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (!confirm("Stergi aceasta subcategorie?")) return;
            if (!await adminRequest(`${API_BASE}/api/categories/${id}`, {method: 'DELETE'})) return;
            adminToast('Categorie stearsa');
            fetchAdminCategories();
        });
    });
}

async function fetchAdminCategories() {
    try {
        const response = await authFetch(`${API_BASE}/api/categories`);
        if (!response.ok) throw new Error(await responseError(response));
        allCategoriesCache = await response.json();
        renderFilteredCategories();
        refreshSubcategories();
        document.querySelectorAll<HTMLSelectElement>('.edit-main-category')
            .forEach(select => select.dispatchEvent(new Event('change')));
    } catch (error) {
        console.error("Eroare categorii:", error);
    }
}

const categoryMainSelect = document.getElementById('new-category-main');
if (categoryMainSelect) categoryMainSelect.addEventListener('change', renderFilteredCategories);

const addCategoryBtn = document.getElementById('add-category-btn');
if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', async () => {
        const name = (document.getElementById('new-category-name') as HTMLInputElement).value.trim();
        const main = (document.getElementById('new-category-main') as HTMLSelectElement).value;
        if (!name) {
            alert("Introdu un nume.");
            return;
        }

        if (!await adminRequest(`${API_BASE}/api/categories`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, mainCategory: main})
        })) return;

        (document.getElementById('new-category-name') as HTMLInputElement).value = "";
        fetchAdminCategories();
        adminToast('Categorie adaugata');
    });
}

function refreshSubcategories() {
    const main = (document.getElementById('new-cactus-main-category') as HTMLSelectElement)?.value;
    const sub = document.getElementById('new-cactus-category') as HTMLSelectElement | null;
    if (!sub) return;
    const selected = sub.value;
    const categories = allCategoriesCache.filter(c => c.mainCategory === main)
        .sort((a, b) => a.name.localeCompare(b.name));
    sub.innerHTML = categories.map(c =>
        `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
    ).join('');
    if (categories.some(c => c.name === selected)) sub.value = selected;
}

document.getElementById('new-cactus-main-category')
    ?.addEventListener('change', refreshSubcategories);

let allCactiCache: Cactus[] = [];
let allOrdersCache: Order[] = [];
let pendingReviewsCount = 0;

function updateStats() {
    const active = allCactiCache.filter(c => c.active).length;
    const oos = allCactiCache.filter(c => c.active && c.stock <= 0).length;
    const activeOrders = allOrdersCache.filter(o => !['Livrată', 'Anulată'].includes(o.status)).length;
    const el = (id: string) => document.getElementById(id);
    if (el('stat-products')) el('stat-products')!.innerText = String(active);
    if (el('stat-orders')) el('stat-orders')!.innerText = String(allOrdersCache.length);
    if (el('stat-active-orders')) el('stat-active-orders')!.innerText = String(activeOrders);
    if (el('stat-out-of-stock')) el('stat-out-of-stock')!.innerText = String(oos);
    if (el('stat-reviews')) el('stat-reviews')!.innerText = String(pendingReviewsCount);

    const badge = el('reviews-badge');
    if (badge) {
        badge.style.display = pendingReviewsCount > 0 ? 'inline' : 'none';
        badge.innerText = String(pendingReviewsCount);
    }
}

function getFilteredCacti(): Cactus[] {
    const q = (document.getElementById('admin-search') as HTMLInputElement)?.value.toLowerCase() || '';
    const f = (document.getElementById('admin-filter-status') as HTMLSelectElement)?.value || 'all';
    const s = (document.getElementById('admin-sort') as HTMLSelectElement)?.value || 'name-asc';

    const result = allCactiCache.filter(c => {
        const matchQ = c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
        let matchF = true;
        if (f === 'active') matchF = c.active;
        else if (f === 'inactive') matchF = !c.active;
        else if (f === 'nostock') matchF = c.active && c.stock <= 0;
        return matchQ && matchF;
    });

    result.sort((a, b) => {
        if (s === 'name-asc') return a.name.localeCompare(b.name);
        if (s === 'name-desc') return b.name.localeCompare(a.name);
        if (s === 'price-asc') return a.price - b.price;
        if (s === 'price-desc') return b.price - a.price;
        if (s === 'stock-asc') return a.stock - b.stock;
        if (s === 'stock-desc') return b.stock - a.stock;
        return 0;
    });
    return result;
}

function renderAdminCacti(cacti: Cactus[]) {
    const container = document.getElementById('admin-cacti-list');
    const countEl = document.getElementById('products-count');
    if (!container) return;
    if (countEl) countEl.innerText = `${cacti.length} din ${allCactiCache.length} produse`;

    if (cacti.length === 0) {
        container.innerHTML = '<p style="color:#999; font-style:italic; grid-column:1/-1;">Niciun produs gasit.</p>';
        return;
    }

    let html = '';
    for (const c of cacti) {
        const img = c.imageUrl || "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
        html += `
        <div class="product-card ${c.active ? '' : 'inactive'}" data-card-id="${c.id}">
            ${c.active ? '' : '<p style="margin:0 0 5px 0; color:#d32f2f; font-weight:bold; font-size:0.8em;">DEZACTIVAT</p>'}
            <img src="${escapeHtml(img)}" alt="${escapeHtml(c.name)}">
            <h4 style="margin:8px 0 4px; color:#2f694b; font-size:0.95em;">${escapeHtml(c.name)}</h4>
            <p style="margin:2px 0; color:#888; font-size:0.75em;">${escapeHtml(c.productType)} · ${escapeHtml(c.mainCategory)} — ${escapeHtml(c.category)}</p>
            <p style="margin:0; color:#d32f2f; font-weight:bold;">${formatPrice(c.price)} RON</p>
            <p style="margin:4px 0 0; color:${c.stock > 0 ? '#2f694b' : '#d32f2f'}; font-size:0.85em; font-weight:bold;">Stoc: ${c.stock}</p>
            ${c.location ? `<p style="margin:2px 0 0; font-size:0.75em; color:#666;"><i class="fa-solid fa-location-dot" style="color:#FF9800;"></i> ${escapeHtml(c.location)}</p>` : ''}
            ${c.description ? `<p style="margin:4px 0 0; font-size:0.75em; color:#999; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${escapeHtml(c.description)}</p>` : ''}
            <div style="display:flex; gap:4px; margin-top:8px;">
                <button class="edit-cactus-btn admin-btn btn-warning btn-sm" data-id="${c.id}" style="flex:1;"><i class="fa-solid fa-pen"></i></button>
                ${c.active
            ? `<button class="delete-cactus-btn admin-btn btn-danger btn-sm" data-id="${c.id}" style="flex:1;"><i class="fa-solid fa-trash"></i></button>`
            : `<button class="reactivate-cactus-btn admin-btn btn-success btn-sm" data-id="${c.id}" style="flex:1;"><i class="fa-solid fa-rotate-left"></i></button>
                       <button class="hard-delete-btn admin-btn btn-dark btn-sm" data-id="${c.id}" style="flex:1;"><i class="fa-solid fa-ban"></i></button>`}
            </div>
        </div>
        <div class="edit-panel" data-id="${c.id}" style="display:none; grid-column:1/-1; background:#f8f4e0; border-radius:10px; padding:20px; border:1px solid #ddd; text-align:left;">
            <h4 style="margin:0 0 14px; color:#2f694b; font-size:1em;">Editare: ${escapeHtml(c.name)}</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px;">
                <div style="grid-column:1/-1;">
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Nume</label>
                    <input type="text" class="edit-name admin-input" value="${escapeHtml(c.name)}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em;">
                </div>
                <div>
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Preț (RON)</label>
                    <input type="number" class="edit-price admin-input" value="${c.price}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em;">
                </div>
                <div>
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Stoc</label>
                    <input type="number" class="edit-stock admin-input" value="${c.stock}" min="0" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em;">
                </div>
                <div>
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Tip produs</label>
                    <select class="edit-product-type admin-input" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em; background:white;">
                        ${PRODUCT_TYPES.map(t => `<option value="${escapeHtml(t)}" ${t === c.productType ? 'selected' : ''}>${escapeHtml(t)}</option>`).join("")}
                    </select>
                </div>
                <div>
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Categorie principală</label>
                    <select class="edit-main-category admin-input" data-id="${c.id}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em; background:white;">
                        ${MAIN_CATEGORIES.map(m => `<option value="${escapeHtml(m)}" ${m === c.mainCategory ? 'selected' : ''}>${escapeHtml(m)}</option>`).join("")}
                    </select>
                </div>
                <div style="grid-column:span 2;">
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Subcategorie (gen)</label>
                    <select class="edit-category admin-input" data-id="${c.id}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em; background:white;">
                        ${allCategoriesCache.filter(cat => cat.mainCategory === c.mainCategory).sort((a, b) => a.name.localeCompare(b.name)).map(cat => `<option value="${escapeHtml(cat.name)}" ${cat.name === c.category ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`).join("")}
                    </select>
                </div>
                <div style="grid-column:span 2;">
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Descriere</label>
                    <input type="text" class="edit-desc admin-input" value="${escapeHtml(c.description)}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em;">
                </div>
                <div style="grid-column:1/-1;">
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Locație (origine)</label>
                    <input type="text" class="edit-location admin-input" value="${escapeHtml(c.location || '')}" placeholder="ex: Mexic, Africa de Sud" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em;">
                </div>
                <div style="grid-column:1/-1;">
                    <label style="font-size:0.8em; color:#666; font-weight:600; margin-bottom:3px; display:block;">Imagine (URL)</label>
                    <input type="text" class="edit-image admin-input" value="${escapeHtml(c.imageUrl)}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-size:0.9em;">
                </div>
                <div style="grid-column:1/-1;">
                    <button class="save-edit-btn admin-btn btn-primary btn-sm" data-id="${c.id}" style="width:100%; padding:10px; font-size:0.95em; border-radius:6px;">Salvează</button>
                </div>
            </div>
        </div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.edit-cactus-btn').forEach(b => b.addEventListener('click', e => {
        const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
        const p = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
        if (!p) return;
        const opening = p.style.display === 'none';
        container.querySelectorAll('.edit-panel').forEach(panel => {
            (panel as HTMLElement).style.display = 'none';
        });
        if (opening) p.style.display = 'block';
    }));

    container.querySelectorAll('.edit-main-category').forEach(sel => sel.addEventListener('change', e => {
        const select = e.target as HTMLSelectElement;
        const id = select.getAttribute('data-id');
        const panel = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
        if (!panel) return;
        const subSelect = panel.querySelector('.edit-category') as HTMLSelectElement;
        const filtered = allCategoriesCache.filter(cat => cat.mainCategory === select.value)
            .sort((a, b) => a.name.localeCompare(b.name));
        const previous = subSelect.value;
        subSelect.innerHTML = filtered.map(cat =>
            `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`
        ).join("");
        if (filtered.some(cat => cat.name === previous)) subSelect.value = previous;
    }));

    container.querySelectorAll('.save-edit-btn').forEach(b => b.addEventListener('click', async e => {
        const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
        const p = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
        if (!p) return;
        const u = {
            version: allCactiCache.find(c => c.id === Number(id))?.version,
            name: (p.querySelector('.edit-name') as HTMLInputElement).value.trim(),
            price: Number((p.querySelector('.edit-price') as HTMLInputElement).value),
            stock: Number((p.querySelector('.edit-stock') as HTMLInputElement).value) || 0,
            description: (p.querySelector('.edit-desc') as HTMLInputElement).value.trim(),
            imageUrl: (p.querySelector('.edit-image') as HTMLInputElement).value.trim(),
            productType: (p.querySelector('.edit-product-type') as HTMLInputElement).value,
            mainCategory: (p.querySelector('.edit-main-category') as HTMLInputElement).value,
            category: (p.querySelector('.edit-category') as HTMLInputElement).value,
            location: (p.querySelector('.edit-location') as HTMLInputElement).value.trim()
        };
        const r = await adminRequest(`${API_BASE}/api/cacti/${id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(u)
        });
        if (r && r.ok) {
            fetchAdminCacti();
            adminToast('Produs actualizat');
        }
    }));

    container.querySelectorAll('.delete-cactus-btn').forEach(b => b.addEventListener('click', async e => {
        const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
        if (!confirm("Dezactivezi acest produs?")) return;
        if (!await adminRequest(`${API_BASE}/api/cacti/${id}`, {method: 'DELETE'})) return;
        fetchAdminCacti();
        adminToast('Produs dezactivat');
    }));

    container.querySelectorAll('.reactivate-cactus-btn').forEach(b => b.addEventListener('click', async e => {
        const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
        if (!await adminRequest(`${API_BASE}/api/cacti/${id}/reactivate`, {method: 'PUT'})) return;
        fetchAdminCacti();
        adminToast('Produs reactivat');
    }));

    container.querySelectorAll('.hard-delete-btn').forEach(b => b.addEventListener('click', async e => {
        const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
        if (!confirm("ATENTIE: Stergere definitiva?")) return;
        if (!confirm("Absolut sigur? Ireversibil.")) return;
        if (!await adminRequest(`${API_BASE}/api/cacti/${id}/permanent`, {method: 'DELETE'})) return;
        fetchAdminCacti();
        adminToast('Produs sters definitiv');
    }));
}

async function fetchAdminCacti() {
    try {
        const r = await authFetch(`${API_BASE}/api/cacti/all`);
        if (!r.ok) throw new Error(await responseError(r));
        allCactiCache = await r.json();
        renderAdminCacti(getFilteredCacti());
        updateStats();
    } catch (e) {
        console.error("Eroare produse:", e);
    }
}

const adminSearch = document.getElementById('admin-search');
const adminFilter = document.getElementById('admin-filter-status');
const adminSort = document.getElementById('admin-sort');
if (adminSearch) adminSearch.addEventListener('input', () => renderAdminCacti(getFilteredCacti()));
if (adminFilter) adminFilter.addEventListener('change', () => renderAdminCacti(getFilteredCacti()));
if (adminSort) adminSort.addEventListener('change', () => renderAdminCacti(getFilteredCacti()));

const addCactusBtn = document.getElementById('add-new-cactus-btn');
if (addCactusBtn) {
    addCactusBtn.addEventListener('click', async () => {
        let imageUrl = (document.getElementById('new-cactus-image') as HTMLInputElement).value.trim();
        const fileInput = document.getElementById('new-cactus-file') as HTMLInputElement;
        const newCactus = {
            name: (document.getElementById('new-cactus-name') as HTMLInputElement).value.trim(),
            price: Number((document.getElementById('new-cactus-price') as HTMLInputElement).value),
            productType: (document.getElementById('new-cactus-product-type') as HTMLSelectElement).value,
            mainCategory: (document.getElementById('new-cactus-main-category') as HTMLSelectElement).value,
            category: (document.getElementById('new-cactus-category') as HTMLSelectElement).value,
            description: (document.getElementById('new-cactus-desc') as HTMLInputElement).value.trim(),
            imageUrl,
            stock: Number((document.getElementById('new-cactus-stock') as HTMLInputElement).value) || 0,
            location: (document.getElementById('new-cactus-location') as HTMLInputElement).value.trim()
        };

        if (!newCactus.name || !newCactus.price || !newCactus.category) {
            alert("Completeaza campurile obligatorii!");
            return;
        }

        if (fileInput.files && fileInput.files.length > 0) {
            const fd = new FormData();
            fd.append('file', fileInput.files[0]);
            const ur = await adminRequest(`${API_BASE}/api/images/upload`, {
                method: 'POST', body: fd
            });
            if (!ur) return;
            imageUrl = (await ur.json()).imageUrl;
            newCactus.imageUrl = imageUrl;
            (document.getElementById('new-cactus-image') as HTMLInputElement).value = imageUrl;
            fileInput.value = '';
        }

        if (!await adminRequest(`${API_BASE}/api/cacti`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newCactus)
        })) return;

        [
            'new-cactus-name', 'new-cactus-price', 'new-cactus-desc',
            'new-cactus-image', 'new-cactus-stock', 'new-cactus-location'
        ].forEach(id => (document.getElementById(id) as HTMLInputElement).value = "");

        if (fileInput) fileInput.value = "";
        fetchAdminCacti();
        adminToast('Produs adaugat');
    });
}

function renderOrderRows(orders: Order[]) {
    const tb = document.getElementById('admin-orders-list');
    if (!tb) return;
    if (orders.length === 0) {
        tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#999;">Nicio comanda.</td></tr>`;
        return;
    }

    tb.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}<br><small>${escapeHtml(formatOrderDate(o.createdAt))}</small></td>
            <td>${escapeHtml(o.customerName)}<br><span style="font-size:0.8em; color:#999;">${escapeHtml(o.email)}</span></td>
            <td>${escapeHtml(o.address)}</td>
            <td>${escapeHtml(o.purchasedItems)}</td>
            <td style="color:#d32f2f; font-weight:bold;">${formatPrice(o.totalPrice)} RON</td>
            <td><select class="order-status-select admin-input" data-id="${o.id}" style="padding:6px;">
                ${ORDER_STATUSES.map(s => `<option value="${escapeHtml(s)}" ${s === o.status ? 'selected' : ''}>${escapeHtml(s)}</option>`).join("")}
            </select></td>
        </tr>`).join("");

    tb.querySelectorAll('.order-status-select').forEach(s => s.addEventListener('change', async e => {
        const t = e.target as HTMLSelectElement;
        const previous = orders.find(order => order.id === Number(t.getAttribute('data-id')))?.status;
        const r = await adminRequest(`${API_BASE}/api/orders/${t.getAttribute('data-id')}/status`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: t.value})
        });
        if (r && r.ok) {
            await fetchAdminOrders();
            adminToast('Status actualizat');
        } else if (previous) {
            t.value = previous;
        }
    }));
}

function getFilteredOrders(): Order[] {
    const q = (document.getElementById('admin-order-search') as HTMLInputElement)?.value.toLowerCase() || '';
    const f = (document.getElementById('admin-order-filter') as HTMLSelectElement)?.value || 'active';
    return allOrdersCache.filter(o => {
        const matchQ = o.customerName.toLowerCase().includes(q)
            || o.email.toLowerCase().includes(q)
            || o.purchasedItems.toLowerCase().includes(q)
            || String(o.id).includes(q);
        let matchF = true;
        if (f === 'active') matchF = !['Livrată', 'Anulată'].includes(o.status);
        else if (f === 'archived') matchF = ['Livrată', 'Anulată'].includes(o.status);
        return matchQ && matchF;
    });
}

async function fetchAdminOrders() {
    try {
        const r = await authFetch(`${API_BASE}/api/orders`);
        if (!r.ok) throw new Error('Neautorizat');
        allOrdersCache = await r.json();
        renderOrderRows(getFilteredOrders());
        updateStats();
    } catch (e) {
        console.error("Eroare comenzi:", e);
    }
}

const orderSearch = document.getElementById('admin-order-search');
const orderFilter = document.getElementById('admin-order-filter');
if (orderSearch) orderSearch.addEventListener('input', () => renderOrderRows(getFilteredOrders()));
if (orderFilter) orderFilter.addEventListener('change', () => renderOrderRows(getFilteredOrders()));

interface PendingReview {
    id: number;
    customerName: string;
    customerEmail: string;
    cactusId: number | null;
    rating: number;
    comment: string;
    createdAt: string;
}

async function fetchPendingReviews() {
    const container = document.getElementById('admin-reviews-list');
    if (!container) return;
    try {
        const r = await authFetch(`${API_BASE}/api/reviews/pending`);
        if (!r.ok) throw new Error(await responseError(r));
        const reviews: PendingReview[] = await r.json();
        pendingReviewsCount = reviews.length;
        updateStats();

        if (reviews.length === 0) {
            container.innerHTML = '<p style="color:#999; font-style:italic;">Nicio recenzie in asteptare.</p>';
            return;
        }

        container.innerHTML = reviews.map(rv => `
            <div class="review-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <strong style="color:#2f694b;">${escapeHtml(rv.customerName)}</strong>
                        <span style="color:#999; font-size:0.85em;">(${escapeHtml(rv.customerEmail)})</span>
                        ${rv.cactusId
            ? `<span style="color:#666; font-size:0.85em;"> — Produs #${rv.cactusId}</span>`
            : '<span style="color:#666; font-size:0.85em;"> — Generala</span>'}
                    </div>
                    <div style="color:#FF9800; font-size:1.2em;">${starsDisplay(rv.rating)}</div>
                </div>
                <p style="margin:10px 0; color:#333; font-style:italic;">"${escapeHtml(rv.comment)}"</p>
                <div style="display:flex; gap:8px;">
                    <button class="approve-review-btn admin-btn btn-success btn-sm" data-id="${rv.id}"><i class="fa-solid fa-check"></i> Aproba</button>
                    <button class="reject-review-btn admin-btn btn-danger btn-sm" data-id="${rv.id}"><i class="fa-solid fa-xmark"></i> Respinge</button>
                </div>
            </div>`).join("");

        container.querySelectorAll('.approve-review-btn').forEach(b => b.addEventListener('click', async e => {
            const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (!await adminRequest(`${API_BASE}/api/reviews/${id}/approve`, {method: 'PUT'})) return;
            fetchPendingReviews();
        }));

        container.querySelectorAll('.reject-review-btn').forEach(b => b.addEventListener('click', async e => {
            if (!confirm("Respingi recenzia?")) return;
            const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (!await adminRequest(`${API_BASE}/api/reviews/${id}`, {method: 'DELETE'})) return;
            fetchPendingReviews();
            adminToast('Recenzie respinsa');
        }));
    } catch (e) {
        console.error("Eroare recenzii:", e);
    }
}

authFetch(`${API_BASE}/api/auth/me`).then(response => {
    if (response.ok) return showAdminPanel();
}).catch(() => {
});
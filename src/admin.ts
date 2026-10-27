// Resource keys also prevent duplicate requests after a list is redrawn.
const pendingAdminActions = new Set<string | Element>();
function onAdminAction(element: Element, eventName: 'click' | 'change', action: (event: Event) => Promise<void>, key: string | Element = element.id || element) {
    element.addEventListener(eventName, async event => {
        if (element.hasAttribute('disabled') || pendingAdminActions.has(key)) return;
        pendingAdminActions.add(key);
        element.setAttribute('disabled', '');
        element.setAttribute('aria-busy', 'true');
        try {
            await action(event);
        } catch {
            alert('Operația nu a putut fi confirmată. Verifică rezultatul înainte de reîncercare.');
        } finally {
            pendingAdminActions.delete(key);
            element.removeAttribute('disabled');
            element.removeAttribute('aria-busy');
        }
    });
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
    onAdminAction(loginBtn, 'click', async () => {
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

function categoriesFor(main?: string): Category[] {
    return allCategoriesCache.filter(c => c.mainCategory === main)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function categoryOptions(main?: string, selected = ''): string {
    return categoriesFor(main).map(c =>
        `<option value="${escapeHtml(c.name)}" ${c.name === selected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
    ).join('');
}

function renderFilteredCategories() {
    const main = (document.getElementById('new-category-main') as HTMLSelectElement)?.value || 'Cactuși';
    const filtered = categoriesFor(main);
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
        onAdminAction(btn, 'click', async e => {
            const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (!confirm("Stergi aceasta subcategorie?")) return;
            if (!await adminRequest(`${API_BASE}/api/categories/${id}`, {method: 'DELETE'})) return;
            showToast('Categorie stearsa');
            await fetchAdminCategories();
        }, `category:${btn.getAttribute('data-id')}`);
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
    onAdminAction(addCategoryBtn, 'click', async () => {
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
        await fetchAdminCategories();
        showToast('Categorie adaugata');
    });
}

function refreshSubcategories() {
    const main = (document.getElementById('new-cactus-main-category') as HTMLSelectElement)?.value;
    const sub = document.getElementById('new-cactus-category') as HTMLSelectElement | null;
    if (!sub) return;
    sub.innerHTML = categoryOptions(main, sub.value);
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

function editField(id: string, label: string, control: string, span = ''): string {
    return `<div class="${span}"><label class="edit-field-label" for="${id}">${label}</label>${control}</div>`;
}

const productActions = [
    { selector: '.delete-cactus-btn', path: '', method: 'DELETE', message: 'Produs dezactivat',
        confirmations: ['Dezactivezi acest produs?'] },
    { selector: '.reactivate-cactus-btn', path: '/reactivate', method: 'PUT', message: 'Produs reactivat',
        confirmations: [] },
    { selector: '.hard-delete-btn', path: '/permanent', method: 'DELETE', message: 'Produs sters definitiv',
        confirmations: ['ATENTIE: Stergere definitiva?', 'Absolut sigur? Ireversibil.'] }
];

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
            ${hybridBadge(c)}
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
        <div class="edit-panel" data-id="${c.id}" data-version="${c.version}" style="display:none;">
            <h4 class="edit-panel-title">Editare: ${escapeHtml(c.name)}</h4>
            <div class="edit-fields">
                ${editField(`edit-name-${c.id}`, 'Nume', `<input type="text" id="edit-name-${c.id}" class="edit-name admin-input" value="${escapeHtml(c.name)}">`, 'edit-full-width')}
                ${editField(`edit-price-${c.id}`, 'Preț (RON)', `<input type="number" id="edit-price-${c.id}" class="edit-price admin-input" value="${c.price}">`)}
                ${editField(`edit-stock-${c.id}`, 'Stoc', `<input type="number" id="edit-stock-${c.id}" class="edit-stock admin-input" value="${c.stock}" min="0">`)}
                ${editField(`edit-product-type-${c.id}`, 'Tip produs', `<select id="edit-product-type-${c.id}" class="edit-product-type admin-input">
                    ${PRODUCT_TYPES.map(t => `<option value="${escapeHtml(t)}" ${t === c.productType ? 'selected' : ''}>${escapeHtml(t)}</option>`).join("")}
                    </select>`)}
                ${editField(`edit-main-category-${c.id}`, 'Categorie principală', `<select id="edit-main-category-${c.id}" class="edit-main-category admin-input" data-id="${c.id}">
                    ${MAIN_CATEGORIES.map(m => `<option value="${escapeHtml(m)}" ${m === c.mainCategory ? 'selected' : ''}>${escapeHtml(m)}</option>`).join("")}
                    </select>`)}
                ${editField(`edit-category-${c.id}`, 'Subcategorie (gen)', `<select id="edit-category-${c.id}" class="edit-category admin-input" data-id="${c.id}">
                    ${categoryOptions(c.mainCategory, c.category)}
                    </select>`, 'edit-half-width')}
                ${editField(`edit-desc-${c.id}`, 'Descriere', `<input type="text" id="edit-desc-${c.id}" class="edit-desc admin-input" value="${escapeHtml(c.description)}">`, 'edit-half-width')}
                ${editField(`edit-location-${c.id}`, 'Locație (origine)', `<input type="text" id="edit-location-${c.id}" class="edit-location admin-input" value="${escapeHtml(c.location || '')}" placeholder="ex: Mexic, Africa de Sud">`, 'edit-full-width')}
                ${editField(`edit-image-${c.id}`, 'Imagine (URL)', `<input type="text" id="edit-image-${c.id}" class="edit-image admin-input" value="${escapeHtml(c.imageUrl)}">`, 'edit-full-width')}
                <label class="hybrid-toggle edit-full-width">
                    <input type="checkbox" class="edit-hybrid" ${c.hybrid === true ? 'checked' : ''}>
                    <span>Hibrid</span>
                </label>
                <div class="edit-full-width">
                    <button class="save-edit-btn admin-btn btn-primary btn-sm" data-id="${c.id}">Salvează</button>
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
        subSelect.innerHTML = categoryOptions(select.value, subSelect.value);
    }));

    container.querySelectorAll('.save-edit-btn').forEach(b => onAdminAction(b, 'click', async e => {
        const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
        const p = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
        if (!p) return;
        const u = {
            version: Number(p.getAttribute('data-version')),
            name: (p.querySelector('.edit-name') as HTMLInputElement).value.trim(),
            price: Number((p.querySelector('.edit-price') as HTMLInputElement).value),
            stock: Number((p.querySelector('.edit-stock') as HTMLInputElement).value) || 0,
            description: (p.querySelector('.edit-desc') as HTMLInputElement).value.trim(),
            imageUrl: (p.querySelector('.edit-image') as HTMLInputElement).value.trim(),
            productType: (p.querySelector('.edit-product-type') as HTMLInputElement).value,
            mainCategory: (p.querySelector('.edit-main-category') as HTMLInputElement).value,
            category: (p.querySelector('.edit-category') as HTMLInputElement).value,
            location: (p.querySelector('.edit-location') as HTMLInputElement).value.trim(),
            hybrid: (p.querySelector('.edit-hybrid') as HTMLInputElement).checked
        };
        const r = await adminRequest(`${API_BASE}/api/cacti/${id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(u)
        });
        if (r) {
            await fetchAdminCacti();
            showToast('Produs actualizat');
        }
    }, `product:${b.getAttribute('data-id')}`));

    for (const action of productActions) {
        container.querySelectorAll(action.selector).forEach(button => {
            onAdminAction(button, 'click', async () => {
                if (!action.confirmations.every(message => confirm(message))) return;
                const id = button.getAttribute('data-id');
                if (!await adminRequest(`${API_BASE}/api/cacti/${id}${action.path}`, {method: action.method})) return;
                await fetchAdminCacti();
                showToast(action.message);
            }, `product:${button.getAttribute('data-id')}`);
        });
    }
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
    onAdminAction(addCactusBtn, 'click', async () => {
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
            location: (document.getElementById('new-cactus-location') as HTMLInputElement).value.trim(),
            hybrid: (document.getElementById('new-cactus-hybrid') as HTMLInputElement).checked
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
            const uploaded = await ur.json();
            if (typeof uploaded.imageUrl !== 'string' || !uploaded.imageUrl.trim()) {
                throw new Error('Serverul nu a returnat adresa imaginii încărcate.');
            }
            imageUrl = uploaded.imageUrl;
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
        (document.getElementById('new-cactus-hybrid') as HTMLInputElement).checked = false;

        if (fileInput) fileInput.value = "";
        await fetchAdminCacti();
        showToast('Produs adaugat');
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
            <td><select class="order-status-select admin-input" data-id="${o.id}" aria-label="Status comandă ${o.id}" ${(ORDER_STATUS_TRANSITIONS[o.status] || []).length === 0 ? 'disabled' : ''} style="padding:6px;">
                ${[o.status, ...(ORDER_STATUS_TRANSITIONS[o.status] || [])].map(s => `<option value="${escapeHtml(s)}" ${s === o.status ? 'selected' : ''}>${escapeHtml(s)}</option>`).join("")}
            </select></td>
        </tr>`).join("");

    tb.querySelectorAll('.order-status-select').forEach(s => onAdminAction(s, 'change', async e => {
        const t = e.target as HTMLSelectElement;
        const previous = orders.find(order => order.id === Number(t.getAttribute('data-id')))?.status;
        const r = await adminRequest(`${API_BASE}/api/orders/${t.getAttribute('data-id')}/status`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status: t.value})
        });
        if (r) {
            await fetchAdminOrders();
            showToast('Status actualizat');
        } else if (previous) {
            t.value = previous;
        }
    }, `order:${s.getAttribute('data-id')}`));
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

interface PendingReview extends ReviewResponse {
    customerEmail: string;
    cactusId: number | null;
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

        container.querySelectorAll('.approve-review-btn').forEach(b => onAdminAction(b, 'click', async e => {
            const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (!await adminRequest(`${API_BASE}/api/reviews/${id}/approve`, {method: 'PUT'})) return;
            await fetchPendingReviews();
        }, `review:${b.getAttribute('data-id')}`));

        container.querySelectorAll('.reject-review-btn').forEach(b => onAdminAction(b, 'click', async e => {
            if (!confirm("Respingi recenzia?")) return;
            const id = (e.target as HTMLElement).closest("[data-id]")?.getAttribute("data-id");
            if (!await adminRequest(`${API_BASE}/api/reviews/${id}`, {method: 'DELETE'})) return;
            await fetchPendingReviews();
            showToast('Recenzie respinsa');
        }, `review:${b.getAttribute('data-id')}`));
    } catch (e) {
        console.error("Eroare recenzii:", e);
    }
}

authFetch(`${API_BASE}/api/auth/me`).then(response => {
    if (response.ok) return showAdminPanel();
}).catch(() => {
});




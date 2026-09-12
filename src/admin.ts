// Interfețele Cactus, Order, Category + constantele vin din shared.ts
// authFetch vine din shared.ts — trimite cookie-ul JWT automat

// --- 1. SISTEMUL DE LOGIN ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const userInput = (document.getElementById('admin-user') as HTMLInputElement).value;
        const passInput = (document.getElementById('admin-pass') as HTMLInputElement).value;

        try {
            const response = await authFetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                alert("❌ Date de autentificare incorecte (Respinse de Server)!");
            }
        } catch (error) {
            alert("Nu am putut contacta serverul pentru autentificare.");
        }
    });
}

// --- 2. GESTIUNE CATEGORII ---
async function fetchAdminCategories() {
    try {
        const response = await authFetch(`${API_BASE}/api/categories`);
        const categories: Category[] = await response.json();

        // A. Afișăm subcategoriile grupate pe cele 3 categorii principale
        const list = document.getElementById('admin-categories-list');
        if (list) {
            let html = "";
            for (const main of MAIN_CATEGORIES) {
                const subcats = categories
                    .filter(c => c.mainCategory === main)
                    .sort((a, b) => a.name.localeCompare(b.name)); // Sortare alfabetică pentru listă
                html += `
                    <div style="width: 100%; margin-bottom: 15px;">
                        <h4 style="color: #2f694b; margin-bottom: 8px;">${escapeHtml(main)}</h4>
                        <ul style="list-style: none; padding: 0; display: flex; gap: 10px; flex-wrap: wrap;">
                            ${subcats.length === 0
                    ? `<li style="color: #999; font-style: italic;">Nicio subcategorie încă</li>`
                    : subcats.map(cat =>
                        `<li style="background: #fdf2b8; border: 1px solid #2f694b; color: #2f694b; padding: 8px 12px; border-radius: 20px; display: flex; align-items: center; gap: 10px; font-weight: bold;">
                                        ${escapeHtml(cat.name)}
                                        <button class="delete-cat-btn" data-id="${cat.id}" style="background: #d32f2f; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 10px; font-weight: bold;">X</button>
                                    </li>`
                    ).join("")
                }
                        </ul>
                    </div>
                `;
            }
            list.innerHTML = html;

            document.querySelectorAll('.delete-cat-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.target as HTMLButtonElement).getAttribute('data-id');
                    if (confirm("Sigur ștergi această subcategorie?")) {
                        await authFetch(`${API_BASE}/api/categories/${id}`, {
                            method: 'DELETE',
                        });
                        fetchAdminCategories();
                    }
                });
            });
        }

        // B. Populează dropdown-ul de subcategorie din formularul de adăugare produs,
        // filtrat după categoria principală selectată acolo.
        updateCactusCategoryDropdown(categories);
    } catch (error) {
        console.error("Eroare la preluarea categoriilor:", error);
    }
}

// Reumple dropdown-ul de subcategorie (gen) în funcție de categoria principală aleasă
function updateCactusCategoryDropdown(categories: Category[]) {
    const mainSelect = document.getElementById('new-cactus-main-category') as HTMLSelectElement;
    const subSelect = document.getElementById('new-cactus-category') as HTMLSelectElement;
    if (!mainSelect || !subSelect) return;

    const selectedMain = mainSelect.value;
    const subcats = categories
        .filter(c => c.mainCategory === selectedMain)
        .sort((a, b) => a.name.localeCompare(b.name)); // Sortare alfabetică pentru dropdown

    if (subcats.length === 0) {
        subSelect.innerHTML = `<option value="">Nicio subcategorie — adaugă una mai sus</option>`;
    } else {
        subSelect.innerHTML = subcats.map(cat => `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`).join("");
    }
}

// Când adminul schimbă categoria principală din formularul de produs,
// reîncărcăm lista de subcategorii disponibile
const mainCategorySelect = document.getElementById('new-cactus-main-category');
if (mainCategorySelect) {
    mainCategorySelect.addEventListener('change', async () => {
        const response = await authFetch(`${API_BASE}/api/categories`);
        const categories: Category[] = await response.json();
        updateCactusCategoryDropdown(categories);
    });
}

// Adăugare subcategorie nouă (necesită Auth)
const addCategoryBtn = document.getElementById('add-category-btn');
if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('new-category-name') as HTMLInputElement;
        const mainSelect = document.getElementById('new-category-main') as HTMLSelectElement;
        if (!nameInput.value.trim() || !mainSelect) return;

        await authFetch(`${API_BASE}/api/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput.value.trim(), mainCategory: mainSelect.value })
        });

        nameInput.value = "";
        fetchAdminCategories();
    });
}

// --- 3. GESTIUNE CACTUȘI (PRODUSE) ---
async function fetchAdminCacti() {
    try {
        const response = await authFetch(`${API_BASE}/api/cacti/all`, {
        });
        const cacti: Cactus[] = await response.json();

        const container = document.getElementById('admin-cacti-list');
        if (!container) return;

        let htmlContent = "";
        for (let cactus of cacti) {
            const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
            const cardStyle = cactus.active
                ? 'background:#fdf2b8; padding:10px; border:1px solid #2f694b; border-radius:6px; text-align:center;'
                : 'background:#e0e0e0; padding:10px; border:1px solid #999; border-radius:6px; text-align:center; opacity:0.7;';
            htmlContent += `
                <div style="${cardStyle}">
                    ${cactus.active ? '' : '<p style="margin: 0 0 5px 0; color: #d32f2f; font-weight: bold; font-size: 0.8em;">❌ DEZACTIVAT</p>'}
                    <img src="${escapeHtml(validImage)}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                    <h4 style="margin: 10px 0 5px 0; color: #2f694b;">${escapeHtml(cactus.name)}</h4>
                    <p style="margin: 0; color: #d32f2f; font-weight: bold;">${cactus.price} RON</p>
                    <p style="margin: 4px 0 0 0; color: ${cactus.stock > 0 ? '#2f694b' : '#d32f2f'}; font-size: 0.85em; font-weight: bold;">Stoc: ${cactus.stock}</p>
                    <div class="edit-panel" data-id="${cactus.id}" style="display: none; margin-top: 8px; text-align: left; font-size: 0.85em;">
                        <input type="text" class="edit-name" value="${escapeHtml(cactus.name)}" placeholder="Nume" style="width: 100%; padding: 4px; margin-bottom: 4px; box-sizing: border-box; border: 1px solid #2f694b; border-radius: 3px;">
                        <input type="number" class="edit-price" value="${cactus.price}" placeholder="Preț" style="width: 48%; padding: 4px; margin-bottom: 4px; border: 1px solid #2f694b; border-radius: 3px;">
                        <input type="number" class="edit-stock" value="${cactus.stock}" placeholder="Stoc" min="0" style="width: 48%; padding: 4px; margin-bottom: 4px; border: 1px solid #2f694b; border-radius: 3px; float: right;">
                        <input type="text" class="edit-desc" value="${escapeHtml(cactus.description)}" placeholder="Descriere" style="width: 100%; padding: 4px; margin-bottom: 4px; box-sizing: border-box; border: 1px solid #2f694b; border-radius: 3px;">
                        <input type="text" class="edit-image" value="${escapeHtml(cactus.imageUrl)}" placeholder="URL imagine" style="width: 100%; padding: 4px; margin-bottom: 6px; box-sizing: border-box; border: 1px solid #2f694b; border-radius: 3px;">
                        <input type="hidden" class="edit-product-type" value="${escapeHtml(cactus.productType)}">
                        <input type="hidden" class="edit-main-category" value="${escapeHtml(cactus.mainCategory)}">
                        <input type="hidden" class="edit-category" value="${escapeHtml(cactus.category)}">
                        <button class="save-edit-btn" data-id="${cactus.id}" style="background-color: #2f694b; color: #fdf2b8; border: none; padding: 5px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold;">
                            💾 Salvează
                        </button>
                    </div>
                    <div style="display: flex; gap: 5px; margin-top: 8px;">
                        <button class="edit-cactus-btn" data-id="${cactus.id}" style="background-color: #FF9800; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; flex: 1; font-weight: bold;">
                            ✏️ Editează
                        </button>
                        ${cactus.active
                ? `<button class="delete-cactus-btn" data-id="${cactus.id}" style="background-color: #d32f2f; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; flex: 1; font-weight: bold;">
                                🗑️ Dezactivează
                              </button>`
                : `<button class="reactivate-cactus-btn" data-id="${cactus.id}" style="background-color: #2f694b; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; flex: 1; font-weight: bold;">
                                ✅ Reactivează
                              </button>
                              <button class="hard-delete-btn" data-id="${cactus.id}" style="background-color: #7f0000; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; flex: 1; font-weight: bold; font-size: 0.8em;">
                                ⛔ Șterge definitiv
                              </button>`
            }
                    </div>
                </div>
            `;
        }
        container.innerHTML = htmlContent;

        // Toggle edit panel
        document.querySelectorAll('.edit-cactus-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const btn = event.target as HTMLButtonElement;
                const id = btn.getAttribute('data-id');
                const panel = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
        });

        // Save edit
        document.querySelectorAll('.save-edit-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const btn = event.target as HTMLButtonElement;
                const id = btn.getAttribute('data-id');
                const panel = document.querySelector(`.edit-panel[data-id="${id}"]`) as HTMLElement;
                if (!panel) return;

                const updated = {
                    name: (panel.querySelector('.edit-name') as HTMLInputElement).value.trim(),
                    price: Number((panel.querySelector('.edit-price') as HTMLInputElement).value),
                    stock: Number((panel.querySelector('.edit-stock') as HTMLInputElement).value) || 0,
                    description: (panel.querySelector('.edit-desc') as HTMLInputElement).value.trim(),
                    imageUrl: (panel.querySelector('.edit-image') as HTMLInputElement).value.trim(),
                    productType: (panel.querySelector('.edit-product-type') as HTMLInputElement).value,
                    mainCategory: (panel.querySelector('.edit-main-category') as HTMLInputElement).value,
                    category: (panel.querySelector('.edit-category') as HTMLInputElement).value
                };

                const response = await authFetch(`${API_BASE}/api/cacti/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated)
                });

                if (response.ok) {
                    fetchAdminCacti();
                } else {
                    alert("Eroare la salvarea modificărilor.");
                }
            });
        });

        // Dezactivare cactus (soft-delete, necesită Auth)
        document.querySelectorAll('.delete-cactus-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const btn = event.target as HTMLButtonElement;
                const cactusId = Number(btn.getAttribute('data-id'));

                if (confirm("Ești sigur că vrei să dezactivezi acest produs? Nu va mai apărea în magazin.")) {
                    await authFetch(`${API_BASE}/api/cacti/${cactusId}`, {
                        method: 'DELETE',
                    });
                    fetchAdminCacti();
                }
            });
        });

        // Reactivare cactus
        document.querySelectorAll('.reactivate-cactus-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const btn = event.target as HTMLButtonElement;
                const cactusId = Number(btn.getAttribute('data-id'));

                await authFetch(`${API_BASE}/api/cacti/${cactusId}/reactivate`, {
                    method: 'PUT',
                });
                fetchAdminCacti();
            });
        });

        // Ștergere permanentă (doar produse inactive)
        document.querySelectorAll('.hard-delete-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const btn = event.target as HTMLButtonElement;
                const cactusId = Number(btn.getAttribute('data-id'));

                if (!confirm("ATENȚIE: Produsul va fi șters definitiv din baza de date. Continui?")) return;
                if (!confirm("Ești absolut sigur? Acțiunea este ireversibilă.")) return;

                await authFetch(`${API_BASE}/api/cacti/${cactusId}/permanent`, {
                    method: 'DELETE',
                });
                fetchAdminCacti();
            });
        });
    } catch (error) {
        console.error("Eroare la preluarea produselor:", error);
    }
}

// Adăugare cactus nou (necesită Auth)
const addCactusBtn = document.getElementById('add-new-cactus-btn');
if (addCactusBtn) {
    addCactusBtn.addEventListener('click', async () => {
        const newCactus = {
            name: (document.getElementById('new-cactus-name') as HTMLInputElement).value.trim(),
            price: Number((document.getElementById('new-cactus-price') as HTMLInputElement).value),
            productType: (document.getElementById('new-cactus-product-type') as HTMLSelectElement).value,
            mainCategory: (document.getElementById('new-cactus-main-category') as HTMLSelectElement).value,
            category: (document.getElementById('new-cactus-category') as HTMLSelectElement).value,
            description: (document.getElementById('new-cactus-desc') as HTMLInputElement).value.trim(),
            imageUrl: (document.getElementById('new-cactus-image') as HTMLInputElement).value.trim(),
            stock: Number((document.getElementById('new-cactus-stock') as HTMLInputElement).value) || 0
        };

        if (!newCactus.name || !newCactus.price || !newCactus.category || !newCactus.mainCategory || !newCactus.productType) {
            alert("Completează toate câmpurile obligatorii (inclusiv tip produs și subcategorie)!");
            return;
        }

        await authFetch(`${API_BASE}/api/cacti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCactus)
        });

        (document.getElementById('new-cactus-name') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-price') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-desc') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-image') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-stock') as HTMLInputElement).value = "";

        fetchAdminCacti();
    });
}

// --- 4. VIZUALIZARE COMENZI (necesită Auth) ---
async function fetchAdminOrders() {
    try {
        const response = await authFetch(`${API_BASE}/api/orders`, {
        });

        if (!response.ok) throw new Error('Neautorizat');

        const orders: Order[] = await response.json();

        const tableBody = document.getElementById('admin-orders-list');
        if (!tableBody) return;

        if (orders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #2f694b;">Nicio comandă momentan. E timpul pentru marketing! 🌵</td></tr>`;
            return;
        }

        let htmlContent = "";
        for (let order of orders) {
            htmlContent += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold; color: #2f694b;">#${order.id}</td>
                    <td style="padding: 12px; color: #333;">${escapeHtml(order.customerName)}<br><span style="font-size: 0.8em; color: #999;">${escapeHtml(order.email)}</span></td>
                    <td style="padding: 12px; color: #333;">${escapeHtml(order.address)}</td>
                    <td style="padding: 12px; color: #2f694b;">${escapeHtml(order.purchasedItems)}</td>
                    <td style="padding: 12px; color: #d32f2f; font-weight: bold;">${order.totalPrice} RON</td>
                    <td style="padding: 12px;">
                        <select class="order-status-select" data-id="${order.id}" style="padding: 6px; border: 1px solid #2f694b; border-radius: 4px;">
                            ${ORDER_STATUSES.map(s => `<option value="${escapeHtml(s)}" ${s === order.status ? 'selected' : ''}>${escapeHtml(s)}</option>`).join("")}
                        </select>
                    </td>
                </tr>
            `;
        }
        tableBody.innerHTML = htmlContent;

        document.querySelectorAll('.order-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const target = e.target as HTMLSelectElement;
                const orderId = target.getAttribute('data-id');
                const newStatus = target.value;

                const response = await authFetch(`${API_BASE}/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) {
                    alert("Nu am putut actualiza statusul comenzii.");
                    fetchAdminOrders(); // reîncarcă starea reală dacă a eșuat
                }
            });
        });

    } catch (error) {
        console.error("Eroare la preluarea comenzilor:", error);
        document.getElementById('admin-orders-list')!.innerHTML = `<tr><td colspan="5" style="color: red;">Eroare de securitate. Nu poți accesa comenzile.</td></tr>`;
    }
}
// --- 5. MODERARE RECENZII ---
interface PendingReview {
    id: number;
    customerName: string;
    customerEmail: string;
    cactusId: number | null;
    rating: number;
    comment: string;
    createdAt: string;
}

// starsDisplay vine din shared.ts

async function fetchPendingReviews() {
    const container = document.getElementById('admin-reviews-list');
    if (!container) return;

    try {
        const response = await authFetch(`${API_BASE}/api/reviews/pending`);
        const reviews: PendingReview[] = await response.json();

        if (reviews.length === 0) {
            container.innerHTML = `<p style="color: #999; font-style: italic;">Nicio recenzie in asteptare.</p>`;
            return;
        }

        container.innerHTML = reviews.map(r => `
            <div style="background: #fdf2b8; padding: 15px; border: 1px solid #2f694b; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <strong style="color: #2f694b;">${escapeHtml(r.customerName)}</strong>
                        <span style="color: #999; font-size: 0.85em;">(${escapeHtml(r.customerEmail)})</span>
                        ${r.cactusId ? `<span style="color: #666; font-size: 0.85em;"> — Produs #${r.cactusId}</span>` : '<span style="color: #666; font-size: 0.85em;"> — Recenzie generala</span>'}
                    </div>
                    <div style="color: #FF9800; font-size: 1.2em;">${starsDisplay(r.rating)}</div>
                </div>
                <p style="margin: 10px 0; color: #333; font-style: italic;">"${escapeHtml(r.comment)}"</p>
                <div style="display: flex; gap: 8px;">
                    <button class="approve-review-btn" data-id="${r.id}" style="background-color: #2f694b; color: white; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        ✅ Aproba
                    </button>
                    <button class="reject-review-btn" data-id="${r.id}" style="background-color: #d32f2f; color: white; border: none; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        ❌ Respinge
                    </button>
                </div>
            </div>
        `).join("");

        document.querySelectorAll('.approve-review-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = (e.target as HTMLButtonElement).getAttribute('data-id');
                await authFetch(`${API_BASE}/api/reviews/${id}/approve`, { method: 'PUT' });
                fetchPendingReviews();
            });
        });

        document.querySelectorAll('.reject-review-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = (e.target as HTMLButtonElement).getAttribute('data-id');
                if (confirm("Esti sigur ca vrei sa respingi aceasta recenzie?")) {
                    await authFetch(`${API_BASE}/api/reviews/${id}`, { method: 'DELETE' });
                    fetchPendingReviews();
                }
            });
        });

    } catch (error) {
        console.error("Eroare la preluarea recenziilor:", error);
    }
}
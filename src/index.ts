// 1. Product Interface
interface Cactus {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
}

// 2. Aici vom ține cactușii pe care ni-i dă serverul
let cactiForSale: Cactus[] = [];

// 3. Current filter and cart state
let selectedCategory: string = "Toți";
let searchQuery: string = "";
let shoppingCart: Cactus[] = [];

// Funcția "Magică" care vorbește cu serverul Java
async function fetchCacti() {
    try {
        // "Sunăm" serverul Java care ascultă pe portul 8080
        const response = await fetch('http://localhost:8080/api/cacti');

        if (!response.ok) {
            throw new Error('A apărut o eroare la conectarea cu serverul!');
        }

        // Traducem răspunsul de la server în date pe care TypeScript le înțelege
        cactiForSale = await response.json();

        // După ce primim datele, desenăm butoanele și grila pe ecran
        renderCategories();
        renderCacti();
    } catch (error) {
        console.error("Eroare:", error);
        alert("Nu m-am putut conecta la baza de date. Asigură-te că serverul Java este pornit!");
    }
}

// Funcția care trimite cererea de ștergere către Java
async function deleteCactus(id: number) {
    // Întrebăm utilizatorul dacă este sigur
    const isConfirmed = confirm("Ești sigur că vrei să ștergi acest cactus definitiv?");
    if (!isConfirmed) return;

    try {
        // Trimitem metoda DELETE către adresa cu ID-ul respectiv (ex: /api/cacti/5)
        const response = await fetch(`http://localhost:8080/api/cacti/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Nu am putut șterge cactusul!');
        }

        showToast("🗑️ Cactusul a fost șters cu succes!");

        // Cerem din nou lista de la server pentru a actualiza ecranul
        fetchCacti();

    } catch (error) {
        console.error("Eroare:", error);
        alert("A apărut o eroare la ștergere.");
    }
}

// 4. Function to update Cart UI
function updateCartUI() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = shoppingCart.length.toString();
    }
    renderCartItems();
}

// 5. Function to show animated Toast Notification
function showToast(message: string) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.innerText = message;

    toast.style.backgroundColor = "#4CAF50";
    toast.style.color = "white";
    toast.style.padding = "15px 25px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    toast.style.fontWeight = "bold";

    toast.style.transform = "translateX(120%)";
    toast.style.transition = "transform 0.4s ease-in-out";

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = "translateX(0)";
    }, 10);

    setTimeout(() => {
        toast.style.transform = "translateX(120%)";

        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 3000);
}

// 6. Function to render category buttons
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = "";
    // Re-calculăm categoriile unice (în caz că s-a adăugat o categorie complet nouă)
    const uniqueCategories = ["Toți", ...new Set(cactiForSale.map(c => c.category))];

    for (let cat of uniqueCategories) {
        const btn = document.createElement('button');
        btn.innerText = cat;
        btn.style.padding = "10px 15px";
        btn.style.marginRight = "10px";
        btn.style.border = "none";
        btn.style.borderRadius = "5px";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";

        if (cat === selectedCategory) {
            btn.style.backgroundColor = "#2E7D32";
            btn.style.color = "white";
        } else {
            btn.style.backgroundColor = "#e0e0e0";
            btn.style.color = "black";
        }

        btn.addEventListener('click', () => {
            selectedCategory = cat;
            renderCategories();
            renderCacti();
        });
        container.appendChild(btn);
    }
}

// 7. Function to render the products
function renderCacti() {
    const container = document.getElementById('cacti-list');
    if (!container) return;

    const filteredCacti = cactiForSale.filter(cactus => {
        const matchesCategory = selectedCategory === "Toți" || cactus.category === selectedCategory;
        const matchesName = cactus.name.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesName;
    });

    let htmlContent = "";



    if (filteredCacti.length === 0) {
        htmlContent = `<p style="grid-column: span 3; color: red; font-size: 1.2em;">Nu am găsit niciun cactus care să se potrivească căutării tale.</p>`;
    } else {
        for (let cactus of filteredCacti) {
            const categoryTag = `<span style="background: #e8f5e9; color: #2e7d32; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">${cactus.category}</span>`;

            htmlContent += `
                <div style="border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background-color: white;">
                    <div>
                        ${categoryTag}
                        <h2 style="color: #2E7D32; margin-top: 10px;">🌵 ${cactus.name}</h2>
                        <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.price} RON</span></p>
                        <p><em>${cactus.description}</em></p>
                    </div>
                    <div>
                        <button class="add-to-cart-btn" data-id="${cactus.id}" style="background-color: #4CAF50; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; font-weight: bold;">
                            Adaugă în coș
                        </button>
                        <!-- NOU: Butonul de Ștergere -->
                        <button class="delete-btn" data-id="${cactus.id}" style="background-color: #d32f2f; color: white; padding: 8px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 5px; font-weight: bold; font-size: 0.9em;">
                            🗑️ Șterge (Admin)
                        </button>
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = htmlContent;

    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target as HTMLButtonElement;
            const cactusId = Number(clickedButton.getAttribute('data-id'));
            const cactusToAdd = cactiForSale.find(c => c.id === cactusId);

            if (cactusToAdd) {
                shoppingCart.push(cactusToAdd);
                updateCartUI();
                showToast(`✅ ${cactusToAdd.name} a fost adăugat în coș!`);
            }
        });
    });

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target as HTMLButtonElement;
            const cactusId = Number(clickedButton.getAttribute('data-id'));

            // Apelăm funcția noastră de ștergere
            deleteCactus(cactusId);
        });
    });
}

// 8. Function to render items inside the Cart Modal
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');

    if (!cartItemsContainer || !cartTotalElement) return;

    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color: gray; font-style: italic;">Coșul este gol.</p>';
        cartTotalElement.innerText = "0";
        return;
    }

    let htmlContent = "";
    let totalPrice = 0;

    for (let item of shoppingCart) {
        htmlContent += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9em; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                <span>🌵 ${item.name}</span>
                <strong>${item.price} RON</strong>
            </div>
        `;
        totalPrice += item.price;
    }

    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.innerText = totalPrice.toString();
}

// 9. Logic to open/close the Cart Modal
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');

if (cartButton && cartModal && closeCartBtn) {
    cartButton.addEventListener('click', () => {
        cartModal.style.display = cartModal.style.display === "none" ? "block" : "none";
    });

    closeCartBtn.addEventListener('click', () => {
        cartModal.style.display = "none";
    });
}

// 10. Search Bar logic
const searchBar = document.getElementById('search-bar') as HTMLInputElement;
if (searchBar) {
    searchBar.addEventListener('input', (event) => {
        searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
        renderCacti();
    });
}

// 11. Initialize the app (Cerem datele de la server la încărcarea paginii)
fetchCacti();
updateCartUI();

// 12. Logic for Admin Panel (Adding new products to PostgreSQL)
const addCactusBtn = document.getElementById('add-new-cactus-btn');
if (addCactusBtn) {
    addCactusBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('new-cactus-name') as HTMLInputElement;
        const priceInput = document.getElementById('new-cactus-price') as HTMLInputElement;
        const categoryInput = document.getElementById('new-cactus-category') as HTMLInputElement;
        const descInput = document.getElementById('new-cactus-desc') as HTMLInputElement;

        const newName = nameInput.value.trim();
        const newPrice = Number(priceInput.value);
        const newCategory = categoryInput.value.trim();
        const newDesc = descInput.value.trim();

        if (!newName || !newPrice || !newCategory || !newDesc) {
            alert("Te rog să completezi toate câmpurile!");
            return;
        }

        // Creăm obiectul. Observă că NU îi mai dăm un ID! Baza de date (PostgreSQL) îi va da automat unul.
        const newCactus = {
            name: newName,
            price: newPrice,
            category: newCategory,
            description: newDesc
        };

        try {
            // Trimitem noul cactus către serverul Java folosind metoda POST
            const response = await fetch('http://localhost:8080/api/cacti', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCactus)
            });

            if (!response.ok) {
                throw new Error('Nu am putut salva cactusul!');
            }

            // Ștergem câmpurile formularului
            nameInput.value = "";
            priceInput.value = "";
            categoryInput.value = "";
            descInput.value = "";

            showToast(`🎉 Noul cactus "${newName}" a fost salvat permanent în baza de date!`);

            // Cel mai important: Cerem din nou lista de la server ca să vedem noul cactus
            fetchCacti();

        } catch (error) {
            console.error("Eroare:", error);
            alert("Eroare la salvare. Asigură-te că serverul Java este pornit.");
        }
    });
}
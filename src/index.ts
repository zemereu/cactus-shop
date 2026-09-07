// 1. Product Interface
// @ts-ignore

interface Cactus {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
    imageUrl: string;
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

            // Dacă produsul nu are poză (este null din baza de date), îi punem noi una generică
            const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";

            htmlContent += `
                <div style="border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background-color: white;">
                    <div>
                        <!-- NOU: Eticheta pentru imagine -->
                        <img src="${validImage}" alt="${cactus.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                        
                        ${categoryTag}
                        <h2 style="color: #2E7D32; margin-top: 10px;">🌵 ${cactus.name}</h2>
                        <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.price} RON</span></p>
                        <p><em>${cactus.description}</em></p>
                    </div>
                    <div>
                        <button class="add-to-cart-btn" data-id="${cactus.id}" style="background-color: #4CAF50; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; font-weight: bold;">
                            Adaugă în coș
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

// 10. Logică pentru Procesarea Comenzilor (Checkout)
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const submitOrderBtn = document.getElementById('submit-order-btn');

if (checkoutBtn && checkoutForm && submitOrderBtn) {

    // Când apeși "Mergi la Casă", ascunde butonul și arată formularul
    checkoutBtn.addEventListener('click', () => {
        if (shoppingCart.length === 0) {
            alert("Coșul este gol! Adaugă un cactus mai întâi.");
            return;
        }
        checkoutBtn.style.display = 'none';
        checkoutForm.style.display = 'block';
    });

    // Când trimiți comanda
    submitOrderBtn.addEventListener('click', async () => {
        const nameInput = (document.getElementById('customer-name') as HTMLInputElement).value.trim();
        const addressInput = (document.getElementById('customer-address') as HTMLInputElement).value.trim();

        if (!nameInput || !addressInput) {
            alert("Te rog să completezi numele și adresa de livrare!");
            return;
        }

        // Calculăm totalul și creăm un rezumat text al produselor (ex: "Aloe Vera, Cactus Pufos")
        const totalPrice = shoppingCart.reduce((sum, item) => sum + item.price, 0);
        const itemsSummary = shoppingCart.map(item => item.name).join(", ");

        const newOrder = {
            customerName: nameInput,
            address: addressInput,
            totalPrice: totalPrice,
            purchasedItems: itemsSummary
        };

        try {
            const response = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });

            if (!response.ok) throw new Error("Eroare la procesarea comenzii.");

            // Afișăm succesul
            showToast(`🎉 Comanda a fost plasată cu succes, ${nameInput}!`);

            // Golim coșul și re-desenăm interfața
            shoppingCart = [];
            updateCartUI();

            // Resetăm formularul și închidem coșul
            (document.getElementById('customer-name') as HTMLInputElement).value = "";
            (document.getElementById('customer-address') as HTMLInputElement).value = "";
            checkoutForm.style.display = 'none';
            checkoutBtn.style.display = 'block';
            document.getElementById('cart-modal')!.style.display = 'none';

        } catch (error) {
            console.error(error);
            alert("A apărut o eroare la salvarea comenzii.");
        }
    });
}

// 11. Initialize the app (Cerem datele de la server la încărcarea paginii)
fetchCacti();
updateCartUI();
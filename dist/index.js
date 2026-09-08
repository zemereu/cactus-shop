"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let cactiForSale = [];
let selectedCategory = "Toți";
let searchQuery = "";
let shoppingCart = [];
// 1. Fetch de la Backend (Filtrare aplicată pe server)
function fetchCacti() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = new URL('http://localhost:8080/api/cacti');
            url.searchParams.append('category', selectedCategory);
            url.searchParams.append('search', searchQuery);
            const response = yield fetch(url.toString());
            if (!response.ok)
                throw new Error('Eroare conectare server!');
            cactiForSale = yield response.json();
            fetchAndRenderCategories();
            renderCacti();
        }
        catch (error) {
            console.error("Eroare:", error);
        }
    });
}
// 2. UI Coș & Notificări
function updateCartUI() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = shoppingCart.length.toString();
    }
    renderCartItems();
}
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container)
        return;
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.backgroundColor = "#2f694b"; // Noul verde
    toast.style.color = "#fdf2b8"; // Noul crem pentru text
    toast.style.padding = "15px 25px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    toast.style.fontWeight = "bold";
    toast.style.transform = "translateX(120%)";
    toast.style.transition = "transform 0.4s ease-in-out";
    container.appendChild(toast);
    setTimeout(() => toast.style.transform = "translateX(0)", 10);
    setTimeout(() => {
        toast.style.transform = "translateX(120%)";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
// 3. Randare Sidebar Categorii
function fetchAndRenderCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('http://localhost:8080/api/categories');
            const categories = yield response.json();
            const container = document.getElementById('sidebar-categories-list');
            if (!container)
                return;
            let htmlContent = `<button class="category-btn" data-cat="Toți" style="background: ${selectedCategory === 'Toți' ? '#2f694b' : 'transparent'}; color: ${selectedCategory === 'Toți' ? '#fdf2b8' : '#2f694b'}; border: 2px solid #2f694b; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold; text-align: left;">Toți Cactușii</button>`;
            for (let cat of categories) {
                const isActive = selectedCategory === cat.name;
                htmlContent += `<button class="category-btn" data-cat="${cat.name}" style="background: ${isActive ? '#2f694b' : 'transparent'}; color: ${isActive ? '#fdf2b8' : '#2f694b'}; border: 2px solid #2f694b; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold; text-align: left;">${cat.name}</button>`;
            }
            container.innerHTML = htmlContent;
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    selectedCategory = e.target.getAttribute('data-cat') || "Toți";
                    fetchAndRenderCategories(); // Redesenează culorile
                    fetchCacti(); // Filtrează produsele
                    closeSidebar(); // Închide sidebar-ul la selecție
                });
            });
        }
        catch (error) {
            console.error("Eroare la categorii:", error);
        }
    });
}
// Logica de deschidere/închidere
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.style.left = "-300px";
        sidebarOverlay.style.display = "none";
    }
}
if (menuBtn && sidebarOverlay && closeSidebarBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.style.left = "0";
        sidebarOverlay.style.display = "block";
    });
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
}
// Adaugă apelul în zona de inițializare de la finalul fișierului
fetchAndRenderCategories();
// 4. Randare Produse (Fără filtrare locală, bazat direct pe server)
function renderCacti() {
    const container = document.getElementById('cacti-list');
    if (!container)
        return;
    let htmlContent = "";
    if (cactiForSale.length === 0) {
        htmlContent = `<p style="grid-column: span 3; color: red; font-size: 1.2em;">Nu am găsit niciun cactus conform căutării.</p>`;
    }
    else {
        for (let cactus of cactiForSale) {
            // Categoria acum are bordură verde și text verde, fără fundal plin
            const categoryTag = `<span style="border: 1px solid #2f694b; color: #2f694b; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">${cactus.category}</span>`;
            const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";
            htmlContent += `
                <div style="border: 2px solid #2f694b; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background-color: transparent;">
                    <div>
                        <img src="${validImage}" alt="${cactus.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                        ${categoryTag}
                        <h2 style="color: #2f694b; margin-top: 10px;">🌵 ${cactus.name}</h2>
                        <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.price} RON</span></p>
                        <p><em>${cactus.description}</em></p>
                    </div>
                    <button class="add-to-cart-btn" data-id="${cactus.id}" style="background-color: #2f694b; color: #fdf2b8; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; font-weight: bold;">
                        Adaugă în coș
                    </button>
                </div>
            `;
        }
    }
    container.innerHTML = htmlContent;
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target;
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
// 5. Randare elemente coș modal (Acum cu buton de ștergere)
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer || !cartTotalElement)
        return;
    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color: gray; font-style: italic;">Coșul este gol.</p>';
        cartTotalElement.innerText = "0";
        return;
    }
    let htmlContent = "";
    let totalPrice = 0;
    // Folosim un index (i) pentru a ști exact ce rând ștergem
    for (let i = 0; i < shoppingCart.length; i++) {
        let item = shoppingCart[i];
        htmlContent += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.9em; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                <span>🌵 ${item.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong>${item.price} RON</strong>
                    <button class="remove-from-cart-btn" data-index="${i}" style="background-color: #d32f2f; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 0.9em; font-weight: bold;" title="Elimină produsul">
                        X
                    </button>
                </div>
            </div>
        `;
        totalPrice += item.price;
    }
    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.innerText = totalPrice.toString();
    // Activăm butoanele "X" pentru a elimina produsele
    const removeButtons = document.querySelectorAll('.remove-from-cart-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Oprim propagarea click-ului ca să nu se închidă coșul accidental
            event.stopPropagation();
            const btn = event.target;
            const indexToRemove = Number(btn.getAttribute('data-index'));
            // Ștergem fix 1 element de la poziția respectivă din memorie
            shoppingCart.splice(indexToRemove, 1);
            // Re-desenăm coșul și actualizăm contorul
            updateCartUI();
        });
    });
}
// 6. Logica Închidere/Deschidere Coș (Click în afară)
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
if (cartButton && cartModal) {
    // Deschide/Închide la click pe butonul de sus
    cartButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Oprim propagarea pentru a nu declanșa imediat 'window.click'
        cartModal.style.display = cartModal.style.display === "none" ? "block" : "none";
    });
    // Închide fereastra dacă utilizatorul dă click oriunde altundeva pe pagină
    window.addEventListener('click', (event) => {
        if (cartModal.style.display === "block") {
            const target = event.target;
            // Dacă click-ul NU s-a efectuat în interiorul ferestrei modale și NU pe butonul de coș
            if (!cartModal.contains(target) && !cartButton.contains(target)) {
                cartModal.style.display = "none";
            }
        }
    });
    // Oprim propagarea click-urilor din interiorul ferestrei modale (ca să nu se închidă accidental când scrii în input)
    cartModal.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}
// 7. Checkout Process
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const submitOrderBtn = document.getElementById('submit-order-btn');
if (checkoutBtn && checkoutForm && submitOrderBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (shoppingCart.length === 0) {
            alert("Coșul este gol! Adaugă un cactus mai întâi.");
            return;
        }
        checkoutBtn.style.display = 'none';
        checkoutForm.style.display = 'block';
    });
    submitOrderBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const nameInput = document.getElementById('customer-name').value.trim();
        const addressInput = document.getElementById('customer-address').value.trim();
        if (!nameInput || !addressInput) {
            alert("Te rog să completezi numele și adresa de livrare!");
            return;
        }
        const totalPrice = shoppingCart.reduce((sum, item) => sum + item.price, 0);
        const itemsSummary = shoppingCart.map(item => item.name).join(", ");
        const newOrder = {
            customerName: nameInput,
            address: addressInput,
            totalPrice: totalPrice,
            purchasedItems: itemsSummary
        };
        try {
            const response = yield fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });
            if (!response.ok)
                throw new Error("Eroare la procesarea comenzii.");
            showToast(`🎉 Comanda a fost plasată cu succes, ${nameInput}!`);
            shoppingCart = [];
            updateCartUI();
            document.getElementById('customer-name').value = "";
            document.getElementById('customer-address').value = "";
            checkoutForm.style.display = 'none';
            checkoutBtn.style.display = 'block';
            document.getElementById('cart-modal').style.display = 'none';
        }
        catch (error) {
            console.error(error);
            alert("A apărut o eroare la salvarea comenzii.");
        }
    }));
}
// 8. Căutare (Apelează Java automat)
const searchBar = document.getElementById('search-bar');
if (searchBar) {
    searchBar.addEventListener('input', (event) => {
        searchQuery = event.target.value.toLowerCase();
        fetchCacti();
    });
}
// 9. Inițializare
fetchCacti();
updateCartUI();

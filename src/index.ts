// Interfețele Cactus și Category vin din shared.ts

let cactiForSale: Cactus[] = [];
let allCategories: Category[] = [];
let selectedProductType: string = "Plantă";
let selectedMainCategory: string = "Cactuși";
let selectedSubCategory: string = "Toți";
let expandedMainCategory: string = "Cactuși"; // care secțiune e deschisă în sidebar
let searchQuery: string = "";
let currentPage: number = 0;
let totalPages: number = 0;
const PAGE_SIZE: number = 12;

// Coșul se încarcă din localStorage la pornire, ca să nu dispară
// când navighezi pe altă pagină (ex: cont.html) și te întorci.
function loadCartFromStorage(): Cactus[] {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(shoppingCart));
}

let shoppingCart: Cactus[] = loadCartFromStorage();

// PRODUCT_TYPES, MAIN_CATEGORIES, escapeHtml, API_BASE, CART_STORAGE_KEY,
// CUSTOMER_NAME_KEY, authFetch vin din shared.ts

// 1. Fetch de la Backend (Filtrare aplicată pe server, cu paginare)
async function fetchCacti() {
    try {
        const url = new URL(`${API_BASE}/api/cacti`);
        url.searchParams.append('productType', selectedProductType);
        url.searchParams.append('mainCategory', selectedMainCategory);
        url.searchParams.append('category', selectedSubCategory);
        url.searchParams.append('search', searchQuery);
        url.searchParams.append('page', currentPage.toString());
        url.searchParams.append('size', PAGE_SIZE.toString());

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Eroare conectare server!');

        const data = await response.json();
        cactiForSale = data.content;
        totalPages = data.totalPages;
        renderCacti();
        renderPagination();
    } catch (error) {
        console.error("Eroare:", error);
    }
}

// Actualizează link-ul "Cont" din header: dacă e logat, arată numele și
// transformă click-ul într-un dropdown (Vezi comenzi / Detalii cont / Delogare)
// în loc să navigheze direct spre cont.html.
function updateAccountLink() {
    const accountLink = document.getElementById('account-link') as HTMLAnchorElement | null;
    const dropdown = document.getElementById('account-dropdown');
    if (!accountLink) return;

    const name = localStorage.getItem(CUSTOMER_NAME_KEY);
    const isLoggedIn = !!name;

    accountLink.innerText = isLoggedIn ? `👤 ${name}` : `👤 Cont`;

    if (isLoggedIn) {
        // Logat: click deschide/închide dropdown-ul, nu mai navighează direct
        accountLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
    // Delogat: link-ul rămâne <a href="cont.html">, comportamentul implicit e corect
}
updateAccountLink();

// Închide dropdown-ul de cont la click oriunde altundeva pe pagină
const accountDropdown = document.getElementById('account-dropdown');
if (accountDropdown) {
    window.addEventListener('click', (event) => {
        if (accountDropdown.style.display === 'block') {
            const target = event.target as Node;
            const accountLinkEl = document.getElementById('account-link');
            if (!accountDropdown.contains(target) && target !== accountLinkEl) {
                accountDropdown.style.display = 'none';
            }
        }
    });
    accountDropdown.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

// Delogare din dropdown
const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await authFetch(`${API_BASE}/api/customers/logout`, { method: 'POST' });
        localStorage.removeItem(CUSTOMER_NAME_KEY);
        window.location.reload();
    });
}

// 2. UI Coș & Notificări
function updateCartUI() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = shoppingCart.length.toString();
    }
    saveCartToStorage();
    renderCartItems();
}

function showToast(message: string) {
    const container = document.getElementById('toast-container');
    if (!container) return;

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

// 3. Randare Sidebar — toggle Plantă/Semințe sus, apoi Cactuși/Suculente expandabile cu genurile lor
async function fetchAndRenderCategories() {
    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        allCategories = await response.json();
        renderSidebar();
    } catch (error) {
        console.error("Eroare la categorii:", error);
    }
}

function renderSidebar() {
    const container = document.getElementById('sidebar-categories-list');
    if (!container) return;

    let html = "";

    // --- Toggle Plantă / Semințe (nivelul de sus) ---
    html += `<div style="display: flex; gap: 8px; margin-bottom: 15px;">`;
    for (const type of PRODUCT_TYPES) {
        const isActive = selectedProductType === type;
        html += `
            <button class="product-type-btn" data-type="${escapeHtml(type)}"
                style="flex: 1; background: ${isActive ? '#FF9800' : 'transparent'}; color: ${isActive ? '#fdf2b8' : '#2f694b'};
                       border: 2px solid #FF9800; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                ${escapeHtml(type)}
            </button>
        `;
    }
    html += `</div>`;

    for (const main of MAIN_CATEGORIES) {
        const isMainActive = selectedMainCategory === main;
        const isExpanded = expandedMainCategory === main;
        const subcats = allCategories.filter(c => c.mainCategory === main);

        // Butonul categoriei principale (click = selectează + expandează/restrânge)
        html += `
            <button class="main-cat-btn" data-main="${escapeHtml(main)}"
                style="background: ${isMainActive ? '#2f694b' : 'transparent'}; color: ${isMainActive ? '#fdf2b8' : '#2f694b'};
                       border: 2px solid #2f694b; padding: 10px; border-radius: 5px; cursor: pointer;
                       font-weight: bold; text-align: left; display: flex; justify-content: space-between; align-items: center;">
                <span>${escapeHtml(main)}</span>
                <span>${isExpanded ? '▾' : '▸'}</span>
            </button>
        `;

        // Subcategoriile — vizibile doar dacă secțiunea e expandată
        if (isExpanded) {
            html += `<div style="display: flex; flex-direction: column; gap: 6px; margin: 4px 0 8px 15px;">`;

            const isAllActive = isMainActive && selectedSubCategory === 'Toți';
            html += `
                <button class="sub-cat-btn" data-main="${escapeHtml(main)}" data-sub="Toți"
                    style="background: ${isAllActive ? '#2f694b' : 'transparent'}; color: ${isAllActive ? '#fdf2b8' : '#2f694b'};
                           border: 1px solid #2f694b; padding: 8px; border-radius: 5px; cursor: pointer;
                           font-weight: normal; text-align: left; font-size: 0.9em;">
                    Toate
                </button>
            `;

            if (subcats.length === 0) {
                html += `<span style="color: #999; font-style: italic; font-size: 0.85em; padding: 4px;">Momentan nimic aici</span>`;
            } else {
                for (const sub of subcats) {
                    const isSubActive = isMainActive && selectedSubCategory === sub.name;
                    html += `
                        <button class="sub-cat-btn" data-main="${escapeHtml(main)}" data-sub="${escapeHtml(sub.name)}"
                            style="background: ${isSubActive ? '#2f694b' : 'transparent'}; color: ${isSubActive ? '#fdf2b8' : '#2f694b'};
                                   border: 1px solid #2f694b; padding: 8px; border-radius: 5px; cursor: pointer;
                                   font-weight: normal; text-align: left; font-size: 0.9em;">
                            ${escapeHtml(sub.name)}
                        </button>
                    `;
                }
            }

            html += `</div>`;
        }
    }

    container.innerHTML = html;

    // Click pe Plantă/Semințe -> schimbă tipul de produs, păstrează gen/categorie selectate
    document.querySelectorAll('.product-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedProductType = (e.currentTarget as HTMLButtonElement).getAttribute('data-type') || "Plantă";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });

    // Click pe categorie principală -> selectează + expandează secțiunea (sau o restrânge dacă era deja deschisă)
    document.querySelectorAll('.main-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const main = (e.currentTarget as HTMLButtonElement).getAttribute('data-main') || "Cactuși";

            if (expandedMainCategory === main) {
                expandedMainCategory = ""; // restrânge dacă era deja deschisă
            } else {
                expandedMainCategory = main;
            }

            selectedMainCategory = main;
            selectedSubCategory = "Toți";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });

    // Click pe subcategorie -> selectează gen specific + închide sidebar-ul
    document.querySelectorAll('.sub-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            selectedMainCategory = target.getAttribute('data-main') || "Cactuși";
            selectedSubCategory = target.getAttribute('data-sub') || "Toți";
            currentPage = 0;
            renderSidebar();
            fetchCacti();
            closeSidebar();
        });
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
    if (!container) return;

    let htmlContent = "";

    if (cactiForSale.length === 0) {
        htmlContent = `<p style="grid-column: span 3; color: red; font-size: 1.2em;">Nu am găsit niciun cactus conform căutării.</p>`;
    } else {
        for (let cactus of cactiForSale) {
            // Categoria acum are bordură verde și text verde, fără fundal plin
            const categoryTag = `<span style="border: 1px solid #2f694b; color: #2f694b; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">${escapeHtml(cactus.category)}</span>`;
            const validImage = cactus.imageUrl ? cactus.imageUrl : "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";

            htmlContent += `
                <div style="border: 2px solid #2f694b; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background-color: transparent;">
                    <div>
                        <img src="${escapeHtml(validImage)}" alt="${escapeHtml(cactus.name)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                        ${categoryTag}
                        <h2 style="color: #2f694b; margin-top: 10px;">🌵 ${escapeHtml(cactus.name)}</h2>
                        <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.price} RON</span></p>
                        <p style="color: ${cactus.stock > 0 ? '#2f694b' : '#d32f2f'}; font-weight: bold; font-size: 0.9em;">
                            ${cactus.stock > 0 ? `${cactus.stock} exemplare rămase` : 'Stoc epuizat'}
                        </p>
                        <p><em>${escapeHtml(cactus.description)}</em></p>
                    </div>
                    ${cactus.stock > 0
                ? `<button class="add-to-cart-btn" data-id="${cactus.id}" style="background-color: #2f694b; color: #fdf2b8; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; font-weight: bold;">
                            Adaugă în coș
                          </button>`
                : `<button disabled style="background-color: #999; color: white; padding: 10px; border: none; border-radius: 4px; width: 100%; margin-top: 15px; font-weight: bold; cursor: not-allowed;">
                            Stoc epuizat
                          </button>`
            }
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
                const alreadyInCart = shoppingCart.filter(c => c.id === cactusId).length;
                if (alreadyInCart >= cactusToAdd.stock) {
                    showToast(`⚠️ Nu mai sunt suficiente exemplare din ${cactusToAdd.name}!`);
                    return;
                }
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

    if (!cartItemsContainer || !cartTotalElement) return;

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
                <span>🌵 ${escapeHtml(item.name)}</span>
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

            const btn = event.target as HTMLButtonElement;
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
            const target = event.target as Node;
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

    submitOrderBtn.addEventListener('click', async () => {
        const nameInput = (document.getElementById('customer-name') as HTMLInputElement).value.trim();
        const emailInput = (document.getElementById('customer-email') as HTMLInputElement).value.trim();
        const addressInput = (document.getElementById('customer-address') as HTMLInputElement).value.trim();

        if (!nameInput || !emailInput || !addressInput) {
            alert("Te rog să completezi numele, emailul și adresa de livrare!");
            return;
        }

        // NU mai trimitem totalPrice sau purchasedItems calculate în browser —
        // serverul nu are încredere în ele. Trimitem doar ID-urile produselor
        // din coș; serverul calculează totalul real din baza de date.
        const cactusIds = shoppingCart.map(item => item.id);

        const newOrder = {
            customerName: nameInput,
            email: emailInput,
            address: addressInput,
            cactusIds: cactusIds
        };

        try {
            const response = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });

            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg || "Eroare la procesarea comenzii.");
            }

            const savedOrder = await response.json();

            shoppingCart = [];
            updateCartUI();

            (document.getElementById('customer-name') as HTMLInputElement).value = "";
            (document.getElementById('customer-email') as HTMLInputElement).value = "";
            (document.getElementById('customer-address') as HTMLInputElement).value = "";
            checkoutForm.style.display = 'none';

            // Afișăm confirmarea cu nr. comandă + detaliile de plată prin transfer bancar
            const confirmationDiv = document.getElementById('order-confirmation');
            if (confirmationDiv) {
                confirmationDiv.style.display = 'block';
                confirmationDiv.innerHTML = `
                    <p style="color: #2f694b; font-weight: bold;">🎉 Comanda a fost plasată!</p>
                    <p><strong>Codul comenzii:</strong> <code style="background: #e8f5e9; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; word-break: break-all;">${escapeHtml(savedOrder.orderToken)}</code></p>
                    <p>Notează acest cod — ai nevoie de el ca să verifici statusul mai târziu.</p>
                    <p style="margin-top: 10px;"><strong>Total de plată: ${savedOrder.totalPrice} RON</strong></p>
                    <div style="background: #fdf2b8; border: 1px solid #2f694b; border-radius: 4px; padding: 10px; margin-top: 10px;">
                        <p style="margin: 0 0 5px 0; font-weight: bold;">Plată prin transfer bancar:</p>
                        <p style="margin: 2px 0;">IBAN: ${escapeHtml(BANK_TRANSFER_INFO.iban)}</p>
                        <p style="margin: 2px 0;">Bancă: ${escapeHtml(BANK_TRANSFER_INFO.bank)}</p>
                        <p style="margin: 2px 0;">Titular: ${escapeHtml(BANK_TRANSFER_INFO.holder)}</p>
                        <p style="margin: 8px 0 0 0; font-style: italic;">Menționează codul comenzii la detalii transfer.</p>
                    </div>
                    <p style="margin-top: 10px;">Comanda ta va apărea ca „plătită" după ce confirmăm transferul.
                       Poți verifica oricând statusul pe pagina <a href="verifica-comanda.html" style="color: #2f694b; font-weight: bold;">Verifică Comanda</a>.</p>
                `;
            }

            checkoutBtn.style.display = 'block';
        } catch (error: any) {
            console.error(error);
            alert(error.message || "A apărut o eroare la salvarea comenzii.");
        }
    });
}

// 8. Paginare
function renderPagination() {
    let container = document.getElementById('pagination-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination-container';
        container.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 30px; margin-bottom: 20px;';
        const cactiList = document.getElementById('cacti-list');
        if (cactiList && cactiList.parentNode) {
            cactiList.parentNode.insertBefore(container, cactiList.nextSibling);
        }
    }

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 0 ? 'disabled' : ''}
        style="padding: 8px 15px; border: 2px solid #2f694b; border-radius: 5px; background: ${currentPage === 0 ? '#e0e0e0' : 'transparent'}; color: #2f694b; font-weight: bold; cursor: ${currentPage === 0 ? 'not-allowed' : 'pointer'};">
        ◀ Înapoi
    </button>`;

    html += `<span style="color: #2f694b; font-weight: bold;">Pagina ${currentPage + 1} din ${totalPages}</span>`;

    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages - 1 ? 'disabled' : ''}
        style="padding: 8px 15px; border: 2px solid #2f694b; border-radius: 5px; background: ${currentPage >= totalPages - 1 ? '#e0e0e0' : 'transparent'}; color: #2f694b; font-weight: bold; cursor: ${currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'};">
        Înainte ▶
    </button>`;

    container.innerHTML = html;

    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            if (target.disabled) return;
            currentPage = Number(target.getAttribute('data-page'));
            fetchCacti();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 9. Căutare (Apelează Java automat)
const searchBar = document.getElementById('search-bar') as HTMLInputElement;
if (searchBar) {
    searchBar.addEventListener('input', (event) => {
        searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
        currentPage = 0;
        fetchCacti();
    });
}

// 9. Inițializare
fetchCacti();
updateCartUI();
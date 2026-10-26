// Shop-only controls are initialized before catalog elements are used.
initCompactShopControls();

// Interfetele Cactus si Category vin din shared.ts.

let cactiForSale: Cactus[] = [];
let allCategories: Category[] = [];
let selectedProductType: string = "";
let selectedMainCategory: string = "";
let selectedSubCategory: string = "Toți";
let expandedMainCategory: string = "";
let searchQuery: string = "";
let currentPage: number = 0;
let totalPages: number = 0;
let totalProducts = 0;
const PAGE_SIZE: number = 20;

let shoppingCart = loadCartFromStorage();
let catalogRequestId = 0;

async function fetchCacti() {
    renderActiveFilters();

    const requestId = ++catalogRequestId;
    const count = document.getElementById('products-count');
    if (count) count.textContent = 'Se încarcă…';

    const container = document.getElementById('cacti-list');

    if (container) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2em; color:#2f694b;"></i>
                <p style="color:#666; margin-top:10px;">Se încarcă produsele...</p>
            </div>`;
    }

    try {
        const params = new URLSearchParams();
        params.append('productType', selectedProductType);
        params.append('mainCategory', selectedMainCategory);
        params.append('category', selectedSubCategory);
        params.append('search', searchQuery);

        const priceMin = (document.getElementById('price-min') as HTMLInputElement)?.value;
        const priceMax = (document.getElementById('price-max') as HTMLInputElement)?.value;

        if (priceMin) params.append('priceMin', priceMin);
        if (priceMax) params.append('priceMax', priceMax);

        params.append('page', currentPage.toString());
        params.append('size', PAGE_SIZE.toString());
        params.append('sort', currentSort);

        if (currentSort === 'favorites') {
            params.append('ids', wishlist.join(','));
        }

        const response = await fetch(`${API_BASE}/api/cacti?${params.toString()}`);
        if (!response.ok) throw new Error('Eroare conectare server!');

        const data = await response.json();
        if (requestId !== catalogRequestId) return;

        cactiForSale = data.content;
        totalPages = data.totalPages;
        totalProducts = data.totalElements ?? cactiForSale.length;

        renderCacti();
        renderPagination();
    } catch (error) {
        if (requestId !== catalogRequestId) return;

        console.error("Eroare:", error);
        if (count) count.textContent = 'Produsele nu au putut fi încărcate';

        if (container) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2em; color:#d32f2f;"></i>
                    <p style="color:#d32f2f; margin-top:10px;">Nu am putut încărca produsele.</p>
                    <button onclick="fetchCacti()" style="margin-top:10px; padding:8px 20px;
                        background:#2f694b; color:#fdf2b8; border:none; border-radius:6px;
                        cursor:pointer; font-weight:bold;">
                        <i class="fa-solid fa-rotate-right"></i> Încearcă din nou
                    </button>
                </div>`;
        }
    }
}

function updateCartUI(persist = true): boolean {
    const saved = !persist || saveCartToStorage(shoppingCart);
    if (!saved) shoppingCart = loadCartFromStorage();

    const cartCountElement = document.getElementById('cart-count');

    if (cartCountElement) {
        cartCountElement.innerText = shoppingCart.length.toString();
    }

    const cartBtn = document.getElementById('cart-button');

    if (cartBtn) {
        cartBtn.style.transform = 'scale(1.15)';
        cartBtn.style.transition = 'transform 0.15s ease';
        setTimeout(() => { cartBtn.style.transform = 'scale(1)'; }, 200);
    }

    renderCartItems();
    return saved;
}

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

    let html = `<div style="display:flex; gap:8px; margin-bottom:15px;">`;

    for (const type of PRODUCT_TYPES) {
        const isActive = selectedProductType === type;

        html += `
            <button class="product-type-btn" data-type="${escapeHtml(type)}"
                style="flex:1; background:${isActive ? '#FF9800' : 'transparent'};
                color:${isActive ? '#fdf2b8' : '#2f694b'};
                border:2px solid #FF9800; padding:10px; border-radius:5px;
                cursor:pointer; font-weight:bold;">
                ${escapeHtml(type)}
            </button>`;
    }

    html += `</div>`;

    for (const main of MAIN_CATEGORIES) {
        const isMainActive = selectedMainCategory === main;
        const isExpanded = expandedMainCategory === main;
        const subcats = allCategories
            .filter(c => c.mainCategory === main)
            .sort((a, b) => a.name.localeCompare(b.name));

        html += `
            <button class="main-cat-btn" data-main="${escapeHtml(main)}"
                style="background:${isMainActive ? '#2f694b' : 'transparent'};
                color:${isMainActive ? '#fdf2b8' : '#2f694b'};
                border:2px solid #2f694b; padding:10px; border-radius:5px;
                cursor:pointer; font-weight:bold; text-align:left;
                display:flex; justify-content:space-between; align-items:center;">
                <span>${escapeHtml(main)}</span>
                <span>${isExpanded ? '▾' : '▸'}</span>
            </button>`;

        if (isExpanded) {
            html += `<div style="display:flex; flex-direction:column; gap:6px; margin:4px 0 8px 15px;">`;

            const isAllActive = isMainActive && selectedSubCategory === 'Toți';

            html += `
                <button class="sub-cat-btn" data-main="${escapeHtml(main)}" data-sub="Toți"
                    style="background:${isAllActive ? '#2f694b' : 'transparent'};
                    color:${isAllActive ? '#fdf2b8' : '#2f694b'};
                    border:1px solid #2f694b; padding:8px; border-radius:5px;
                    cursor:pointer; font-weight:normal; text-align:left; font-size:0.9em;">
                    Toate
                </button>`;

            if (subcats.length === 0) {
                html += `<span style="color:#999; font-style:italic; font-size:0.85em; padding:4px;">Momentan nimic aici</span>`;
            } else {
                for (const sub of subcats) {
                    const isSubActive = isMainActive && selectedSubCategory === sub.name;

                    html += `
                        <button class="sub-cat-btn"
                            data-main="${escapeHtml(main)}"
                            data-sub="${escapeHtml(sub.name)}"
                            style="background:${isSubActive ? '#2f694b' : 'transparent'};
                            color:${isSubActive ? '#fdf2b8' : '#2f694b'};
                            border:1px solid #2f694b; padding:8px; border-radius:5px;
                            cursor:pointer; font-weight:normal; text-align:left; font-size:0.9em;">
                            ${escapeHtml(sub.name)}
                        </button>`;
                }
            }

            html += `</div>`;
        }
    }

    container.innerHTML = html;

    document.querySelectorAll('.product-type-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            selectedProductType =
                (event.currentTarget as HTMLButtonElement).getAttribute('data-type') || "Plante";

            currentPage = 0;
            renderSidebar();
            fetchCacti();
        });
    });

    document.querySelectorAll('.main-cat-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const main =
                (event.currentTarget as HTMLButtonElement).getAttribute('data-main') || "Cactuși";

            expandedMainCategory = expandedMainCategory === main ? "" : main;
            selectedMainCategory = main;
            selectedSubCategory = "Toți";
            currentPage = 0;

            renderSidebar();
            fetchCacti();
        });
    });

    document.querySelectorAll('.sub-cat-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const target = event.currentTarget as HTMLButtonElement;
            selectedMainCategory = target.getAttribute('data-main') || "Cactuși";
            selectedSubCategory = target.getAttribute('data-sub') || "Toți";
            currentPage = 0;

            renderSidebar();
            fetchCacti();
            closeSidebar();
        });
    });
}

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.style.transform = "translateX(-100%)";
        sidebar.style.visibility = "hidden";
        sidebarOverlay.style.display = "none";
        menuBtn?.setAttribute("aria-expanded", "false");
        menuBtn?.focus();
    }
}

if (menuBtn && sidebarOverlay && closeSidebarBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.style.transform = "translateX(0)";
        sidebar.style.visibility = "visible";
        sidebarOverlay.style.display = "block";
        menuBtn.setAttribute("aria-expanded", "true");
        closeSidebarBtn.focus();
    });

    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar?.style.visibility === 'visible') {
        closeSidebar();
    }
});

fetchAndRenderCategories();

type ViewMode = 'grid' | 'compact' | 'list';
const VIEW_MODE_KEY = 'cactusViewMode';
let viewMode: ViewMode = (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'grid';

const viewTogglesContainer = document.getElementById('view-toggles');

if (viewTogglesContainer) {
    const views = [
        { key: 'grid', icon: 'fa-table-cells-large', title: 'Grilă normală' },
        { key: 'compact', icon: 'fa-grip', title: 'Grilă compactă' },
        { key: 'list', icon: 'fa-list', title: 'Listă' }
    ];

    viewTogglesContainer.innerHTML = views.map(view => `
        <button class="view-toggle-btn" data-view="${view.key}" title="${view.title}"
            style="background:transparent; border:2px solid #2f694b; color:#2f694b;
            padding:8px 12px; border-radius:6px; cursor:pointer; font-size:16px;">
            <i class="fa-solid ${view.icon}"></i>
        </button>`).join('');
}

function applyViewMode() {
    document.body.classList.remove('view-grid', 'view-compact', 'view-list');
    document.body.classList.add(`view-${viewMode}`);

    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-view') === viewMode;
        (btn as HTMLElement).style.backgroundColor = isActive ? '#2f694b' : 'transparent';
        (btn as HTMLElement).style.color = isActive ? '#fdf2b8' : '#2f694b';
    });
}

document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        viewMode = btn.getAttribute('data-view') as ViewMode;
        saveLocalValue(VIEW_MODE_KEY, viewMode);
        applyViewMode();
    });
});

applyViewMode();

let currentSort = 'name-asc';
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;

if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        currentPage = 0;
        fetchCacti();
    });
}

function renderCacti() {
    const container = document.getElementById('cacti-list');
    if (!container) return;

    const countEl = document.getElementById('products-count');
    let htmlContent = "";

    if (cactiForSale.length === 0) {
        if (countEl) countEl.innerText = '0 produse';

        htmlContent = `
            <p class="catalog-empty" role="status">
                Nu am găsit niciun produs conform căutării.
            </p>`;
    } else {
        if (countEl) {
            const pageInfo =
                totalPages > 1 ? ` (pagina ${currentPage + 1} din ${totalPages})` : '';

            countEl.innerText =
                `${cactiForSale.length} din ${totalProducts} ${totalProducts === 1 ? 'produs' : 'produse'}${pageInfo}`;
        }

        htmlContent = cactiForSale.map(cactus => renderProductCard(cactus, isWishlisted(cactus.id))).join('');
    }

    container.innerHTML = htmlContent;
    bindProductCards(container, cactiForSale);
}

function bindProductCards(container: HTMLElement, products: Cactus[]) {
    container.querySelectorAll('.cactus-image').forEach(img => {
        (img as HTMLElement).style.cursor = 'zoom-in';

        img.addEventListener('click', event => {
            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img') as HTMLImageElement;

            if (modal && zoomImg) {
                event.preventDefault();
                zoomImg.src = (img as HTMLImageElement).src;
                modal.style.display = 'flex';
                (img.closest('a') as HTMLElement | null)?.focus();
                modal.dispatchEvent(new Event('zoom-open'));
            }
        });
    });

    container.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            const src = (event.target as HTMLElement)
                .closest('[data-img]')?.getAttribute('data-img');

            const modal = document.getElementById('zoom-modal');
            const zoomImg = document.getElementById('zoom-img') as HTMLImageElement;

            if (modal && zoomImg && src) {
                zoomImg.src = src;
                modal.style.display = 'flex';
                (btn as HTMLElement).focus();
                modal.dispatchEvent(new Event('zoom-open'));
            }
        });
    });

    container.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const id = Number(
                (event.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id')
            );

            if (!id) return;

            toggleWishlist(id);

            const liked = isWishlisted(id);
            document.querySelectorAll<HTMLButtonElement>(`.wishlist-btn[data-id="${id}"]`).forEach(heart => {
                heart.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>`;
                heart.setAttribute('aria-pressed', String(liked));
            });

            if (currentSort === 'favorites') {
                currentPage = 0;
                fetchCacti();
            }
        });
    });

    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', event => {
            const clickedButton = event.currentTarget as HTMLButtonElement;
            const cactusId = Number(clickedButton.getAttribute('data-id'));
            const cactusToAdd = products.find(c => c.id === cactusId);

            if (!cactusToAdd) return;

            shoppingCart = loadCartFromStorage();
            const alreadyInCart = shoppingCart.filter(c => c.id === cactusId).length;

            if (alreadyInCart >= cactusToAdd.stock) {
                showToast(`Nu mai sunt suficiente exemplare din ${cactusToAdd.name}!`);
                return;
            }

            shoppingCart.push(cactusToAdd);
            if (!updateCartUI()) return;

            showToast(`${cactusToAdd.name} a fost adăugat în coș!`);
        });
    });
}

const pendingCartAdds = new Set<number>();

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer || !cartTotalElement) return;

    const focused = document.activeElement as HTMLElement | null;
    const focusedId = focused?.getAttribute('data-id');
    const focusedClass = ['cart-minus-btn', 'cart-plus-btn', 'cart-remove-btn']
        .find(name => focused?.classList.contains(name));

    const focusSelector =
        focusedId && focusedClass && cartItemsContainer.contains(focused)
            ? `.${focusedClass}[data-id="${Number(focusedId)}"]`
            : null;

    if (shoppingCart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <i class="fa-solid fa-cart-shopping" style="font-size:2em; color:#ccc;"></i>
                <p style="color:#999; margin-top:8px;">
                    Coșul e gol. Explorează
                    <a href="shop.html" style="color:#2f694b; font-weight:bold;">magazinul</a>!
                </p>
            </div>`;

        cartTotalElement.innerText = formatPrice(0);
        if (focusSelector) document.getElementById('cart-button')?.focus();
        return;
    }

    const grouped = groupCartItems(shoppingCart);

    let htmlContent = "";
    let totalPrice = 0;

    grouped.forEach(({ item, qty }) => {
        const lineTotal = Math.round(item.price * 100) * qty;
        totalPrice += lineTotal;

        htmlContent += `
            <div style="display:flex; justify-content:space-between; align-items:center;
                margin-bottom:8px; font-size:0.9em; border-bottom:1px dashed #eee; padding-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <i class="fa-solid fa-leaf" style="color:#2f694b; margin-right:4px;"></i>
                    <span style="font-weight:600;">${escapeHtml(item.name)}</span> ${hybridBadge(item)}
                </div>
                <div style="display:flex; align-items:center; gap:6px; white-space:nowrap;">
                    <button class="cart-minus-btn" data-id="${item.id}"
                        style="width:26px; height:26px; border:1px solid #2f694b;
                        background:transparent; border-radius:4px; cursor:pointer;
                        color:#2f694b; font-weight:bold; font-size:1em;">−</button>
                    <span style="min-width:20px; text-align:center; font-weight:bold;">${qty}</span>
                    <button class="cart-plus-btn" data-id="${item.id}"
                        style="width:26px; height:26px; border:1px solid #2f694b;
                        background:transparent; border-radius:4px; cursor:pointer;
                        color:#2f694b; font-weight:bold; font-size:1em;">+</button>
                    <strong style="min-width:55px; text-align:right;">${formatPrice(lineTotal / 100)}</strong>
                    <button class="cart-remove-btn" data-id="${item.id}"
                        style="background:#d32f2f; color:white; border:none; border-radius:4px;
                        padding:2px 6px; cursor:pointer; font-size:0.8em;" title="Elimină tot">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
    });

    cartItemsContainer.innerHTML = htmlContent;
    cartTotalElement.innerText = formatPrice(totalPrice / 100);

    if (focusSelector) {
        const next = cartItemsContainer.querySelector<HTMLElement>(focusSelector)
            || cartItemsContainer.querySelector<HTMLElement>('button')
            || document.getElementById('cart-button');

        next?.focus();
    }

    cartItemsContainer.querySelectorAll('.cart-minus-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            event.stopPropagation();

            const id = Number(
                (event.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id')
            );

            shoppingCart = loadCartFromStorage();
            const idx = shoppingCart.findIndex(c => c.id === id);

            if (idx !== -1) {
                shoppingCart.splice(idx, 1);
                updateCartUI();
            }
        });
    });

    cartItemsContainer.querySelectorAll('.cart-plus-btn').forEach(btn => {
        btn.addEventListener('click', async event => {
            event.stopPropagation();

            const id = Number(btn.getAttribute('data-id'));
            shoppingCart = loadCartFromStorage();

            const item = shoppingCart.find(c => c.id === id);
            if (!item || pendingCartAdds.has(id)) return;

            pendingCartAdds.add(id);
            btn.setAttribute('aria-busy', 'true');

            try {
                const response = await fetch(`${API_BASE}/api/cacti/${id}`);

                if (!response.ok) {
                    throw new Error('Nu am putut verifica stocul. Reîncearcă.');
                }

                const fresh = await response.json();
                shoppingCart = loadCartFromStorage();

                if (!shoppingCart.some(c => c.id === id)) return;

                if (!Number.isSafeInteger(fresh.stock) || fresh.stock < 0) {
                    throw new Error('Nu am putut verifica stocul. Reîncearcă.');
                }

                const qty = shoppingCart.filter(c => c.id === id).length;

                if (fresh.active === false || qty >= fresh.stock) {
                    showToast('Stoc insuficient pentru încă o bucată.');
                    return;
                }

                shoppingCart.push(item);
                updateCartUI();
            } catch {
                showToast('Nu am putut verifica stocul. Reîncearcă.');
            } finally {
                pendingCartAdds.delete(id);
                btn.removeAttribute('aria-busy');
            }
        });
    });

    cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            event.stopPropagation();

            const id = Number(
                (event.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id')
            );

            shoppingCart = loadCartFromStorage().filter(c => c.id !== id);
            updateCartUI();
        });
    });
}

const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');

if (cartButton && cartModal) {
    cartButton.addEventListener('click', event => {
        event.stopPropagation();

        cartModal.style.display =
            cartModal.style.display === "none" ? "block" : "none";

        cartButton.setAttribute(
            "aria-expanded",
            String(cartModal.style.display === "block")
        );
    });

    window.addEventListener('click', event => {
        if (cartModal.style.display !== "block") return;

        const target = event.target as Node;

        if (!cartModal.contains(target) && !cartButton.contains(target)) {
            cartModal.style.display = "none";
            cartButton.setAttribute("aria-expanded", "false");
        }
    });

    cartModal.addEventListener('click', event => {
        event.stopPropagation();
    });
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && cartModal?.style.display === 'block') {
        cartModal.style.display = 'none';
        cartButton?.setAttribute('aria-expanded', 'false');
        cartButton?.focus();
    }
});

const checkoutBtn = document.getElementById('checkout-btn');

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (shoppingCart.length === 0) {
            showToast('Coșul este gol!');
            return;
        }

        window.location.href = 'checkout.html';
    });
}

function renderPagination() {
    let container = document.getElementById('pagination-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination-container';
        container.style.cssText =
            'display:flex; justify-content:center; align-items:center; gap:10px; margin-top:30px; margin-bottom:20px;';

        const cactiList = document.getElementById('cacti-list');

        if (cactiList?.parentNode) {
            cactiList.parentNode.insertBefore(container, cactiList.nextSibling);
        }
    }

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="page-btn" data-page="${currentPage - 1}"
            ${currentPage === 0 ? 'disabled' : ''}
            style="padding:8px 15px; border:2px solid #2f694b; border-radius:5px;
            background:${currentPage === 0 ? '#e0e0e0' : 'transparent'};
            color:#2f694b; font-weight:bold;
            cursor:${currentPage === 0 ? 'not-allowed' : 'pointer'};">
            ◀ Înapoi
        </button>
        <span style="color:#2f694b; font-weight:bold;">
            Pagina ${currentPage + 1} din ${totalPages}
        </span>
        <button class="page-btn" data-page="${currentPage + 1}"
            ${currentPage >= totalPages - 1 ? 'disabled' : ''}
            style="padding:8px 15px; border:2px solid #2f694b; border-radius:5px;
            background:${currentPage >= totalPages - 1 ? '#e0e0e0' : 'transparent'};
            color:#2f694b; font-weight:bold;
            cursor:${currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'};">
            Înainte ▶
        </button>`;

    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', event => {
            const target = event.currentTarget as HTMLButtonElement;
            if (target.disabled) return;

            currentPage = Number(target.getAttribute('data-page'));
            fetchCacti();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

const searchBar = document.getElementById('search-bar') as HTMLInputElement;
let searchTimeout: ReturnType<typeof setTimeout>;

if (searchBar) {
    searchBar.addEventListener('input', event => {
        catalogRequestId++;
        searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
        currentPage = 0;

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => fetchCacti(), 300);
    });
}

let priceTimeout: ReturnType<typeof setTimeout>;
const priceMinInput = document.getElementById('price-min');
const priceMaxInput = document.getElementById('price-max');

[priceMinInput, priceMaxInput].forEach(input => {
    input?.addEventListener('input', () => {
        catalogRequestId++;
        currentPage = 0;

        clearTimeout(priceTimeout);
        priceTimeout = setTimeout(() => fetchCacti(), 500);
    });
});

function renderActiveFilters() {
    const toolbar = document.querySelector('.catalog-toolbar');
    if (!toolbar) return;

    let chips = document.getElementById('active-filters');

    if (!chips) {
        chips = document.createElement('div');
        chips.id = 'active-filters';
        chips.setAttribute('aria-label', 'Filtre active');
        toolbar.after(chips);
    }

    const filters: Array<{ label: string; clear: () => void }> = [];

    if (selectedProductType) {
        filters.push({
            label: selectedProductType,
            clear: () => { selectedProductType = ''; }
        });
    }

    if (selectedMainCategory) {
        filters.push({
            label: selectedMainCategory,
            clear: () => {
                selectedMainCategory = '';
                selectedSubCategory = 'Toți';
            }
        });
    }

    if (selectedSubCategory !== 'Toți') {
        filters.push({
            label: selectedSubCategory,
            clear: () => { selectedSubCategory = 'Toți'; }
        });
    }

    const categoryFilterCount = filters.length;

    if (searchQuery) {
        filters.push({
            label: `Căutare: ${searchQuery}`,
            clear: () => {
                searchQuery = '';
                searchBar.value = '';
            }
        });
    }

    const min = priceMinInput as HTMLInputElement | null;
    const max = priceMaxInput as HTMLInputElement | null;

    if (min?.value || max?.value) {
        const label = min?.value && max?.value
            ? `${formatPrice(Number(min.value))}–${formatPrice(Number(max.value))} RON`
            : min?.value
                ? `De la ${formatPrice(Number(min.value))} RON`
                : `Până la ${formatPrice(Number(max!.value))} RON`;

        filters.push({
            label,
            clear: () => {
                if (min) min.value = '';
                if (max) max.value = '';
            }
        });
    }

    if (currentSort === 'favorites') {
        filters.push({
            label: 'Favorite',
            clear: () => {
                currentSort = 'name-asc';
                sortSelect.value = currentSort;
            }
        });
    }

    chips.replaceChildren();
    chips.hidden = filters.length === 0;

    const refresh = () => {
        clearTimeout(searchTimeout);
        clearTimeout(priceTimeout);
        currentPage = 0;

        const priceDetails = document.getElementById('price-disclosure');
        const priceActive = Boolean(min?.value || max?.value);

        priceDetails?.classList.toggle('has-active-filter', priceActive);

        const label = priceDetails?.querySelector('summary span');
        if (label) label.textContent = priceActive ? 'Filtre •' : 'Filtre';

        document.getElementById('search-disclosure')
            ?.classList.toggle('has-active-filter', searchQuery !== '');

        renderSidebar();
        fetchCacti();

        const next = document.querySelector<HTMLElement>('#active-filters button')
            || document.querySelector<HTMLElement>('#price-disclosure summary');

        next?.focus();
    };

    for (const [index, filter] of filters.entries()) {
        if (index > 0 && index < categoryFilterCount) {
            const arrow = document.createElement('span');
            arrow.className = 'breadcrumb-arrow';
            arrow.textContent = '›';
            arrow.setAttribute('aria-hidden', 'true');
            chips.appendChild(arrow);
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = index < categoryFilterCount
            ? 'filter-chip breadcrumb-filter'
            : 'filter-chip';

        button.textContent = `${filter.label} ×`;
        button.setAttribute('aria-label', `Elimină filtrul ${filter.label}`);

        button.addEventListener('click', () => {
            filter.clear();
            refresh();
        });

        chips.appendChild(button);
    }

    if (filters.length) {
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'filter-reset';
        reset.textContent = 'Resetează';

        reset.addEventListener('click', () => {
            filters.forEach(filter => filter.clear());
            refresh();
        });

        chips.appendChild(reset);
    }
}

async function renderRecentlyViewed() {
    const container = document.getElementById('recent-products');
    const wrapper = document.getElementById('recently-viewed');
    if (!container || !wrapper) return;

    const ids = readStoredProductIds('recentlyViewed').slice(0, 5);
    const results = await Promise.all(ids.map(async id => {
        try {
            const response = await fetch(`${API_BASE}/api/cacti/${id}`);
            if (!response.ok) return null;
            const product: Cactus = await response.json();
            return product && product.id === id && product.active !== false ? product : null;
        } catch {
            return null;
        }
    }));
    const products = results.filter((product): product is Cactus => product !== null);
    container.innerHTML = products.map(product => renderProductCard(product, isWishlisted(product.id))).join('');
    bindProductCards(container, products);
    wrapper.hidden = products.length === 0;
}

renderRecentlyViewed();
initImageZoom();

window.addEventListener('storage', event => {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
        shoppingCart = loadCartFromStorage();
        updateCartUI(false);
    }
});

fetchCacti();
updateCartUI(false);




function initCompactShopControls() {
    const cart = document.getElementById('cart-button');

    if (cart) {
        const count = document.getElementById('cart-count');
        cart.innerHTML = '<i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>';

        if (count) {
            count.hidden = true;
            cart.appendChild(count);
        }

        cart.setAttribute('aria-label', 'Deschide coșul');
        cart.title = 'Coș';
    }

    const search = document.getElementById('search-bar') as HTMLInputElement | null;

    if (search && !document.getElementById('search-disclosure')) {
        const host = search.parentElement!;
        const header = search.closest('header');
        const actions = header?.lastElementChild;

        if (header && actions && actions !== host) {
            const toggle = document.createElement('button');
            toggle.id = 'search-disclosure';
            toggle.type = 'button';
            toggle.className = 'shop-icon-button';
            toggle.innerHTML =
                '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';
            toggle.setAttribute('aria-label', 'Caută produse');
            toggle.setAttribute('aria-controls', 'search-bar');
            toggle.title = 'Caută produse';

            actions.prepend(toggle);
            host.classList.add('compact-search-host');
            header.classList.add('compact-shop-header');
            search.setAttribute('aria-label', 'Caută produse după nume');

            const setOpen = (open: boolean) => {
                host.hidden = !open;
                toggle.setAttribute('aria-expanded', String(open));
                if (open) search.focus();
            };

            setOpen(false);

            toggle.addEventListener('click', () => {
                setOpen(Boolean(host.hidden));
            });

            search.addEventListener('input', () => {
                toggle.classList.toggle(
                    'has-active-filter',
                    search.value.trim() !== ''
                );
            });

            search.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    setOpen(false);
                    toggle.focus();
                }
            });

            document.addEventListener('click', event => {
                if (
                    !host.contains(event.target as Node) &&
                    !toggle.contains(event.target as Node)
                ) {
                    setOpen(false);
                }
            });
        }
    }

    const min = document.getElementById('price-min') as HTMLInputElement | null;
    const max = document.getElementById('price-max') as HTMLInputElement | null;

    if (min && max && !document.getElementById('price-disclosure')) {
        const fields = min.parentElement!;
        const details = document.createElement('details');

        details.id = 'price-disclosure';
        details.className = 'shop-disclosure price-disclosure';
        details.innerHTML = `
            <summary>
                <i class="fa-solid fa-sliders" aria-hidden="true"></i>
                <span>Filtre</span>
            </summary>
        `;

        const toolbar = fields.parentElement!;
        toolbar.classList.add('catalog-toolbar');
        toolbar.prepend(details);

        const sort = document.getElementById('sort-select');
        sort?.parentElement?.classList.add('catalog-sort');

        const count = document.getElementById('products-count');

        if (count) {
            count.setAttribute('role', 'status');
            count.setAttribute('aria-live', 'polite');
            details.after(count);
        }

        details.appendChild(fields);
        fields.classList.add('shop-control-panel', 'price-fields');

        min.setAttribute('aria-label', 'Preț minim în RON');
        max.setAttribute('aria-label', 'Preț maxim în RON');

        const update = () => {
            const active = min.value !== '' || max.value !== '';
            details.classList.toggle('has-active-filter', active);
            details.querySelector('summary span')!.textContent =
                active ? 'Filtre •' : 'Filtre';
        };

        min.addEventListener('input', update);
        max.addEventListener('input', update);
        update();
    }

    document.querySelectorAll<HTMLDetailsElement>('.shop-disclosure').forEach(details => {
        document.addEventListener('click', event => {
            if (details.open && !details.contains(event.target as Node)) {
                details.open = false;
            }
        });

        details.addEventListener('keydown', event => {
            if (event.key === 'Escape' && details.open) {
                details.open = false;
                details.querySelector('summary')?.focus();
            }
        });
    });
}

// Shared markup for catalog and recently viewed product cards.
function renderProductCard(cactus: Cactus, hearted = false): string {
    const validImage = cactus.imageUrl ||
        "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=400&q=80";

    const stockLabel = cactus.stock === 1
        ? '1 exemplar rămas'
        : cactus.stock > 1
            ? `${cactus.stock} exemplare rămase`
            : 'Stoc epuizat';

    return `
        <article class="cactus-card">
            <div class="card-actions">
                <button class="wishlist-btn card-action-btn"
                    data-id="${cactus.id}"
                    title="Favorite"
                    aria-label="Favorite"
                    aria-pressed="${hearted}">
                    <i class="fa-${hearted ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
                </button>
                <button class="zoom-btn card-action-btn"
                    data-img="${escapeHtml(validImage)}"
                    title="Mărește imaginea"
                    aria-label="Mărește imaginea">
                    <i class="fa-solid fa-expand" aria-hidden="true"></i>
                </button>
            </div>

            <a class="cactus-photo" href="product.html?id=${cactus.id}">
                <img loading="lazy"
                    class="cactus-image"
                    src="${escapeHtml(validImage)}"
                    alt="${escapeHtml(cactus.name)}">
            </a>

            <div class="cactus-details">
                <span class="cactus-category">${escapeHtml(cactus.category)}</span>
                ${hybridBadge(cactus)}
                <a class="cactus-name-link" href="product.html?id=${cactus.id}">
                    <h2 title="${escapeHtml(cactus.name)}">${escapeHtml(cactus.name)}</h2>
                </a>
                <p class="cactus-price">${formatPrice(cactus.price)} <span>RON</span></p>
                <p class="cactus-stock ${cactus.stock > 0 ? '' : 'is-unavailable'}">${stockLabel}</p>
            </div>

            <button class="${cactus.stock > 0 ? 'add-to-cart-btn' : 'sold-out-btn'}"
                data-id="${cactus.id}" ${cactus.stock > 0 ? '' : 'disabled'}>
                ${cactus.stock > 0 ? 'Adaugă în coș' : 'Stoc epuizat'}
            </button>
        </article>`;
}
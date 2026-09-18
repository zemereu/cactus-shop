// API_BASE, CUSTOMER_NAME_KEY, escapeHtml, authFetch vin din shared.ts

interface ReviewResponse {
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// Dacă URL-ul are ?cactusId=X, arătăm recenzii pentru acel produs.
// Altfel, recenzii generale despre magazin.
const urlParams = new URLSearchParams(window.location.search);
const cactusIdParam = urlParams.get('cactusId');
const cactusId = cactusIdParam ? Number(cactusIdParam) : null;

const titleEl = document.getElementById('reviews-title');
if (titleEl) {
    titleEl.innerText = cactusId ? 'Recenzii produs' : 'Recenzii despre magazin';
}

// starsDisplay vine din shared.ts

// --- Randare lista recenzii ---
async function loadReviews() {
    const listEl = document.getElementById('reviews-list');
    if (!listEl) return;

    listEl.innerHTML = `<div style="text-align: center; padding: 30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5em; color: #2f694b;"></i><p style="color: #666; margin-top: 8px;">Se încarcă recenziile...</p></div>`;

    const endpoint = cactusId
        ? `${API_BASE}/api/reviews/product/${cactusId}`
        : `${API_BASE}/api/reviews/general`;

    try {
        const response = await fetch(endpoint);
        const reviews: ReviewResponse[] = await response.json();

        if (reviews.length === 0) {
            listEl.innerHTML = `<p style="text-align: center; color: #999; font-style: italic;">Nicio recenzie încă. Fii primul!</p>`;
            return;
        }

        listEl.innerHTML = reviews.map(r => `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); margin-bottom: 15px;">
                <div style="color: #FF9800; font-size: 1.3em;">${starsDisplay(r.rating)}</div>
                <p style="font-style: italic; color: #333; margin: 10px 0;">${escapeHtml(r.comment)}</p>
                <p style="margin: 0; font-weight: bold; color: #2f694b;">${escapeHtml(r.customerName)}</p>
                <span style="font-size: 0.8em; color: #999;">${escapeHtml(r.createdAt)}</span>
            </div>
        `).join("");
    } catch (error) {
        console.error(error);
        listEl.innerHTML = `<p style="color: #d32f2f; text-align: center;"><i class="fa-solid fa-triangle-exclamation"></i> Nu am putut încărca recenziile.</p>`;
    }
}
loadReviews();

// --- Formular de trimitere (vizibil doar dacă e logat) ---
const formContainer = document.getElementById('review-form-container');
const loginPrompt = document.getElementById('login-prompt');

async function checkReviewAuth() {
    try {
        const response = await authFetch(`${API_BASE}/api/customers/me`);
        if (response.ok) {
            if (formContainer) formContainer.style.display = 'block';
        } else {
            if (loginPrompt) loginPrompt.style.display = 'block';
        }
    } catch {
        if (loginPrompt) loginPrompt.style.display = 'block';
    }
}
checkReviewAuth();

// --- Selector de stele ---
let selectedRating = 0;
const starElements = document.querySelectorAll('#star-picker .star');
starElements.forEach(starEl => {
    starEl.addEventListener('click', (e) => {
        selectedRating = Number((e.target as HTMLElement).getAttribute('data-value'));
        starElements.forEach((s, index) => {
            s.textContent = index < selectedRating ? '★' : '☆';
        });
    });
});

// --- Trimitere recenzie ---
const submitBtn = document.getElementById('submit-review-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        const comment = (document.getElementById('review-comment') as HTMLTextAreaElement).value.trim();
        const messageEl = document.getElementById('review-form-message');
        if (!messageEl) return;

        if (selectedRating === 0) {
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Alege o notă (click pe stele).";
            return;
        }
        if (!comment) {
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Scrie un comentariu.";
            return;
        }

        try {
            const response = await authFetch(`${API_BASE}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: selectedRating,
                    comment: comment,
                    cactusId: cactusId
                })
            });

            messageEl.style.display = 'block';
            if (response.ok) {
                messageEl.style.color = '#2f694b';
                messageEl.innerText = "Mulțumim! Recenzia ta va apărea după aprobare.";
                (document.getElementById('review-comment') as HTMLTextAreaElement).value = "";
                selectedRating = 0;
                starElements.forEach(s => s.textContent = '☆');
                setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            } else {
                const errorMsg = await response.text();
                messageEl.style.color = '#d32f2f';
                messageEl.innerText = errorMsg || "Nu am putut trimite recenzia.";
            }
        } catch (error) {
            console.error(error);
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Eroare de conexiune.";
        }
    });
}
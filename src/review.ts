// API_BASE, CUSTOMER_JWT_KEY, CUSTOMER_NAME_KEY, escapeHtml vin din shared.ts

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

function starsDisplay(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// --- Randare listă recenzii ---
async function loadReviews() {
    const listEl = document.getElementById('reviews-list');
    if (!listEl) return;

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
        listEl.innerHTML = `<p style="color: #d32f2f;">Nu am putut încărca recenziile.</p>`;
    }
}
loadReviews();

// --- Formular de trimitere (doar dacă e logat) ---
const token = localStorage.getItem(CUSTOMER_JWT_KEY);
const formContainer = document.getElementById('review-form-container');
const loginPrompt = document.getElementById('login-prompt');

if (token) {
    if (formContainer) formContainer.style.display = 'block';
} else {
    if (loginPrompt) loginPrompt.style.display = 'block';
}

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
            const response = await fetch(`${API_BASE}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(CUSTOMER_JWT_KEY)}`
                },
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
            } else {
                messageEl.style.color = '#d32f2f';
                messageEl.innerText = "Nu am putut trimite recenzia.";
            }
        } catch (error) {
            console.error(error);
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Eroare de conexiune.";
        }
    });
}
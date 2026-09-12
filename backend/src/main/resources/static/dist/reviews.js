"use strict";
// API_BASE, CUSTOMER_NAME_KEY, escapeHtml, authFetch vin din shared.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function loadReviews() {
    return __awaiter(this, void 0, void 0, function* () {
        const listEl = document.getElementById('reviews-list');
        if (!listEl)
            return;
        const endpoint = cactusId
            ? `${API_BASE}/api/reviews/product/${cactusId}`
            : `${API_BASE}/api/reviews/general`;
        try {
            const response = yield fetch(endpoint);
            const reviews = yield response.json();
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
        }
        catch (error) {
            console.error(error);
            listEl.innerHTML = `<p style="color: #d32f2f;">Nu am putut încărca recenziile.</p>`;
        }
    });
}
loadReviews();
// --- Formular de trimitere (vizibil doar dacă e logat) ---
const formContainer = document.getElementById('review-form-container');
const loginPrompt = document.getElementById('login-prompt');
function checkReviewAuth() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield authFetch(`${API_BASE}/api/customers/me`);
            if (response.ok) {
                if (formContainer)
                    formContainer.style.display = 'block';
            }
            else {
                if (loginPrompt)
                    loginPrompt.style.display = 'block';
            }
        }
        catch (_a) {
            if (loginPrompt)
                loginPrompt.style.display = 'block';
        }
    });
}
checkReviewAuth();
// --- Selector de stele ---
let selectedRating = 0;
const starElements = document.querySelectorAll('#star-picker .star');
starElements.forEach(starEl => {
    starEl.addEventListener('click', (e) => {
        selectedRating = Number(e.target.getAttribute('data-value'));
        starElements.forEach((s, index) => {
            s.textContent = index < selectedRating ? '★' : '☆';
        });
    });
});
// --- Trimitere recenzie ---
const submitBtn = document.getElementById('submit-review-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const comment = document.getElementById('review-comment').value.trim();
        const messageEl = document.getElementById('review-form-message');
        if (!messageEl)
            return;
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
            const response = yield authFetch(`${API_BASE}/api/reviews`, {
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
                document.getElementById('review-comment').value = "";
                selectedRating = 0;
                starElements.forEach(s => s.textContent = '☆');
                setTimeout(() => { window.location.href = 'index.html'; }, 3000);
            }
            else {
                const errorMsg = yield response.text();
                messageEl.style.color = '#d32f2f';
                messageEl.innerText = errorMsg || "Nu am putut trimite recenzia.";
            }
        }
        catch (error) {
            console.error(error);
            messageEl.style.display = 'block';
            messageEl.style.color = '#d32f2f';
            messageEl.innerText = "Eroare de conexiune.";
        }
    }));
}

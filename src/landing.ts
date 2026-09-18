// CUSTOMER_NAME_KEY, API_BASE, escapeHtml, authFetch, initAccountDropdown vin din shared.ts

// Cont dropdown — vine din shared.ts
initAccountDropdown();

// Încarcă primele 3 recenzii generale aprobate pe landing page
async function loadLandingReviews() {
    const container = document.getElementById('general-reviews-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE}/api/reviews/general`);
        const reviews = await response.json();

        if (reviews.length === 0) {
            container.innerHTML = `<p style="color: #fdf2b8; font-style: italic;">Nicio recenzie încă. Fii primul care lasă una!</p>`;
            return;
        }

        const topReviews = reviews.slice(0, 3);
        container.innerHTML = topReviews.map((r: any) => `
            <div style="flex: 1 1 300px; background-color: #fdf2b8; padding: 30px; border-radius: 16px; text-align: left; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                <div style="color: #FF9800; font-size: 1.5em; margin-bottom: 15px;">${'<i class="fa-solid fa-star" style="color: #FF9800;"></i>'.repeat(r.rating)}</div>
                <p style="font-style: italic; color: #333; line-height: 1.6; margin-bottom: 25px;">
                    "${escapeHtml(r.comment)}"
                </p>
                <h4 style="color: #2f694b; margin: 0; font-size: 1.1em;">- ${escapeHtml(r.customerName)}</h4>
                <span style="font-size: 0.85em; color: #666;">${escapeHtml(r.createdAt)}</span>
            </div>
        `).join("");
    } catch (error) {
        console.error("Eroare la încărcarea recenziilor:", error);
        container.innerHTML = `<p style="color: #fdf2b8;"><i class="fa-solid fa-triangle-exclamation"></i> Nu am putut încărca recenziile.</p>`;
    }
}
loadLandingReviews();
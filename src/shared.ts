// --- shared.ts ---
// Cod comun folosit atât de index.ts (magazin) cât și de admin.ts (panou admin).
// Acest fișier trebuie încărcat ÎNAINTE de index.js / admin.js în HTML,
// altfel API_BASE și escapeHtml nu vor exista încă atunci când sunt apelate.

// Adresa backend-ului. VERIFICĂ acest domeniu — trebuie să fie EXACT
// domeniul public din Railway (Settings → Networking).
const API_BASE = 'https://cactus-shop-production.up.railway.app';

// Scapă orice text ce ar putea proveni din date introduse de utilizator
// înainte de a-l pune în innerHTML (nume produs, descriere, categorie,
// nume client, adresă, etc.) — previne XSS stocat.
function escapeHtml(unsafe: string | null | undefined): string {
    if (unsafe === null || unsafe === undefined) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
"use strict";
// 2. Baza de date inițială
const cactusiDeVanzare = [
    { id: 1, nume: "Cactus Gigant Mexican", pret: 150, descriere: "Impunător, perfect pentru living.", categorie: "Gigantici" },
    { id: 2, nume: "Cactus Pufos", pret: 45, descriere: "Acoperit cu perișori albi.", categorie: "Interior" },
    { id: 3, nume: "Aloe Vera", pret: 30, descriere: "Planta medicinală esențială.", categorie: "Medicinali" },
    { id: 4, nume: "Cactus cu Flori Roz", pret: 60, descriere: "Înflorește spectaculos primăvara.", categorie: "Cu flori" },
    { id: 5, nume: "Saguaro Mic", pret: 85, descriere: "Clasicul cactus din deșert.", categorie: "Gigantici" },
    { id: 6, nume: "Echinopsis", pret: 35, descriere: "Rotund și foarte rezistent.", categorie: "Interior" }
];
// 3. Starea curentă a filtrelor
let categorieSelectata = "Toți";
let termenCautare = ""; // Adăugăm o variabilă care ține minte ce am scris în bara de căutare
// 4. Funcția care generează butoanele de sus
function afiseazaCategorii() {
    const container = document.getElementById('categorii-container');
    if (!container)
        return;
    container.innerHTML = "";
    const categoriiUnice = ["Toți", ...new Set(cactusiDeVanzare.map(c => c.categorie))];
    for (let cat of categoriiUnice) {
        const btn = document.createElement('button');
        btn.innerText = cat;
        btn.style.padding = "10px 15px";
        btn.style.marginRight = "10px";
        btn.style.border = "none";
        btn.style.borderRadius = "5px";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        if (cat === categorieSelectata) {
            btn.style.backgroundColor = "#2E7D32";
            btn.style.color = "white";
        }
        else {
            btn.style.backgroundColor = "#e0e0e0";
            btn.style.color = "black";
        }
        btn.addEventListener('click', () => {
            categorieSelectata = cat;
            afiseazaCategorii();
            afiseazaCactusi();
        });
        container.appendChild(btn);
    }
}
// 5. Funcția care desenează produsele (Acum filtrează și după CATEGORIE și după NUME)
function afiseazaCactusi() {
    const container = document.getElementById('lista-cactusi');
    if (!container)
        return;
    // Filtrăm lista de cactuși
    const cactusiFiltrati = cactusiDeVanzare.filter(cactus => {
        // Verificăm dacă se potrivește categoria
        const sePotrivesteCategoria = categorieSelectata === "Toți" || cactus.categorie === categorieSelectata;
        // Verificăm dacă numele conține textul scris în bara de căutare (transformăm totul în litere mici ca să nu conteze cum scriem)
        const sePotrivesteNumele = cactus.nume.toLowerCase().includes(termenCautare);
        // Arătăm cactusul doar dacă trece de ambele filtre
        return sePotrivesteCategoria && sePotrivesteNumele;
    });
    let continutHTML = "";
    if (cactusiFiltrati.length === 0) {
        continutHTML = `<p style="grid-column: span 3; color: red; font-size: 1.2em;">Nu am găsit niciun cactus care să se potrivească căutării tale.</p>`;
    }
    else {
        for (let cactus of cactusiFiltrati) {
            continutHTML += `
                <div style="border: 2px solid #4CAF50; padding: 15px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; background-color: white;">
                    <div>
                        <span style="background: #e8f5e9; color: #2e7d32; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">
                            ${cactus.categorie}
                        </span>
                        <h2 style="color: #2E7D32; margin-top: 10px;">🌵 ${cactus.nume}</h2>
                        <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.pret} RON</span></p>
                        <p><em>${cactus.descriere}</em></p>
                    </div>
                    <button style="background-color: #4CAF50; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 15px; font-weight: bold;">
                        Adaugă în coș
                    </button>
                </div>
            `;
        }
    }
    container.innerHTML = continutHTML;
}
// 6. Logica pentru Bara de Căutare (Așteaptă la fiecare tastă apăsată)
const searchBar = document.getElementById('search-bar');
if (searchBar) {
    searchBar.addEventListener('input', (event) => {
        // Salvăm ce s-a scris și transformăm în litere mici (toLowerCase)
        termenCautare = event.target.value.toLowerCase();
        // Redesenăm grila la fiecare literă tastată!
        afiseazaCactusi();
    });
}
// 7. Pornim site-ul
afiseazaCategorii();
afiseazaCactusi();

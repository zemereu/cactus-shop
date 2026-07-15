"use strict";
// 2. Creăm „Baza de date” (o listă/array de cactuși)
const cactusiDeVanzare = [
    {
        id: 1,
        nume: "Cactus Gigant Mexican",
        pret: 150.50,
        descriere: "Un cactus impunător, perfect pentru living."
    },
    {
        id: 2,
        nume: "Cactus Pufos (Bătrânul)",
        pret: 45.00,
        descriere: "Acoperit cu perișori albi, foarte ușor de îngrijit."
    },
    {
        id: 3,
        nume: "Aloe Vera",
        pret: 30.00,
        descriere: "Planta medicinală esențială pentru orice casă."
    }
];
// 3. Funcția care desenează cactușii pe ecran
function afiseazaCactusi() {
    // Căutăm containerul HTML pe care l-am pregătit mai devreme
    const container = document.getElementById('lista-cactusi');
    // TypeScript ne obligă să verificăm dacă acest container există cu adevărat pe site
    if (!container) {
        console.error("Eroare: Nu am găsit div-ul 'lista-cactusi' în HTML!");
        return;
    }
    // Construim o variabilă de tip text (string) în care vom stoca HTML-ul generat
    let continutHTML = "";
    // Trecem prin fiecare cactus din lista noastră
    for (let cactus of cactusiDeVanzare) {
        // Adăugăm un pic de HTML și design de bază (CSS) pentru fiecare produs
        // Atenție: Folosim backticks ( ` ) pentru a putea scrie variabile direct cu ${}
        continutHTML += `
            <div style="border: 2px solid #4CAF50; padding: 15px; margin-bottom: 15px; border-radius: 8px; max-width: 400px;">
                <h2 style="color: #2E7D32; margin-top: 0;">🌵 ${cactus.nume}</h2>
                <p><strong>Preț:</strong> <span style="color: #d32f2f; font-size: 1.2em;">${cactus.pret} RON</span></p>
                <p><em>${cactus.descriere}</em></p>
                <button style="background-color: #4CAF50; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer;">
                    Adaugă în coș
                </button>
            </div>
        `;
    }
    // Injectăm tot acest text HTML în pagină, fix în interiorul div-ului nostru!
    container.innerHTML = continutHTML;
}
// 4. Pornim funcția
afiseazaCactusi();
// 1. Căutăm butonul de adăugare din HTML
const butonAdauga = document.getElementById('buton-adauga');
// 2. Îi spunem ce să facă atunci când dăm click pe el
if (butonAdauga) {
    butonAdauga.addEventListener('click', () => {
        // 3. Citim valorile scrise în formular (HTMLInputElement ne ajută să luăm valoarea exactă)
        const numeNou = document.getElementById('input-nume').value;
        const pretNou = Number(document.getElementById('input-pret').value);
        const descriereNoua = document.getElementById('input-descriere').value;
        // Validare simplă: verificăm să nu adăugăm un cactus fără nume
        if (numeNou === "" || pretNou === 0) {
            alert("Te rog completează numele și prețul!");
            return; // Oprește funcția aici
        }
        // 4. Creăm noul obiect de tip Cactus respectând interfața ta
        const cactusNou = {
            id: cactusiDeVanzare.length + 1, // generăm un ID nou
            nume: numeNou,
            pret: pretNou,
            descriere: descriereNoua
        };
        // 5. Băgăm noul cactus în lista noastră (array)
        cactusiDeVanzare.push(cactusNou);
        // 6. Apelăm din nou funcția de afișare pentru a desena lista actualizată pe ecran!
        afiseazaCactusi();
        // Opțional: Curățăm căsuțele formularului după adăugare
        document.getElementById('input-nume').value = "";
        document.getElementById('input-pret').value = "";
        document.getElementById('input-descriere').value = "";
    });
}

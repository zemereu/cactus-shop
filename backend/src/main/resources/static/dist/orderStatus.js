"use strict";
// escapeHtml și API_BASE vin din shared.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Culoarea asociată fiecărui status, pentru claritate vizuală
function statusColor(status) {
    switch (status) {
        case "Neplătită": return "#d32f2f";
        case "Plătită - în pregătire": return "#FF9800";
        case "Expediată": return "#2f694b";
        case "Livrată": return "#2f694b";
        default: return "#555";
    }
}
const lookupBtn = document.getElementById('lookup-btn');
if (lookupBtn) {
    lookupBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderIdInput = document.getElementById('lookup-order-id').value.trim();
        const emailInput = document.getElementById('lookup-email').value.trim();
        const resultDiv = document.getElementById('lookup-result');
        if (!resultDiv)
            return;
        if (!orderIdInput || !emailInput) {
            resultDiv.innerHTML = `<p style="color: #d32f2f;">Completează ambele câmpuri.</p>`;
            return;
        }
        resultDiv.innerHTML = `<p style="color: #555;">Se verifică...</p>`;
        try {
            const url = new URL(`${API_BASE}/api/orders/lookup`);
            url.searchParams.append('orderId', orderIdInput);
            url.searchParams.append('email', emailInput);
            const response = yield fetch(url.toString());
            if (!response.ok) {
                resultDiv.innerHTML = `<p style="color: #d32f2f;">Nu am găsit nicio comandă cu aceste date. Verifică numărul comenzii și emailul.</p>`;
                return;
            }
            const order = yield response.json();
            resultDiv.innerHTML = `
                <div style="border: 1px solid #2f694b; border-radius: 4px; padding: 15px;">
                    <p style="margin: 0 0 10px 0;"><strong>Comanda #${order.id}</strong></p>
                    <p style="margin: 0 0 10px 0;">
                        Status:
                        <span style="color: ${statusColor(order.status)}; font-weight: bold;">${escapeHtml(order.status)}</span>
                    </p>
                    <p style="margin: 0 0 10px 0; color: #555;">${escapeHtml(order.purchasedItems)}</p>
                    <p style="margin: 0; font-weight: bold;">Total: ${order.totalPrice} RON</p>
                </div>
            `;
        }
        catch (error) {
            console.error(error);
            resultDiv.innerHTML = `<p style="color: #d32f2f;">A apărut o eroare. Încearcă din nou.</p>`;
        }
    }));
}

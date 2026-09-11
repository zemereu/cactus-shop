// CUSTOMER_NAME_KEY vine din shared.ts

// Dacă clientul e deja logat, afișează numele lui în loc de "Cont"
const accountLink = document.getElementById('account-link');
if (accountLink) {
    const name = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (name) {
        accountLink.innerText = `👤 ${name}`;
    }
}
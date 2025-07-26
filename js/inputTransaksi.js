import { SCRIPT_URL, parseCurrency, formatCurrency, hostList, adminList, treatmentPersonList, populateDropdown, showToast } from './utils.js';

let allTransactions = [];

function checkDuplicateCustomerToday(customerName, transactionType) {
    const today = moment().startOf('day');
    return allTransactions.some(row => 
        moment(row['Tanggal Input']).isSame(today, 'day') &&
        String(row['Nama Customer'] || '').toLowerCase() === customerName.toLowerCase() &&
        row['Jenis Transaksi'] === transactionType
    );
}

export function setupUnifiedForm(transactions) {
    allTransactions = transactions;
    const unifiedForm = document.getElementById('unifiedForm');
    if(!unifiedForm) return;

    const transactionTypeSelect = document.getElementById('transactionType');
    const penjualanFields = document.getElementById('penjualanFields');
    const salesReturnFields = document.getElementById('salesReturnFields');
    const treatmentFields = document.getElementById('treatmentFields');
    const unifiedSubmitBtn = document.getElementById('unifiedSubmitBtn');
    const salesReturnHostSelect = document.getElementById('salesReturnHost');
    const salesReturnAdminSelect = document.getElementById('salesReturnAdmin');
    const treatmentPersonSelect = document.getElementById('treatmentPerson');
    const salesReturnBackupHostContainer = document.getElementById('salesReturnBackupHostContainer');
    const salesReturnBackupAdminContainer = document.getElementById('salesReturnBackupAdminContainer');
    const treatmentBackupContainer = document.getElementById('treatmentBackupContainer');
    const salesReturnOmzetInput = document.getElementById('salesReturnOmzet');
    
    // Selalu isi ulang dropdown dengan data terbaru dari utils.js
    populateDropdown(salesReturnHostSelect, hostList);
    populateDropdown(salesReturnAdminSelect, adminList);
    populateDropdown(treatmentPersonSelect, treatmentPersonList);

    if (unifiedForm.dataset.listenerAttached) return;

    const formFields = { /* ... (sama seperti sebelumnya) ... */ };
    const allFieldsets = [penjualanFields, salesReturnFields, treatmentFields];

    transactionTypeSelect.addEventListener('change', () => { /* ... (sama) ... */ });
    salesReturnHostSelect.addEventListener('change', () => { /* ... (sama) ... */ });
    salesReturnAdminSelect.addEventListener('change', () => { /* ... (sama) ... */ });
    treatmentPersonSelect.addEventListener('change', () => { /* ... (sama) ... */ });
    salesReturnOmzetInput.addEventListener('input', (e) => e.target.value = formatCurrency(parseCurrency(e.target.value)));

    unifiedForm.addEventListener('submit', async (e) => { /* ... (logika submit tetap sama) ... */ });
    unifiedForm.dataset.listenerAttached = 'true';
}

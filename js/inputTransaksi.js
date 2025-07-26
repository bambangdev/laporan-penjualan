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

export function renderInputTransaksiHTML() {
    const page = document.getElementById('inputTransaksiPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Input Transaksi Baru</h1>
         <form id="unifiedForm" novalidate class="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
            <div class="space-y-4">
                <div>
                    <label for="transactionType" class="block text-sm font-bold text-gray-700 mb-1">Jenis Transaksi</label>
                    <select id="transactionType" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
                        <option value="" disabled selected>-- Pilih Jenis Transaksi --</option>
                        <option value="Penjualan">Penjualan</option>
                        <option value="Return">Return</option>
                        <option value="Treatment">Treatment</option>
                    </select>
                </div>
                <div id="penjualanFields" class="hidden space-y-4">
                    <div><label for="penjualanShift" class="block text-sm font-medium text-gray-700 mb-1">Shift</label><select id="penjualanShift" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"><option value="" disabled selected>-- Pilih Shift --</option><option value="Shift Pagi">Shift Pagi</option><option value="Shift Siang">Shift Siang</option></select></div>
                </div>
                <div id="salesReturnFields" class="hidden space-y-4">
                    <div><label for="salesReturnHost" class="block text-sm font-medium text-gray-700 mb-1">Nama Host</label><select id="salesReturnHost" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"><option value="" disabled selected>-- Pilih Host --</option></select></div>
                    <div id="salesReturnBackupHostContainer" class="hidden"><label for="salesReturnBackupHost" class="block text-sm font-medium text-gray-700 mb-1">Isi Nama Host Backup</label><input type="text" id="salesReturnBackupHost" placeholder="Ketik nama host pengganti" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"></div>
                    <div><label for="salesReturnAdmin" class="block text-sm font-medium text-gray-700 mb-1">Nama Admin</label><select id="salesReturnAdmin" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"><option value="" disabled selected>-- Pilih Admin --</option></select></div>
                    <div id="salesReturnBackupAdminContainer" class="hidden"><label for="salesReturnBackupAdmin" class="block text-sm font-medium text-gray-700 mb-1">Isi Nama Admin Backup</label><input type="text" id="salesReturnBackupAdmin" placeholder="Ketik nama admin pengganti" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"></div>
                    <div>
                        <label for="salesReturnCustomer" class="block text-sm font-medium text-gray-700 mb-1">Nama Customer</label>
                        <input type="text" id="salesReturnCustomer" list="customerSuggestions" placeholder="Ketik nama customer" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
                        <datalist id="customerSuggestions"></datalist>
                    </div>
                    <div><label for="salesReturnPcs" class="block text-sm font-medium text-gray-700 mb-1">Total Pcs</label><input type="number" id="salesReturnPcs" placeholder="Contoh: 50" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"></div>
                    <div><label for="salesReturnOmzet" class="block text-sm font-medium text-gray-700 mb-1">Total Omzet (Rp)</label><input type="text" id="salesReturnOmzet" placeholder="Contoh: 1.500.000" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"></div>
                </div>
                <div id="treatmentFields" class="hidden space-y-4">
                    <div><label for="treatmentPerson" class="block text-sm font-medium text-gray-700 mb-1">Nama Orang Treatment</label><select id="treatmentPerson" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"><option value="" disabled selected>-- Pilih Nama --</option></select></div>
                    <div id="treatmentBackupContainer" class="hidden"><label for="treatmentBackupPerson" class="block text-sm font-medium text-gray-700 mb-1">Isi Nama Pengganti</label><input type="text" id="treatmentBackupPerson" placeholder="Ketik nama pengganti" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"></div>
                    <div><label for="treatmentPcs" class="block text-sm font-medium text-gray-700 mb-1">Jumlah PCS di-Treatment</label><input type="number" id="treatmentPcs" placeholder="Contoh: 35" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"></div>
                </div>
            </div>
            <button type="submit" id="unifiedSubmitBtn" class="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-150 ease-in-out flex items-center justify-center mt-6"><span>Kirim Transaksi</span><div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6 ml-3 hidden"></div></button>
        </form>
    `;
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
    
    populateDropdown(salesReturnHostSelect, hostList);
    populateDropdown(salesReturnAdminSelect, adminList);
    populateDropdown(treatmentPersonSelect, treatmentPersonList);

    if (unifiedForm.dataset.listenerAttached) return;

    const formFields = { 'Penjualan': ['penjualanFields', 'salesReturnFields'], 'Return': ['salesReturnFields'], 'Treatment': ['treatmentFields'] };
    const allFieldsets = [penjualanFields, salesReturnFields, treatmentFields];

    transactionTypeSelect.addEventListener('change', () => { /* ... (logika ganti form) ... */ });
    salesReturnHostSelect.addEventListener('change', () => salesReturnBackupHostContainer.classList.toggle('hidden', salesReturnHostSelect.value !== 'Backup'));
    salesReturnAdminSelect.addEventListener('change', () => salesReturnBackupAdminContainer.classList.toggle('hidden', salesReturnAdminSelect.value !== 'Backup'));
    treatmentPersonSelect.addEventListener('change', () => treatmentBackupContainer.classList.toggle('hidden', treatmentPersonSelect.value !== 'Backup'));
    salesReturnOmzetInput.addEventListener('input', (e) => e.target.value = formatCurrency(parseCurrency(e.target.value)));

    unifiedForm.addEventListener('submit', async (e) => { /* ... (logika submit form) ... */ });
    unifiedForm.dataset.listenerAttached = 'true';
}

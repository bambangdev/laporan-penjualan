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

    transactionTypeSelect.addEventListener('change', () => {
        const selectedType = transactionTypeSelect.value;
        allFieldsets.forEach(fs => fs.classList.add('hidden'));
        if (formFields[selectedType]) {
            formFields[selectedType].forEach(fieldId => {
                document.getElementById(fieldId).classList.remove('hidden');
            });
        }
    });
    salesReturnHostSelect.addEventListener('change', () => salesReturnBackupHostContainer.classList.toggle('hidden', salesReturnHostSelect.value !== 'Backup'));
    salesReturnAdminSelect.addEventListener('change', () => salesReturnBackupAdminContainer.classList.toggle('hidden', salesReturnAdminSelect.value !== 'Backup'));
    treatmentPersonSelect.addEventListener('change', () => treatmentBackupContainer.classList.toggle('hidden', treatmentPersonSelect.value !== 'Backup'));
    salesReturnOmzetInput.addEventListener('input', (e) => e.target.value = formatCurrency(parseCurrency(e.target.value)));

    unifiedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedType = transactionTypeSelect.value;
        if (!selectedType) {
            showToast('Mohon pilih jenis transaksi.', 'error');
            return;
        }
        const btnText = unifiedSubmitBtn.querySelector('span');
        const loader = unifiedSubmitBtn.querySelector('.loader');
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        unifiedSubmitBtn.disabled = true;

        let formData = { action: 'add', transactionType: selectedType };
        let customerName = '';

        if (selectedType === 'Penjualan' || selectedType === 'Return') {
            customerName = document.getElementById('salesReturnCustomer').value.trim();
            const finalHost = salesReturnHostSelect.value === 'Backup' ? document.getElementById('salesReturnBackupHost').value.trim() : salesReturnHostSelect.value;
            const finalAdmin = salesReturnAdminSelect.value === 'Backup' ? document.getElementById('salesReturnBackupAdmin').value.trim() : salesReturnAdminSelect.value;
            Object.assign(formData, {
                shift: selectedType === 'Penjualan' ? document.getElementById('penjualanShift').value : '',
                host: finalHost, adminName: finalAdmin, customerName: customerName,
                totalPcs: document.getElementById('salesReturnPcs').value,
                totalOmzet: parseCurrency(salesReturnOmzetInput.value)
            });
        } else if (selectedType === 'Treatment') {
            const finalTreatment = treatmentPersonSelect.value === 'Backup' ? document.getElementById('treatmentBackupPerson').value.trim() : treatmentPersonSelect.value;
            Object.assign(formData, { orangTreatment: finalTreatment, pcsTreatment: document.getElementById('treatmentPcs').value });
        }

        if (customerName && ['Penjualan', 'Return'].includes(selectedType)) {
            if (checkDuplicateCustomerToday(customerName, selectedType)) {
                if (!confirm(`Peringatan: Nama pelanggan "${customerName}" untuk transaksi ${selectedType} sudah terinput hari ini. Lanjutkan?`)) {
                    showToast('Pengiriman dibatalkan.');
                    btnText.classList.remove('hidden');
                    loader.classList.add('hidden');
                    unifiedSubmitBtn.disabled = false;
                    return;
                }
            }
        }
        
        try {
            const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            showToast(`Laporan ${selectedType} berhasil dikirim!`, 'success');
            unifiedForm.reset();
            allFieldsets.forEach(fs => fs.classList.add('hidden'));
            document.dispatchEvent(new CustomEvent('dataChanged'));
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            unifiedSubmitBtn.disabled = false;
        }
    });
    unifiedForm.dataset.listenerAttached = 'true';
}

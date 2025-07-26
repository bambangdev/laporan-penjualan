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

    // Hentikan jika event listener sudah pernah ditambahkan
    if (unifiedForm.dataset.listenerAttached) return;

    const formFields = {
        'Penjualan': ['penjualanFields', 'salesReturnFields'],
        'Return': ['salesReturnFields'],
        'Treatment': ['treatmentFields']
    };
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

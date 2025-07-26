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
         <form id="unifiedForm" novalidate class="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-lg">
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
                <div id="dynamicFieldsContainer" class="space-y-4"></div>
            </div>
            <button type="submit" id="unifiedSubmitBtn" class="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-150 ease-in-out flex items-center justify-center mt-6">
                <span>Kirim Transaksi</span>
                <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6 ml-3 hidden"></div>
            </button>
        </form>
    `;
}

function renderFields(type) {
    const container = document.getElementById('dynamicFieldsContainer');
    if (!container) return;
    
    let html = '';
    if (type === 'Penjualan' || type === 'Return') {
        if (type === 'Penjualan') {
            html += `<div><label for="penjualanShift" class="block text-sm font-medium text-gray-700 mb-1">Shift</label><select id="penjualanShift" required class="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="" disabled selected>-- Pilih Shift --</option><option value="Shift Pagi">Shift Pagi</option><option value="Shift Siang">Shift Siang</option></select></div>`;
        }
        html += `
            <div><label for="salesHost" class="block text-sm font-medium text-gray-700 mb-1">Nama Host</label><select id="salesHost" required class="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="" disabled selected>-- Pilih Host --</option></select></div>
            <div id="salesBackupHostContainer" class="hidden"><label for="salesBackupHost" class="block text-sm font-medium text-gray-700 mb-1">Isi Nama Host Backup</label><input type="text" id="salesBackupHost" placeholder="Ketik nama host pengganti" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
            <div><label for="salesAdmin" class="block text-sm font-medium text-gray-700 mb-1">Nama Admin</label><select id="salesAdmin" required class="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="" disabled selected>-- Pilih Admin --</option></select></div>
            <div id="salesBackupAdminContainer" class="hidden"><label for="salesBackupAdmin" class="block text-sm font-medium text-gray-700 mb-1">Isi Nama Admin Backup</label><input type="text" id="salesBackupAdmin" placeholder="Ketik nama admin pengganti" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
            <div><label for="salesCustomer" class="block text-sm font-medium text-gray-700 mb-1">Nama Customer</label><input type="text" id="salesCustomer" required list="customerSuggestions" placeholder="Ketik nama customer" class="w-full px-4 py-2 border border-gray-300 rounded-lg"><datalist id="customerSuggestions"></datalist></div>
            <div><label for="salesPcs" class="block text-sm font-medium text-gray-700 mb-1">Total Pcs</label><input type="number" id="salesPcs" required placeholder="Contoh: 50" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
            <div><label for="salesOmzet" class="block text-sm font-medium text-gray-700 mb-1">Total Omzet (Rp)</label><input type="text" id="salesOmzet" required placeholder="Contoh: 1.500.000" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
        `;
    } else if (type === 'Treatment') {
        html += `
            <div><label for="treatmentPerson" class="block text-sm font-medium text-gray-700 mb-1">Nama Staff Treatment</label><select id="treatmentPerson" required class="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="" disabled selected>-- Pilih Nama --</option></select></div>
            <div id="treatmentBackupContainer" class="hidden"><label for="treatmentBackupPerson" class="block text-sm font-medium text-gray-700 mb-1">Isi Nama Pengganti</label><input type="text" id="treatmentBackupPerson" placeholder="Ketik nama pengganti" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
            <div><label for="treatmentPcs" class="block text-sm font-medium text-gray-700 mb-1">Jumlah PCS di-Treatment</label><input type="number" id="treatmentPcs" required placeholder="Contoh: 35" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></div>
        `;
    }
    container.innerHTML = html;
    setupFieldEventListeners(type);
}

function setupFieldEventListeners(type) {
    if (type === 'Penjualan' || type === 'Return') {
        populateDropdown(document.getElementById('salesHost'), hostList);
        populateDropdown(document.getElementById('salesAdmin'), adminList);
        const uniqueCustomers = [...new Set(allTransactions.map(t => t['Nama Customer']).filter(Boolean))];
        const datalist = document.getElementById('customerSuggestions');
        if(datalist) {
            datalist.innerHTML = uniqueCustomers.map(c => `<option value="${c}">`).join('');
        }
        
        document.getElementById('salesHost').addEventListener('change', (e) => document.getElementById('salesBackupHostContainer').classList.toggle('hidden', e.target.value !== 'Backup'));
        document.getElementById('salesAdmin').addEventListener('change', (e) => document.getElementById('salesBackupAdminContainer').classList.toggle('hidden', e.target.value !== 'Backup'));
        document.getElementById('salesOmzet').addEventListener('input', (e) => e.target.value = formatCurrency(parseCurrency(e.target.value)));
    } else if (type === 'Treatment') {
        populateDropdown(document.getElementById('treatmentPerson'), treatmentPersonList);
        document.getElementById('treatmentPerson').addEventListener('change', (e) => document.getElementById('treatmentBackupContainer').classList.toggle('hidden', e.target.value !== 'Backup'));
    }
}

function validateForm(type, data) {
    const requiredFields = {
        'Penjualan': ['shift', 'host', 'adminName', 'customerName', 'totalPcs', 'totalOmzet'],
        'Return': ['host', 'adminName', 'customerName', 'totalPcs', 'totalOmzet'],
        'Treatment': ['orangTreatment', 'pcsTreatment']
    };

    for (const field of requiredFields[type]) {
        if (!data[field] && data[field] !== 0) { // Check for empty strings, null, undefined, but allow 0
            showToast(`Kolom ${field} wajib diisi.`, 'error');
            return false;
        }
    }
    return true;
}

export function setupUnifiedForm(transactions) {
    allTransactions = transactions;
    const form = document.getElementById('unifiedForm');
    const transactionTypeSelect = document.getElementById('transactionType');
    if (!form || !transactionTypeSelect) return;
    if (form.dataset.listenerAttached) return;

    transactionTypeSelect.addEventListener('change', () => renderFields(transactionTypeSelect.value));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('unifiedSubmitBtn');
        const btnText = submitBtn.querySelector('span');
        const loader = submitBtn.querySelector('.loader');
        
        const selectedType = transactionTypeSelect.value;
        if (!selectedType) {
            showToast('Mohon pilih jenis transaksi.', 'error');
            return;
        }

        let formData = { action: 'add', transactionType: selectedType };
        let customerName = '';

        if (selectedType === 'Penjualan' || selectedType === 'Return') {
            const hostSelect = document.getElementById('salesHost');
            const adminSelect = document.getElementById('salesAdmin');
            
            customerName = document.getElementById('salesCustomer').value.trim();
            const finalHost = hostSelect.value === 'Backup' ? document.getElementById('salesBackupHost').value.trim() : hostSelect.value;
            const finalAdmin = adminSelect.value === 'Backup' ? document.getElementById('salesBackupAdmin').value.trim() : adminSelect.value;
            
            Object.assign(formData, {
                shift: selectedType === 'Penjualan' ? (document.getElementById('penjualanShift')?.value || '') : '',
                host: finalHost,
                adminName: finalAdmin,
                customerName: customerName,
                totalPcs: document.getElementById('salesPcs').value,
                totalOmzet: parseCurrency(document.getElementById('salesOmzet').value)
            });
        } else if (selectedType === 'Treatment') {
            const treatmentSelect = document.getElementById('treatmentPerson');
            const finalTreatment = treatmentSelect.value === 'Backup' ? document.getElementById('treatmentBackupPerson').value.trim() : treatmentSelect.value;
            Object.assign(formData, {
                orangTreatment: finalTreatment,
                pcsTreatment: document.getElementById('treatmentPcs').value
            });
        }
        
        if (!validateForm(selectedType, formData)) return;

        if (customerName && ['Penjualan', 'Return'].includes(selectedType)) {
            if (checkDuplicateCustomerToday(customerName, selectedType)) {
                if (!confirm(`Peringatan: Nama pelanggan "${customerName}" untuk transaksi ${selectedType} sudah terinput hari ini. Anda yakin ingin melanjutkan?`)) {
                    showToast('Pengiriman dibatalkan oleh pengguna.');
                    return;
                }
            }
        }
        
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message || 'Terjadi kesalahan di server.');
            showToast(`Laporan ${selectedType} berhasil dikirim!`, 'success');
            form.reset();
            document.getElementById('dynamicFieldsContainer').innerHTML = '';
            transactionTypeSelect.value = '';
            document.dispatchEvent(new CustomEvent('dataChanged'));
        } catch (error) {
            showToast(`Gagal mengirim: ${error.message}`, 'error');
        } finally {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });
    form.dataset.listenerAttached = 'true';
}

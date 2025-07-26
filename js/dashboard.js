import { SCRIPT_URL, EDIT_PIN, hostList, adminList, treatmentPersonList, formatCurrency, parseCurrency, populateDropdown, showToast } from './utils.js';

let allData = [];
let filteredDashboardData = [];
let currentPage = 1;
const rowsPerPage = 30;
let dashboardDatePicker;
let currentRowToAction = null;

function renderTopHostSalesTableForDashboard(data) {
    const hostSales = data.reduce((acc, row) => {
        const hostName = row['Nama Host'] || 'Unknown';
        if (hostName === 'Unknown') return acc;
        acc[hostName] = acc[hostName] || { omzet: 0, pcs: 0 };
        acc[hostName].omzet += parseCurrency(row['Total Omzet'] || 0);
        acc[hostName].pcs += Number(row['Total Pcs'] || 0);
        return acc;
    }, {});

    const sortedHosts = Object.keys(hostSales).sort((a, b) => hostSales[b].omzet - hostSales[a].omzet);
    const tbody = document.getElementById('dashboardTopHostTable');
    tbody.innerHTML = '';

    if (sortedHosts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-sm text-gray-400">Tidak ada data penjualan host.</td></tr>`;
        return;
    }

    sortedHosts.forEach(host => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-3 text-sm font-medium text-gray-900">${host}</td>
            <td class="py-2 px-3 text-sm text-gray-500">${formatCurrency(hostSales[host].omzet)}</td>
            <td class="py-2 px-3 text-sm text-gray-500">${hostSales[host].pcs.toLocaleString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateAndRenderStats(data) {
    const penjualanData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const returnData = data.filter(r => r['Jenis Transaksi'] === 'Return');
    const treatmentData = data.filter(r => r['Jenis Transaksi'] === 'Treatment');

    document.getElementById('statPcsPenjualan').textContent = penjualanData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0).toLocaleString('id-ID');
    document.getElementById('statOmzetPenjualan').textContent = formatCurrency(penjualanData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0));
    document.getElementById('statPcsReturn').textContent = returnData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0).toLocaleString('id-ID');
    document.getElementById('statOmzetReturn').textContent = formatCurrency(returnData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0));
    document.getElementById('statPcsTreatment').textContent = treatmentData.reduce((s, r) => s + Number(r['PCS Treatment'] || 0), 0).toLocaleString('id-ID');
}

function renderDashboardTable() {
    const tbody = document.getElementById('dashboardTableBody');
    const currentPageSpan = document.getElementById('currentPageSpan');
    const totalPagesSpan = document.getElementById('totalPagesSpan');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    tbody.innerHTML = '';

    const totalRows = filteredDashboardData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
    const paginatedData = filteredDashboardData.slice(startIndex, endIndex);

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-gray-500">Tidak ada data yang cocok.</td></tr>`;
    } else {
        paginatedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.dataset.rowData = JSON.stringify(row);
            const tanggalFormatted = row['Tanggal Input'] ? new Date(row['Tanggal Input']).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

            tr.innerHTML = `
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-900">${tanggalFormatted}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Nama Customer'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Shift'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Nama Host'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Nama Admin'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${Number(row['Total Pcs'] || 0).toLocaleString('id-ID')}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(row['Total Omzet'])}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Jenis Transaksi']}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${Number(row['PCS Treatment'] || 0).toLocaleString('id-ID')}</td>
                <td class="py-4 px-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button class="text-indigo-600 hover:text-indigo-900 edit-row-btn">Edit</button>
                    <button class="text-red-600 hover:text-red-900 delete-row-btn">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages > 0 ? totalPages : 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    document.querySelectorAll('.edit-row-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            currentRowToAction = JSON.parse(tr.dataset.rowData);
            document.getElementById('editRowPasswordModal').classList.remove('hidden');
            document.getElementById('editRowPasswordModal').classList.add('flex');
            document.getElementById('editRowPasswordInput').focus();
        });
    });

    document.querySelectorAll('.delete-row-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            currentRowToAction = JSON.parse(tr.dataset.rowData);
            document.getElementById('deleteConfirmationModal').classList.remove('hidden');
            document.getElementById('deleteConfirmationModal').classList.add('flex');
        });
    });
}

function populateCustomerAutocomplete(data) {
    const customerDatalist = document.getElementById('customerSuggestions');
    // Guard clause jika elemen tidak ditemukan (saat halaman lain aktif)
    if (!customerDatalist) return;
    const uniqueCustomers = [...new Set(data.map(item => String(item['Nama Customer'] || '').trim()).filter(Boolean))].sort();
    customerDatalist.innerHTML = '';
    uniqueCustomers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer;
        customerDatalist.appendChild(option);
    });
}

function applyFilters() {
    const dashboardLoader = document.getElementById('dashboardLoader');
    dashboardLoader.classList.remove('hidden');
    dashboardLoader.classList.add('flex');

    setTimeout(() => {
        const searchTerm = document.getElementById('dashboardSearchCustomer').value.toLowerCase();
        const selectedShift = document.getElementById('dashboardFilterShift').value;
        const selectedHost = document.getElementById('dashboardFilterHost').value;
        const selectedAdmin = document.getElementById('dashboardFilterAdmin').value;
        const selectedTransactionType = document.getElementById('dashboardFilterTransactionType').value;
        const startDate = dashboardDatePicker.getStartDate()?.toJSDate();
        const endDate = dashboardDatePicker.getEndDate()?.toJSDate();
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        filteredDashboardData = allData.filter(row => {
            const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
            const customerMatch = String(row['Nama Customer'] || '').toLowerCase().includes(searchTerm);
            const shiftMatch = selectedShift ? row.Shift === selectedShift : true;
            const hostMatch = selectedHost ? row['Nama Host'] === selectedHost : true;
            const adminMatch = selectedAdmin ? row['Nama Admin'] === selectedAdmin : true;
            const transactionTypeMatch = selectedTransactionType ? row['Jenis Transaksi'] === selectedTransactionType : true;
            const dateMatch = (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
            return customerMatch && shiftMatch && hostMatch && adminMatch && transactionTypeMatch && dateMatch;
        });

        currentPage = 1;
        calculateAndRenderStats(filteredDashboardData);
        renderTopHostSalesTableForDashboard(filteredDashboardData.filter(r => r['Jenis Transaksi'] === 'Penjualan'));
        populateCustomerAutocomplete(allData);
        renderDashboardTable();

        dashboardLoader.classList.add('hidden');
        dashboardLoader.classList.remove('flex');
    }, 50);
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredDashboardData.length / rowsPerPage);
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    }
    renderDashboardTable();
}

function exportDashboardToExcel() {
    if (filteredDashboardData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }
    const headers = ['Tanggal', 'Customer', 'Shift', 'Host', 'Admin', 'PCS', 'Omzet', 'Jenis Transaksi', 'PCS Treatment'];
    let csvContent = headers.join(',') + '\n';
    filteredDashboardData.forEach(row => {
        const rowValues = [
            row['Tanggal Input'] ? new Date(row['Tanggal Input']).toLocaleDateString('id-ID') : '',
            `"${String(row['Nama Customer'] || '').replace(/"/g, '""')}"`,
            `"${String(row['Shift'] || '').replace(/"/g, '""')}"`,
            `"${String(row['Nama Host'] || '').replace(/"/g, '""')}"`,
            `"${String(row['Nama Admin'] || '').replace(/"/g, '""')}"`,
            Number(row['Total Pcs'] || 0),
            parseCurrency(row['Total Omzet'] || 0),
            `"${String(row['Jenis Transaksi'] || '').replace(/"/g, '""')}"`,
            Number(row['PCS Treatment'] || 0)
        ];
        csvContent += rowValues.join(',') + '\n';
    });
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_Dashboard_${moment().format('YYYYMMDD_HHmmss')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function populateEditModal(data) {
    document.getElementById('editRowIndex').value = data.rowIndex;
    document.getElementById('editOriginalTimestamp').value = data['Tanggal Input'];
    document.getElementById('editTransactionType').value = data['Jenis Transaksi'] || '';
    document.getElementById('editShift').value = data.Shift || '';

    const editHostInput = document.getElementById('editHost');
    const editBackupHostContainer = document.getElementById('editBackupHostContainer');
    const editBackupHostInput = document.getElementById('editBackupHost');
    populateDropdown(editHostInput, hostList);
    editHostInput.value = data['Nama Host'] || '';
    if (!hostList.includes(data['Nama Host']) && data['Nama Host']) {
        editHostInput.value = 'Backup';
        editBackupHostContainer.classList.remove('hidden');
        editBackupHostInput.value = data['Nama Host'];
    } else {
        editBackupHostContainer.classList.add('hidden');
        editBackupHostInput.value = '';
    }

    const editAdminInput = document.getElementById('editAdmin');
    const editBackupAdminContainer = document.getElementById('editBackupAdminContainer');
    const editBackupAdminInput = document.getElementById('editBackupAdmin');
    populateDropdown(editAdminInput, adminList);
    editAdminInput.value = data['Nama Admin'] || '';
    if (!adminList.includes(data['Nama Admin']) && data['Nama Admin']) {
        editAdminInput.value = 'Backup';
        editBackupAdminContainer.classList.remove('hidden');
        editBackupAdminInput.value = data['Nama Admin'];
    } else {
        editBackupAdminContainer.classList.add('hidden');
        editBackupAdminInput.value = '';
    }
    
    document.getElementById('editCustomer').value = data['Nama Customer'] || '';
    document.getElementById('editPcs').value = data['Total Pcs'] || '';
    document.getElementById('editOmzet').value = formatCurrency(data['Total Omzet']);
    
    const editOrangTreatmentInput = document.getElementById('editOrangTreatment');
    const editBackupTreatmentContainer = document.getElementById('editBackupTreatmentContainer');
    const editBackupOrangTreatmentInput = document.getElementById('editBackupOrangTreatment');
    populateDropdown(editOrangTreatmentInput, treatmentPersonList);
    editOrangTreatmentInput.value = data['Orang Treatment'] || '';
    if (!treatmentPersonList.includes(data['Orang Treatment']) && data['Orang Treatment']) {
        editOrangTreatmentInput.value = 'Backup';
        editBackupTreatmentContainer.classList.remove('hidden');
        editBackupOrangTreatmentInput.value = data['Orang Treatment'];
    } else {
        editBackupTreatmentContainer.classList.add('hidden');
        editBackupOrangTreatmentInput.value = '';
    }
    document.getElementById('editPcsTreatment').value = data['PCS Treatment'] || '';

    editHostInput.onchange = () => editBackupHostContainer.classList.toggle('hidden', editHostInput.value !== 'Backup');
    editAdminInput.onchange = () => editBackupAdminContainer.classList.toggle('hidden', editAdminInput.value !== 'Backup');
    editOrangTreatmentInput.onchange = () => editBackupTreatmentContainer.classList.toggle('hidden', editOrangTreatmentInput.value !== 'Backup');
    document.getElementById('editOmzet').oninput = (e) => e.target.value = formatCurrency(parseCurrency(e.target.value));
}

async function handleEditFormSubmit(e) {
    e.preventDefault();
    const saveEditTransactionBtn = document.getElementById('saveEditTransaction');
    const btnText = saveEditTransactionBtn.querySelector('span');
    const loader = saveEditTransactionBtn.querySelector('.loader');
    
    btnText.classList.add('hidden'); 
    loader.classList.remove('hidden'); 
    saveEditTransactionBtn.disabled = true;

    const finalHost = document.getElementById('editHost').value === 'Backup' ? document.getElementById('editBackupHost').value.trim() : document.getElementById('editHost').value;
    const finalAdmin = document.getElementById('editAdmin').value === 'Backup' ? document.getElementById('editBackupAdmin').value.trim() : document.getElementById('editAdmin').value;
    const finalTreatment = document.getElementById('editOrangTreatment').value === 'Backup' ? document.getElementById('editBackupOrangTreatment').value.trim() : document.getElementById('editOrangTreatment').value;

    const formData = {
        action: 'edit',
        rowIndex: document.getElementById('editRowIndex').value,
        timestamp: document.getElementById('editOriginalTimestamp').value,
        transactionType: document.getElementById('editTransactionType').value,
        shift: document.getElementById('editShift').value,
        host: finalHost,
        adminName: finalAdmin,
        customerName: document.getElementById('editCustomer').value.trim(),
        totalPcs: document.getElementById('editPcs').value,
        totalOmzet: parseCurrency(document.getElementById('editOmzet').value),
        orangTreatment: finalTreatment,
        pcsTreatment: document.getElementById('editPcsTreatment').value,
    };
    
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        
        showToast(`Data berhasil diperbarui!`, 'success');
        
        document.dispatchEvent(new CustomEvent('dataChanged'));
        setTimeout(() => {
            document.getElementById('editTransactionModal').classList.add('hidden');
            document.getElementById('editTransactionModal').classList.remove('flex');
        }, 1500);
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        btnText.classList.remove('hidden'); 
        loader.classList.add('hidden'); 
        saveEditTransactionBtn.disabled = false;
    }
}

// ===== FUNGSI HAPUS YANG DIPERBAIKI =====
async function handleDeleteTransaction() {
    if (!currentRowToAction || !currentRowToAction.rowIndex) {
        showToast('Gagal menghapus: Data tidak ditemukan.', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const btnText = confirmBtn.querySelector('span');
    const loader = confirmBtn.querySelector('.loader');

    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    confirmBtn.disabled = true;

    const formData = {
        action: 'delete',
        rowIndex: currentRowToAction.rowIndex,
    };

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);

        // --- PERBAIKAN LOGIKA ADA DI SINI ---
        // 1. Hapus item dari array data utama
        const indexToRemove = allData.findIndex(item => item.rowIndex === currentRowToAction.rowIndex);
        if (indexToRemove > -1) {
            allData.splice(indexToRemove, 1);
        }

        // 2. Tampilkan notifikasi dan tutup modal
        showToast('Transaksi berhasil dihapus!', 'success');
        document.getElementById('deleteConfirmationModal').classList.add('hidden');
        
        // 3. Panggil applyFilters() untuk me-render ulang tabel dengan data yang sudah diupdate
        //    Ini lebih cepat daripada memanggil event 'dataChanged' yang memuat ulang semua dari server
        applyFilters();

    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        confirmBtn.disabled = false;
        currentRowToAction = null;
    }
}

function populateDashboardFilters() {
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean).sort())];
    populateDropdown(document.getElementById('dashboardFilterShift'), getUniqueValues('Shift'), false);
    populateDropdown(document.getElementById('dashboardFilterHost'), getUniqueValues('Nama Host'), false);
    populateDropdown(document.getElementById('dashboardFilterAdmin'), getUniqueValues('Nama Admin'), false);
}

export function setupDashboardPage(data) {
    const searchInput = document.getElementById('dashboardSearchCustomer');
    if (!searchInput) return;

    allData = data;
    const litepickerOptions = {
        singleMode: false, format: 'DD MMM YY', lang: 'id-ID', numberOfMonths: 2,
        dropdowns: { minYear: 2020, maxYear: null, months: true, years: true },
        buttonText: {
            previousMonth: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`,
            nextMonth: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>`,
        },
    };

    if (!dashboardDatePicker) {
        dashboardDatePicker = new Litepicker({
            element: document.getElementById('dashboardDateRangePicker'),
            ...litepickerOptions,
            setup: (picker) => picker.on('selected', applyFilters),
        });
        dashboardDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
    }

    populateDashboardFilters();

    if (!searchInput.dataset.listenerAttached) {
        searchInput.addEventListener('input', applyFilters);
        document.getElementById('dashboardFilterShift').addEventListener('change', applyFilters);
        document.getElementById('dashboardFilterHost').addEventListener('change', applyFilters);
        document.getElementById('dashboardFilterAdmin').addEventListener('change', applyFilters);
        document.getElementById('dashboardFilterTransactionType').addEventListener('change', applyFilters);
        document.getElementById('prevPageBtn').addEventListener('click', () => changePage('prev'));
        document.getElementById('nextPageBtn').addEventListener('click', () => changePage('next'));
        document.getElementById('exportExcelBtn').addEventListener('click', exportDashboardToExcel);

        document.getElementById('editRowPasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (document.getElementById('editRowPasswordInput').value === EDIT_PIN) {
                document.getElementById('editRowPasswordModal').classList.add('hidden');
                document.getElementById('editRowPasswordInput').value = '';
                populateEditModal(currentRowToAction);
                document.getElementById('editTransactionModal').classList.add('flex');
                document.getElementById('editTransactionModal').classList.remove('hidden');
            } else {
                document.getElementById('editRowPasswordError').textContent = 'PIN salah.';
            }
        });
        document.getElementById('cancelEditRow').addEventListener('click', () => {
            document.getElementById('editRowPasswordModal').classList.add('hidden');
            document.getElementById('editRowPasswordModal').classList.remove('flex');
        });
        document.getElementById('editTransactionForm').addEventListener('submit', handleEditFormSubmit);
        document.getElementById('cancelEditTransaction').addEventListener('click', () => {
            document.getElementById('editTransactionModal').classList.add('hidden');
            document.getElementById('editTransactionModal').classList.remove('flex');
        });
        
        document.getElementById('confirmDeleteBtn').addEventListener('click', handleDeleteTransaction);

        searchInput.dataset.listenerAttached = 'true';
    }

    document.addEventListener('filterChanged', (e) => {
        if (e.detail.pageId === 'dashboardPage') {
            applyFilters();
        }
    });
}

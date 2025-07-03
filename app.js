// --- APP STATE & CONFIG ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzpSVOHsYuDXUoJqHJ4mi2bHiHVT7tqSgD1Q6iq2RKHhwIqszVCfczZUMrNB7zzoFn/exec';
const CORRECT_PIN = '7501';
const SALES_REPORT_PIN = 'yanto1'; 
const EDIT_PIN = '69960';
const hostList = ['wafa', 'debi', 'bunga'];
const adminList = ['Bunga', 'Teh Ros'];
const treatmentPersonList = ['Bunda', 'Resin'];
let allData = [];
let isDataFetched = false;
let dashboardDatePicker, customerDatePicker, salesReportDatePicker;
let currentRowToEdit = null;
let monthlySalesChartInstance = null;

// --- Pagination variables for Dashboard Table ---
let filteredDashboardData = [];
let currentPage = 1;
const rowsPerPage = 30;

// --- DOM ELEMENTS ---
const loginSection = document.getElementById('loginSection');
const mainApp = document.getElementById('mainApp');
const pinInputs = document.querySelectorAll('#pin-inputs input');
const pinError = document.getElementById('pinError');
const sidebar = document.getElementById('sidebar');
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const pages = document.querySelectorAll('.page');
const pageLoader = document.getElementById('pageLoader');
const pageError = document.getElementById('pageError');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const salesReportPinModal = document.getElementById('salesReportPinModal');
const salesReportPinForm = document.getElementById('salesReportPinForm');
const salesReportPinInput = document.getElementById('salesReportPinInput');
const salesReportPinError = document.getElementById('salesReportPinError');
const cancelSalesReportBtn = document.getElementById('cancelSalesReport');

const editRowPasswordModal = document.getElementById('editRowPasswordModal');
const editRowPasswordForm = document.getElementById('editRowPasswordForm');
const editRowPasswordInput = document.getElementById('editRowPasswordInput');
const editRowPasswordError = document.getElementById('editRowPasswordError');
const cancelEditRowBtn = document.getElementById('cancelEditRow');

const editTransactionModal = document.getElementById('editTransactionModal');
const editTransactionForm = document.getElementById('editTransactionForm');
const editRowIndexInput = document.getElementById('editRowIndex');
const editOriginalTimestampInput = document.getElementById('editOriginalTimestamp');
const editTransactionTypeInput = document.getElementById('editTransactionType');
const editShiftInput = document.getElementById('editShift');
const editHostInput = document.getElementById('editHost');
const editBackupHostContainer = document.getElementById('editBackupHostContainer');
const editBackupHostInput = document.getElementById('editBackupHost');
const editAdminInput = document.getElementById('editAdmin');
const editBackupAdminContainer = document.getElementById('editBackupAdminContainer');
const editBackupAdminInput = document.getElementById('editBackupAdmin');
const editCustomerInput = document.getElementById('editCustomer');
const editPcsInput = document.getElementById('editPcs');
const editOmzetInput = document.getElementById('editOmzet');
const editOrangTreatmentInput = document.getElementById('editOrangTreatment');
const editBackupTreatmentContainer = document.getElementById('editBackupTreatmentContainer');
const editBackupOrangTreatmentInput = document.getElementById('editBackupOrangTreatment');
const editPcsTreatmentInput = document.getElementById('editPcsTreatment');
const cancelEditTransactionBtn = document.getElementById('cancelEditTransaction');
const saveEditTransactionBtn = document.getElementById('saveEditTransaction');
const editTransactionStatus = document.getElementById('editTransactionStatus');

const salesReportNetOmzet = document.getElementById('salesReportNetOmzet');
const salesReportReturnRatio = document.getElementById('salesReportReturnRatio');
const salesReportUniqueCustomers = document.getElementById('salesReportUniqueCustomers');
const salesReportRepeatCustomers = document.getElementById('salesReportRepeatCustomers');
const salesReportTopHostTable = document.getElementById('salesReportTopHostTable');
// Estimasi Gaji Table Elements
const salesReportHostCombinedTable = document.getElementById('salesReportHostCombinedTable');
const salesReportAdminCombinedTable = document.getElementById('salesReportAdminCombinedTable');
const salesReportTreatmentCombinedTable = document.getElementById('salesReportTreatmentCombinedTable');


const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageSpan = document.getElementById('currentPageSpan');
const totalPagesSpan = document.getElementById('totalPagesSpan');

const exportExcelBtn = document.getElementById('exportExcelBtn');


// --- HELPER FUNCTIONS ---
const parseCurrency = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0;
const formatCurrency = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;

function populateDropdown(selectElement, listItems, includeBackup = true) {
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
    if (firstOption) selectElement.appendChild(firstOption);

    listItems.forEach(item => selectElement.add(new Option(item, item)));
    if(includeBackup) selectElement.add(new Option('Backup (Isi Manual)', 'Backup'));
}

// Fungsi untuk mengecek duplikasi customer di hari yang sama
function checkDuplicateCustomerToday(customerName, transactionType) {
    const today = moment().startOf('day');
    
    const transactionsToday = allData.filter(row => {
        const rowDate = moment(row['Tanggal Input']);
        return rowDate.isSame(today, 'day') && 
               String(row['Nama Customer'] || '').toLowerCase() === customerName.toLowerCase() &&
               row['Jenis Transaksi'] === transactionType;
    });
    
    return transactionsToday.length > 0;
}

// --- PAGE & NAVIGATION LOGIC ---
function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

function switchPage(pageId) {
    pages.forEach(page => page.classList.toggle('active', page.id === pageId));
    sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    if (window.innerWidth < 1024) {
        closeSidebar();
    }
    if (['dashboardPage', 'customerReportPage', 'salesReportPage'].includes(pageId)) {
        if (pageId === 'salesReportPage' && !salesReportDatePicker.getStartDate()) {
            salesReportDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
        }
        isDataFetched = false; 
        fetchData();
    }
}

// --- LOGIN & PASSWORD LOGIC ---
pinInputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) pinInputs[index - 1].focus();
    });
    input.addEventListener('input', () => {
        if (input.value && index < pinInputs.length - 1) pinInputs[index + 1].focus();
        const enteredPin = Array.from(pinInputs).map(i => i.value).join('');
        if (enteredPin.length === 4) {
            if (enteredPin === CORRECT_PIN) {
                loginSection.classList.add('hidden');
                mainApp.classList.remove('hidden');
                switchPage('dashboardPage');
            } else {
                pinError.textContent = 'PIN salah, coba lagi.';
                pinInputs.forEach(i => i.value = '');
                pinInputs[0].focus();
            }
        } else {
             pinError.textContent = '';
        }
    });
});

salesReportPinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (salesReportPinInput.value === SALES_REPORT_PIN) {
        salesReportPinModal.classList.add('hidden');
        salesReportPinModal.classList.remove('flex');
        switchPage('salesReportPage');
        salesReportPinInput.value = '';
        salesReportPinError.textContent = '';
    } else {
        salesReportPinError.textContent = 'PIN salah.';
    }
});

cancelSalesReportBtn.addEventListener('click', () => {
    salesReportPinModal.classList.add('hidden');
    salesReportPinModal.classList.remove('flex');
    salesReportPinInput.value = '';
    salesReportPinError.textContent = '';
});

editRowPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editRowPasswordInput.value === EDIT_PIN) {
        editRowPasswordModal.classList.add('hidden');
        editRowPasswordModal.classList.remove('flex');
        editRowPasswordInput.value = '';
        editRowPasswordError.textContent = '';
        
        populateEditModal(currentRowToEdit);
        editTransactionModal.classList.remove('hidden');
        editTransactionModal.classList.add('flex');
    } else {
        editRowPasswordError.textContent = 'PIN salah.';
    }
});

cancelEditRowBtn.addEventListener('click', () => {
    editRowPasswordModal.classList.add('hidden');
    editRowPasswordModal.classList.remove('flex');
    editRowPasswordInput.value = '';
    editRowPasswordError.textContent = '';
    currentRowToEdit = null;
});

cancelEditTransactionBtn.addEventListener('click', () => {
    editTransactionModal.classList.add('hidden');
    editTransactionModal.classList.remove('flex');
    editTransactionForm.reset();
    editTransactionStatus.textContent = '';
    currentRowToEdit = null;
    editBackupHostContainer.classList.add('hidden');
    editBackupAdminContainer.classList.add('hidden');
    editBackupTreatmentContainer.classList.add('hidden');
});

// --- DATA FETCHING & RENDERING LOGIC ---
async function fetchData() {
    if (isDataFetched) {
        if (document.getElementById('salesReportPage').classList.contains('active')) {
            applySalesReportFilters();
        } else if (document.getElementById('dashboardPage').classList.contains('active')) {
            applyFilters();
        } else if (document.getElementById('customerReportPage').classList.contains('active')) {
            applyCustomerReportFilters();
        }
        return;
    }
    pageLoader.classList.remove('hidden');
    pageError.classList.add('hidden');
    
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        allData = result.data.sort((a, b) => {
            const dateA = a['Tanggal Input'] ? new Date(a['Tanggal Input']) : new Date(0);
            const dateB = b['Tanggal Input'] ? new Date(b['Tanggal Input']) : new Date(0);
            return dateB - dateA;
        });
        isDataFetched = true;
        populateFilters(); 
        
        if (document.getElementById('salesReportPage').classList.contains('active')) {
            applySalesReportFilters();
        } else if (document.getElementById('dashboardPage').classList.contains('active')) {
            applyFilters();
        } else if (document.getElementById('customerReportPage').classList.contains('active')) {
            applyCustomerReportFilters();
        }

    } catch (error) {
        pageError.textContent = `Gagal memuat data: ${error.message}.`;
        pageError.classList.remove('hidden');
    } finally {
        pageLoader.classList.add('hidden');
    }
}

function applyFilters() { // This function is for the Dashboard page
    const dashboardSearchCustomer = document.getElementById('dashboardSearchCustomer');
    const dashboardFilterShift = document.getElementById('dashboardFilterShift');
    const dashboardFilterHost = document.getElementById('dashboardFilterHost');
    const dashboardFilterAdmin = document.getElementById('dashboardFilterAdmin');
    const dashboardFilterTransactionType = document.getElementById('dashboardFilterTransactionType');
    
    const searchTerm = dashboardSearchCustomer.value.toLowerCase();
    const selectedShift = dashboardFilterShift.value;
    const selectedHost = dashboardFilterHost.value;
    const selectedAdmin = dashboardFilterAdmin.value;
    const selectedTransactionType = dashboardFilterTransactionType.value;
    const startDate = dashboardDatePicker.getStartDate()?.toJSDate();
    const endDate = dashboardDatePicker.getEndDate()?.toJSDate();
    if(startDate) startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999);

    // Filter data berdasarkan kriteria
    filteredDashboardData = allData.filter(row => {
        const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
        const customerMatch = String(row['Nama Customer'] || '').toLowerCase().includes(searchTerm);
        const shiftMatch = selectedShift ? row.Shift === selectedShift : true;
        const hostMatch = selectedHost ? row['Nama Host'] === selectedHost : true;
        const adminMatch = selectedAdmin ? row['Nama Admin'] === selectedAdmin : true;
        const transactionTypeMatch = selectedTransactionType ? row['Jenis Transaksi'] === selectedTransactionType : true;
        const dateMatch = (!startDate || (rowDate && rowDate >= startDate)) && (!endDate || (rowDate && rowDate <= endDate));
        return customerMatch && shiftMatch && hostMatch && adminMatch && transactionTypeMatch && dateMatch;
    });
    
    // Reset halaman saat filter berubah
    currentPage = 1;
    
    calculateAndRenderStats(filteredDashboardData);
    renderDashboardTable();
}

function calculateAndRenderStats(data) {
    const penjualanData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const returnData = data.filter(r => r['Jenis Transaksi'] === 'Return');

    const statPcsPenjualan = document.getElementById('statPcsPenjualan');
    const statOmzetPenjualan = document.getElementById('statOmzetPenjualan');
    const statPcsReturn = document.getElementById('statPcsReturn');
    const statOmzetReturn = document.getElementById('statOmzetReturn');
    
    statPcsPenjualan.textContent = penjualanData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0).toLocaleString('id-ID');
    statOmzetPenjualan.textContent = formatCurrency(penjualanData.reduce((s, r) => s + Number(r['Total Omzet'] || 0), 0));
    statPcsReturn.textContent = returnData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0).toLocaleString('id-ID');
    statOmzetReturn.textContent = formatCurrency(returnData.reduce((s, r) => s + Number(r['Total Omzet'] || 0), 0));
}

function renderDashboardTable() {
    const tbody = document.getElementById('dashboardTableBody');
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

            const tanggalFormatted = row['Tanggal Input'] ? new Date(row['Tanggal Input']).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) : '-';

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
                <td class="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 edit-row-btn" data-row-index="${row.rowIndex}">Edit</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    document.querySelectorAll('.edit-row-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            currentRowToEdit = JSON.parse(tr.dataset.rowData);
            editRowPasswordModal.classList.remove('hidden');
            editRowPasswordModal.classList.add('flex');
            editRowPasswordInput.focus();
        });
    });
}

function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < Math.ceil(filteredDashboardData.length / rowsPerPage)) {
        currentPage++;
    }
    renderDashboardTable();
}

function exportDashboardToExcel() {
    if (filteredDashboardData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }

    const headers = [
        'Tanggal', 'Customer', 'Shift', 'Host', 'Admin',
        'PCS', 'Omzet', 'Jenis Transaksi', 'PCS Treatment'
    ];

    let csvContent = headers.join(',') + '\n';

    filteredDashboardData.forEach(row => {
        const rowValues = [
            row['Tanggal Input'] ? new Date(row['Tanggal Input']).toLocaleDateString('id-ID') : '',
            `"${String(row['Nama Customer'] || '').replace(/"/g, '""')}"`,
            `"${String(row['Shift'] || '').replace(/"/g, '""')}"`,
            `"${String(row['Nama Host'] || '').replace(/"/g, '""')}"`,
            `"${String(row['Nama Admin'] || '').replace(/"/g, '""')}"`,
            Number(row['Total Pcs'] || 0),
            Number(row['Total Omzet'] || 0),
            `"${String(row['Jenis Transaksi'] || '').replace(/"/g, '""')}"`,
            Number(row['PCS Treatment'] || 0)
        ];
        csvContent += rowValues.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Laporan_Dashboard_InfiniThree_' + moment().format('YYYYMMDD_HHmmss') + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('Browser Anda tidak mendukung pengunduhan file secara langsung.');
    }
}

function populateEditModal(data) {
    editRowIndexInput.value = data.rowIndex;
    editOriginalTimestampInput.value = data['Tanggal Input'];
    editTransactionTypeInput.value = data['Jenis Transaksi'] || '';
    editShiftInput.value = data.Shift || '';

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

    editCustomerInput.value = data['Nama Customer'] || '';
    editPcsInput.value = data['Total Pcs'] || '';
    editOmzetInput.value = formatCurrency(data['Total Omzet']);
    
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
    editPcsTreatmentInput.value = data['PCS Treatment'] || '';

    editHostInput.onchange = () => { editBackupHostContainer.classList.toggle('hidden', editHostInput.value !== 'Backup'); };
    editAdminInput.onchange = () => { editBackupAdminContainer.classList.toggle('hidden', editAdminInput.value !== 'Backup'); };
    editOrangTreatmentInput.onchange = () => { editBackupTreatmentContainer.classList.toggle('hidden', editOrangTreatmentInput.value !== 'Backup'); };

    editOmzetInput.oninput = (e) => { e.target.value = formatCurrency(parseCurrency(e.target.value)); };
}

editTransactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = saveEditTransactionBtn;
    const btnText = submitBtn.querySelector('span');
    const loader = submitBtn.querySelector('.loader');
    
    btnText.classList.add('hidden'); loader.classList.remove('hidden'); submitBtn.disabled = true;

    const finalHost = editHostInput.value === 'Backup' ? editBackupHostInput.value.trim() : editHostInput.value;
    const finalAdmin = editAdminInput.value === 'Backup' ? editBackupAdminInput.value.trim() : editAdminInput.value;
    const finalTreatment = editOrangTreatmentInput.value === 'Backup' ? editBackupOrangTreatmentInput.value.trim() : editOrangTreatmentInput.value;

    const omzetValue = parseCurrency(editOmzetInput.value);

    const formData = {
        action: 'edit',
        rowIndex: editRowIndexInput.value,
        timestamp: editOriginalTimestampInput.value,
        transactionType: editTransactionTypeInput.value || '',
        shift: editShiftInput.value || '',
        host: finalHost || '',
        adminName: finalAdmin || '',
        customerName: editCustomerInput.value || '',
        totalPcs: editPcsInput.value || '',
        totalOmzet: omzetValue || '',
        orangTreatment: finalTreatment || '',
        pcsTreatment: editPcsTreatmentInput.value || '',
    };
    
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        editTransactionStatus.textContent = `Data berhasil diperbarui!`;
        editTransactionStatus.className = 'mt-4 text-center text-sm h-4 text-green-600';
        isDataFetched = false;
        await fetchData();
        setTimeout(() => {
            editTransactionModal.classList.add('hidden');
            editTransactionModal.classList.remove('flex');
            editTransactionForm.reset();
            editTransactionStatus.textContent = '';
            currentRowToEdit = null;
            editBackupHostContainer.classList.add('hidden');
            editBackupAdminContainer.classList.add('hidden');
            editBackupTreatmentContainer.classList.add('hidden');
        }, 1500);
    } catch (error) {
        editTransactionStatus.textContent = `Error: ${error.message}`;
        editTransactionStatus.className = 'mt-4 text-center text-sm h-4 text-red-600';
    } finally {
        btnText.classList.remove('hidden'); loader.classList.add('hidden'); submitBtn.disabled = false;
    }
});

function applyCustomerReportFilters() {
    if (!isDataFetched) return;
    const startDate = customerDatePicker.getStartDate()?.toJSDate();
    const endDate = customerDatePicker.getEndDate()?.toJSDate();
    if(startDate) startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999);
    
    const filteredData = allData.filter(row => {
         const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
         return (!startDate || (rowDate && rowDate >= startDate)) && (!endDate || (rowDate && rowDate <= endDate));
    });
    calculateAndRenderCustomerReport(filteredData);
}

function calculateAndRenderCustomerReport(data) {
    const topBuyerEl = { name: document.getElementById('topBuyerName'), pcs: document.getElementById('topBuyerPcs'), omzet: document.getElementById('topBuyerOmzet') };
    const topReturnerEl = { name: document.getElementById('topReturnerName'), pcs: document.getElementById('topReturnerPcs'), omzet: document.getElementById('topReturnerOmzet') };
    
    const getTopCustomer = (sourceData, pcsField, omzetField) => {
        if (sourceData.length === 0) return null;
        const customerData = sourceData.reduce((acc, row) => {
            const name = row['Nama Customer'];
            if(!name || name === '-') return acc;
            acc[name] = acc[name] || { pcs: 0, omzet: 0 };
            acc[name].pcs += Number(row[pcsField] || 0);
            acc[name].omzet += parseCurrency(row[omzetField] || 0);
            return acc;
        }, {});
        const topCustomerName = Object.keys(customerData).sort((a,b) => customerData[b].omzet - customerData[a].omzet)[0];
        return topCustomerName ? { name: topCustomerName, ...customerData[topCustomerName] } : null;
    };
    
    const topBuyer = getTopCustomer(data.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Total Pcs', 'Total Omzet');
    const topReturner = getTopCustomer(data.filter(r => r['Jenis Transaksi'] === 'Return'), 'Total Pcs', 'Total Omzet');

    const renderTopCustomer = (elements, data) => {
        if (data) {
            elements.name.textContent = data.name;
            elements.pcs.textContent = data.pcs.toLocaleString('id-ID');
            elements.omzet.textContent = formatCurrency(data.omzet);
        } else {
            elements.name.textContent = '-';
            elements.pcs.textContent = '0';
            elements.omzet.textContent = 'Rp 0';
        }
    };
    renderTopCustomer(topBuyerEl, topBuyer);
    renderTopCustomer(topReturnerEl, topReturner);
}

function applySalesReportFilters() {
    if (!isDataFetched) return;
    const startDate = salesReportDatePicker.getStartDate()?.toJSDate();
    const endDate = salesReportDatePicker.getEndDate()?.toJSDate();
    if(startDate) startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999);
    
    const filteredData = allData.filter(row => {
         const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
         return (!startDate || (rowDate && rowDate >= startDate)) && (!endDate || (rowDate && rowDate <= endDate));
    });

    const penjualanData = filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const returnData = filteredData.filter(r => r['Jenis Transaksi'] === 'Return');
    const treatmentData = filteredData.filter(r => r['Jenis Transaksi'] === 'Treatment');

    const totalOmzetPenjualan = penjualanData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0);
    const totalOmzetReturn = returnData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0);
    const netOmzet = totalOmzetPenjualan - totalOmzetReturn;
    salesReportNetOmzet.textContent = formatCurrency(netOmzet);

    const returnRatio = totalOmzetPenjualan > 0 ? (totalOmzetReturn / totalOmzetPenjualan) * 100 : 0;
    salesReportReturnRatio.textContent = `${returnRatio.toFixed(2)}%`;

    const customerPurchaseCounts = penjualanData.reduce((acc, row) => {
        const customerName = String(row['Nama Customer'] || '').trim();
        if (customerName) {
            acc[customerName] = (acc[customerName] || 0) + 1;
        }
        return acc;
    }, {});

    const uniqueCustomers = Object.keys(customerPurchaseCounts).length;
    salesReportUniqueCustomers.textContent = uniqueCustomers.toLocaleString('id-ID');

    let repeatCustomers = 0;
    for (const customer in customerPurchaseCounts) {
        if (customerPurchaseCounts[customer] > 1) {
            repeatCustomers++;
        }
    }
    salesReportRepeatCustomers.textContent = repeatCustomers.toLocaleString('id-ID');

    const getPersonUniqueDays = (dataArray, personField) => {
        const personDays = {};
        dataArray.forEach(row => {
            const date = moment(row['Tanggal Input']);
            const person = String(row[personField] || '').trim();
            if (date.isValid() && person) {
                personDays[person] = personDays[person] || new Set();
                personDays[person].add(date.format('YYYY-MM-DD'));
            }
        });
        return personDays;
    };

    const getPersonBonus = (sourceData, groupByField, pcsField, omzetField, bonusRate, bonusType, target) => {
        const performance = {};
        const getJustDate = (isoString) => isoString ? isoString.split('T')[0] : null;

        sourceData.forEach(row => {
            const name = String(row[groupByField] || '').trim();
            const day = getJustDate(row['Tanggal Input']);
            
            if (name && day) {
                performance[name] = performance[name] || { totalPcsDaily: {}, totalOmzetDaily: {} };
                performance[name].totalPcsDaily[day] = (performance[name].totalPcsDaily[day] || 0) + Number(row[pcsField] || 0);
                if (omzetField) {
                    performance[name].totalOmzetDaily[day] = (performance[name].totalOmzetDaily[day] || 0) + parseCurrency(row[omzetField] || 0);
                }
            }
        });

        const bonusSummary = {};
        for (const name in performance) {
            let currentPersonTotalBonus = 0;
            for (const day in performance[name].totalPcsDaily) {
                const dailyPcs = performance[name].totalPcsDaily[day];
                if (dailyPcs >= target) {
                    if (bonusType === 'percentage') {
                        const dailyOmzet = performance[name].totalOmzetDaily[day] || 0;
                        currentPersonTotalBonus += dailyOmzet * bonusRate;
                    } else if (bonusType === 'fixed') {
                        currentPersonTotalBonus += bonusRate;
                    }
                }
            }
            bonusSummary[name] = { totalBonus: currentPersonTotalBonus };
        }
        return bonusSummary;
    }

    const hostDailyData = getPersonUniqueDays(penjualanData, 'Nama Host');
    const adminDailyData = getPersonUniqueDays(penjualanData, 'Nama Admin');
    const treatmentDailyData = getPersonUniqueDays(treatmentData, 'Orang Treatment');

    const hostBonusData = getPersonBonus(penjualanData, 'Nama Host', 'Total Pcs', 'Total Omzet', 0.03, 'percentage', 40);
    const adminBonusData = getPersonBonus(penjualanData, 'Nama Admin', 'Total Pcs', 'Total Omzet', 0.01, 'percentage', 40);
    const treatmentBonusData = getPersonBonus(treatmentData, 'Orang Treatment', 'PCS Treatment', null, 2500, 'fixed', 30);

    const hostSalaryRate = 80000;
    const adminSalaryRate = 60000;
    const treatmentDailyRate = 12500;

    const renderCombinedSalaryBonusTable = (tbodyElement, dailyDataMap, bonusDataMap, rate, type) => {
        tbodyElement.innerHTML = '';
        const allNames = new Set([...Object.keys(dailyDataMap), ...Object.keys(bonusDataMap)]);
        const sortedNames = Array.from(allNames).sort();

        if (sortedNames.length === 0) {
            const colspan = type === 'Treatment' ? '3' : '5';
            tbodyElement.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
            return;
        }

        sortedNames.forEach(name => {
            const uniqueDays = dailyDataMap[name] ? dailyDataMap[name].size : 0;
            const basicSalary = uniqueDays * rate;
            const bonus = bonusDataMap[name] ? bonusDataMap[name].totalBonus : 0;
            const totalCombinedSalary = basicSalary + bonus;
            
            const tr = document.createElement('tr');
            if (type === 'Treatment') {
                tr.innerHTML = `
                    <td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td>
                    <td class="py-2 px-3 text-sm text-gray-500">${uniqueDays.toLocaleString('id-ID')} Hari</td>
                    <td class="py-2 px-3 text-sm font-semibold text-gray-800">${formatCurrency(basicSalary)}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td>
                    <td class="py-2 px-3 text-sm text-gray-500">${uniqueDays.toLocaleString('id-ID')} Hari</td>
                    <td class="py-2 px-3 text-sm text-gray-500">${formatCurrency(basicSalary)}</td>
                    <td class="py-2 px-3 text-sm text-green-600">${formatCurrency(bonus)}</td>
                    <td class="py-2 px-3 text-sm font-semibold text-blue-600">${formatCurrency(totalCombinedSalary)}</td>
                `;
            }
            tbodyElement.appendChild(tr);
        });
    };

    renderCombinedSalaryBonusTable(salesReportHostCombinedTable, hostDailyData, hostBonusData, hostSalaryRate, 'Host');
    renderCombinedSalaryBonusTable(salesReportAdminCombinedTable, adminDailyData, adminBonusData, adminSalaryRate, 'Admin');
    renderCombinedSalaryBonusTable(salesReportTreatmentCombinedTable, treatmentDailyData, treatmentBonusData, treatmentDailyRate, 'Treatment');

    renderMonthlySalesChart(penjualanData);
    renderTopHostSalesTable(penjualanData);
}

function renderMonthlySalesChart(data) {
    const monthlyData = data.reduce((acc, row) => {
        const date = moment(row['Tanggal Input']);
        if (date.isValid()) {
            const monthYear = date.format('YYYY-MM');
            acc[monthYear] = (acc[monthYear] || 0) + parseCurrency(row['Total Omzet'] || 0);
        }
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(monthYear => moment(monthYear, 'YYYY-MM').format('MMM YY'));
    const omzetData = sortedMonths.map(month => monthlyData[month]);

    const ctx = document.getElementById('monthlySalesChart').getContext('2d');

    if (monthlySalesChartInstance) {
        monthlySalesChartInstance.destroy();
    }

    monthlySalesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omzet Penjualan',
                data: omzetData,
                borderColor: '#EC4899',
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Omzet (Rp)' },
                    ticks: { callback: value => formatCurrency(value) }
                },
                x: { title: { display: true, text: 'Bulan' } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    });
}

function renderTopHostSalesTable(data) {
    const hostSales = data.reduce((acc, row) => {
        const hostName = row['Nama Host'] || 'Unknown';
        acc[hostName] = acc[hostName] || { omzet: 0, pcs: 0 };
        acc[hostName].omzet += parseCurrency(row['Total Omzet'] || 0);
        acc[hostName].pcs += Number(row['Total Pcs'] || 0);
        return acc;
    }, {});

    const sortedHosts = Object.keys(hostSales).sort((a, b) => hostSales[b].omzet - hostSales[a].omzet);
    const tbody = salesReportTopHostTable;
    tbody.innerHTML = '';

    if (sortedHosts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
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

function populateFilters() {
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean))];
    const dashboardFilterShift = document.getElementById('dashboardFilterShift');
    const dashboardFilterHost = document.getElementById('dashboardFilterHost');
    const dashboardFilterAdmin = document.getElementById('dashboardFilterAdmin');
    populateDropdown(dashboardFilterShift, getUniqueValues('Shift'), false);
    populateDropdown(dashboardFilterHost, getUniqueValues('Nama Host'), false);
    populateDropdown(dashboardFilterAdmin, getUniqueValues('Nama Admin'), false);
}

function setupForm(formId, type, formFields) {
    const form = document.getElementById(formId);
    
    formFields.omzet?.addEventListener('input', (e) => { e.target.value = formatCurrency(parseCurrency(e.target.value)); });
    
    if (formFields.host) formFields.host.onchange = () => { formFields.backupHostContainer?.classList.toggle('hidden', formFields.host.value !== 'Backup'); };
    if (formFields.admin) formFields.admin.onchange = () => { formFields.backupAdminContainer?.classList.toggle('hidden', formFields.admin.value !== 'Backup'); };
    if (formFields.treatment) formFields.treatment.onchange = () => { formFields.backupTreatmentContainer?.classList.toggle('hidden', formFields.treatment.value !== 'Backup'); };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.querySelector(':invalid')?.focus();
            formFields.status.textContent = 'Error: Mohon isi semua kolom.';
            formFields.status.className = 'mt-4 text-center text-sm h-4 text-red-600';
            return;
        }
        formFields.status.textContent = '';
        const submitBtn = document.getElementById(formFields.submitBtnId);
        const btnText = submitBtn.querySelector('span');
        const loader = submitBtn.querySelector('.loader');
        
        const customerName = formFields.customer?.value.trim();
        if (customerName && ['Penjualan', 'Return'].includes(type)) {
            if (checkDuplicateCustomerToday(customerName, type)) {
                if (!window.confirm(`Peringatan: Nama pelanggan "${customerName}" untuk transaksi ${type} sudah terinput di hari ini. Lanjutkan pengiriman?`)) {
                    formFields.status.textContent = 'Pengiriman dibatalkan.';
                    formFields.status.className = 'mt-4 text-center text-sm h-4 text-gray-600';
                    return;
                }
            }
        }

        btnText.classList.add('hidden'); loader.classList.remove('hidden'); submitBtn.disabled = true;

        const finalHost = formFields.host?.value === 'Backup' ? formFields.backupHostInput?.value.trim() : formFields.host?.value;
        const finalAdmin = formFields.admin?.value === 'Backup' ? formFields.backupAdminInput?.value.trim() : formFields.admin?.value;
        const finalTreatment = formFields.treatment?.value === 'Backup' ? formFields.backupTreatmentInput?.value.trim() : formFields.treatment?.value;

        const omzetValue = parseCurrency(formFields.omzet?.value);
        const formData = {
            action: 'add',
            transactionType: type,
            shift: formFields.shift?.value || '',
            host: finalHost || '',
            adminName: finalAdmin || '',
            customerName: customerName || '',
            totalPcs: formFields.pcs?.value || '',
            totalOmzet: omzetValue || '',
            orangTreatment: finalTreatment || '',
            pcsTreatment: formFields.pcsTreatment?.value || '',
        };
        
        try {
            const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            formFields.status.textContent = `Laporan ${type} berhasil dikirim!`;
            formFields.status.className = 'mt-4 text-center text-sm h-4 text-green-600';
            form.reset();
            if (formFields.backupHostContainer) formFields.backupHostContainer.classList.add('hidden');
            if (formFields.backupAdminContainer) formFields.backupAdminContainer.classList.add('hidden');
            if (formFields.backupTreatmentContainer) formFields.backupTreatmentContainer.classList.add('hidden');
            isDataFetched = false;
        } catch (error) {
            formFields.status.textContent = `Error: ${error.message}`;
            formFields.status.className = 'mt-4 text-center text-sm h-4 text-red-600';
        } finally {
            btnText.classList.remove('hidden'); loader.classList.add('hidden'); submitBtn.disabled = false;
        }
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    });
    [closeSidebarBtn, sidebarOverlay].forEach(el => el.addEventListener('click', closeSidebar));
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId === 'salesReportPage') {
                salesReportPinModal.classList.remove('hidden');
                salesReportPinModal.classList.add('flex');
                salesReportPinInput.focus();
            } else {
                switchPage(pageId);
            }
        });
    });

    populateDropdown(document.getElementById('penjualanHost'), hostList);
    populateDropdown(document.getElementById('penjualanAdmin'), adminList);
    populateDropdown(document.getElementById('returnHost'), hostList);
    populateDropdown(document.getElementById('returnAdmin'), adminList);
    populateDropdown(document.getElementById('treatmentPerson'), treatmentPersonList);

    populateDropdown(editHostInput, hostList);
    populateDropdown(editAdminInput, adminList);
    populateDropdown(editOrangTreatmentInput, treatmentPersonList);

    setupForm('penjualanForm', 'Penjualan', {
         shift: document.getElementById('penjualanShift'), host: document.getElementById('penjualanHost'), admin: document.getElementById('penjualanAdmin'), customer: document.getElementById('penjualanCustomer'), pcs: document.getElementById('penjualanPcs'), omzet: document.getElementById('penjualanOmzet'),
         backupHostContainer: document.getElementById('penjualanBackupHostContainer'), backupAdminContainer: document.getElementById('penjualanBackupAdminContainer'),
         backupHostInput: document.getElementById('penjualanBackupHost'), backupAdminInput: document.getElementById('penjualanBackupAdmin'),
         submitBtnId: 'penjualanSubmitBtn', status: document.getElementById('penjualanStatus'),
    });
    
    setupForm('returnForm', 'Return', {
         host: document.getElementById('returnHost'), admin: document.getElementById('returnAdmin'), customer: document.getElementById('returnCustomer'), pcs: document.getElementById('returnPcs'), omzet: document.getElementById('returnOmzet'),
         backupHostContainer: document.getElementById('returnBackupHostContainer'), backupAdminContainer: document.getElementById('returnBackupAdminContainer'),
         backupHostInput: document.getElementById('returnBackupHost'), backupAdminInput: document.getElementById('returnBackupAdmin'),
         submitBtnId: 'returnSubmitBtn', status: document.getElementById('returnStatus'),
    });

    setupForm('treatmentForm', 'Treatment', {
         treatment: document.getElementById('treatmentPerson'), pcsTreatment: document.getElementById('treatmentPcs'),
         backupTreatmentContainer: document.getElementById('treatmentBackupContainer'), backupTreatmentInput: document.getElementById('treatmentBackupPerson'),
         submitBtnId: 'treatmentSubmitBtn', status: document.getElementById('treatmentStatus'),
    });
    
    const litepickerOptions = {
        singleMode: false, format: 'DD MMM YY', lang: 'id-ID', numberOfMonths: 2,
        dropdowns: { minYear: 2020, maxYear: null, months: true, years: true },
        buttonText: {
            'previousMonth': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`,
            'nextMonth': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>`,
        },
    };

    dashboardDatePicker = new Litepicker({ element: document.getElementById('dashboardDateRangePicker'), ...litepickerOptions, setup: (picker) => { picker.on('selected', () => applyFilters()); }});
    customerDatePicker = new Litepicker({ element: document.getElementById('customerReportDateRangePicker'), ...litepickerOptions, setup: (picker) => { picker.on('selected', () => applyCustomerReportFilters()); }});
    salesReportDatePicker = new Litepicker({ element: document.getElementById('salesReportDateRangePicker'), ...litepickerOptions, setup: (picker) => { picker.on('selected', () => applySalesReportFilters()); }});

    salesReportDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());

    ['input', 'change'].forEach(evt => {
        document.getElementById('dashboardSearchCustomer').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterShift').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterHost').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterAdmin').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterTransactionType').addEventListener(evt, applyFilters);
    });
    
    prevPageBtn.addEventListener('click', () => changePage('prev'));
    nextPageBtn.addEventListener('click', () => changePage('next'));

    exportExcelBtn.addEventListener('click', exportDashboardToExcel);

    pinInputs[0].focus();
});

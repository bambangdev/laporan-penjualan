// --- APP STATE & CONFIG ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzpSVOHsYuDXUoJqHJ4mi2bHiHVT7tqSgD1Q6iq2RKHhwIqszVCfczZUMrNB7zzoFn/exec';
const CORRECT_PIN = '7501';
const SALES_REPORT_PIN = '2232'; 
const EDIT_PIN = '2232';
const hostList = ['wafa', 'debi', 'bunga'];
const adminList = ['Bunga', 'Teh Ros'];
const treatmentPersonList = ['Bunda', 'Resin'];
let allData = [];
let isDataFetched = false;
let dashboardDatePicker, customerDatePicker, salesReportDatePicker;
let currentRowToEdit = null;
let dailySalesChartInstance = null;

// --- Storing customer lists for modals ---
let uniqueCustomerList = [];
let repeatCustomerList = [];

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
const salesReportHostCombinedTable = document.getElementById('salesReportHostCombinedTable');
const salesReportAdminCombinedTable = document.getElementById('salesReportAdminCombinedTable');
const salesReportTreatmentCombinedTable = document.getElementById('salesReportTreatmentCombinedTable');


const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageSpan = document.getElementById('currentPageSpan');
const totalPagesSpan = document.getElementById('totalPagesSpan');

const exportExcelBtn = document.getElementById('exportExcelBtn');

const statPcsTreatment = document.getElementById('statPcsTreatment');
const topBuyersTable = document.getElementById('topBuyersTable');
const topReturnersTable = document.getElementById('topReturnersTable');
const uniqueCustomersCard = document.getElementById('uniqueCustomersCard');
const repeatCustomersCard = document.getElementById('repeatCustomersCard');
const customerListModal = document.getElementById('customerListModal');
const customerListModalTitle = document.getElementById('customerListModalTitle');
const customerListModalBody = document.getElementById('customerListModalBody');
const closeCustomerListModal = document.getElementById('closeCustomerListModal');

const unifiedForm = document.getElementById('unifiedForm');
const transactionTypeSelect = document.getElementById('transactionType');
const penjualanFields = document.getElementById('penjualanFields');
const salesReturnFields = document.getElementById('salesReturnFields');
const treatmentFields = document.getElementById('treatmentFields');
const unifiedSubmitBtn = document.getElementById('unifiedSubmitBtn');
const unifiedFormStatus = document.getElementById('unifiedFormStatus');
const salesReturnHostSelect = document.getElementById('salesReturnHost');
const salesReturnAdminSelect = document.getElementById('salesReturnAdmin');
const treatmentPersonSelect = document.getElementById('treatmentPerson');
const salesReturnBackupHostContainer = document.getElementById('salesReturnBackupHostContainer');
const salesReturnBackupAdminContainer = document.getElementById('salesReturnBackupAdminContainer');
const treatmentBackupContainer = document.getElementById('treatmentBackupContainer');
const salesReturnOmzetInput = document.getElementById('salesReturnOmzet');

// --- NEW LOADER ELEMENTS ---
const dashboardLoader = document.getElementById('dashboardLoader');
const customerLoader = document.getElementById('customerLoader');
const salesLoader = document.getElementById('salesLoader');


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
        if (!isDataFetched) {
            fetchData();
        } else {
            if (pageId === 'dashboardPage') applyFilters();
            if (pageId === 'customerReportPage') applyCustomerReportFilters();
            if (pageId === 'salesReportPage') applySalesReportFilters();
        }
    }
}

// --- LOGIN & MODAL LOGIC ---
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

function showCustomerListModal(title, customers) {
    customerListModalTitle.textContent = title;
    customerListModalBody.innerHTML = '';
    if (customers.length > 0) {
        const list = document.createElement('ul');
        list.className = 'list-disc list-inside space-y-1';
        customers.sort().forEach(customer => {
            const item = document.createElement('li');
            item.textContent = customer;
            list.appendChild(item);
        });
        customerListModalBody.appendChild(list);
    } else {
        customerListModalBody.textContent = 'Tidak ada data customer.';
    }
    customerListModal.classList.remove('hidden');
    customerListModal.classList.add('flex');
}

closeCustomerListModal.addEventListener('click', () => {
    customerListModal.classList.add('hidden');
    customerListModal.classList.remove('flex');
});


// --- DATA FETCHING & RENDERING LOGIC ---
async function fetchData() {
    pageLoader.classList.remove('hidden');
    pageLoader.classList.add('flex');
    pageError.classList.add('hidden');
    
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        allData = result.data.sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
        isDataFetched = true;
        populateFilters(); 
        
        if (document.getElementById('dashboardPage').classList.contains('active')) applyFilters();
        else if (document.getElementById('customerReportPage').classList.contains('active')) applyCustomerReportFilters();
        else if (document.getElementById('salesReportPage').classList.contains('active')) applySalesReportFilters();

    } catch (error) {
        pageError.textContent = `Gagal memuat data: ${error.message}.`;
        pageError.classList.remove('hidden');
    } finally {
        pageLoader.classList.add('hidden');
        pageLoader.classList.remove('flex');
    }
}

// --- DASHBOARD LOGIC ---
function applyFilters() {
    if (!isDataFetched) return;
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
        if(startDate) startDate.setHours(0,0,0,0);
        if(endDate) endDate.setHours(23,59,59,999);

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
        renderDashboardTable();
        
        dashboardLoader.classList.add('hidden');
        dashboardLoader.classList.remove('flex');
    }, 50); // Jeda agar browser render loader
}

function calculateAndRenderStats(data) {
    const penjualanData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const returnData = data.filter(r => r['Jenis Transaksi'] === 'Return');
    const treatmentData = data.filter(r => r['Jenis Transaksi'] === 'Treatment');

    document.getElementById('statPcsPenjualan').textContent = penjualanData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0).toLocaleString('id-ID');
    document.getElementById('statOmzetPenjualan').textContent = formatCurrency(penjualanData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0));
    document.getElementById('statPcsReturn').textContent = returnData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0).toLocaleString('id-ID');
    document.getElementById('statOmzetReturn').textContent = formatCurrency(returnData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0));
    statPcsTreatment.textContent = treatmentData.reduce((s, r) => s + Number(r['PCS Treatment'] || 0), 0).toLocaleString('id-ID');
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
    totalPagesSpan.textContent = totalPages > 0 ? totalPages : 1;
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

    const formData = {
        action: 'edit',
        rowIndex: editRowIndexInput.value,
        timestamp: editOriginalTimestampInput.value,
        transactionType: editTransactionTypeInput.value,
        shift: editShiftInput.value,
        host: finalHost,
        adminName: finalAdmin,
        customerName: editCustomerInput.value.trim(),
        totalPcs: editPcsInput.value,
        totalOmzet: parseCurrency(editOmzetInput.value),
        orangTreatment: finalTreatment,
        pcsTreatment: editPcsTreatmentInput.value,
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
        }, 1500);
    } catch (error) {
        editTransactionStatus.textContent = `Error: ${error.message}`;
        editTransactionStatus.className = 'mt-4 text-center text-sm h-4 text-red-600';
    } finally {
        btnText.classList.remove('hidden'); loader.classList.add('hidden'); submitBtn.disabled = false;
    }
});

// --- CUSTOMER REPORT LOGIC ---
function applyCustomerReportFilters() {
    if (!isDataFetched) return;
    customerLoader.classList.remove('hidden');
    customerLoader.classList.add('flex');

    setTimeout(() => {
        const startDate = customerDatePicker.getStartDate()?.toJSDate();
        const endDate = customerDatePicker.getEndDate()?.toJSDate();
        if(startDate) startDate.setHours(0,0,0,0);
        if(endDate) endDate.setHours(23,59,59,999);
        
        const filteredData = allData.filter(row => {
             const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
             return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
        });
        calculateAndRenderCustomerLeaderboards(filteredData);
        
        customerLoader.classList.add('hidden');
        customerLoader.classList.remove('flex');
    }, 50);
}

function calculateAndRenderCustomerLeaderboards(data) {
    const getTop10 = (sourceData, pcsField, omzetField, sortField = 'omzet') => {
        if (sourceData.length === 0) return [];
        const customerData = sourceData.reduce((acc, row) => {
            const name = String(row['Nama Customer'] || '').trim();
            if(!name || name === '-') return acc;
            acc[name] = acc[name] || { name: name, pcs: 0, omzet: 0 };
            acc[name].pcs += Number(row[pcsField] || 0);
            acc[name].omzet += parseCurrency(row[omzetField] || 0);
            return acc;
        }, {});
        
        return Object.values(customerData)
            .sort((a, b) => b[sortField] - a[sortField])
            .slice(0, 10);
    };

    const renderLeaderboard = (tbodyElement, leaderboardData) => {
        tbodyElement.innerHTML = '';
        if (leaderboardData.length === 0) {
            tbodyElement.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
            return;
        }
        leaderboardData.forEach((customer, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-2 px-3 text-sm font-medium text-gray-900">${index + 1}</td>
                <td class="py-2 px-3 text-sm text-gray-700">${customer.name}</td>
                <td class="py-2 px-3 text-sm font-semibold text-pink-600">${formatCurrency(customer.omzet)}</td>
                <td class="py-2 px-3 text-sm text-gray-500">${customer.pcs.toLocaleString('id-ID')}</td>
            `;
            tbodyElement.appendChild(tr);
        });
    };
    
    const topBuyers = getTop10(data.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Total Pcs', 'Total Omzet', 'omzet');
    const topReturners = getTop10(data.filter(r => r['Jenis Transaksi'] === 'Return'), 'Total Pcs', 'Total Omzet', 'omzet');

    renderLeaderboard(topBuyersTable, topBuyers);
    renderLeaderboard(topReturnersTable, topReturners);
}

// --- SALES REPORT LOGIC ---
function applySalesReportFilters() {
    if (!isDataFetched) return;
    salesLoader.classList.remove('hidden');
    salesLoader.classList.add('flex');

    setTimeout(() => {
        const startDate = salesReportDatePicker.getStartDate()?.toJSDate();
        const endDate = salesReportDatePicker.getEndDate()?.toJSDate();
        if(startDate) startDate.setHours(0, 0, 0, 0);
        if(endDate) endDate.setHours(23, 59, 59, 999);

        // --- Calculation for the previous period ---
        const diffDays = moment(endDate).diff(moment(startDate), 'days') + 1;
        const previousStartDate = moment(startDate).subtract(diffDays, 'days').toDate();
        const previousEndDate = moment(endDate).subtract(diffDays, 'days').toDate();

        const filteredData = allData.filter(row => {
            const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
            return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
        });

        const prevPeriodData = allData.filter(row => {
            const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
            return (!previousStartDate || !rowDate) ? true : (rowDate >= previousStartDate && rowDate <= previousEndDate);
        });


        // --- Helper function to calculate metrics ---
        const calculateMetrics = (data) => {
            const penjualanData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
            const returnData = data.filter(r => r['Jenis Transaksi'] === 'Return');

            const totalPcsPenjualan = penjualanData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0);
            const totalOmzetPenjualan = penjualanData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0);
            const totalOmzetReturn = returnData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0);
            const netOmzet = totalOmzetPenjualan - totalOmzetReturn;

            const customerPurchaseCounts = penjualanData.reduce((acc, row) => {
                const customerName = String(row['Nama Customer'] || '').trim();
                if (customerName && customerName !== '-') acc[customerName] = (acc[customerName] || 0) + 1;
                return acc;
            }, {});
            
            const uniqueCustomers = Object.keys(customerPurchaseCounts).length;
            const repeatCustomers = Object.keys(customerPurchaseCounts).filter(name => customerPurchaseCounts[name] > 1).length;

            return { totalPcsPenjualan, totalOmzetPenjualan, netOmzet, uniqueCustomers, repeatCustomers, totalOmzetReturn };
        };
        
        const currentMetrics = calculateMetrics(filteredData);
        const previousMetrics = calculateMetrics(prevPeriodData);

        // --- Render main metrics ---
        document.getElementById('salesReportTotalPcs').textContent = currentMetrics.totalPcsPenjualan.toLocaleString('id-ID');
        document.getElementById('salesReportTotalOmzet').textContent = formatCurrency(currentMetrics.totalOmzetPenjualan);
        salesReportNetOmzet.textContent = formatCurrency(currentMetrics.netOmzet);
        salesReportReturnRatio.textContent = `${(currentMetrics.totalOmzetPenjualan > 0 ? (currentMetrics.totalOmzetReturn / currentMetrics.totalOmzetPenjualan) * 100 : 0).toFixed(2)}%`;
        salesReportUniqueCustomers.textContent = currentMetrics.uniqueCustomers.toLocaleString('id-ID');
        salesReportRepeatCustomers.textContent = currentMetrics.repeatCustomers.toLocaleString('id-ID');

        // --- Helper function for comparison rendering ---
        const renderComparison = (elementId, currentValue, previousValue) => {
            const element = document.getElementById(elementId);
            if (previousValue === 0) {
                element.innerHTML = '<span>- vs periode lalu</span>';
                element.className = 'text-sm text-gray-500 mt-1';
                return;
            }
            const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
            const arrow = percentageChange >= 0 ? '▲' : '▼';
            const color = percentageChange >= 0 ? 'text-green-600' : 'text-red-600';
            element.innerHTML = `<span class="${color}">${arrow} ${percentageChange.toFixed(2)}%</span> vs periode lalu`;
        };
        
        // --- Render comparison metrics ---
        renderComparison('salesReportTotalPcsComparison', currentMetrics.totalPcsPenjualan, previousMetrics.totalPcsPenjualan);
        renderComparison('salesReportTotalOmzetComparison', currentMetrics.totalOmzetPenjualan, previousMetrics.totalOmzetPenjualan);
        renderComparison('salesReportNetOmzetComparison', currentMetrics.netOmzet, previousMetrics.netOmzet);
        renderComparison('salesReportUniqueCustomersComparison', currentMetrics.uniqueCustomers, previousMetrics.uniqueCustomers);
        renderComparison('salesReportRepeatCustomersComparison', currentMetrics.repeatCustomers, previousMetrics.repeatCustomers);


        // --- Existing code for tables and charts ---
        const treatmentData = filteredData.filter(r => r['Jenis Transaksi'] === 'Treatment');
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
                let totalBonus = 0;
                for (const day in performance[name].totalPcsDaily) {
                    if (performance[name].totalPcsDaily[day] >= target) {
                        if (bonusType === 'percentage') totalBonus += (performance[name].totalOmzetDaily[day] || 0) * bonusRate;
                        else if (bonusType === 'fixed') totalBonus += bonusRate;
                    }
                }
                bonusSummary[name] = { totalBonus };
            }
            return bonusSummary;
        }

        const hostDailyData = getPersonUniqueDays(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Nama Host');
        const adminDailyData = getPersonUniqueDays(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Nama Admin');
        const treatmentDailyData = getPersonUniqueDays(treatmentData, 'Orang Treatment');
        const hostBonusData = getPersonBonus(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Nama Host', 'Total Pcs', 'Total Omzet', 0.03, 'percentage', 40);
        const adminBonusData = getPersonBonus(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Nama Admin', 'Total Pcs', 'Total Omzet', 0.01, 'percentage', 40);
        const treatmentBonusData = getPersonBonus(treatmentData, 'Orang Treatment', 'PCS Treatment', null, 2500, 'fixed', 30);
        const hostSalaryRate = 80000, adminSalaryRate = 60000, treatmentDailyRate = 12500;

        const renderCombinedSalaryBonusTable = (tbody, dataMap, bonusMap, rate, type) => {
            tbody.innerHTML = '';
            const allNames = new Set([...Object.keys(dataMap), ...Object.keys(bonusMap)]);
            const sortedNames = Array.from(allNames).sort();

            if (sortedNames.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${type === 'Treatment' ? 3 : 5}" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
                return;
            }

            sortedNames.forEach(name => {
                const uniqueDays = dataMap[name] ? dataMap[name].size : 0;
                const basicSalary = uniqueDays * rate;
                const bonus = bonusMap[name] ? bonusMap[name].totalBonus : 0;
                const total = basicSalary + bonus;
                const tr = document.createElement('tr');
                if (type === 'Treatment') {
                    tr.innerHTML = `<td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td><td class="py-2 px-3 text-sm text-gray-500">${uniqueDays} Hari</td><td class="py-2 px-3 text-sm font-semibold text-gray-800">${formatCurrency(basicSalary)}</td>`;
                } else {
                    tr.innerHTML = `<td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td><td class="py-2 px-3 text-sm text-gray-500">${uniqueDays} Hari</td><td class="py-2 px-3 text-sm text-gray-500">${formatCurrency(basicSalary)}</td><td class="py-2 px-3 text-sm text-green-600">${formatCurrency(bonus)}</td><td class="py-2 px-3 text-sm font-semibold text-blue-600">${formatCurrency(total)}</td>`;
                }
                tbody.appendChild(tr);
            });
        };

        renderCombinedSalaryBonusTable(salesReportHostCombinedTable, hostDailyData, hostBonusData, hostSalaryRate, 'Host');
        renderCombinedSalaryBonusTable(salesReportAdminCombinedTable, adminDailyData, adminBonusData, adminSalaryRate, 'Admin');
        renderCombinedSalaryBonusTable(salesReportTreatmentCombinedTable, treatmentDailyData, treatmentBonusData, treatmentDailyRate, 'Treatment');

        renderDailySalesChart(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), startDate, endDate);
        renderTopHostSalesTable(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'));

        salesLoader.classList.add('hidden');
        salesLoader.classList.remove('flex');
    }, 50);
}

function renderDailySalesChart(data, startDate, endDate) {
    const dailyData = {};
    
    if (startDate && endDate) {
        let currentDay = moment(startDate);
        while(currentDay.isSameOrBefore(endDate, 'day')) {
            dailyData[currentDay.format('YYYY-MM-DD')] = 0;
            currentDay.add(1, 'day');
        }
    }
    
    data.forEach(row => {
        const date = moment(row['Tanggal Input']);
        if (date.isValid()) {
            const day = date.format('YYYY-MM-DD');
            if(dailyData.hasOwnProperty(day)) {
               dailyData[day] += parseCurrency(row['Total Omzet'] || 0);
            }
        }
    });

    const sortedDays = Object.keys(dailyData).sort();
    const labels = sortedDays.map(day => moment(day).format('DD MMM'));
    const omzetData = sortedDays.map(day => dailyData[day]);

    const ctx = document.getElementById('dailySalesChart').getContext('2d');
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();

    dailySalesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omzet Penjualan Harian',
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
                y: { beginAtZero: true, title: { display: true, text: 'Omzet (Rp)' }, ticks: { callback: value => formatCurrency(value).replace('Rp ', '') } },
                x: { title: { display: true, text: 'Tanggal' } }
            },
            plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: ${formatCurrency(context.raw)}` } } }
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
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean).sort())];
    const dashboardFilterShift = document.getElementById('dashboardFilterShift');
    const dashboardFilterHost = document.getElementById('dashboardFilterHost');
    const dashboardFilterAdmin = document.getElementById('dashboardFilterAdmin');
    populateDropdown(dashboardFilterShift, getUniqueValues('Shift'), false);
    populateDropdown(dashboardFilterHost, getUniqueValues('Nama Host'), false);
    populateDropdown(dashboardFilterAdmin, getUniqueValues('Nama Admin'), false);
}

// --- UNIFIED FORM LOGIC ---
function setupUnifiedForm() {
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

    salesReturnHostSelect.addEventListener('change', () => {
        salesReturnBackupHostContainer.classList.toggle('hidden', salesReturnHostSelect.value !== 'Backup');
    });
    salesReturnAdminSelect.addEventListener('change', () => {
        salesReturnBackupAdminContainer.classList.toggle('hidden', salesReturnAdminSelect.value !== 'Backup');
    });
    treatmentPersonSelect.addEventListener('change', () => {
        treatmentBackupContainer.classList.toggle('hidden', treatmentPersonSelect.value !== 'Backup');
    });
    salesReturnOmzetInput.addEventListener('input', (e) => {
        e.target.value = formatCurrency(parseCurrency(e.target.value));
    });

    unifiedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedType = transactionTypeSelect.value;
        if (!selectedType) {
            unifiedFormStatus.textContent = 'Error: Mohon pilih jenis transaksi.';
            unifiedFormStatus.className = 'mt-4 text-center text-sm h-4 text-red-600';
            return;
        }

        unifiedFormStatus.textContent = '';
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
                host: finalHost,
                adminName: finalAdmin,
                customerName: customerName,
                totalPcs: document.getElementById('salesReturnPcs').value,
                totalOmzet: parseCurrency(salesReturnOmzetInput.value)
            });
        } else if (selectedType === 'Treatment') {
            const finalTreatment = treatmentPersonSelect.value === 'Backup' ? document.getElementById('treatmentBackupPerson').value.trim() : treatmentPersonSelect.value;
            Object.assign(formData, {
                orangTreatment: finalTreatment,
                pcsTreatment: document.getElementById('treatmentPcs').value
            });
        }

        if (customerName && ['Penjualan', 'Return'].includes(selectedType)) {
            if (checkDuplicateCustomerToday(customerName, selectedType)) {
                if (!confirm(`Peringatan: Nama pelanggan "${customerName}" untuk transaksi ${selectedType} sudah terinput hari ini. Lanjutkan?`)) {
                    unifiedFormStatus.textContent = 'Pengiriman dibatalkan.';
                    unifiedFormStatus.className = 'mt-4 text-center text-sm h-4 text-gray-600';
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
            unifiedFormStatus.textContent = `Laporan ${selectedType} berhasil dikirim!`;
            unifiedFormStatus.className = 'mt-4 text-center text-sm h-4 text-green-600';
            unifiedForm.reset();
            allFieldsets.forEach(fs => fs.classList.add('hidden'));
            isDataFetched = false;
        } catch (error) {
            unifiedFormStatus.textContent = `Error: ${error.message}`;
            unifiedFormStatus.className = 'mt-4 text-center text-sm h-4 text-red-600';
        } finally {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            unifiedSubmitBtn.disabled = false;
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

    populateDropdown(salesReturnHostSelect, hostList);
    populateDropdown(salesReturnAdminSelect, adminList);
    populateDropdown(treatmentPersonSelect, treatmentPersonList);

    populateDropdown(editHostInput, hostList);
    populateDropdown(editAdminInput, adminList);
    populateDropdown(editOrangTreatmentInput, treatmentPersonList);

    setupUnifiedForm();
    
    const litepickerOptions = {
        singleMode: false, format: 'DD MMM YY', lang: 'id-ID', numberOfMonths: 2,
        dropdowns: { minYear: 2020, maxYear: null, months: true, years: true },
        buttonText: {
            'previousMonth': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`,
            'nextMonth': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>`,
        },
    };

    dashboardDatePicker = new Litepicker({ element: document.getElementById('dashboardDateRangePicker'), ...litepickerOptions, setup: (picker) => { picker.on('selected', applyFilters); }});
    customerDatePicker = new Litepicker({ element: document.getElementById('customerReportDateRangePicker'), ...litepickerOptions, setup: (picker) => { picker.on('selected', applyCustomerReportFilters); }});
    salesReportDatePicker = new Litepicker({ element: document.getElementById('salesReportDateRangePicker'), ...litepickerOptions, setup: (picker) => { picker.on('selected', applySalesReportFilters); }});

    dashboardDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
    customerDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
    salesReportDatePicker.setDateRange(moment().subtract(6, 'days').toDate(), moment().toDate());

    document.getElementById('dashboardSearchCustomer').addEventListener('input', applyFilters);
    document.getElementById('dashboardFilterShift').addEventListener('change', applyFilters);
    document.getElementById('dashboardFilterHost').addEventListener('change', applyFilters);
    document.getElementById('dashboardFilterAdmin').addEventListener('change', applyFilters);
    document.getElementById('dashboardFilterTransactionType').addEventListener('change', applyFilters);
    
    prevPageBtn.addEventListener('click', () => changePage('prev'));
    nextPageBtn.addEventListener('click', () => changePage('next'));
    exportExcelBtn.addEventListener('click', exportDashboardToExcel);

    uniqueCustomersCard.addEventListener('click', () => showCustomerListModal('Daftar Customer Unik', uniqueCustomerList));
    repeatCustomersCard.addEventListener('click', () => showCustomerListModal('Daftar Customer Repeat', repeatCustomerList));

    pinInputs[0].focus();
});

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
            
            const customerName = row['Nama Customer'] || '-';
            const customerHTML = customerName !== '-' 
                ? `<button class="text-left text-blue-600 hover:underline customer-history-btn">${customerName}</button>`
                : '<span>-</span>';

            tr.innerHTML = `
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-900">${tanggalFormatted}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm">${customerHTML}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Shift'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Nama Host'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Nama Admin'] || '-'}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${Number(row['Total Pcs'] || 0).toLocaleString('id-ID')}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(row['Total Omzet'])}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${row['Jenis Transaksi']}</td>
                <td class="py-4 px-4 whitespace-nowrap text-sm text-gray-500">${Number(row['PCS Treatment'] || 0).toLocaleString('id-ID')}</td>
                <td class="py-4 px-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button class="text-indigo-600 hover:text-indigo-900 edit-row-btn">Edit</button>
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

    document.querySelectorAll('.customer-history-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            showCustomerHistory(e.target.textContent);
        });
    });
}

function showCustomerHistory(customerName) {
    const modal = document.getElementById('customerHistoryModal');
    const nameSpan = document.getElementById('historyCustomerName');
    const bodyDiv = document.getElementById('customerHistoryBody');

    if (!modal || !nameSpan || !bodyDiv) return;

    nameSpan.textContent = customerName;
    bodyDiv.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat...</p>';
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const customerTransactions = allData
        .filter(row => row['Nama Customer'] === customerName)
        .sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));

    if (customerTransactions.length === 0) {
        bodyDiv.innerHTML = '<p class="text-center text-gray-500">Tidak ada riwayat transaksi untuk pelanggan ini.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full bg-white divide-y divide-gray-200 text-sm">';
    tableHTML += `
        <thead class="bg-gray-50">
            <tr>
                <th class="py-2 px-3 text-left font-medium text-gray-500">Tanggal</th>
                <th class="py-2 px-3 text-left font-medium text-gray-500">Jenis</th>
                <th class="py-2 px-3 text-right font-medium text-gray-500">Omzet</th>
                <th class="py-2 px-3 text-right font-medium text-gray-500">PCS</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
    `;

    customerTransactions.forEach(row => {
        const tanggal = new Date(row['Tanggal Input']).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const omzet = formatCurrency(row['Total Omzet']);
        const pcs = Number(row['Total Pcs'] || 0).toLocaleString('id-ID');
        const jenis = row['Jenis Transaksi'];
        const colorClass = jenis === 'Return' ? 'text-red-600' : 'text-green-600';

        tableHTML += `
            <tr>
                <td class="py-2 px-3">${tanggal}</td>
                <td class="py-2 px-3 font-medium ${jenis === 'Return' ? 'text-red-500' : ''}">${jenis}</td>
                <td class="py-2 px-3 text-right font-semibold ${colorClass}">${omzet}</td>
                <td class="py-2 px-3 text-right">${pcs}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    bodyDiv.innerHTML = tableHTML;
}

function populateCustomerAutocomplete(data) {
    const customerDatalist = document.getElementById('customerSuggestions');
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
    // ... (Fungsi applyFilters tetap sama, tidak ada perubahan) ...
}

function changePage(direction) {
    // ... (Fungsi changePage tetap sama, tidak ada perubahan) ...
}

function exportDashboardToExcel() {
    // ... (Fungsi exportDashboardToExcel tetap sama, tidak ada perubahan) ...
}

function populateEditModal(data) {
    // ... (Fungsi populateEditModal tetap sama, tidak ada perubahan) ...
}

async function handleEditFormSubmit(e) {
    // ... (Fungsi handleEditFormSubmit tetap sama, tidak ada perubahan) ...
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
    // ... (sisa fungsi setupDashboardPage, TAPI dengan tambahan listener di bawah) ...

    if (!searchInput.dataset.listenerAttached) {
        // ... (semua listener lain yang sudah ada)

        const closeHistoryModalBtn = document.getElementById('closeCustomerHistoryModal');
        if (closeHistoryModalBtn) {
            closeHistoryModalBtn.addEventListener('click', () => {
                const modal = document.getElementById('customerHistoryModal');
                if(modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            });
        }
        
        searchInput.dataset.listenerAttached = 'true';
    }
    // ... (sisa fungsi) ...
}

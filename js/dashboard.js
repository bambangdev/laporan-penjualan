import { SCRIPT_URL, EDIT_PIN, hostList, adminList, treatmentPersonList, formatCurrency, parseCurrency, populateDropdown, showToast } from './utils.js';

let allData = [];
let filteredDashboardData = [];
let currentPage = 1;
const rowsPerPage = 30;
let dashboardDatePicker;
let currentRowToAction = null;

export function renderDashboardHTML() {
    const page = document.getElementById('dashboardPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div id="dashboardContent" class="relative">
            <div id="dashboardLoader" class="absolute inset-0 bg-gray-100 bg-opacity-80 z-10 hidden items-center justify-center flex-col space-y-4">
                <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
                <p class="text-xl font-semibold text-gray-700">Memuat data...</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg bg-gray-50">
                <input type="search" id="dashboardSearchCustomer" placeholder="Cari Nama Customer..." class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <select id="dashboardFilterShift" class="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Semua Shift</option></select>
                <select id="dashboardFilterHost" class="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Semua Host</option></select>
                <select id="dashboardFilterAdmin" class="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">Semua Admin</option></select>
                <select id="dashboardFilterTransactionType" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Semua Jenis Transaksi</option>
                    <option value="Penjualan">Penjualan</option>
                    <option value="Return">Return</option>
                    <option value="Treatment">Treatment</option>
                </select>
                <div class="col-span-1 sm:col-span-2 lg:col-span-4"><input type="text" id="dashboardDateRangePicker" placeholder="Pilih rentang tanggal" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div class="stat-card"><p class="text-sm text-gray-500">Total PCS Penjualan</p><p id="statPcsPenjualan" class="text-2xl font-bold text-gray-900">0</p></div>
                <div class="stat-card"><p class="text-sm text-gray-500">Total Omzet Penjualan</p><p id="statOmzetPenjualan" class="text-2xl font-bold text-green-600">Rp 0</p></div>
                <div class="stat-card"><p class="text-sm text-gray-500">Total PCS Return</p><p id="statPcsReturn" class="text-2xl font-bold text-gray-900">0</p></div>
                <div class="stat-card"><p class="text-sm text-gray-500">Total Omzet Return</p><p id="statOmzetReturn" class="text-2xl font-bold text-red-600">Rp 0</p></div>
                <div class="stat-card"><p class="text-sm text-gray-500">Total PCS Treatment</p><p id="statPcsTreatment" class="text-2xl font-bold text-blue-600">0</p></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                 <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Host Berdasarkan Omzet Penjualan</h3>
                 <div class="table-responsive border rounded-lg"><table class="min-w-full bg-white"><thead class="bg-gray-50"><tr><th class="th-cell">Peringkat</th><th class="th-cell">Nama Host</th><th class="th-cell">Total Omzet</th><th class="th-cell">Total Pcs</th></tr></thead><tbody id="dashboardTopHostTable"></tbody></table></div>
            </div>
            <div class="mt-8">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Data Transaksi</h3>
                <div id="dashboardTableContainer" class="table-responsive"><table class="min-w-full bg-white"><thead class="bg-gray-50"><tr><th class="th-cell">Tanggal</th><th class="th-cell">Customer</th><th class="th-cell">Shift</th><th class="th-cell">Host</th><th class="th-cell">Admin</th><th class="th-cell">Pcs</th><th class="th-cell">Omzet</th><th class="th-cell">Jenis</th><th class="th-cell">Pcs Treat.</th><th class="th-cell">Aksi</th></tr></thead><tbody id="dashboardTableBody"></tbody></table></div>
                <div class="flex justify-between items-center mt-4">
                    <button id="prevPageBtn" class="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg pagination-btn">Sebelumnya</button>
                    <span>Halaman <span id="currentPageSpan">1</span> dari <span id="totalPagesSpan">1</span></span>
                    <button id="nextPageBtn" class="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg pagination-btn">Berikutnya</button>
                </div>
            </div>
        </div>
    `;
}

function applyFilters() {
    const dashboardLoader = document.getElementById('dashboardLoader');
    if (dashboardLoader) {
        dashboardLoader.classList.remove('hidden');
        dashboardLoader.classList.add('flex');
    }

    // Use a short timeout to allow the loader to render before the heavy filtering task
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
        renderDashboardTable();

        if (dashboardLoader) {
            dashboardLoader.classList.add('hidden');
            dashboardLoader.classList.remove('flex');
        }
    }, 50);
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

function renderTopHostSalesTableForDashboard(data) {
    const tableBody = document.getElementById('dashboardTopHostTable');
    if (!tableBody) return;

    const hostSales = data.reduce((acc, row) => {
        const host = row['Nama Host'];
        if (!host) return acc;
        acc[host] = acc[host] || { name: host, omzet: 0, pcs: 0 };
        acc[host].omzet += parseCurrency(row['Total Omzet'] || 0);
        acc[host].pcs += Number(row['Total Pcs'] || 0);
        return acc;
    }, {});

    const sortedHosts = Object.values(hostSales).sort((a, b) => b.omzet - a.omzet).slice(0, 5);

    tableBody.innerHTML = '';
    if (sortedHosts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Tidak ada data penjualan untuk ditampilkan.</td></tr>';
        return;
    }

    sortedHosts.forEach((host, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b';
        tr.innerHTML = `
            <td class="td-cell text-center font-bold">${index + 1}</td>
            <td class="td-cell">${host.name}</td>
            <td class="td-cell font-semibold text-green-600">${formatCurrency(host.omzet)}</td>
            <td class="td-cell">${host.pcs.toLocaleString('id-ID')} pcs</td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderDashboardTable() {
    const tableBody = document.getElementById('dashboardTableBody');
    const currentPageSpan = document.getElementById('currentPageSpan');
    const totalPagesSpan = document.getElementById('totalPagesSpan');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (!tableBody || !currentPageSpan || !totalPagesSpan || !prevPageBtn || !nextPageBtn) return;
    
    const totalRows = filteredDashboardData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    
    const startRow = (currentPage - 1) * rowsPerPage;
    const endRow = startRow + rowsPerPage;
    const paginatedData = filteredDashboardData.slice(startRow, endRow);

    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-10 text-gray-500">Tidak ada data yang cocok dengan filter Anda.</td></tr>';
    } else {
        paginatedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="td-cell">${moment(row['Tanggal Input']).format('DD MMM YYYY, HH:mm')}</td>
                <td class="td-cell">${row['Nama Customer'] || '-'}</td>
                <td class="td-cell">${row['Shift'] || '-'}</td>
                <td class="td-cell">${row['Nama Host'] || '-'}</td>
                <td class="td-cell">${row['Nama Admin'] || '-'}</td>
                <td class="td-cell">${Number(row['Total Pcs'] || 0).toLocaleString('id-ID')}</td>
                <td class="td-cell">${row['Total Omzet'] ? formatCurrency(row['Total Omzet']) : '-'}</td>
                <td class="td-cell"><span class="px-2 py-1 text-xs font-semibold rounded-full ${row['Jenis Transaksi'] === 'Penjualan' ? 'bg-green-100 text-green-800' : row['Jenis Transaksi'] === 'Return' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">${row['Jenis Transaksi']}</span></td>
                <td class="td-cell">${Number(row['PCS Treatment'] || 0).toLocaleString('id-ID')}</td>
                <td class="td-cell">
                    <button class="text-red-500 hover:text-red-700 delete-row-btn" data-row-index="${row.rowIndex}">Hapus</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    currentPageSpan.textContent = totalPages === 0 ? 0 : currentPage;
    totalPagesSpan.textContent = totalPages;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    document.querySelectorAll('.delete-row-btn').forEach(button => {
        button.addEventListener('click', handleDeleteRow);
    });
}

async function handleDeleteRow(event) {
    const button = event.target;
    const rowIndex = button.dataset.rowIndex;
    
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.`)) return;

    const password = prompt("Masukkan PIN untuk menghapus:", "");
    if (password !== EDIT_PIN) {
        showToast("PIN salah.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = 'Menghapus...';
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'deleteTransaction', rowIndex: rowIndex })
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        showToast('Transaksi berhasil dihapus!', 'success');
        document.dispatchEvent(new CustomEvent('dataChanged'));
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        button.disabled = false;
        button.textContent = 'Hapus';
    }
}

function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next') {
        const totalPages = Math.ceil(filteredDashboardData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
        }
    }
    renderDashboardTable();
}

function populateDashboardFilters() {
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean).sort())];
    
    populateDropdown(document.getElementById('dashboardFilterShift'), getUniqueValues('Shift'), false);
    populateDropdown(document.getElementById('dashboardFilterHost'), hostList, false);
    populateDropdown(document.getElementById('dashboardFilterAdmin'), adminList, false);
}

export function setupDashboardPage(data) {
    allData = data;
    const dashboardPage = document.getElementById('dashboardPage');
    if (!dashboardPage || dashboardPage.innerHTML === '') return; // Don't run if page not rendered

    if (!dashboardDatePicker || !document.getElementById('dashboardDateRangePicker').litepickerInstance) {
        dashboardDatePicker = new Litepicker({
            element: document.getElementById('dashboardDateRangePicker'),
            singleMode: false,
            format: 'DD MMM YYYY',
            lang: 'id-ID',
            tooltipText: { "one": "hari", "other": "hari" },
            dropdowns: { "minYear": 2020, "maxYear": null, "months": true, "years": true },
            setup: (picker) => {
                picker.on('selected', (date1, date2) => {
                    applyFilters();
                });
            }
        });
    }

    const searchInput = document.getElementById('dashboardSearchCustomer');
    if (!searchInput.dataset.listenerAttached) {
        searchInput.addEventListener('input', applyFilters);
        document.getElementById('dashboardFilterShift').addEventListener('change', applyFilters);
        document.getElementById('dashboardFilterHost').addEventListener('change', applyFilters);
        document.getElementById('dashboardFilterAdmin').addEventListener('change', applyFilters);
        document.getElementById('dashboardFilterTransactionType').addEventListener('change', applyFilters);
        document.getElementById('prevPageBtn').addEventListener('click', () => changePage('prev'));
        document.getElementById('nextPageBtn').addEventListener('click', () => changePage('next'));
        searchInput.dataset.listenerAttached = 'true';
    }
    
    populateDashboardFilters();
    // Set initial date range to this month and apply filters
    const today = moment();
    dashboardDatePicker.setDateRange(today.startOf('month').toDate(), today.endOf('month').toDate());
}

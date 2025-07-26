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
                 <div class="table-responsive border rounded-lg"><table class="min-w-full bg-white"><tbody id="dashboardTopHostTable"></tbody></table></div>
            </div>
            <div class="mt-8">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Data Transaksi</h3>
                <div id="dashboardTableContainer" class="table-responsive"><table class="min-w-full bg-white"><tbody id="dashboardTableBody"></tbody></table></div>
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
        renderDashboardTable();

        dashboardLoader.classList.add('hidden');
        dashboardLoader.classList.remove('flex');
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

function renderDashboardTable() {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

function showCustomerHistory(customerName) {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

function populateCustomerAutocomplete(data) {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

function changePage(direction) {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

function exportDashboardToExcel() {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

function populateEditModal(data) {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

async function handleEditFormSubmit(e) {
    // ... (Fungsi lengkap dari file dashboard.js yang Anda unggah)
}

function populateDashboardFilters() {
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean).sort())];
    populateDropdown(document.getElementById('dashboardFilterShift'), getUniqueValues('Shift'), false);
    populateDropdown(document.getElementById('dashboardFilterHost'), getUniqueValues('Nama Host'), false);
    populateDropdown(document.getElementById('dashboardFilterAdmin'), getUniqueValues('Nama Admin'), false);
}

export function setupDashboardPage(data) {
    allData = data;
    const searchInput = document.getElementById('dashboardSearchCustomer');
    if (!searchInput) return;

    if (!dashboardDatePicker || !document.getElementById('dashboardDateRangePicker').litepickerInstance) {
        dashboardDatePicker = new Litepicker({
            element: document.getElementById('dashboardDateRangePicker'),
            singleMode: false,
            // ... (opsi lainnya)
            setup: (picker) => picker.on('selected', applyFilters)
        });
    }

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
    applyFilters();
}

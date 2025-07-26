import { formatCurrency, parseCurrency, populateDropdown } from './utils.js';
let allData = [];
let dashboardDatePicker;
// ... (variabel global lain)

export function renderDashboardHTML() {
    const page = document.getElementById('dashboardPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div id="dashboardContent" class="relative">
            <div id="dashboardLoader" class="absolute inset-0 bg-gray-100 bg-opacity-80 z-10 hidden items-center justify-center flex-col space-y-4"></div>
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
            <div id="statsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div class="stat-card"><p class="text-sm">Total PCS Penjualan</p><p id="statPcsPenjualan" class="text-2xl font-bold">0</p></div>
                <div class="stat-card"><p class="text-sm">Total Omzet Penjualan</p><p id="statOmzetPenjualan" class="text-2xl font-bold text-green-600">Rp 0</p></div>
                <div class="stat-card"><p class="text-sm">Total PCS Return</p><p id="statPcsReturn" class="text-2xl font-bold">0</p></div>
                <div class="stat-card"><p class="text-sm">Total Omzet Return</p><p id="statOmzetReturn" class="text-2xl font-bold text-red-600">Rp 0</p></div>
                <div class="stat-card"><p class="text-sm">Total PCS Treatment</p><p id="statPcsTreatment" class="text-2xl font-bold text-blue-600">0</p></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                 <h3 class="text-lg font-semibold">Top Host Berdasarkan Omzet Penjualan</h3>
                 <div class="table-responsive border rounded-lg mt-4"><table class="min-w-full"><tbody id="dashboardTopHostTable"></tbody></table></div>
            </div>
            <div class="mt-8">
                <h3 class="text-lg font-semibold">Data Transaksi</h3>
                <div id="dashboardTableContainer" class="table-responsive mt-4"><table class="min-w-full"><tbody id="dashboardTableBody"></tbody></table></div>
                <div class="flex justify-between items-center mt-4">
                    <button id="prevPageBtn" class="pagination-btn">Sebelumnya</button>
                    <span>Halaman <span id="currentPageSpan">1</span> dari <span id="totalPagesSpan">1</span></span>
                    <button id="nextPageBtn" class="pagination-btn">Berikutnya</button>
                </div>
            </div>
        </div>
    `;
}

export function setupDashboardPage(data) {
    allData = data;
    const searchInput = document.getElementById('dashboardSearchCustomer');
    if (!searchInput) return;

    function applyFilters() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
    
    // Inisialisasi & event listener
    dashboardDatePicker = new Litepicker({ element: document.getElementById('dashboardDateRangePicker'), setup: (picker) => { picker.on('selected', applyFilters); } });
    searchInput.addEventListener('input', applyFilters);
    document.getElementById('dashboardFilterShift').addEventListener('change', applyFilters);
    // ... (listener lainnya)
    
    applyFilters(); // Panggil pertama kali untuk mengisi data
}

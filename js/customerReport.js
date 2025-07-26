import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let customerDatePicker;

/**
 * Merender struktur HTML dasar untuk halaman Laporan Customer.
 */
export function renderCustomerReportHTML() {
    const page = document.getElementById('customerReportPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Laporan Customer</h1>
        <div class="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <label for="customerReportDateRangePicker" class="block text-sm font-medium text-gray-700 mb-1">Pilih Rentang Tanggal</label>
            <input type="text" id="customerReportDateRangePicker" placeholder="Filter data berdasarkan tanggal" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Top 10 Customer (Pembelian Terbanyak)</h4>
                <div class="table-responsive border rounded-lg bg-white shadow-sm">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="th-cell text-center">#</th>
                                <th class="th-cell">Nama Customer</th>
                                <th class="th-cell">Total Omzet</th>
                                <th class="th-cell text-right">Pcs</th>
                            </tr>
                        </thead>
                        <tbody id="topBuyersTable"></tbody>
                    </table>
                </div>
            </div>
            <div>
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Top 10 Customer (Return Terbanyak)</h4>
                <div class="table-responsive border rounded-lg bg-white shadow-sm">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="th-cell text-center">#</th>
                                <th class="th-cell">Nama Customer</th>
                                <th class="th-cell">Total Omzet</th>
                                <th class="th-cell text-right">Pcs</th>
                            </tr>
                        </thead>
                        <tbody id="topReturnersTable"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/**
 * Menghitung dan merender papan peringkat untuk pembeli dan peretur teratas.
 */
function calculateAndRenderCustomerLeaderboards() {
    const topBuyersTable = document.getElementById('topBuyersTable');
    const topReturnersTable = document.getElementById('topReturnersTable');
    if (!topBuyersTable || !topReturnersTable) return;

    // Ambil rentang tanggal dari date picker
    const startDate = customerDatePicker.getStartDate()?.toJSDate();
    const endDate = customerDatePicker.getEndDate()?.toJSDate();
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    // Filter data utama berdasarkan rentang tanggal yang dipilih
    const filteredData = allData.filter(row => {
        const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
        return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
    });

    /**
     * Fungsi generik untuk mengagregasi data customer dan mengambil top 10.
     * @param {Array} sourceData - Data transaksi yang sudah difilter.
     * @param {string} pcsField - Nama kolom untuk jumlah Pcs.
     * @param {string} omzetField - Nama kolom untuk Omzet.
     * @returns {Array} - Array berisi 10 customer teratas.
     */
    const getTop10 = (sourceData, pcsField, omzetField) => {
        if (sourceData.length === 0) return [];
        
        // Gunakan reduce untuk mengelompokkan data berdasarkan nama customer
        const customerData = sourceData.reduce((acc, row) => {
            const name = String(row['Nama Customer'] || '').trim();
            if (!name || name === '-') return acc; // Abaikan jika nama kosong atau '-'
            
            acc[name] = acc[name] || { name: name, pcs: 0, omzet: 0 };
            acc[name].pcs += Number(row[pcsField] || 0);
            acc[name].omzet += parseCurrency(row[omzetField] || 0);
            return acc;
        }, {});

        // Ubah objek menjadi array, urutkan berdasarkan omzet, dan ambil 10 teratas
        return Object.values(customerData).sort((a, b) => b.omzet - a.omzet).slice(0, 10);
    };

    /**
     * Merender data papan peringkat ke dalam tabel.
     * @param {HTMLElement} tbodyElement - Elemen tbody tabel.
     * @param {Array} leaderboardData - Data yang akan dirender.
     */
    const renderLeaderboard = (tbodyElement, leaderboardData) => {
        tbodyElement.innerHTML = '';
        if (leaderboardData.length === 0) {
            tbodyElement.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-sm text-gray-400">Tidak ada data untuk periode ini.</td></tr>`;
            return;
        }
        leaderboardData.forEach((customer, index) => {
            const tr = document.createElement('tr');
            tr.className = 'border-b';
            tr.innerHTML = `
                <td class="td-cell text-center font-medium text-gray-500">${index + 1}</td>
                <td class="td-cell font-semibold text-gray-800">${customer.name}</td>
                <td class="td-cell text-pink-600 font-bold">${formatCurrency(customer.omzet)}</td>
                <td class="td-cell text-right text-gray-500">${customer.pcs.toLocaleString('id-ID')}</td>
            `;
            tbodyElement.appendChild(tr);
        });
    };

    // Hitung dan render untuk kedua kategori
    const topBuyers = getTop10(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Total Pcs', 'Total Omzet');
    const topReturners = getTop10(filteredData.filter(r => r['Jenis Transaksi'] === 'Return'), 'Total Pcs', 'Total Omzet');

    renderLeaderboard(topBuyersTable, topBuyers);
    renderLeaderboard(topReturnersTable, topReturners);
}

/**
 * Menyiapkan event listener dan data untuk halaman Laporan Customer.
 * @param {Array} data - Semua data transaksi.
 */
export function setupCustomerReportPage(data) {
    allData = data;
    const datePickerElement = document.getElementById('customerReportDateRangePicker');
    if (!datePickerElement) return;

    if (!customerDatePicker || !datePickerElement.litepickerInstance) {
        customerDatePicker = new Litepicker({
            element: datePickerElement,
            singleMode: false, 
            format: 'DD MMM YY', 
            lang: 'id-ID',
            setup: (picker) => picker.on('selected', calculateAndRenderCustomerLeaderboards),
        });
        // Atur rentang tanggal awal ke bulan ini
        customerDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
    }
    
    // Panggil fungsi untuk merender data pertama kali
    calculateAndRenderCustomerLeaderboards();
}

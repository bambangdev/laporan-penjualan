import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let salesReportDatePicker;
let dailySalesChartInstance = null; // Variabel untuk menyimpan instance chart

/**
 * Merender struktur HTML dasar untuk halaman Laporan Penjualan.
 */
export function renderSalesReportHTML() {
    const page = document.getElementById('salesReportPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Sales Report (Bonus)</h1>
        
        <div class="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <label for="salesReportDateRangePicker" class="block text-sm font-medium text-gray-700 mb-1">Pilih Rentang Tanggal</label>
            <input type="text" id="salesReportDateRangePicker" placeholder="Filter data berdasarkan tanggal" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Grafik Omzet Penjualan Harian</h3>
            <canvas id="dailySalesChart" height="100"></canvas>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Top 5 Host Berdasarkan Omzet</h3>
            <div class="table-responsive">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="th-cell text-center">#</th>
                            <th class="th-cell">Nama Host</th>
                            <th class="th-cell">Total Omzet</th>
                            <th class="th-cell text-right">Total Pcs</th>
                        </tr>
                    </thead>
                    <tbody id="topHostSalesTable"></tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Merender grafik penjualan harian menggunakan Chart.js.
 * @param {Array} salesData - Data penjualan yang sudah difilter dan diagregasi per hari.
 */
function renderDailySalesChart(salesData) {
    const ctx = document.getElementById('dailySalesChart');
    if (!ctx) return;

    // Hancurkan chart yang sudah ada untuk mencegah memory leak
    if (dailySalesChartInstance) {
        dailySalesChartInstance.destroy();
    }
    
    // Siapkan label (tanggal) dan data (omzet) untuk chart
    const labels = salesData.map(d => moment(d.date).format('DD MMM'));
    const dataPoints = salesData.map(d => d.omzet);

    dailySalesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omzet Harian',
                data: dataPoints,
                borderColor: '#db2777', // pink-600
                backgroundColor: 'rgba(219, 39, 119, 0.1)',
                tension: 0.2,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Merender tabel untuk top host berdasarkan omzet penjualan.
 * @param {Array} salesData - Data penjualan yang sudah difilter.
 */
function renderTopHostSalesTable(salesData) {
    const tableBody = document.getElementById('topHostSalesTable');
    if (!tableBody) return;

    // Agregasi penjualan per host
    const hostSales = salesData.reduce((acc, row) => {
        const host = row['Nama Host'];
        if (!host || host === '-') return acc;
        acc[host] = acc[host] || { name: host, omzet: 0, pcs: 0 };
        acc[host].omzet += parseCurrency(row['Total Omzet'] || 0);
        acc[host].pcs += Number(row['Total Pcs'] || 0);
        return acc;
    }, {});

    const sortedHosts = Object.values(hostSales).sort((a, b) => b.omzet - a.omzet).slice(0, 5);

    tableBody.innerHTML = '';
    if (sortedHosts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Tidak ada data penjualan untuk periode ini.</td></tr>`;
        return;
    }
    
    sortedHosts.forEach((host, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b';
        tr.innerHTML = `
            <td class="td-cell text-center font-medium text-gray-500">${index + 1}</td>
            <td class="td-cell font-semibold text-gray-800">${host.name}</td>
            <td class="td-cell text-green-600 font-bold">${formatCurrency(host.omzet)}</td>
            <td class="td-cell text-right text-gray-500">${host.pcs.toLocaleString('id-ID')} pcs</td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Menerapkan filter tanggal dan memicu rendering ulang komponen laporan.
 */
function applySalesReportFilters() {
    const startDate = salesReportDatePicker.getStartDate()?.toJSDate();
    const endDate = salesReportDatePicker.getEndDate()?.toJSDate();
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const filteredSales = allData.filter(row => {
        if (row['Jenis Transaksi'] !== 'Penjualan') return false;
        const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
        return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
    });
    
    // Agregasi data untuk grafik penjualan harian
    const dailySales = filteredSales.reduce((acc, row) => {
        const date = moment(row['Tanggal Input']).startOf('day').format('YYYY-MM-DD');
        acc[date] = acc[date] || { date: date, omzet: 0 };
        acc[date].omzet += parseCurrency(row['Total Omzet'] || 0);
        return acc;
    }, {});

    const sortedDailySales = Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));

    renderDailySalesChart(sortedDailySales);
    renderTopHostSalesTable(filteredSales);
}

/**
 * Menyiapkan event listener dan data untuk halaman Laporan Penjualan.
 * @param {Array} data - Semua data transaksi.
 */
export function setupSalesReportPage(data) {
    allData = data;
    const datePickerElement = document.getElementById('salesReportDateRangePicker');
    if (!datePickerElement) return;

    if (!salesReportDatePicker || !datePickerElement.litepickerInstance) {
        salesReportDatePicker = new Litepicker({
            element: datePickerElement,
            singleMode: false, 
            format: 'DD MMM YY', 
            lang: 'id-ID',
            setup: (picker) => picker.on('selected', applySalesReportFilters),
        });
        // Atur rentang tanggal awal ke 7 hari terakhir
        salesReportDatePicker.setDateRange(moment().subtract(6, 'days').toDate(), moment().toDate());
    }
    
    applySalesReportFilters();
}

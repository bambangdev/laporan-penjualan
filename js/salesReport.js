import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let salesReportDatePicker;
let dailySalesChartInstance = null;
let salesByShiftChartInstance = null;
let salesByDayChartInstance = null;

/**
 * Merender struktur HTML yang lebih kaya untuk halaman Laporan Penjualan.
 */
export function renderSalesReportHTML() {
    const page = document.getElementById('salesReportPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Sales Report & Insights</h1>
        <p class="text-gray-600 mb-6">Analisis mendalam untuk performa penjualan bisnis Anda.</p>
        
        <div class="mb-6 p-4 border rounded-lg bg-white shadow-sm">
            <label for="salesReportDateRangePicker" class="block text-sm font-medium text-gray-700 mb-1">Pilih Rentang Tanggal</label>
            <input type="text" id="salesReportDateRangePicker" placeholder="Filter data berdasarkan tanggal" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="stat-card"><p class="text-sm text-gray-500">Total Omzet</p><p id="kpiTotalOmzet" class="text-2xl font-bold text-green-600">Rp 0</p></div>
            <div class="stat-card"><p class="text-sm text-gray-500">Total Transaksi</p><p id="kpiTotalTransaksi" class="text-2xl font-bold text-blue-600">0</p></div>
            <div class="stat-card"><p class="text-sm text-gray-500">Rata-rata per Transaksi</p><p id="kpiAvgOmzet" class="text-2xl font-bold text-purple-600">Rp 0</p></div>
            <div class="stat-card"><p class="text-sm text-gray-500">Total Pcs Terjual</p><p id="kpiTotalPcs" class="text-2xl font-bold text-gray-900">0</p></div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Grafik Omzet Penjualan Harian</h3>
            <canvas id="dailySalesChart" height="100"></canvas>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Performa Omzet per Shift</h3>
                <canvas id="salesByShiftChart" height="150"></canvas>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Tren Penjualan per Hari</h3>
                <canvas id="salesByDayChart" height="150"></canvas>
            </div>
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

function destroyAllCharts() {
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();
    if (salesByShiftChartInstance) salesByShiftChartInstance.destroy();
    if (salesByDayChartInstance) salesByDayChartInstance.destroy();
}

/**
 * Merender semua KPI card.
 */
function renderKpiCards(filteredData) {
    const totalOmzet = filteredData.reduce((sum, row) => sum + parseCurrency(row['Total Omzet']), 0);
    const totalTransaksi = filteredData.length;
    const totalPcs = filteredData.reduce((sum, row) => sum + Number(row['Total Pcs'] || 0), 0);
    const avgOmzet = totalTransaksi > 0 ? totalOmzet / totalTransaksi : 0;

    document.getElementById('kpiTotalOmzet').textContent = formatCurrency(totalOmzet);
    document.getElementById('kpiTotalTransaksi').textContent = totalTransaksi.toLocaleString('id-ID');
    document.getElementById('kpiAvgOmzet').textContent = formatCurrency(avgOmzet);
    document.getElementById('kpiTotalPcs').textContent = totalPcs.toLocaleString('id-ID');
}

/**
 * Merender grafik Omzet per Shift.
 */
function renderSalesByShiftChart(filteredData) {
    const ctx = document.getElementById('salesByShiftChart');
    if (!ctx) return;
    
    const shiftData = filteredData.reduce((acc, row) => {
        const shift = row['Shift'] || 'Lainnya';
        acc[shift] = (acc[shift] || 0) + parseCurrency(row['Total Omzet']);
        return acc;
    }, {});

    salesByShiftChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(shiftData),
            datasets: [{
                data: Object.values(shiftData),
                backgroundColor: ['#3b82f6', '#f97316', '#8b5cf6'], // blue, orange, purple
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${formatCurrency(c.raw)}` } }
            }
        }
    });
}

/**
 * Merender grafik Tren Penjualan per Hari dalam Seminggu.
 */
function renderSalesByDayChart(filteredData) {
    const ctx = document.getElementById('salesByDayChart');
    if (!ctx) return;

    const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayData = new Array(7).fill(0);

    filteredData.forEach(row => {
        const dayIndex = moment(row['Tanggal Input']).day(); // 0 for Sunday, 1 for Monday, etc.
        dayData[dayIndex] += parseCurrency(row['Total Omzet']);
    });

    salesByDayChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Total Omzet',
                data: dayData,
                backgroundColor: 'rgba(219, 39, 119, 0.7)',
                borderColor: '#db2777',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { ticks: { callback: (v) => formatCurrency(v) } } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => `Omzet: ${formatCurrency(c.raw)}` } }
            }
        }
    });
}


// Fungsi renderDailySalesChart dan renderTopHostSalesTable tetap sama seperti sebelumnya...
function renderDailySalesChart(salesData) {
    const ctx = document.getElementById('dailySalesChart');
    if (!ctx) return;
    const labels = salesData.map(d => moment(d.date).format('DD MMM'));
    const dataPoints = salesData.map(d => d.omzet);
    dailySalesChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Omzet Harian', data: dataPoints, borderColor: '#db2777', backgroundColor: 'rgba(219, 39, 119, 0.1)', tension: 0.2, fill: true, }] }, options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return formatCurrency(value); } } } }, plugins: { tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null) { label += formatCurrency(context.parsed.y); } return label; } } } } } });
}
function renderTopHostSalesTable(salesData) {
    const tableBody = document.getElementById('topHostSalesTable');
    if (!tableBody) return;
    const hostSales = salesData.reduce((acc, row) => { const host = row['Nama Host']; if (!host || host === '-') return acc; acc[host] = acc[host] || { name: host, omzet: 0, pcs: 0 }; acc[host].omzet += parseCurrency(row['Total Omzet'] || 0); acc[host].pcs += Number(row['Total Pcs'] || 0); return acc; }, {});
    const sortedHosts = Object.values(hostSales).sort((a, b) => b.omzet - a.omzet).slice(0, 5);
    tableBody.innerHTML = '';
    if (sortedHosts.length === 0) { tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Tidak ada data penjualan untuk periode ini.</td></tr>`; return; }
    sortedHosts.forEach((host, index) => { const tr = document.createElement('tr'); tr.className = 'border-b'; tr.innerHTML = `<td class="td-cell text-center font-medium text-gray-500">${index + 1}</td><td class="td-cell font-semibold text-gray-800">${host.name}</td><td class="td-cell text-green-600 font-bold">${formatCurrency(host.omzet)}</td><td class="td-cell text-right text-gray-500">${host.pcs.toLocaleString('id-ID')} pcs</td>`; tableBody.appendChild(tr); });
}


/**
 * Menerapkan filter tanggal dan memicu rendering ulang semua komponen laporan.
 */
function applySalesReportFilters() {
    destroyAllCharts(); // Hancurkan semua chart sebelum render ulang

    const startDate = salesReportDatePicker.getStartDate()?.toJSDate();
    const endDate = salesReportDatePicker.getEndDate()?.toJSDate();
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const filteredSales = allData.filter(row => {
        if (row['Jenis Transaksi'] !== 'Penjualan') return false;
        const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
        return !startDate || !rowDate || (rowDate >= startDate && rowDate <= endDate);
    });
    
    // Render semua komponen dengan data yang sudah difilter
    renderKpiCards(filteredSales);
    renderSalesByShiftChart(filteredSales);
    renderSalesByDayChart(filteredSales);

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
        salesReportDatePicker.setDateRange(moment().subtract(6, 'days').toDate(), moment().toDate());
    }
    
    applySalesReportFilters();
}

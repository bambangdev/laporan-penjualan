import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let customerDatePicker;

export function renderCustomerReportHTML() {
    const page = document.getElementById('customerReportPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Laporan Customer</h1>
        <div class="mb-6 p-4 border rounded-lg bg-gray-50">
            <label for="customerReportDateRangePicker" class="block text-sm font-medium text-gray-700 mb-1">Pilih Rentang Tanggal</label>
            <input type="text" id="customerReportDateRangePicker" placeholder="Filter data berdasarkan tanggal" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Top 10 Customer (Pembelian Terbanyak)</h4>
                <div class="table-responsive border rounded-lg"><table class="min-w-full bg-white"><tbody id="topBuyersTable"></tbody></table></div>
            </div>
            <div>
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Top 10 Customer (Return Terbanyak)</h4>
                <div class="table-responsive border rounded-lg"><table class="min-w-full bg-white"><tbody id="topReturnersTable"></tbody></table></div>
            </div>
        </div>
    `;
}

function calculateAndRenderCustomerLeaderboards() {
    const topBuyersTable = document.getElementById('topBuyersTable');
    const topReturnersTable = document.getElementById('topReturnersTable');
    if (!topBuyersTable || !topReturnersTable) return;

    const startDate = customerDatePicker.getStartDate()?.toJSDate();
    const endDate = customerDatePicker.getEndDate()?.toJSDate();
    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const filteredData = allData.filter(row => {
        const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
        return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
    });

    const getTop10 = (sourceData, pcsField, omzetField) => {
        if (sourceData.length === 0) return [];
        const customerData = sourceData.reduce((acc, row) => {
            const name = String(row['Nama Customer'] || '').trim();
            if (!name || name === '-') return acc;
            acc[name] = acc[name] || { name: name, pcs: 0, omzet: 0 };
            acc[name].pcs += Number(row[pcsField] || 0);
            acc[name].omzet += parseCurrency(row[omzetField] || 0);
            return acc;
        }, {});

        return Object.values(customerData).sort((a, b) => b.omzet - a.omzet).slice(0, 10);
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

    const topBuyers = getTop10(filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Total Pcs', 'Total Omzet');
    const topReturners = getTop10(filteredData.filter(r => r['Jenis Transaksi'] === 'Return'), 'Total Pcs', 'Total Omzet');

    renderLeaderboard(topBuyersTable, topBuyers);
    renderLeaderboard(topReturnersTable, topReturners);
}

export function setupCustomerReportPage(data) {
    allData = data;
    const datePickerElement = document.getElementById('customerReportDateRangePicker');
    if (!datePickerElement) return;

    if (!customerDatePicker || !datePickerElement.litepickerInstance) {
        customerDatePicker = new Litepicker({
            element: datePickerElement,
            singleMode: false, format: 'DD MMM YY', lang: 'id-ID',
            setup: (picker) => picker.on('selected', calculateAndRenderCustomerLeaderboards),
        });
        customerDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
    }
    
    calculateAndRenderCustomerLeaderboards();
}

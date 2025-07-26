import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let customerDatePicker;

function calculateAndRenderCustomerLeaderboards(data) {
    const topBuyersTable = document.getElementById('topBuyersTable');
    const topReturnersTable = document.getElementById('topReturnersTable');

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

        return Object.values(customerData)
            .sort((a, b) => b.omzet - a.omzet)
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

    const topBuyers = getTop10(data.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Total Pcs', 'Total Omzet');
    const topReturners = getTop10(data.filter(r => r['Jenis Transaksi'] === 'Return'), 'Total Pcs', 'Total Omzet');

    renderLeaderboard(topBuyersTable, topBuyers);
    renderLeaderboard(topReturnersTable, topReturners);
}

function applyCustomerReportFilters() {
    const customerLoader = document.getElementById('customerLoader');
    customerLoader.classList.remove('hidden');
    customerLoader.classList.add('flex');

    setTimeout(() => {
        const startDate = customerDatePicker.getStartDate()?.toJSDate();
        const endDate = customerDatePicker.getEndDate()?.toJSDate();
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        const filteredData = allData.filter(row => {
            const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
            return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
        });
        calculateAndRenderCustomerLeaderboards(filteredData);

        customerLoader.classList.add('hidden');
        customerLoader.classList.remove('flex');
    }, 50);
}

export function setupCustomerReportPage(data) {
    allData = data;
    const litepickerOptions = {
        singleMode: false, format: 'DD MMM YY', lang: 'id-ID', numberOfMonths: 2,
        dropdowns: { minYear: 2020, maxYear: null, months: true, years: true },
        buttonText: {
            previousMonth: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`,
            nextMonth: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>`,
        },
    };

    if (!customerDatePicker) {
        customerDatePicker = new Litepicker({
            element: document.getElementById('customerReportDateRangePicker'),
            ...litepickerOptions,
            setup: (picker) => picker.on('selected', applyCustomerReportFilters),
        });
        customerDatePicker.setDateRange(moment().startOf('month').toDate(), moment().endOf('month').toDate());
    }
    
    // Listen for global filter changes
    document.addEventListener('filterChanged', (e) => {
        if (e.detail.pageId === 'customerReportPage') {
            applyCustomerReportFilters();
        }
    });
}

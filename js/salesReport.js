import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let salesReportDatePicker;
let dailySalesChartInstance = null;

export function renderSalesReportHTML() {
    const page = document.getElementById('salesReportPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Sales Report (Bonus)</h1>
        `;
}

function renderTopHostSalesTable(data) { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
function renderDailySalesChart(data, startDate, endDate) { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
function renderCombinedSalaryBonusTable(tbody, dataMap, bonusMap, rate, type) { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
function applySalesReportFilters() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }

export function setupSalesReportPage(data) {
    allData = data;
    const datePickerElement = document.getElementById('salesReportDateRangePicker');
    if (!datePickerElement) return;

    if (!salesReportDatePicker) {
        salesReportDatePicker = new Litepicker({ element: datePickerElement, /* ... (opsi) ... */ });
    }
    applySalesReportFilters();
}

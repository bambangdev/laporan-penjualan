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

// ... (semua fungsi lain seperti renderTopHostSalesTable, renderDailySalesChart, dll. dari file salesReport.js lama Anda) ...

export function setupSalesReportPage(data) {
    allData = data;
    const datePickerElement = document.getElementById('salesReportDateRangePicker');
    if (!datePickerElement) return;

    if (!salesReportDatePicker || !datePickerElement.litepickerInstance) {
        salesReportDatePicker = new Litepicker({
            element: datePickerElement,
            singleMode: false, format: 'DD MMM YY', lang: 'id-ID',
            setup: (picker) => picker.on('selected', applySalesReportFilters),
        });
        salesReportDatePicker.setDateRange(moment().subtract(6, 'days').toDate(), moment().toDate());
    }
    
    applySalesReportFilters();
}

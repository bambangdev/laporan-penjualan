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

function calculateAndRenderCustomerLeaderboards(data) { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
function applyCustomerReportFilters() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }

export function setupCustomerReportPage(data) {
    allData = data;
    const datePickerElement = document.getElementById('customerReportDateRangePicker');
    if (!datePickerElement) return;

    if (!customerDatePicker) {
        customerDatePicker = new Litepicker({ element: datePickerElement, /* ... (opsi) ... */ });
    }
    applyCustomerReportFilters();
}

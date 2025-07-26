import { SCRIPT_URL, EDIT_PIN, hostList, adminList, treatmentPersonList, formatCurrency, parseCurrency, populateDropdown, showToast } from './utils.js';

let allData = [];
// ... (sisa variabel global: filteredDashboardData, currentPage, dll)

function renderTopHostSalesTableForDashboard(data) { /* ... (fungsi utuh) ... */ }
function calculateAndRenderStats(data) { /* ... (fungsi utuh) ... */ }
function renderDashboardTable() { /* ... (fungsi utuh) ... */ }
function showCustomerHistory(customerName) { /* ... (fungsi utuh) ... */ }
function populateCustomerAutocomplete(data) { /* ... (fungsi utuh) ... */ }
function applyFilters() { /* ... (fungsi utuh) ... */ }
function changePage(direction) { /* ... (fungsi utuh) ... */ }
function exportDashboardToExcel() { /* ... (fungsi utuh) ... */ }
function populateEditModal(data) { /* ... (fungsi utuh) ... */ }
async function handleEditFormSubmit(e) { /* ... (fungsi utuh) ... */ }

function populateDashboardFilters() {
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean).sort())];
    populateDropdown(document.getElementById('dashboardFilterShift'), getUniqueValues('Shift'), false);
    populateDropdown(document.getElementById('dashboardFilterHost'), getUniqueValues('Nama Host'), false);
    populateDropdown(document.getElementById('dashboardFilterAdmin'), getUniqueValues('Nama Admin'), false);
}

export function setupDashboardPage(data) {
    // ===== PENGECEKAN KUNCI ADA DI SINI =====
    const dashboardPage = document.getElementById('dashboardPage');
    if (!dashboardPage || !dashboardPage.classList.contains('active')) {
        return; // Hentikan eksekusi jika bukan di halaman dashboard
    }
    
    allData = data;
    // ... (sisa kode setupDashboardPage yang sudah ada)

    const searchInput = document.getElementById('dashboardSearchCustomer');
    if (!searchInput.dataset.listenerAttached) {
        // ... (semua event listener)
        
        searchInput.dataset.listenerAttached = 'true';
    }

    // Panggil applyFilters untuk pertama kali mengisi halaman
    applyFilters();
}

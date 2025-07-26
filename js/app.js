import { CORRECT_PIN, SALES_REPORT_PIN, SCRIPT_URL, updateMasterLists } from './utils.js';
import { setupDashboardPage } from './dashboard.js';
import { setupCustomerReportPage } from './customerReport.js';
import { setupSalesReportPage } from './salesReport.js';
import { setupUnifiedForm } from './inputTransaksi.js';
import { setupDataMasterPage } from './datamaster.js';

document.addEventListener('DOMContentLoaded', () => {
    let allTransactions = [];
    let allMasterData = [];
    let isDataFetched = false;

    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    const pinError = document.getElementById('pinError');
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pages = document.querySelectorAll('.page');
    const pageLoader = document.getElementById('pageLoader');
    const pageError = document.getElementById('pageError');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const salesReportPinModal = document.getElementById('salesReportPinModal');
    const salesReportPinForm = document.getElementById('salesReportPinForm');
    const salesReportPinInput = document.getElementById('salesReportPinInput');
    const salesReportPinError = document.getElementById('salesReportPinError');
    const cancelSalesReportBtn = document.getElementById('cancelSalesReport');

    function openSidebar() { /* ... (sama seperti sebelumnya) ... */ }
    function closeSidebar() { /* ... (sama seperti sebelumnya) ... */ }

    async function fetchDataAndSetupPages() {
        if (isDataFetched) return;
        pageLoader.classList.remove('hidden');
        pageLoader.classList.add('flex');
        pageError.classList.add('hidden');
        try {
            const response = await fetch(SCRIPT_URL);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);

            allTransactions = result.transactions.sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
            allMasterData = result.masterData;
            isDataFetched = true;
            
            updateMasterLists(allMasterData); // <-- Langkah penting!

            setupDashboardPage(allTransactions);
            setupCustomerReportPage(allTransactions);
            setupSalesReportPage(allTransactions);
            setupUnifiedForm(allTransactions);
            setupDataMasterPage(allMasterData);

            const activePage = document.querySelector('.page.active');
            if (activePage) {
                document.dispatchEvent(new CustomEvent('filterChanged', { detail: { pageId: activePage.id } }));
            }
        } catch (error) {
            pageError.textContent = `Gagal memuat data: ${error.message}.`;
            pageError.classList.remove('hidden');
        } finally {
            pageLoader.classList.add('hidden');
            pageLoader.classList.remove('flex');
        }
    }

    function switchPage(pageId) {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
        if (window.innerWidth < 1024) { closeSidebar(); }

        const dataDependentPages = ['dashboardPage', 'customerReportPage', 'salesReportPage', 'dataMasterPage', 'inputTransaksiPage'];
        if (dataDependentPages.includes(pageId)) {
            if (!isDataFetched) {
                fetchDataAndSetupPages();
            } else {
                 if(pageId === 'dataMasterPage') { setupDataMasterPage(allMasterData); }
                 if(pageId === 'inputTransaksiPage') { setupUnifiedForm(allTransactions); }
                 document.dispatchEvent(new CustomEvent('filterChanged', { detail: { pageId: pageId } }));
            }
        }
    }

    pinInputs.forEach(/* ... (logika login tetap sama) ... */);
    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    sidebarLinks.forEach(/* ... (logika navigasi sidebar tetap sama) ... */);
    salesReportPinForm.addEventListener(/* ... (logika modal sales report tetap sama) ... */);
    cancelSalesReportBtn.addEventListener('click', () => { /* ... (sama) ... */ });
    document.addEventListener('dataChanged', () => { isDataFetched = false; fetchDataAndSetupPages(); });
    pinInputs[0].focus();
});

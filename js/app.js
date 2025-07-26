import { CORRECT_PIN, SALES_REPORT_PIN, EDIT_PIN } from './utils.js';
import { setupDashboardPage } from './dashboard.js';
import { setupCustomerReportPage } from './customerReport.js';
import { setupSalesReportPage } from './salesReport.js';
import { setupUnifiedForm } from './inputTransaksi.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let allData = [];
    let isDataFetched = false;

    // --- DOM ELEMENTS ---
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

    // --- MAIN APP LOGIC ---

    function closeSidebar() {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    }

    async function fetchDataAndSetupPages() {
        if (isDataFetched) return; // Don't refetch if data is already there

        pageLoader.classList.remove('hidden');
        pageLoader.classList.add('flex');
        pageError.classList.add('hidden');
        
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbxzpSVOHsYuDXUoJqHJ4mi2bHiHVT7tqSgD1Q6iq2RKHhwIqszVCfczZUMrNB7zzoFn/exec');
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            
            allData = result.data.sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
            isDataFetched = true;

            // Setup all pages with the fetched data
            setupDashboardPage(allData);
            setupCustomerReportPage(allData);
            setupSalesReportPage(allData);
            setupUnifiedForm(allData);

            // Trigger filter for the currently active page
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
        if (window.innerWidth < 1024) {
            closeSidebar();
        }

        const dataDependentPages = ['dashboardPage', 'customerReportPage', 'salesReportPage'];
        if (dataDependentPages.includes(pageId)) {
            if (!isDataFetched) {
                fetchDataAndSetupPages();
            } else {
                 // Trigger filter for the new page
                 document.dispatchEvent(new CustomEvent('filterChanged', { detail: { pageId: pageId } }));
            }
        }
    }
    
    // --- INITIALIZATION ---

    // Login Logic
    pinInputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && !input.value && index > 0) pinInputs[index - 1].focus();
        });
        input.addEventListener('input', () => {
            if (input.value && index < pinInputs.length - 1) pinInputs[index + 1].focus();
            const enteredPin = Array.from(pinInputs).map(i => i.value).join('');
            if (enteredPin.length === 4) {
                if (enteredPin === CORRECT_PIN) {
                    loginSection.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                    switchPage('dashboardPage'); 
                } else {
                    pinError.textContent = 'PIN salah, coba lagi.';
                    pinInputs.forEach(i => i.value = '');
                    pinInputs[0].focus();
                }
            } else {
                pinError.textContent = '';
            }
        });
    });

    // Sidebar Navigation
    [openSidebarBtn, closeSidebarBtn, sidebarOverlay].forEach(el => el.addEventListener('click', closeSidebar));
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId === 'salesReportPage') {
                salesReportPinModal.classList.remove('hidden');
                salesReportPinModal.classList.add('flex');
                salesReportPinInput.focus();
            } else {
                switchPage(pageId);
            }
        });
    });
    
    // Sales Report PIN Modal
    salesReportPinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (salesReportPinInput.value === SALES_REPORT_PIN) {
            salesReportPinModal.classList.add('hidden');
            salesReportPinModal.classList.remove('flex');
            switchPage('salesReportPage');
            salesReportPinInput.value = '';
            salesReportPinError.textContent = '';
        } else {
            salesReportPinError.textContent = 'PIN salah.';
        }
    });
    cancelSalesReportBtn.addEventListener('click', () => {
        salesReportPinModal.classList.add('hidden');
        salesReportPinModal.classList.remove('flex');
    });
    
    // Listen for data changes from forms to refetch
    document.addEventListener('dataChanged', () => {
        isDataFetched = false; // Mark data as stale
        const activePage = document.querySelector('.page.active');
        if (activePage && ['dashboardPage', 'customerReportPage', 'salesReportPage'].includes(activePage.id)) {
            fetchDataAndSetupPages();
        }
    });

    // Initial focus
    pinInputs[0].focus();
});

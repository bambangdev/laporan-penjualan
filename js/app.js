import { CORRECT_PIN, SALES_REPORT_PIN } from './utils.js';
import { setupDashboardPage } from './dashboard.js';
import { setupCustomerReportPage } from './customerReport.js';
import { setupSalesReportPage } from './salesReport.js';
import { setupUnifiedForm } from './inputTransaksi.js';
import { setupDataMasterPage } from './datamaster.js'; // <-- Impor baru

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let allTransactions = []; // Diubah namanya agar lebih jelas
    let allMasterData = []; // State baru untuk data master
    let isDataFetched = false;

    // --- DOM ELEMENTS ---
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    // ... (sisa elemen DOM tetap sama) ...
    
    // --- MAIN APP LOGIC ---

    function openSidebar() {
        // ... (fungsi openSidebar tetap sama) ...
    }

    function closeSidebar() {
        // ... (fungsi closeSidebar tetap sama) ...
    }

    async function fetchDataAndSetupPages() {
        if (isDataFetched) return; 

        pageLoader.classList.remove('hidden');
        pageLoader.classList.add('flex');
        pageError.classList.add('hidden');
        
        try {
            const response = await fetch(SCRIPT_URL); // SCRIPT_URL ada di utils.js
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            
            // Simpan kedua set data ke state global
            allTransactions = result.transactions.sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
            allMasterData = result.masterData;
            isDataFetched = true;

            // Setup semua halaman dengan data yang relevan
            setupDashboardPage(allTransactions); // Kirim data transaksi
            setupCustomerReportPage(allTransactions); // Kirim data transaksi
            setupSalesReportPage(allTransactions); // Kirim data transaksi
            setupUnifiedForm(allTransactions, allMasterData); // Kirim kedua data
            setupDataMasterPage(allMasterData); // Kirim data master

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

        // Halaman Data Master juga butuh data
        const dataDependentPages = ['dashboardPage', 'customerReportPage', 'salesReportPage', 'dataMasterPage'];
        if (dataDependentPages.includes(pageId)) {
            if (!isDataFetched) {
                fetchDataAndSetupPages();
            } else {
                 // Jika data sudah ada, cukup setup ulang halaman data master
                 if(pageId === 'dataMasterPage') {
                    setupDataMasterPage(allMasterData);
                 }
                 document.dispatchEvent(new CustomEvent('filterChanged', { detail: { pageId: pageId } }));
            }
        }
    }
    
    // --- INITIALIZATION ---
    // ... (Sisa kode di app.js tetap sama, tidak ada perubahan) ...
});

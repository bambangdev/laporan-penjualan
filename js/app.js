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

    function openSidebar() {
        if (sidebar) sidebar.classList.remove('-translate-x-full');
        if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.add('-translate-x-full');
        if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
    }

    async function fetchData() {
        if (isDataFetched) return true; // Kembalikan true jika data sudah ada
        if (pageLoader) {
            pageLoader.classList.remove('hidden');
            pageLoader.classList.add('flex');
        }
        if (pageError) pageError.classList.add('hidden');
        
        try {
            const response = await fetch(SCRIPT_URL);
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);

            if (typeof result.transactions === 'undefined' || typeof result.masterData === 'undefined') {
                throw new Error("Struktur data dari server salah. Pastikan Apps Script sudah di-deploy ulang dengan benar.");
            }

            allTransactions = (result.transactions || []).sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
            allMasterData = result.masterData || [];
            isDataFetched = true;
            updateMasterLists(allMasterData);
            return true; // Sukses mengambil data

        } catch (error) {
            if (pageError) {
                pageError.textContent = `Gagal memuat data: ${error.message}.`;
                pageError.classList.remove('hidden');
            }
            return false; // Gagal mengambil data
        } finally {
            if (pageLoader) {
                pageLoader.classList.add('hidden');
                pageLoader.classList.remove('flex');
            }
        }
    }

    async function switchPage(pageId) {
        // Tampilkan halaman yang dituju
        if (pages) pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        if (sidebarLinks) sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
        if (window.innerWidth < 1024) { closeSidebar(); }

        // Ambil data jika belum ada
        const dataReady = await fetchData();
        if (!dataReady) return; // Hentikan jika data gagal dimuat

        // Panggil fungsi setup HANYA untuk halaman yang aktif
        switch (pageId) {
            case 'dashboardPage':
                setupDashboardPage(allTransactions);
                break;
            case 'customerReportPage':
                setupCustomerReportPage(allTransactions);
                break;
            case 'salesReportPage':
                setupSalesReportPage(allTransactions);
                break;
            case 'inputTransaksiPage':
                setupUnifiedForm(allTransactions);
                break;
            case 'dataMasterPage':
                setupDataMasterPage(allMasterData);
                break;
        }
    }

    if (pinInputs && pinInputs.length > 0) {
        pinInputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === "Backspace" && !input.value && index > 0) pinInputs[index - 1].focus();
            });
            input.addEventListener('input', () => {
                if (input.value && index < pinInputs.length - 1) pinInputs[index + 1].focus();
                const enteredPin = Array.from(pinInputs).map(i => i.value).join('');
                if (enteredPin.length === 4) {
                    if (enteredPin === CORRECT_PIN) {
                        if (loginSection) loginSection.classList.add('hidden');
                        if (mainApp) mainApp.classList.remove('hidden');
                        switchPage('dashboardPage'); 
                    } else {
                        if (pinError) pinError.textContent = 'PIN salah, coba lagi.';
                        pinInputs.forEach(i => i.value = '');
                        if (pinInputs[0]) pinInputs[0].focus();
                    }
                } else {
                    if (pinError) pinError.textContent = '';
                }
            });
        });
        if (pinInputs[0]) pinInputs[0].focus();
    }

    if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    
    if (sidebarLinks) sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId === 'salesReportPage') {
                if (salesReportPinModal) {
                    salesReportPinModal.classList.remove('hidden');
                    salesReportPinModal.classList.add('flex');
                }
                if (salesReportPinInput) salesReportPinInput.focus();
            } else {
                switchPage(pageId);
            }
        });
    });

    if (salesReportPinForm) salesReportPinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (salesReportPinInput && salesReportPinInput.value === SALES_REPORT_PIN) {
            if (salesReportPinModal) {
                salesReportPinModal.classList.add('hidden');
                salesReportPinModal.classList.remove('flex');
            }
            switchPage('salesReportPage');
            salesReportPinInput.value = '';
            if (salesReportPinError) salesReportPinError.textContent = '';
        } else {
            if (salesReportPinError) salesReportPinError.textContent = 'PIN salah.';
        }
    });

    if (cancelSalesReportBtn) cancelSalesReportBtn.addEventListener('click', () => {
        if (salesReportPinModal) {
            salesReportPinModal.classList.add('hidden');
            salesReportPinModal.classList.remove('flex');
        }
    });

    document.addEventListener('dataChanged', () => { 
        isDataFetched = false; 
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            switchPage(activePage.id);
        }
    });
});

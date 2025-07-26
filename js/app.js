import { CORRECT_PIN, SALES_REPORT_PIN, SCRIPT_URL, updateMasterLists } from './utils.js';
import { setupDashboardPage, renderDashboardHTML } from './dashboard.js';
import { setupCustomerReportPage, renderCustomerReportHTML } from './customerReport.js';
import { setupSalesReportPage, renderSalesReportHTML } from './salesReport.js';
import { setupUnifiedForm, renderInputTransaksiHTML } from './inputTransaksi.js';
import { setupDataMasterPage, renderDataMasterHTML } from './datamaster.js';

document.addEventListener('DOMContentLoaded', () => {
    let allTransactions = [], allMasterData = [], isDataFetched = false;
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    // ... (definisi elemen DOM lainnya)

    function renderInitialHTML() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
    function openSidebar() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
    function closeSidebar() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }
    async function fetchData() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }

    async function switchPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        
        const activePage = document.getElementById(pageId);
        const activeLink = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
        
        if(activePage) activePage.style.display = 'block';
        if(activeLink) activeLink.classList.add('active');
        if (window.innerWidth < 1024) closeSidebar();

        const dataReady = await fetchData();
        if (!dataReady) return;

        // RENDER HTML DULU, BARU SETUP LOGIKA
        switch (pageId) {
            case 'dashboardPage':
                renderDashboardHTML();
                setupDashboardPage(allTransactions);
                break;
            case 'inputTransaksiPage':
                renderInputTransaksiHTML();
                setupUnifiedForm(allTransactions);
                break;
            case 'customerReportPage':
                renderCustomerReportHTML();
                setupCustomerReportPage(allTransactions);
                break;
            case 'salesReportPage':
                renderSalesReportHTML();
                setupSalesReportPage(allTransactions);
                break;
            case 'dataMasterPage':
                renderDataMasterHTML();
                setupDataMasterPage(allMasterData);
                break;
        }
    }

    if (pinInputs && pinInputs.length > 0) {
        pinInputs.forEach(input => {
            input.addEventListener('input', () => {
                const enteredPin = Array.from(pinInputs).map(i => i.value).join('');
                if (enteredPin.length === 4) {
                    if (enteredPin === CORRECT_PIN) {
                        loginSection.style.display = 'none';
                        mainApp.style.display = 'block';
                        renderInitialHTML();
                        switchPage('dashboardPage');
                    } else {
                        // logika pin salah
                    }
                }
            });
        });
    }
});

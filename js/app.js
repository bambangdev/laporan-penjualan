import { CORRECT_PIN, SALES_REPORT_PIN, SCRIPT_URL, updateMasterLists } from './utils.js';
import { setupDashboardPage, renderDashboardHTML } from './dashboard.js';
import { setupCustomerReportPage, renderCustomerReportHTML } from './customerReport.js';
import { setupSalesReportPage, renderSalesReportHTML } from './salesReport.js';
import { setupUnifiedForm, renderInputTransaksiHTML } from './inputTransaksi.js';
import { setupDataMasterPage, renderDataMasterHTML } from './datamaster.js';

document.addEventListener('DOMContentLoaded', () => {
    let allTransactions = [];
    let allMasterData = [];
    let isDataFetched = false;

    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    const pinError = document.getElementById('pinError');
    const sidebar = document.getElementById('sidebar');
    const pages = document.querySelectorAll('.page');
    const pageLoader = document.getElementById('pageLoader');
    const pageError = document.getElementById('pageError');
    
    function renderInitialHTML() {
        document.querySelector('header').innerHTML = `<button id="open-sidebar-btn" class="text-gray-500 hover:text-gray-800"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button><h2 class="text-lg font-bold text-pink-600">infinithree.id</h2>`;
        sidebar.innerHTML = `<div class="flex items-center justify-between p-4 border-b"><h2 class="text-xl font-bold text-pink-600">infinithree.id</h2><button id="close-sidebar-btn" class="text-gray-500 hover:text-gray-800 lg:hidden"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><nav class="p-4 space-y-2"></nav>`;
        const nav = sidebar.querySelector('nav');
        nav.innerHTML = `
            <a href="#dashboard" class="sidebar-link active" data-page="dashboardPage"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>Dashboard</a>
            <a href="#inputTransaksi" class="sidebar-link" data-page="inputTransaksiPage"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Input Transaksi</a>
            <a href="#customerReport" class="sidebar-link" data-page="customerReportPage"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>Customer Report</a>
            <a href="#salesReport" class="sidebar-link" data-page="salesReportPage"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Sales Report</a>
            <a href="#dataMaster" class="sidebar-link" data-page="dataMasterPage"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7l9 6 9-6"></path></svg>Data Master</a>
        `;
        document.getElementById('open-sidebar-btn').addEventListener('click', openSidebar);
        document.getElementById('close-sidebar-btn').addEventListener('click', closeSidebar);
        document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
        document.querySelectorAll('.sidebar-link').forEach(link => link.addEventListener('click', (e) => handleNavClick(e)));
    }

    function openSidebar() { /* ... */ }
    function closeSidebar() { /* ... */ }

    async function fetchData() { /* ... (fungsi lengkap dari respons sebelumnya) ... */ }

    async function switchPage(pageId) {
        pages.forEach(page => page.style.display = 'none');
        const activePage = document.getElementById(pageId);
        if (activePage) activePage.style.display = 'block';

        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
        if (window.innerWidth < 1024) closeSidebar();

        const dataReady = await fetchData();
        if (!dataReady) return;

        switch (pageId) {
            case 'dashboardPage':
                renderDashboardHTML();
                setupDashboardPage(allTransactions);
                break;
            case 'customerReportPage':
                renderCustomerReportHTML();
                setupCustomerReportPage(allTransactions);
                break;
            case 'salesReportPage':
                renderSalesReportHTML();
                setupSalesReportPage(allTransactions);
                break;
            case 'inputTransaksiPage':
                renderInputTransaksiHTML();
                setupUnifiedForm(allTransactions);
                break;
            case 'dataMasterPage':
                renderDataMasterHTML();
                setupDataMasterPage(allMasterData);
                break;
        }
    }

    function handleNavClick(e) {
        e.preventDefault();
        const pageId = e.currentTarget.dataset.page;
        if (pageId === 'salesReportPage') {
            // Logika modal PIN
        } else {
            switchPage(pageId);
        }
    }

    if (pinInputs && pinInputs.length > 0) {
        pinInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                if (input.value && index < pinInputs.length - 1) pinInputs[index + 1].focus();
                const enteredPin = Array.from(pinInputs).map(i => i.value).join('');
                if (enteredPin.length === 4) {
                    if (enteredPin === CORRECT_PIN) {
                        loginSection.style.display = 'none';
                        mainApp.style.display = 'block';
                        renderInitialHTML();
                        switchPage('dashboardPage'); 
                    } else {
                        // Logika PIN salah
                    }
                }
            });
        });
    }

    document.addEventListener('dataChanged', () => { 
        isDataFetched = false; 
        const activePage = document.querySelector('.sidebar-link.active');
        if (activePage) {
            switchPage(activePage.dataset.page);
        }
    });
});

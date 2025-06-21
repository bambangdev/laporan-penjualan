// --- main.js ---
// File utama untuk inisialisasi aplikasi.

// Variabel global untuk status aplikasi
let allData = [];
let isDataFetched = false;
let dashboardDatePicker, customerDatePicker;
let salesChartInstance;


document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi elemen UI (sidebar, navigasi)
    // HARUS dipanggil pertama agar fungsi global seperti switchPage terdefinisi
    initUI();
    
    // Inisialisasi autentikasi (login, password)
    initAuth();

    // Inisialisasi semua form input
    initForms();

    // Opsi konfigurasi umum untuk Litepicker
    const litepickerOptions = {
        singleMode: false, format: 'DD MMM YYYY', lang: 'id-ID', numberOfMonths: 2,
        dropdowns: { minYear: 2020, maxYear: null, months: true, years: true },
        buttonText: {
            'previousMonth': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`,
            'nextMonth': `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>`,
        },
    };

    // Inisialisasi Litepicker untuk Dashboard
    dashboardDatePicker = new Litepicker({ 
        element: document.getElementById('dashboardDateRangePicker'), 
        ...litepickerOptions, 
        setup: (picker) => { picker.on('selected', () => applyFilters()); }
    });

    // Inisialisasi Litepicker untuk Customer Report
    customerDatePicker = new Litepicker({ 
        element: document.getElementById('customerReportDateRangePicker'), 
        ...litepickerOptions, 
        setup: (picker) => { picker.on('selected', () => applyCustomerReportFilters()); }
    });
    
    // Tambahkan event listener untuk filter di Dashboard
    ['input', 'change'].forEach(evt => {
        document.getElementById('dashboardSearchCustomer').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterShift').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterHost').addEventListener(evt, applyFilters);
        document.getElementById('dashboardFilterAdmin').addEventListener(evt, applyFilters);
    });

    // Populate dropdowns di form input
    populateDropdown(document.getElementById('penjualanHost'), hostList);
    populateDropdown(document.getElementById('penjualanAdmin'), adminList);
    populateDropdown(document.getElementById('returnHost'), hostList);
    populateDropdown(document.getElementById('returnAdmin'), adminList);
    populateDropdown(document.getElementById('treatmentPerson'), treatmentPersonList);

    // Mulai aplikasi dari layar PIN
    document.querySelector('#pin-inputs input').focus();
});

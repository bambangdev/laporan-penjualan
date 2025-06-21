// --- ui.js ---
// Mengelola interaksi antarmuka seperti sidebar, navigasi, dan fungsi pembantu.

// --- HELPER FUNCTIONS ---
const parseCurrency = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0;
const formatCurrency = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;

function populateDropdown(selectElement, listItems, includeBackup = true) {
    // Simpan nilai yang sedang dipilih (jika ada)
    const selectedValue = selectElement.value;
    
    while (selectElement.options.length > 1) selectElement.remove(1);
    listItems.forEach(item => selectElement.add(new Option(item, item)));
    if(includeBackup) selectElement.add(new Option('Backup (Isi Manual)', 'Backup'));
    
    // Kembalikan nilai yang dipilih sebelumnya
    if (selectedValue) {
        selectElement.value = selectedValue;
    }
}

// --- PAGE & NAVIGATION LOGIC ---
function initUI() {
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pages = document.querySelectorAll('.page');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const salesReportPasswordModal = document.getElementById('salesReportPasswordModal');
    const salesReportPasswordInput = document.getElementById('salesReportPasswordInput');

    function closeSidebar() {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    }

    window.switchPage = (pageId) => {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        sidebarLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
        if (window.innerWidth < 1024) {
            closeSidebar();
        }
        // Fetch data if navigating to a data-driven page
        if (['dashboardPage', 'customerReportPage', 'salesReportPage'].includes(pageId)) {
            fetchData();
        }
    }

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    });

    [closeSidebarBtn, sidebarOverlay].forEach(el => el.addEventListener('click', closeSidebar));

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId === 'salesReportPage') {
                salesReportPasswordModal.classList.remove('hidden');
                salesReportPasswordModal.classList.add('flex');
                salesReportPasswordInput.focus();
            } else {
                switchPage(pageId);
            }
        });
    });
}

// GANTI URL DI BAWAH INI DENGAN URL DEPLOYMENT ANDA YANG TERAKHIR DAN AKTIF
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_WZnzSKat7xjOpOYni1l7cLGq0zT-4Nv-mJsdwH714fiAMwrDNt9aSUMdS2lx4S_4/exec';

export const CORRECT_PIN = '7501';
export const SALES_REPORT_PIN = '2232'; 
export const EDIT_PIN = '2232';

// Variabel global untuk menampung daftar dari server
export let hostList = [];
export let adminList = [];
export let treatmentPersonList = [];

// Fungsi untuk mengisi daftar di atas dari data master
export function updateMasterLists(masterData) {
    hostList = masterData.filter(item => item.Tipe === 'Host').map(item => item.Nama);
    adminList = masterData.filter(item => item.Tipe === 'Admin').map(item => item.Nama);
    treatmentPersonList = masterData.filter(item => item.Tipe === 'Treatment').map(item => item.Nama);
}

// --- HELPER FUNCTIONS ---
export const parseCurrency = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0;
export const formatCurrency = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;

export function populateDropdown(selectElement, listItems, includeBackup = true) {
    if (!selectElement) return;
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
    if (firstOption) selectElement.appendChild(firstOption);

    listItems.sort().forEach(item => selectElement.add(new Option(item, item)));
    
    if(includeBackup) selectElement.add(new Option('Backup (Isi Manual)', 'Backup'));
}

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

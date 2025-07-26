// --- APP STATE & CONFIG ---
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzpSVOHsYuDXUoJqHJ4mi2bHiHVT7tqSgD1Q6iq2RKHhwIqszVCfczZUMrNB7zzoFn/exec';
export const CORRECT_PIN = '7501';
export const SALES_REPORT_PIN = '2232'; 
export const EDIT_PIN = '2232';
export const hostList = ['wafa', 'debi', 'bunga'];
export const adminList = ['Bunga', 'Teh Ros'];
export const treatmentPersonList = ['Bunda', 'Resin'];

// --- HELPER FUNCTIONS ---
export const parseCurrency = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0;
export const formatCurrency = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;

export function populateDropdown(selectElement, listItems, includeBackup = true) {
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
    if (firstOption) selectElement.appendChild(firstOption);

    listItems.forEach(item => selectElement.add(new Option(item, item)));
    if(includeBackup) selectElement.add(new Option('Backup (Isi Manual)', 'Backup'));
    // ... (semua kode di utils.js yang sudah ada) ...

// --- FUNGSI BARU UNTUK NOTIFIKASI TOAST ---
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Memicu transisi
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Menghilangkan toast setelah 4 detik
    setTimeout(() => {
        toast.classList.remove('show');
        // Menghapus elemen dari DOM setelah transisi selesai
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000);
}

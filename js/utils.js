/**
 * URL Google Apps Script Web App.
 * GANTI URL INI dengan URL hasil deployment skrip Anda.
 * Pastikan untuk mendeploy ulang skrip setiap kali ada perubahan di sisi Google Apps Script.
 */
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_WZnzSKat7xjOpOYni1l7cLGq0zT-4Nv-mJsdwH714fiAMwrDNt9aSUMdS2lx4S_4/exec';

// PIN untuk berbagai level akses di aplikasi
export const CORRECT_PIN = '7501';      // PIN login utama
export const SALES_REPORT_PIN = '2232'; // PIN untuk mengakses laporan penjualan (jika diperlukan)
export const EDIT_PIN = '2232';         // PIN untuk mengedit atau menghapus data sensitif

// Variabel global untuk menampung daftar dari server.
// Diisi saat aplikasi pertama kali memuat data.
export let hostList = [];
export let adminList = [];
export let treatmentPersonList = [];

/**
 * Mengisi daftar master (host, admin, treatment) dari data yang diambil dari server.
 * @param {Array} masterData - Array objek data master dari server.
 */
export function updateMasterLists(masterData) {
    hostList = masterData.filter(item => item.Tipe === 'Host').map(item => item.Nama);
    adminList = masterData.filter(item => item.Tipe === 'Admin').map(item => item.Nama);
    treatmentPersonList = masterData.filter(item => item.Tipe === 'Treatment').map(item => item.Nama);
}

// --- FUNGSI-FUNGSI PEMBANTU (HELPER FUNCTIONS) ---

/**
 * Mengubah string mata uang (misal: "Rp 1.500.000") menjadi angka (1500000).
 * @param {string | number} value - Nilai mata uang dalam format string atau angka.
 * @returns {number} - Nilai dalam format angka.
 */
export const parseCurrency = (value) => Number(String(value).replace(/[^0-9]/g, '')) || 0;

/**
 * Mengubah angka menjadi format mata uang Rupiah (misal: 1500000 menjadi "Rp 1.500.000").
 * @param {number} value - Nilai angka yang akan diformat.
 * @returns {string} - Nilai dalam format string Rupiah.
 */
export const formatCurrency = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value || 0)}`;

/**
 * Mengisi elemen <select> (dropdown) dengan daftar item.
 * @param {HTMLSelectElement} selectElement - Elemen dropdown yang akan diisi.
 * @param {Array<string>} listItems - Daftar item (string) untuk dijadikan <option>.
 * @param {boolean} [includeBackup=true] - Apakah akan menyertakan opsi "Backup (Isi Manual)".
 */
export function populateDropdown(selectElement, listItems, includeBackup = true) {
    if (!selectElement) return;
    const firstOption = selectElement.options[0]; // Simpan opsi pertama (misal: "-- Pilih Tipe --")
    selectElement.innerHTML = ''; // Kosongkan dropdown
    if (firstOption) selectElement.appendChild(firstOption); // Kembalikan opsi pertama

    listItems.sort().forEach(item => selectElement.add(new Option(item, item)));
    
    if(includeBackup) selectElement.add(new Option('Backup (Isi Manual)', 'Backup'));
}

/**
 * Menampilkan notifikasi toast di pojok kanan atas layar.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {'success' | 'error'} [type='success'] - Jenis notifikasi ('success' untuk hijau, 'error' untuk merah).
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Memicu animasi masuk
    setTimeout(() => { toast.classList.add('show'); }, 10);

    // Memicu animasi keluar dan menghapus elemen setelah selesai
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000); // Notifikasi akan hilang setelah 4 detik
}

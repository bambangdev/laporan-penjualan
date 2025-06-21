// --- api.js ---
// Bertanggung jawab untuk komunikasi dengan Google Sheet.

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzpSVOHsYuDXUoJqHJ4mi2bHiHVT7tqSgD1Q6iq2RKHhwIqszVCfczZUMrNB7zzoFn/exec';

async function fetchData() {
    // Jika data sudah pernah diambil, cukup terapkan filter ulang.
    if (isDataFetched) {
        applyFilters();
        return;
    }
    
    // Tampilkan loader saat proses fetch dimulai
    const pageLoader = document.getElementById('pageLoader');
    const pageError = document.getElementById('pageError');
    pageLoader.classList.remove('hidden');
    pageLoader.classList.add('flex');
    pageError.classList.add('hidden');

    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message);
        }
        
        // Simpan data dan urutkan dari yang terbaru
        allData = result.data.sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
        isDataFetched = true;
        
        // Setelah data berhasil diambil, isi dropdown filter dan tampilkan data
        populateFilters();
        applyFilters();

    } catch (error) {
        pageError.textContent = `Gagal memuat data: ${error.message}. Pastikan URL & skrip Google benar.`;
        pageError.classList.remove('hidden');
    } finally {
        pageLoader.classList.add('hidden');
        pageLoader.classList.remove('flex');
    }
}

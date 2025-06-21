const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzpSVOHsYuDXUoJqHJ4mi2bHiHVT7tqSgD1Q6iq2RKHhwIqszVCfczZUMrNB7zzoFn/exec';

async function fetchData() {
    if (isDataFetched) {
        applyFilters();
        return;
    }
    pageLoader.classList.remove('hidden');
    pageError.classList.add('hidden');
    
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        allData = result.data.sort((a, b) => new Date(b['Tanggal Input']) - new Date(a['Tanggal Input']));
        isDataFetched = true;
        populateFilters();
        applyFilters();
    } catch (error) {
        pageError.textContent = `Gagal memuat data: ${error.message}.`;
        pageError.classList.remove('hidden');
    } finally {
        pageLoader.classList.add('hidden');
    }
}

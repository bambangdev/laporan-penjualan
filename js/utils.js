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
}

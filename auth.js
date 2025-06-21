const CORRECT_PIN = '7501';
const SALES_REPORT_PASSWORD = 'kuyangora666';

function initAuth() {
    const loginSection = document.getElementById('loginSection');
    const mainApp = document.getElementById('mainApp');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    const pinError = document.getElementById('pinError');
    const salesReportPasswordModal = document.getElementById('salesReportPasswordModal');
    const salesReportPasswordForm = document.getElementById('salesReportPasswordForm');
    const salesReportPasswordInput = document.getElementById('salesReportPasswordInput');
    const salesReportPasswordError = document.getElementById('salesReportPasswordError');
    const cancelSalesReportBtn = document.getElementById('cancelSalesReport');

    pinInputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && !input.value && index > 0) pinInputs[index - 1].focus();
        });
        input.addEventListener('input', () => {
            if (input.value && index < pinInputs.length - 1) pinInputs[index + 1].focus();
            const enteredPin = Array.from(pinInputs).map(i => i.value).join('');
            if (enteredPin.length === 4) {
                if (enteredPin === CORRECT_PIN) {
                    loginSection.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                    switchPage('dashboardPage');
                } else {
                    pinError.textContent = 'PIN salah, coba lagi.';
                    pinInputs.forEach(i => i.value = '');
                    pinInputs[0].focus();
                }
            } else {
                 pinError.textContent = '';
            }
        });
    });

    salesReportPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (salesReportPasswordInput.value === SALES_REPORT_PASSWORD) {
            salesReportPasswordModal.classList.add('hidden');
            salesReportPasswordModal.classList.remove('flex');
            switchPage('salesReportPage');
            salesReportPasswordInput.value = '';
            salesReportPasswordError.textContent = '';
        } else {
            salesReportPasswordError.textContent = 'Kata sandi salah.';
        }
    });

    cancelSalesReportBtn.addEventListener('click', () => {
        salesReportPasswordModal.classList.add('hidden');
        salesReportPasswordModal.classList.remove('flex');
        salesReportPasswordInput.value = '';
        salesReportPasswordError.textContent = '';
    });
}

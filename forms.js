function initForms() {
    function setupForm(formId, type, formFields) {
        const form = document.getElementById(formId);
        if (!form) return;

        formFields.omzet?.addEventListener('input', (e) => { e.target.value = formatCurrency(parseCurrency(e.target.value)); });
        
        form.addEventListener('change', () => {
             formFields.backupHostContainer?.classList.toggle('hidden', formFields.host?.value !== 'Backup');
             formFields.backupAdminContainer?.classList.toggle('hidden', formFields.admin?.value !== 'Backup');
             formFields.backupTreatmentContainer?.classList.toggle('hidden', formFields.treatment?.value !== 'Backup');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.querySelector(':invalid')?.focus();
                formFields.status.textContent = 'Error: Mohon isi semua kolom.';
                formFields.status.className = 'mt-4 text-center text-sm h-4 text-red-600';
                return;
            }
            formFields.status.textContent = '';
            const submitBtn = document.getElementById(formFields.submitBtnId);
            const btnText = submitBtn.querySelector('span');
            const loader = submitBtn.querySelector('.loader');
            
            btnText.classList.add('hidden'); loader.classList.remove('hidden'); submitBtn.disabled = true;

            const finalHost = formFields.host?.value === 'Backup' ? formFields.backupHostInput?.value.trim() : formFields.host?.value;
            const finalAdmin = formFields.admin?.value === 'Backup' ? formFields.backupAdminInput?.value.trim() : formFields.admin?.value;
            const finalTreatment = formFields.treatment?.value === 'Backup' ? formFields.backupTreatmentInput?.value.trim() : formFields.treatment?.value;

            const omzetValue = parseCurrency(formFields.omzet?.value);
            const formData = {
                transactionType: type,
                shift: formFields.shift?.value || '',
                host: finalHost || '',
                adminName: finalAdmin || '',
                customerName: formFields.customer?.value || '',
                totalPcs: formFields.pcs?.value || '',
                totalOmzet: omzetValue || '',
                orangTreatment: finalTreatment || '',
                pcsTreatment: formFields.pcsTreatment?.value || '',
            };
            
            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);
                formFields.status.textContent = `Laporan ${type} berhasil dikirim!`;
                formFields.status.className = 'mt-4 text-center text-sm h-4 text-green-600';
                form.reset();
                form.dispatchEvent(new Event('change'));
                isDataFetched = false;
            } catch (error) {
                formFields.status.textContent = `Error: ${error.message}`;
                formFields.status.className = 'mt-4 text-center text-sm h-4 text-red-600';
            } finally {
                btnText.classList.remove('hidden'); loader.classList.add('hidden'); submitBtn.disabled = false;
            }
        });
    }

    // Penjualan Form
    setupForm('penjualanForm', 'Penjualan', {
         shift: document.getElementById('penjualanShift'), host: document.getElementById('penjualanHost'), admin: document.getElementById('penjualanAdmin'), customer: document.getElementById('penjualanCustomer'), pcs: document.getElementById('penjualanPcs'), omzet: document.getElementById('penjualanOmzet'),
         backupHostContainer: document.getElementById('penjualanBackupHostContainer'), backupAdminContainer: document.getElementById('penjualanBackupAdminContainer'),
         backupHostInput: document.getElementById('penjualanBackupHost'), backupAdminInput: document.getElementById('penjualanBackupAdmin'),
         submitBtnId: 'penjualanSubmitBtn', status: document.getElementById('penjualanStatus'),
    });
    
    // Return Form
    setupForm('returnForm', 'Return', {
         host: document.getElementById('returnHost'), admin: document.getElementById('returnAdmin'), customer: document.getElementById('returnCustomer'), pcs: document.getElementById('returnPcs'), omzet: document.getElementById('returnOmzet'),
         backupHostContainer: document.getElementById('returnBackupHostContainer'), backupAdminContainer: document.getElementById('returnBackupAdminContainer'),
         backupHostInput: document.getElementById('returnBackupHost'), backupAdminInput: document.getElementById('returnBackupAdmin'),
         submitBtnId: 'returnSubmitBtn', status: document.getElementById('returnStatus'),
    });

    // Treatment Form
    setupForm('treatmentForm', 'Treatment', {
         treatment: document.getElementById('treatmentPerson'), pcsTreatment: document.getElementById('treatmentPcs'),
         backupTreatmentContainer: document.getElementById('treatmentBackupContainer'), backupTreatmentInput: document.getElementById('treatmentBackupPerson'),
         submitBtnId: 'treatmentSubmitBtn', status: document.getElementById('treatmentStatus'),
    });
}

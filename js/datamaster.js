import { SCRIPT_URL, showToast } from './utils.js';

// Fungsi untuk me-render daftar data master ke dalam container
function renderMasterList(containerId, list, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; // Kosongkan container
    
    if (list.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Tidak ada data.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'space-y-2';

    list.forEach(item => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-50 p-2 rounded';
        li.innerHTML = `
            <span class="text-gray-800">${item.Nama}</span>
            <button data-row-index="${item.rowIndex}" data-name="${item.Nama}" class="delete-master-item text-red-500 hover:text-red-700 text-xs">Hapus</button>
        `;
        ul.appendChild(li);
    });

    container.appendChild(ul);

    // Tambahkan event listener untuk tombol hapus
    container.querySelectorAll('.delete-master-item').forEach(button => {
        button.addEventListener('click', handleDeleteMasterItem);
    });
}

// Fungsi untuk menangani penghapusan item
async function handleDeleteMasterItem(event) {
    const button = event.target;
    const rowIndex = button.dataset.rowIndex;
    const name = button.dataset.name;

    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
        return;
    }

    button.disabled = true;
    button.textContent = 'Menghapus...';

    const formData = {
        action: 'deleteMaster',
        rowIndex: rowIndex,
    };

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);

        showToast(`Data "${name}" berhasil dihapus.`, 'success');
        document.dispatchEvent(new CustomEvent('dataChanged')); // Memicu refresh data global

    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        button.disabled = false;
        button.textContent = 'Hapus';
    }
}


// Fungsi utama untuk setup halaman Data Master
export function setupDataMasterPage(masterData) {
    const dataMasterForm = document.getElementById('dataMasterForm');
    if (!dataMasterForm) return; // Hentikan jika bukan di halaman Data Master

    // Pisahkan data master berdasarkan tipenya
    const hosts = masterData.filter(item => item.Tipe === 'Host');
    const admins = masterData.filter(item => item.Tipe === 'Admin');
    const treatments = masterData.filter(item => item.Tipe === 'Treatment');

    // Render setiap daftar
    renderMasterList('hostListContainer', hosts, 'Host');
    renderMasterList('adminListContainer', admins, 'Admin');
    renderMasterList('treatmentListContainer', treatments, 'Treatment');

    // Setup form untuk menambah data baru
    if (!dataMasterForm.dataset.listenerAttached) {
        dataMasterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const saveBtn = document.getElementById('saveMasterDataBtn');
            const btnText = saveBtn.querySelector('span');
            const loader = saveBtn.querySelector('.loader');

            const dataType = document.getElementById('masterDataType').value;
            const dataName = document.getElementById('masterDataName').value.trim();

            if (!dataType || !dataName) {
                showToast('Tipe dan Nama tidak boleh kosong.', 'error');
                return;
            }

            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
            saveBtn.disabled = true;

            const formData = {
                action: 'addMaster',
                type: dataType,
                name: dataName,
            };

            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(formData) });
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);

                showToast(`Data "${dataName}" berhasil disimpan.`, 'success');
                dataMasterForm.reset();
                document.dispatchEvent(new CustomEvent('dataChanged')); // Memicu refresh data global

            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            } finally {
                btnText.classList.remove('hidden');
                loader.classList.add('hidden');
                saveBtn.disabled = false;
            }
        });
        dataMasterForm.dataset.listenerAttached = 'true';
    }
}

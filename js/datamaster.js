import { SCRIPT_URL, showToast } from './utils.js';

export function renderDataMasterHTML() {
    const page = document.getElementById('dataMasterPage');
    if (!page) return;
    page.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800 mb-6">Manajemen Data Master</h1>
        <div class="max-w-md p-6 bg-white rounded-lg shadow mb-8">
            <h2 class="text-xl font-semibold mb-4">Tambah Data Baru</h2>
            <form id="dataMasterForm" class="space-y-4">
                <div>
                    <label for="masterDataType" class="block text-sm font-bold text-gray-700 mb-1">Tipe Data</label>
                    <select id="masterDataType" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="" disabled selected>-- Pilih Tipe --</option>
                        <option value="Host">Host</option>
                        <option value="Admin">Admin</option>
                        <option value="Treatment">Treatment</option>
                    </select>
                </div>
                <div>
                    <label for="masterDataName" class="block text-sm font-bold text-gray-700 mb-1">Nama</label>
                    <input type="text" id="masterDataName" required placeholder="Ketik nama baru" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <button type="submit" id="saveMasterDataBtn" class="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-700 flex items-center justify-center">
                    <span>Simpan Data</span>
                    <div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6 ml-3 hidden"></div>
                </button>
            </form>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Daftar Host</h3>
                <div id="hostListContainer" class="bg-white p-4 rounded-lg shadow"></div>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Daftar Admin</h3>
                <div id="adminListContainer" class="bg-white p-4 rounded-lg shadow"></div>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Daftar Staff Treatment</h3>
                <div id="treatmentListContainer" class="bg-white p-4 rounded-lg shadow"></div>
            </div>
        </div>
    `;
}

function renderMasterList(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
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
    container.querySelectorAll('.delete-master-item').forEach(button => {
        button.addEventListener('click', handleDeleteMasterItem);
    });
}

async function handleDeleteMasterItem(event) {
    const button = event.target;
    const rowIndex = button.dataset.rowIndex;
    const name = button.dataset.name;
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) return;

    button.disabled = true;
    button.textContent = 'Menghapus...';
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'deleteMaster', rowIndex }) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        showToast(`Data "${name}" berhasil dihapus.`, 'success');
        document.dispatchEvent(new CustomEvent('dataChanged'));
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        button.disabled = false;
        button.textContent = 'Hapus';
    }
}

export function setupDataMasterPage(masterData) {
    const dataMasterForm = document.getElementById('dataMasterForm');
    if (!dataMasterForm) return;

    const hosts = masterData.filter(item => item.Tipe === 'Host');
    const admins = masterData.filter(item => item.Tipe === 'Admin');
    const treatments = masterData.filter(item => item.Tipe === 'Treatment');

    renderMasterList('hostListContainer', hosts);
    renderMasterList('adminListContainer', admins);
    renderMasterList('treatmentListContainer', treatments);

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

            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'addMaster', type: dataType, name: dataName }) });
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);
                showToast(`Data "${dataName}" berhasil disimpan.`, 'success');
                dataMasterForm.reset();
                document.dispatchEvent(new CustomEvent('dataChanged'));
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

// --- reports.js ---
// Mengelola semua perhitungan dan rendering untuk laporan dan dashboard.

function applyFilters() {
    if (!isDataFetched) return;

    const dashboardSearchCustomer = document.getElementById('dashboardSearchCustomer');
    const dashboardFilterShift = document.getElementById('dashboardFilterShift');
    const dashboardFilterHost = document.getElementById('dashboardFilterHost');
    const dashboardFilterAdmin = document.getElementById('dashboardFilterAdmin');
    
    const searchTerm = dashboardSearchCustomer.value.toLowerCase();
    const selectedShift = dashboardFilterShift.value;
    const selectedHost = dashboardFilterHost.value;
    const selectedAdmin = dashboardFilterAdmin.value;
    const startDate = dashboardDatePicker.getStartDate()?.toJSDate();
    const endDate = dashboardDatePicker.getEndDate()?.toJSDate();
    if(startDate) startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999);

    const filteredData = allData.filter(row => {
        const rowDate = new Date(row['Tanggal Input']);
        // BUG FIX: Convert 'Nama Customer' to string before calling toLowerCase()
        const customerMatch = row['Nama Customer'] ? String(row['Nama Customer']).toLowerCase().includes(searchTerm) : searchTerm === '';
        const shiftMatch = selectedShift ? row.Shift === selectedShift : true;
        const hostMatch = selectedHost ? row['Nama Host'] === selectedHost : true;
        const adminMatch = selectedAdmin ? row['Nama Admin'] === selectedAdmin : true;
        const dateMatch = (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate);
        return customerMatch && shiftMatch && hostMatch && adminMatch && dateMatch;
    });
    
    calculateAndRenderStats(filteredData);
    renderSalesTrendChart(filteredData);
    applyCustomerReportFilters(); 
    applySalesReportFilters();
}

function calculateAndRenderStats(data) {
    const penjualanData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const returnData = data.filter(r => r['Jenis Transaksi'] === 'Return');

    const omzetPenjualan = penjualanData.reduce((s, r) => s + Number(r['Total Omzet'] || 0), 0);
    const omzetReturn = returnData.reduce((s, r) => s + Number(r['Total Omzet'] || 0), 0);

    document.getElementById('statOmzetPenjualan').textContent = formatCurrency(omzetPenjualan);
    document.getElementById('statOmzetReturn').textContent = formatCurrency(omzetReturn);
    document.getElementById('statLabaKotor').textContent = formatCurrency(omzetPenjualan - omzetReturn);
    document.getElementById('statTingkatReturn').textContent = omzetPenjualan > 0 ? `${((omzetReturn / omzetPenjualan) * 100).toFixed(1)}%` : '0%';
}

function renderSalesTrendChart(data) {
    const salesData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const salesByDay = salesData.reduce((acc, row) => {
        const date = moment(row['Tanggal Input']).format('YYYY-MM-DD');
        acc[date] = (acc[date] || 0) + Number(row['Total Omzet']);
        return acc;
    }, {});

    const sortedDates = Object.keys(salesByDay).sort((a,b) => new Date(a) - new Date(b));
    const labels = sortedDates.map(date => moment(date).format('DD MMM'));
    const chartData = sortedDates.map(date => salesByDay[date]);
    
    const ctx = document.getElementById('salesTrendChart').getContext('2d');
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }
    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omzet Penjualan',
                data: chartData,
                borderColor: '#db2777',
                backgroundColor: 'rgba(219, 39, 119, 0.1)',
                fill: true,
                tension: 0.3,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => 'Rp ' + (v/1000) + 'k' } } },
            plugins: { tooltip: { callbacks: { label: (c) => ` Omzet: ${formatCurrency(c.raw)}` } } }
        }
    });
}

function applyCustomerReportFilters() {
    if (!isDataFetched) return;
    const startDate = customerDatePicker.getStartDate()?.toJSDate();
    const endDate = customerDatePicker.getEndDate()?.toJSDate();
    if(startDate) startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999);
    
    const filteredData = allData.filter(row => {
         const rowDate = new Date(row['Tanggal Input']);
         return (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate);
    });
    calculateAndRenderCustomerReport(filteredData);
}

function calculateAndRenderCustomerReport(data) {
    const topBuyerEl = { name: document.getElementById('topBuyerName'), pcs: document.getElementById('topBuyerPcs'), omzet: document.getElementById('topBuyerOmzet') };
    const topReturnerEl = { name: document.getElementById('topReturnerName'), pcs: document.getElementById('topReturnerPcs'), omzet: document.getElementById('topReturnerOmzet') };
    
    const getTopCustomer = (sourceData, pcsField, omzetField) => {
        if (sourceData.length === 0) return null;
        const customerData = sourceData.reduce((acc, row) => {
            const name = row['Nama Customer'];
            if(!name || name === '-') return acc;
            acc[name] = acc[name] || { pcs: 0, omzet: 0 };
            acc[name].pcs += Number(row[pcsField] || 0);
            acc[name].omzet += Number(row[omzetField] || 0);
            return acc;
        }, {});
        const topCustomerName = Object.keys(customerData).sort((a,b) => customerData[b].omzet - customerData[a].omzet)[0];
        return topCustomerName ? { name: topCustomerName, ...customerData[topCustomerName] } : null;
    };
    
    const topBuyer = getTopCustomer(data.filter(r => r['Jenis Transaksi'] === 'Penjualan'), 'Total Pcs', 'Total Omzet');
    const topReturner = getTopCustomer(data.filter(r => r['Jenis Transaksi'] === 'Return'), 'Total Pcs', 'Total Omzet');

    const renderTopCustomer = (elements, data) => {
        if (data) {
            elements.name.textContent = data.name;
            elements.pcs.textContent = data.pcs.toLocaleString('id-ID');
            elements.omzet.textContent = formatCurrency(data.omzet);
        } else {
            elements.name.textContent = '-';
            elements.pcs.textContent = '0';
            elements.omzet.textContent = 'Rp 0';
        }
    };
    renderTopCustomer(topBuyerEl, topBuyer);
    renderTopCustomer(topReturnerEl, topReturner);
}

function applySalesReportFilters() {
    if (!isDataFetched) return;
    const startDate = salesReportDatePicker.getStartDate()?.toJSDate();
    const endDate = salesReportDatePicker.getEndDate()?.toJSDate();
    if(startDate) startDate.setHours(0,0,0,0);
    if(endDate) endDate.setHours(23,59,59,999);
    
    const filteredData = allData.filter(row => {
         const rowDate = new Date(row['Tanggal Input']);
         return (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate);
    });
    calculateAndRenderScoreboard(filteredData, document.getElementById('salesReportHostScoreboardBody'), document.getElementById('salesReportAdminScoreboardBody'), document.getElementById('salesReportTreatmentScoreboardBody'));
}

function calculateAndRenderScoreboard(data, hostTbody, adminTbody, treatmentTbody) {
    const getJustDate = (isoString) => isoString.split('T')[0];

    const processPerformance = (sourceData, groupByField, pcsField, omzetField, bonusRate, bonusType, target) => {
        const performance = {};
        const salesByPerson = sourceData.reduce((acc, row) => {
            const key = row[groupByField];
            if (key) (acc[key] = acc[key] || []).push(row);
            return acc;
        }, {});

        for (const name in salesByPerson) {
            const personSales = salesByPerson[name];
            const totalPcs = personSales.reduce((s, r) => s + Number(r[pcsField] || 0), 0);
            let totalBonus = 0;

            const salesByDay = personSales.reduce((acc, row) => {
                const day = getJustDate(row['Tanggal Input']);
                (acc[day] = acc[day] || []).push(row);
                return acc;
            }, {});

            for (const date in salesByDay) {
                const dailyPcs = salesByDay[date].reduce((s, r) => s + Number(r[pcsField] || 0), 0);
                if (dailyPcs >= target) {
                     if (bonusType === 'percentage') {
                        const dailyOmzet = salesByDay[date].reduce((s, r) => s + Number(r[omzetField] || 0), 0);
                        totalBonus += dailyOmzet * bonusRate;
                     } else if (bonusType === 'fixed') {
                        totalBonus += bonusRate;
                     }
                }
            }
            performance[name] = { totalPcs, totalBonus };
        }
        return performance;
    };
    
    const renderScoreboardTable = (tbody, performanceData) => {
        tbody.innerHTML = '';
        const sortedNames = Object.keys(performanceData).sort((a,b) => performanceData[b].totalBonus - performanceData[a].totalBonus);
        if (sortedNames.length === 0) {
             tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
             return;
        }
        sortedNames.forEach(name => {
            const perf = performanceData[name];
            tbody.innerHTML += `<tr><td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td><td class="py-2 px-3 text-sm text-gray-500">${perf.totalPcs.toLocaleString('id-ID')}</td><td class="py-2 px-3 text-sm font-semibold text-pink-600">${formatCurrency(perf.totalBonus)}</td></tr>`;
        });
    };
    
    const salesData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
    const treatmentData = data.filter(r => r['Jenis Transaksi'] === 'Treatment');
    
    renderScoreboardTable(hostTbody, processPerformance(salesData, 'Nama Host', 'Total Pcs', 'Total Omzet', 0.03, 'percentage', 40));
    renderScoreboardTable(adminTbody, processPerformance(salesData, 'Nama Admin', 'Total Pcs', 'Total Omzet', 0.01, 'percentage', 40));
    renderScoreboardTable(treatmentTbody, processPerformance(treatmentData, 'Orang Treatment', 'PCS Treatment', null, 2500, 'fixed', 30));
}

function populateFilters() {
    const getUniqueValues = (key) => [...new Set(allData.map(item => item[key]).filter(Boolean))];
    const dashboardFilterShift = document.getElementById('dashboardFilterShift');
    const dashboardFilterHost = document.getElementById('dashboardFilterHost');
    const dashboardFilterAdmin = document.getElementById('dashboardFilterAdmin');
    populateDropdown(dashboardFilterShift, getUniqueValues('Shift'), false);
    populateDropdown(dashboardFilterHost, getUniqueValues('Nama Host'), false);
    populateDropdown(dashboardFilterAdmin, getUniqueValues('Nama Admin'), false);
}

import { formatCurrency, parseCurrency } from './utils.js';

let allData = [];
let salesReportDatePicker;
let dailySalesChartInstance = null;

function renderTopHostSalesTable(data) {
    const hostSales = data.reduce((acc, row) => {
        const hostName = row['Nama Host'] || 'Unknown';
        if(hostName === 'Unknown') return acc;
        acc[hostName] = acc[hostName] || { omzet: 0, pcs: 0 };
        acc[hostName].omzet += parseCurrency(row['Total Omzet'] || 0);
        acc[hostName].pcs += Number(row['Total Pcs'] || 0);
        return acc;
    }, {});

    const sortedHosts = Object.keys(hostSales).sort((a, b) => hostSales[b].omzet - hostSales[a].omzet);
    const tbody = document.getElementById('salesReportTopHostTable');
    tbody.innerHTML = '';

    if (sortedHosts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
        return;
    }

    sortedHosts.forEach(host => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-3 text-sm font-medium text-gray-900">${host}</td>
            <td class="py-2 px-3 text-sm text-gray-500">${formatCurrency(hostSales[host].omzet)}</td>
            <td class="py-2 px-3 text-sm text-gray-500">${hostSales[host].pcs.toLocaleString('id-ID')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDailySalesChart(data, startDate, endDate) {
    const dailyData = {};
    if (startDate && endDate) {
        let currentDay = moment(startDate);
        while (currentDay.isSameOrBefore(endDate, 'day')) {
            dailyData[currentDay.format('YYYY-MM-DD')] = 0;
            currentDay.add(1, 'day');
        }
    }
    
    data.forEach(row => {
        const date = moment(row['Tanggal Input']);
        if (date.isValid()) {
            const day = date.format('YYYY-MM-DD');
            if (dailyData.hasOwnProperty(day)) {
                dailyData[day] += parseCurrency(row['Total Omzet'] || 0);
            }
        }
    });

    const sortedDays = Object.keys(dailyData).sort();
    const labels = sortedDays.map(day => moment(day).format('DD MMM'));
    const omzetData = sortedDays.map(day => dailyData[day]);

    const ctx = document.getElementById('dailySalesChart').getContext('2d');
    if (dailySalesChartInstance) dailySalesChartInstance.destroy();

    dailySalesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omzet Penjualan Harian',
                data: omzetData,
                borderColor: '#EC4899',
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Omzet (Rp)' }, ticks: { callback: value => formatCurrency(value).replace('Rp ', '') } },
                x: { title: { display: true, text: 'Tanggal' } }
            },
            plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: ${formatCurrency(context.raw)}` } } }
        }
    });
}


function renderCombinedSalaryBonusTable(tbody, dataMap, bonusMap, rate, type) {
    tbody.innerHTML = '';
    const allNames = new Set([...Object.keys(dataMap), ...Object.keys(bonusMap)]);
    if(type !== 'Treatment') allNames.forEach(name => { if(!name || name ==='Unknown') allNames.delete(name) });
    const sortedNames = Array.from(allNames).sort();

    if (sortedNames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${type === 'Treatment' ? 3 : 5}" class="text-center py-4 text-sm text-gray-400">Tidak ada data.</td></tr>`;
        return;
    }

    sortedNames.forEach(name => {
        const uniqueDays = dataMap[name] ? dataMap[name].size : 0;
        const basicSalary = uniqueDays * rate;
        const bonus = bonusMap[name] ? bonusMap[name].totalBonus : 0;
        const total = basicSalary + bonus;
        const tr = document.createElement('tr');
        if (type === 'Treatment') {
            tr.innerHTML = `<td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td><td class="py-2 px-3 text-sm text-gray-500">${uniqueDays} Hari</td><td class="py-2 px-3 text-sm font-semibold text-gray-800">${formatCurrency(basicSalary)}</td>`;
        } else {
            tr.innerHTML = `<td class="py-2 px-3 text-sm font-medium text-gray-900">${name}</td><td class="py-2 px-3 text-sm text-gray-500">${uniqueDays} Hari</td><td class="py-2 px-3 text-sm text-gray-500">${formatCurrency(basicSalary)}</td><td class="py-2 px-3 text-sm text-green-600">${formatCurrency(bonus)}</td><td class="py-2 px-3 text-sm font-semibold text-blue-600">${formatCurrency(total)}</td>`;
        }
        tbody.appendChild(tr);
    });
}


function applySalesReportFilters() {
    const salesLoader = document.getElementById('salesLoader');
    salesLoader.classList.remove('hidden');
    salesLoader.classList.add('flex');

    setTimeout(() => {
        const startDate = salesReportDatePicker.getStartDate()?.toJSDate();
        const endDate = salesReportDatePicker.getEndDate()?.toJSDate();
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        const diffDays = moment(endDate).diff(moment(startDate), 'days') + 1;
        const previousStartDate = moment(startDate).subtract(diffDays, 'days').toDate();
        const previousEndDate = moment(endDate).subtract(diffDays, 'days').toDate();

        const filteredData = allData.filter(row => {
            const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
            return (!startDate || !rowDate) ? true : (rowDate >= startDate && rowDate <= endDate);
        });

        const prevPeriodData = allData.filter(row => {
            const rowDate = row['Tanggal Input'] ? new Date(row['Tanggal Input']) : null;
            return (!previousStartDate || !rowDate) ? true : (rowDate >= previousStartDate && rowDate <= previousEndDate);
        });

        const calculateMetrics = (data) => {
            const penjualanData = data.filter(r => r['Jenis Transaksi'] === 'Penjualan');
            const returnData = data.filter(r => r['Jenis Transaksi'] === 'Return');
            const totalPcsPenjualan = penjualanData.reduce((s, r) => s + Number(r['Total Pcs'] || 0), 0);
            const totalOmzetPenjualan = penjualanData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0);
            const totalOmzetReturn = returnData.reduce((s, r) => s + parseCurrency(r['Total Omzet'] || 0), 0);
            const netOmzet = totalOmzetPenjualan - totalOmzetReturn;
            const customerPurchaseCounts = penjualanData.reduce((acc, row) => {
                const customerName = String(row['Nama Customer'] || '').trim();
                if (customerName && customerName !== '-') acc[customerName] = (acc[customerName] || 0) + 1;
                return acc;
            }, {});
            const uniqueCustomers = Object.keys(customerPurchaseCounts).length;
            const repeatCustomers = Object.keys(customerPurchaseCounts).filter(name => customerPurchaseCounts[name] > 1).length;
            return { totalPcsPenjualan, totalOmzetPenjualan, netOmzet, uniqueCustomers, repeatCustomers, totalOmzetReturn };
        };

        const currentMetrics = calculateMetrics(filteredData);
        const previousMetrics = calculateMetrics(prevPeriodData);

        document.getElementById('salesReportTotalPcs').textContent = currentMetrics.totalPcsPenjualan.toLocaleString('id-ID');
        document.getElementById('salesReportTotalOmzet').textContent = formatCurrency(currentMetrics.totalOmzetPenjualan);
        document.getElementById('salesReportNetOmzet').textContent = formatCurrency(currentMetrics.netOmzet);
        document.getElementById('salesReportReturnRatio').textContent = `${(currentMetrics.totalOmzetPenjualan > 0 ? (currentMetrics.totalOmzetReturn / currentMetrics.totalOmzetPenjualan) * 100 : 0).toFixed(2)}%`;
        document.getElementById('salesReportUniqueCustomers').textContent = currentMetrics.uniqueCustomers.toLocaleString('id-ID');
        document.getElementById('salesReportRepeatCustomers').textContent = currentMetrics.repeatCustomers.toLocaleString('id-ID');

        const renderComparison = (elementId, currentValue, previousValue) => {
            const element = document.getElementById(elementId);
            if (previousValue === 0) {
                element.innerHTML = '<span>- vs periode lalu</span>';
                element.className = 'text-sm text-gray-500 mt-1';
                return;
            }
            const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
            const arrow = percentageChange >= 0 ? '▲' : '▼';
            const color = percentageChange >= 0 ? 'text-green-600' : 'text-red-600';
            element.innerHTML = `<span class="${color}">${arrow} ${percentageChange.toFixed(2)}%</span> vs periode lalu`;
        };
        
        renderComparison('salesReportTotalPcsComparison', currentMetrics.totalPcsPenjualan, previousMetrics.totalPcsPenjualan);
        renderComparison('salesReportTotalOmzetComparison', currentMetrics.totalOmzetPenjualan, previousMetrics.totalOmzetPenjualan);
        renderComparison('salesReportNetOmzetComparison', currentMetrics.netOmzet, previousMetrics.netOmzet);
        renderComparison('salesReportUniqueCustomersComparison', currentMetrics.uniqueCustomers, previousMetrics.uniqueCustomers);
        renderComparison('salesReportRepeatCustomersComparison', currentMetrics.repeatCustomers, previousMetrics.repeatCustomers);

        const getPersonUniqueDays = (dataArray, personField) => {
            const personDays = {};
            dataArray.forEach(row => {
                const date = moment(row['Tanggal Input']);
                const person = String(row[personField] || '').trim();
                if (date.isValid() && person) {
                    personDays[person] = personDays[person] || new Set();
                    personDays[person].add(date.format('YYYY-MM-DD'));
                }
            });
            return personDays;
        };

        const getPersonBonus = (sourceData, groupByField, pcsField, omzetField, bonusRate, bonusType, target) => {
            const performance = {};
            sourceData.forEach(row => {
                const name = String(row[groupByField] || '').trim();
                const day = row['Tanggal Input'] ? row['Tanggal Input'].split('T')[0] : null;
                if (name && day) {
                    performance[name] = performance[name] || { totalPcsDaily: {}, totalOmzetDaily: {} };
                    performance[name].totalPcsDaily[day] = (performance[name].totalPcsDaily[day] || 0) + Number(row[pcsField] || 0);
                    if (omzetField) {
                        performance[name].totalOmzetDaily[day] = (performance[name].totalOmzetDaily[day] || 0) + parseCurrency(row[omzetField] || 0);
                    }
                }
            });

            const bonusSummary = {};
            for (const name in performance) {
                let totalBonus = 0;
                for (const day in performance[name].totalPcsDaily) {
                    if (performance[name].totalPcsDaily[day] >= target) {
                        if (bonusType === 'percentage') totalBonus += (performance[name].totalOmzetDaily[day] || 0) * bonusRate;
                        else if (bonusType === 'fixed') totalBonus += bonusRate;
                    }
                }
                bonusSummary[name] = { totalBonus };
            }
            return bonusSummary;
        };
        
        const penjualanData = filteredData.filter(r => r['Jenis Transaksi'] === 'Penjualan');
        const treatmentData = filteredData.filter(r => r['Jenis Transaksi'] === 'Treatment');
        const hostDailyData = getPersonUniqueDays(penjualanData, 'Nama Host');
        const adminDailyData = getPersonUniqueDays(penjualanData, 'Nama Admin');
        const treatmentDailyData = getPersonUniqueDays(treatmentData, 'Orang Treatment');
        const hostBonusData = getPersonBonus(penjualanData, 'Nama Host', 'Total Pcs', 'Total Omzet', 0.03, 'percentage', 40);
        const adminBonusData = getPersonBonus(penjualanData, 'Nama Admin', 'Total Pcs', 'Total Omzet', 0.01, 'percentage', 40);
        const treatmentBonusData = getPersonBonus(treatmentData, 'Orang Treatment', 'PCS Treatment', null, 2500, 'fixed', 30);
        
        renderCombinedSalaryBonusTable(document.getElementById('salesReportHostCombinedTable'), hostDailyData, hostBonusData, 80000, 'Host');
        renderCombinedSalaryBonusTable(document.getElementById('salesReportAdminCombinedTable'), adminDailyData, adminBonusData, 60000, 'Admin');
        renderCombinedSalaryBonusTable(document.getElementById('salesReportTreatmentCombinedTable'), treatmentDailyData, treatmentBonusData, 12500, 'Treatment');

        renderDailySalesChart(penjualanData, startDate, endDate);
        renderTopHostSalesTable(penjualanData);

        salesLoader.classList.add('hidden');
        salesLoader.classList.remove('flex');
    }, 50);
}


export function setupSalesReportPage(data) {
    allData = data;
    const litepickerOptions = {
        singleMode: false, format: 'DD MMM YY', lang: 'id-ID', numberOfMonths: 2,
        dropdowns: { minYear: 2020, maxYear: null, months: true, years: true },
         buttonText: {
            previousMonth: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`,
            nextMonth: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg>`,
        },
    };

    if (!salesReportDatePicker) {
        salesReportDatePicker = new Litepicker({
            element: document.getElementById('salesReportDateRangePicker'),
            ...litepickerOptions,
            setup: (picker) => picker.on('selected', applySalesReportFilters),
        });
        salesReportDatePicker.setDateRange(moment().subtract(6, 'days').toDate(), moment().toDate());
    }

    // Listen for global filter changes
    document.addEventListener('filterChanged', (e) => {
        if (e.detail.pageId === 'salesReportPage') {
            applySalesReportFilters();
        }
    });
}

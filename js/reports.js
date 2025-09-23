// js/reports.js - Reporting Logic

(function() {
    'use strict';

    // --- DOM Elements ---
    const nav = document.querySelector('#reports-view .sub-nav');
    const outputDiv = document.getElementById('report-output');
    const generateBtn = document.getElementById('generate-report-btn');
    const exportBtn = document.getElementById('export-csv-btn');
    const printBtn = document.getElementById('print-report-btn');
    const dateControls = document.querySelector('#reports-view .report-controls');

    let currentReportData = [];
    let currentReportHeaders = [];
    let currentReportTitle = '';

    async function generateSalesReport() {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        const sales = await window.db.getAll('sales');

        const filtered = sales.filter(s => {
            const saleDate = new Date(s.timestamp);
            if (startDate && saleDate < new Date(startDate)) return false;
            if (endDate && saleDate > new Date(endDate)) return false;
            return true;
        });

        let totalRevenue = 0;
        let totalCost = 0;
        let tableHtml = '<table><thead><tr><th>التاريخ</th><th>الإجمالي</th><th>الربح</th></tr></thead><tbody>';
        currentReportData = [];
        currentReportHeaders = ['Date', 'Total', 'Profit'];

        filtered.forEach(sale => {
            const saleCost = sale.items.reduce((acc, item) => acc + (item.purchaseCost * item.quantity), 0);
            const profit = sale.finalTotal - saleCost;
            totalRevenue += sale.finalTotal;
            totalCost += saleCost;
            tableHtml += `<tr><td>${new Date(sale.timestamp).toLocaleDateString()}</td><td>${sale.finalTotal.toFixed(2)}</td><td>${profit.toFixed(2)}</td></tr>`;
            currentReportData.push({ Date: new Date(sale.timestamp).toLocaleDateString(), Total: sale.finalTotal.toFixed(2), Profit: profit.toFixed(2) });
        });
        tableHtml += '</tbody></table>';

        const totalProfit = totalRevenue - totalCost;
        const summaryHtml = `<div class="summary">إجمالي المبيعات: ${totalRevenue.toFixed(2)} | إجمالي الربح: ${totalProfit.toFixed(2)}</div>`;
        outputDiv.innerHTML = summaryHtml + tableHtml;
        currentReportTitle = 'Sales and Profit Report';
    }

    async function generateStockValueReport() {
        const products = await window.db.getAll('products');
        let totalValue = 0;
        let tableHtml = '<table><thead><tr><th>المنتج</th><th>الكمية</th><th>تكلفة الشراء</th><th>قيمة المخزون</th></tr></thead><tbody>';
        currentReportData = [];
        currentReportHeaders = ['Product', 'Stock', 'Purchase Cost', 'Stock Value'];

        products.forEach(p => {
            const value = p.stock * p.purchaseCost;
            totalValue += value;
            tableHtml += `<tr><td>${p.name}</td><td>${p.stock}</td><td>${p.purchaseCost.toFixed(2)}</td><td>${value.toFixed(2)}</td></tr>`;
            currentReportData.push({ Product: p.name, Stock: p.stock, 'Purchase Cost': p.purchaseCost.toFixed(2), 'Stock Value': value.toFixed(2) });
        });
        tableHtml += '</tbody></table>';
        const summaryHtml = `<div class="summary">إجمالي قيمة المخزون: ${totalValue.toFixed(2)}</div>`;
        outputDiv.innerHTML = summaryHtml + tableHtml;
        currentReportTitle = 'Stock Value Report';
    }

    async function generateLowStockReport() {
        const products = await window.db.getAll('products');
        const lowStockProducts = products.filter(p => p.stock <= p.lowStockAlert);
        let tableHtml = '<table><thead><tr><th>المنتج</th><th>الكمية الحالية</th><th>حد التنبيه</th></tr></thead><tbody>';
        currentReportData = [];
        currentReportHeaders = ['Product', 'Current Stock', 'Alert Level'];

        lowStockProducts.forEach(p => {
            tableHtml += `<tr><td>${p.name}</td><td>${p.stock}</td><td>${p.lowStockAlert}</td></tr>`;
            currentReportData.push({ Product: p.name, 'Current Stock': p.stock, 'Alert Level': p.lowStockAlert });
        });
        tableHtml += '</tbody></table>';
        outputDiv.innerHTML = tableHtml;
        currentReportTitle = 'Low Stock Report';
    }

    function exportToCsv() {
        let csvContent = "data:text/csv;charset=utf-8," + currentReportHeaders.join(",") + "\n"
            + currentReportData.map(e => Object.values(e).join(",")).join("\n");

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${currentReportTitle.replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function printReport() {
        const response = await fetch('/templates/reports.html');
        const template = await response.text();
        const populatedHtml = template
            .replace('{{reportTitle}}', currentReportTitle)
            .replace('{{generationDate}}', new Date().toLocaleString())
            .replace('{{summary}}', outputDiv.querySelector('.summary')?.outerHTML || '')
            .replace('{{table}}', outputDiv.querySelector('table')?.outerHTML || '');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(populatedHtml);
        printWindow.document.close();
        printWindow.print();
    }

    function setupEventListeners() {
        let activeReportGenerator = generateSalesReport;
        dateControls.style.display = 'block';

        nav.addEventListener('click', e => {
            if (e.target.matches('[data-report]')) {
                const reportType = e.target.dataset.report;
                dateControls.style.display = 'none';
                if (reportType === 'sales') {
                    activeReportGenerator = generateSalesReport;
                    dateControls.style.display = 'block';
                } else if (reportType === 'stock-value') {
                    activeReportGenerator = generateStockValueReport;
                } else if (reportType === 'low-stock') {
                    activeReportGenerator = generateLowStockReport;
                }
                activeReportGenerator();
            }
        });
        generateBtn.addEventListener('click', () => activeReportGenerator());
        exportBtn.addEventListener('click', exportToCsv);
        printBtn.addEventListener('click', printReport);
    }

    function init() {
        console.log('Reports module initialized.');
        setupEventListeners();
        generateSalesReport(); // Generate default report on load
    }

    window.reports = {
        init
    };

})();

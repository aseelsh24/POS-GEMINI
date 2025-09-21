(function() {
    'use strict';

    // --- DOM Elements ---
    const reportsNav = document.querySelector('#reports-view .sub-nav');
    const reportSections = document.querySelectorAll('#reports-view section');
    // Sales Report
    const generateSalesReportBtn = document.getElementById('generate-sales-report-btn');
    const salesReportContentDiv = document.getElementById('sales-report-content');
    const startDateInput = document.getElementById('sales-report-start-date');
    const endDateInput = document.getElementById('sales-report-end-date');
    // Inventory Value Report
    const inventoryValueContentDiv = document.getElementById('inventory-value-content');
    // Customer Balances Report
    const customerBalancesContentDiv = document.getElementById('customer-balances-content');

    /**
     * Generates and displays the sales and profit report for a given date range.
     */
    async function generateSalesReport() {
        try {
            const allSales = await window.db.crud.getAll('sales');
            const startDate = startDateInput.value ? new Date(startDateInput.value).setHours(0, 0, 0, 0) : null;
            const endDate = endDateInput.value ? new Date(endDateInput.value).setHours(23, 59, 59, 999) : null;

            const filteredSales = allSales.filter(sale => {
                const saleDate = new Date(sale.date);
                if (startDate && saleDate < startDate) return false;
                if (endDate && saleDate > endDate) return false;
                return true;
            });

            let totalRevenue = 0;
            let totalCost = 0;
            let reportHTML = '<table><thead><tr><th>التاريخ</th><th>العناصر</th><th>الإجمالي</th><th>الربح</th></tr></thead><tbody>';

            filteredSales.forEach(sale => {
                let saleRevenue = sale.totalAmount;
                let saleCost = 0;
                let itemsHtml = '<ul>';
                sale.items.forEach(item => {
                    saleCost += (item.cost || 0) * item.quantity;
                    itemsHtml += `<li>${item.name} (x${item.quantity})</li>`;
                });
                itemsHtml += '</ul>';

                totalRevenue += saleRevenue;
                totalCost += saleCost;

                const saleProfit = saleRevenue - saleCost;
                reportHTML += `
                    <tr>
                        <td>${new Date(sale.date).toLocaleString()}</td>
                        <td>${itemsHtml}</td>
                        <td>${saleRevenue.toFixed(2)}</td>
                        <td>${saleProfit.toFixed(2)}</td>
                    </tr>
                `;
            });

            reportHTML += '</tbody></table>';

            const totalProfit = totalRevenue - totalCost;
            const summaryHTML = `
                <div class="report-summary">
                    <div>إجمالي الإيرادات: <strong>${totalRevenue.toFixed(2)}</strong></div>
                    <div>إجمالي التكلفة: <strong>${totalCost.toFixed(2)}</strong></div>
                    <div>إجمالي الربح: <strong>${totalProfit.toFixed(2)}</strong></div>
                </div>
            `;

            salesReportContentDiv.innerHTML = summaryHTML + reportHTML;

        } catch (error) {
            console.error('Error generating sales report:', error);
            salesReportContentDiv.innerHTML = '<p>حدث خطأ أثناء إنشاء التقرير.</p>';
        }
    }

    /**
     * Generates and displays the current inventory value report.
     */
    async function generateInventoryValueReport() {
        try {
            const allProducts = await window.db.crud.getAll('products');
            let totalValue = 0;
            let reportHTML = '<table><thead><tr><th>المنتج</th><th>الكمية</th><th>متوسط التكلفة</th><th>القيمة الإجمالية</th></tr></thead><tbody>';

            allProducts.forEach(product => {
                const value = (product.avgCost || 0) * (product.quantity || 0);
                totalValue += value;
                reportHTML += `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.quantity || 0}</td>
                        <td>${(product.avgCost || 0).toFixed(2)}</td>
                        <td>${value.toFixed(2)}</td>
                    </tr>
                `;
            });

            reportHTML += '</tbody></table>';
            const summaryHTML = `<div class="report-summary"><div>القيمة الإجمالية للمخزون: <strong>${totalValue.toFixed(2)}</strong></div></div>`;
            inventoryValueContentDiv.innerHTML = summaryHTML + reportHTML;

        } catch (error) {
            console.error('Error generating inventory value report:', error);
            inventoryValueContentDiv.innerHTML = '<p>حدث خطأ أثناء إنشاء التقرير.</p>';
        }
    }

    /**
     * Generates and displays the customer balances report.
     */
    async function generateCustomerBalancesReport() {
        try {
            const allCustomers = await window.db.crud.getAll('customers');
            const customersWithBalance = allCustomers.filter(c => c.balance && c.balance > 0);
            let totalBalance = 0;
            let reportHTML = '<table><thead><tr><th>العميل</th><th>الهاتف</th><th>الرصيد المستحق</th></tr></thead><tbody>';

            customersWithBalance.forEach(customer => {
                totalBalance += customer.balance;
                reportHTML += `
                    <tr>
                        <td>${customer.name}</td>
                        <td>${customer.phone || ''}</td>
                        <td>${customer.balance.toFixed(2)}</td>
                    </tr>
                `;
            });

            reportHTML += '</tbody></table>';
            const summaryHTML = `<div class="report-summary"><div>إجمالي الديون المستحقة: <strong>${totalBalance.toFixed(2)}</strong></div></div>`;
            customerBalancesContentDiv.innerHTML = summaryHTML + reportHTML;

        } catch (error) {
            console.error('Error generating customer balances report:', error);
            customerBalancesContentDiv.innerHTML = '<p>حدث خطأ أثناء إنشاء التقرير.</p>';
        }
    }

    /**
     * Sets up all event listeners for the reports module.
     */
    function setupEventListeners() {
        reportsNav.addEventListener('click', (event) => {
            const target = event.target;
            if (target.matches('.sub-nav-button')) {
                // Handle tab switching
                reportsNav.querySelectorAll('.sub-nav-button').forEach(btn => btn.classList.remove('active'));
                target.classList.add('active');

                const sectionId = target.dataset.section;
                reportSections.forEach(section => {
                    section.classList.toggle('hidden', section.id !== sectionId);
                });

                // Generate report if it's one of the auto-generated ones
                if (sectionId === 'inventory-value-section') generateInventoryValueReport();
                if (sectionId === 'customer-balances-section') generateCustomerBalancesReport();
            }
        });

        generateSalesReportBtn.addEventListener('click', generateSalesReport);
    }

    /**
     * Initializes the reports module.
     */
    function init() {
        setupEventListeners();
        // Generate the default visible report on init
        generateSalesReport();
        console.log('Reports module initialized.');
    }

    window.reports = {
        init: init
    };

})();

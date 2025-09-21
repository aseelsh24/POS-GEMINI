// js/inventory.js - Inventory Management Module

(function() {
    'use strict';

    // --- DOM Elements ---
    const showProductsBtn = document.getElementById('show-products-btn');
    const showSuppliersBtn = document.getElementById('show-suppliers-btn');
    const productSection = document.getElementById('inventory-products-section');
    const supplierSection = document.getElementById('inventory-suppliers-section');
    const addProductBtn = document.getElementById('add-product-btn');
    const productForm = document.getElementById('product-form');
    const cancelProductFormBtn = document.getElementById('cancel-product-form');
    const productsTableBody = document.getElementById('products-table-body');
    const productIdField = document.getElementById('product-id');
    const addSupplierBtn = document.getElementById('add-supplier-btn');
    const supplierForm = document.getElementById('supplier-form');
    const cancelSupplierFormBtn = document.getElementById('cancel-supplier-form');
    const suppliersTableBody = document.getElementById('suppliers-table-body');
    const supplierIdField = document.getElementById('supplier-id');
    const recordPurchaseBtn = document.getElementById('record-purchase-btn');
    const purchaseModal = document.getElementById('purchase-modal');
    const closePurchaseModalBtn = document.getElementById('close-purchase-modal-btn');
    const purchaseForm = document.getElementById('purchase-form');
    const purchaseProductSelect = document.getElementById('purchase-product');
    const purchaseSupplierSelect = document.getElementById('purchase-supplier');

    // --- Product Management ---
    async function renderProductsTable() {
        try {
            const products = await window.db.crud.getAll('products');
            productsTableBody.innerHTML = '';
            products.forEach(product => {
                const row = productsTableBody.insertRow();
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>${product.barcode || ''}</td>
                    <td>${(product.avgCost || 0).toFixed(2)}</td>
                    <td>${product.salePrice.toFixed(2)}</td>
                    <td>${product.quantity || 0}</td>
                    <td>
                        <button class="edit-product-btn" data-id="${product.id}">تعديل</button>
                        <button class="delete-product-btn" data-id="${product.id}">حذف</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error rendering products table:', error);
        }
    }

    async function handleProductFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const productId = parseInt(productIdField.value, 10);
        const product = {
            name: form.name.value,
            barcode: form.barcode.value,
            salePrice: parseFloat(form.salePrice.value),
        };

        try {
            if (isNaN(productId)) {
                product.quantity = 0;
                product.avgCost = 0;
                await window.db.crud.add('products', product);
            } else {
                const existingProduct = await window.db.crud.get('products', productId);
                product.id = productId;
                product.quantity = existingProduct.quantity;
                product.avgCost = existingProduct.avgCost;
                await window.db.crud.update('products', product);
            }
            form.reset();
            productIdField.value = '';
            productForm.classList.add('hidden');
            await renderProductsTable();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('فشل حفظ المنتج. قد يكون الباركود مكررًا.');
        }
    }

    async function editProduct(id) {
        try {
            const product = await window.db.crud.get('products', id);
            if (product) {
                productIdField.value = product.id;
                productForm.name.value = product.name;
                productForm.barcode.value = product.barcode;
                productForm.salePrice.value = product.salePrice;
                productForm.querySelector('#product-avg-cost').value = (product.avgCost || 0).toFixed(2);
                productForm.querySelector('#product-quantity').value = product.quantity || 0;
                productForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching product for editing:', error);
        }
    }

    async function deleteProduct(id) {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            try {
                await window.db.crud.delete('products', id);
                await renderProductsTable();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    }

    // --- Supplier Management ---
    async function renderSuppliersTable() {
        try {
            const suppliers = await window.db.crud.getAll('suppliers');
            suppliersTableBody.innerHTML = '';
            suppliers.forEach(supplier => {
                const row = suppliersTableBody.insertRow();
                row.innerHTML = `
                    <td>${supplier.name}</td>
                    <td>${supplier.contact || ''}</td>
                    <td>
                        <button class="edit-supplier-btn" data-id="${supplier.id}">تعديل</button>
                        <button class="delete-supplier-btn" data-id="${supplier.id}">حذف</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error rendering suppliers table:', error);
        }
    }

    async function handleSupplierFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const supplierId = parseInt(supplierIdField.value, 10);
        const supplier = {
            name: form.name.value,
            contact: form.contact.value,
        };

        try {
            if (isNaN(supplierId)) {
                await window.db.crud.add('suppliers', supplier);
            } else {
                supplier.id = supplierId;
                await window.db.crud.update('suppliers', supplier);
            }
            form.reset();
            supplierIdField.value = '';
            supplierForm.classList.add('hidden');
            await renderSuppliersTable();
        } catch (error) {
            console.error('Error saving supplier:', error);
        }
    }

    async function editSupplier(id) {
        try {
            const supplier = await window.db.crud.get('suppliers', id);
            if (supplier) {
                supplierIdField.value = supplier.id;
                supplierForm.name.value = supplier.name;
                supplierForm.contact.value = supplier.contact;
                supplierForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching supplier for editing:', error);
        }
    }

    async function deleteSupplier(id) {
        if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
            try {
                await window.db.crud.delete('suppliers', id);
                await renderSuppliersTable();
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
    }

    // --- Purchase Management ---
    async function populatePurchaseForm() {
        try {
            const products = await window.db.crud.getAll('products');
            const suppliers = await window.db.crud.getAll('suppliers');

            purchaseProductSelect.innerHTML = '<option value="">اختر منتجًا...</option>';
            products.forEach(p => {
                purchaseProductSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
            });

            purchaseSupplierSelect.innerHTML = '<option value="">اختر موردًا...</option>';
            suppliers.forEach(s => {
                purchaseSupplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });

        } catch (error) {
            console.error('Error populating purchase form:', error);
        }
    }

    async function handlePurchaseFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const productId = parseInt(form.productId.value, 10);
        const supplierId = parseInt(form.supplierId.value, 10);
        const quantity = parseInt(form.quantity.value, 10);
        const cost = parseFloat(form.cost.value);

        if (isNaN(productId) || isNaN(supplierId) || isNaN(quantity) || isNaN(cost)) {
            alert('يرجى ملء جميع الحقول بشكل صحيح.');
            return;
        }

        try {
            // 1. Record the purchase event
            const purchaseRecord = {
                productId,
                supplierId,
                quantity,
                cost,
                date: new Date().toISOString()
            };
            await window.db.crud.add('purchases', purchaseRecord);

            // 2. Update the product's quantity and average cost
            const product = await window.db.crud.get('products', productId);
            const currentStockValue = (product.avgCost || 0) * (product.quantity || 0);
            const purchaseValue = cost * quantity;

            const newTotalQuantity = (product.quantity || 0) + quantity;
            const newStockValue = currentStockValue + purchaseValue;
            const newAvgCost = newStockValue / newTotalQuantity;

            product.quantity = newTotalQuantity;
            product.avgCost = newAvgCost;

            await window.db.crud.update('products', product);

            // 3. Close modal and refresh table
            purchaseModal.classList.add('hidden');
            await renderProductsTable();

        } catch (error) {
            console.error('Error processing purchase:', error);
            alert('فشل تسجيل عملية الشراء.');
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Sub-navigation
        showProductsBtn.addEventListener('click', () => {
            productSection.classList.remove('hidden');
            supplierSection.classList.add('hidden');
            showProductsBtn.classList.add('active');
            showSuppliersBtn.classList.remove('active');
        });
        showSuppliersBtn.addEventListener('click', () => {
            productSection.classList.add('hidden');
            supplierSection.classList.remove('hidden');
            showProductsBtn.classList.remove('active');
            showSuppliersBtn.classList.add('active');
        });

        // Products
        addProductBtn.addEventListener('click', () => {
            productForm.reset();
            productIdField.value = '';
            productForm.classList.remove('hidden');
        });
        cancelProductFormBtn.addEventListener('click', () => {
            productForm.classList.add('hidden');
        });
        productForm.addEventListener('submit', handleProductFormSubmit);
        productsTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const id = parseInt(target.getAttribute('data-id'), 10);
            if (target.classList.contains('edit-product-btn')) editProduct(id);
            if (target.classList.contains('delete-product-btn')) deleteProduct(id);
        });

        // Suppliers
        addSupplierBtn.addEventListener('click', () => {
            supplierForm.reset();
            supplierIdField.value = '';
            supplierForm.classList.remove('hidden');
        });
        cancelSupplierFormBtn.addEventListener('click', () => {
            supplierForm.classList.add('hidden');
        });
        supplierForm.addEventListener('submit', handleSupplierFormSubmit);
        suppliersTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const id = parseInt(target.getAttribute('data-id'), 10);
            if (target.classList.contains('edit-supplier-btn')) editSupplier(id);
            if (target.classList.contains('delete-supplier-btn')) deleteSupplier(id);
        });

        // Purchases
        recordPurchaseBtn.addEventListener('click', () => {
            populatePurchaseForm();
            purchaseModal.classList.remove('hidden');
        });
        closePurchaseModalBtn.addEventListener('click', () => {
            purchaseModal.classList.add('hidden');
        });
        purchaseForm.addEventListener('submit', handlePurchaseFormSubmit);
    }

    // --- Initialization ---
    function init() {
        setupEventListeners();
        renderProductsTable();
        renderSuppliersTable();
        console.log('Inventory module initialized.');
    }

    window.inventory = {
        init: init,
        renderProductsTable: renderProductsTable,
        renderSuppliersTable: renderSuppliersTable
    };

})();

// js/inventory.js - Product and Stock Management

(function() {
    'use strict';

    // --- DOM Elements ---
    const addProductBtn = document.getElementById('add-product-btn');
    const productForm = document.getElementById('product-form');
    const cancelBtn = document.getElementById('cancel-product-form-btn');
    const productsTableBody = document.getElementById('products-table-body');
    const productIdField = document.getElementById('product-id');
    const barcodeInput = document.getElementById('product-barcode');
    // Scanner elements
    const scanBtn = document.getElementById('scan-barcode-btn');
    const scannerModal = document.getElementById('scanner-modal');
    const closeScannerBtn = document.getElementById('close-scanner-btn');
    const scannerVideo = document.getElementById('scanner-video');
    // Stock Adjustment elements
    const adjModal = document.getElementById('stock-adjustment-modal');
    const adjForm = document.getElementById('stock-adjustment-form');
    const closeAdjBtn = document.getElementById('close-adj-modal-btn');
    const adjProductId = document.getElementById('adj-product-id');
    const adjProductName = document.getElementById('adj-product-name');

    const codeReader = new ZXing.BrowserMultiFormatReader();

    async function renderProductsTable() {
        try {
            const products = await window.db.getAll('products');
            productsTableBody.innerHTML = '';
            products.forEach(p => {
                const row = productsTableBody.insertRow();
                row.className = (p.lowStockAlert > 0 && p.stock <= p.lowStockAlert) ? 'low-stock' : '';
                row.innerHTML = `
                    <td>${p.name}</td>
                    <td>${p.barcode || ''}</td>
                    <td>${p.category || ''}</td>
                    <td>${p.stock || 0} ${p.unit || ''}</td>
                    <td>${p.salePrice.toFixed(2)}</td>
                    <td>
                        <button class="edit-product-btn" data-id="${p.id}">تعديل</button>
                        <button class="delete-product-btn" data-id="${p.id}">حذف</button>
                        <button class="adjust-stock-btn" data-id="${p.id}">تعديل المخزون</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error rendering products table:', error);
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const id = parseInt(productIdField.value, 10);
        const product = {
            name: document.getElementById('product-name').value,
            barcode: barcodeInput.value,
            category: document.getElementById('product-category').value,
            unit: document.getElementById('product-unit').value,
            purchaseCost: parseFloat(document.getElementById('product-purchase-cost').value),
            salePrice: parseFloat(document.getElementById('product-sale-price').value),
            stock: parseInt(document.getElementById('product-stock').value, 10),
            lowStockAlert: parseInt(document.getElementById('product-low-stock-alert').value, 10) || 0,
        };

        try {
            if (isNaN(id)) {
                await window.db.add('products', product);
            } else {
                product.id = id;
                await window.db.put('products', product);
            }
            productForm.classList.add('hidden');
            productForm.reset();
            productIdField.value = '';
            await renderProductsTable();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('فشل حفظ المنتج.');
        }
    }

    async function showEditForm(id) {
        try {
            const products = await window.db.getAll('products');
            const product = products.find(p => p.id === id);
            if (product) {
                productIdField.value = product.id;
                document.getElementById('product-name').value = product.name;
                barcodeInput.value = product.barcode || '';
                document.getElementById('product-category').value = product.category || '';
                document.getElementById('product-unit').value = product.unit || '';
                document.getElementById('product-purchase-cost').value = product.purchaseCost;
                document.getElementById('product-sale-price').value = product.salePrice;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-low-stock-alert').value = product.lowStockAlert || 0;
                productForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching product for edit:', error);
        }
    }

    async function deleteProduct(id) {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            try {
                await window.db.delete('products', id);
                await renderProductsTable();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    }

    function startScanner() {
        scannerModal.classList.remove('hidden');
        codeReader.decodeFromVideoDevice(undefined, 'scanner-video', (result, err) => {
            if (result) {
                barcodeInput.value = result.getText();
                codeReader.reset();
                scannerModal.classList.add('hidden');
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
                codeReader.reset();
                scannerModal.classList.add('hidden');
            }
        });
    }

    async function showAdjustmentForm(id) {
        try {
            const products = await window.db.getAll('products');
            const product = products.find(p => p.id === id);
            if(product) {
                adjProductId.value = id;
                adjProductName.textContent = product.name;
                adjModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching product for adjustment:', error);
        }
    }

    async function handleAdjustmentSubmit(event) {
        event.preventDefault();
        const id = parseInt(adjProductId.value, 10);
        const type = document.getElementById('adj-type').value;
        const quantity = parseInt(document.getElementById('adj-quantity').value, 10);

        if(isNaN(id) || isNaN(quantity) || quantity <= 0) {
            alert('يرجى إدخال كمية صحيحة.');
            return;
        }

        try {
            const products = await window.db.getAll('products');
            const product = products.find(p => p.id === id);
            if(product) {
                if(type === 'purchase') {
                    product.stock += quantity;
                } else { // return or loss
                    product.stock -= quantity;
                    if(product.stock < 0) product.stock = 0;
                }
                await window.db.put('products', product);
                adjModal.classList.add('hidden');
                adjForm.reset();
                await renderProductsTable();
            }
        } catch (error) {
            console.error('Error adjusting stock:', error);
        }
    }

    function setupEventListeners() {
        addProductBtn.addEventListener('click', () => {
            productForm.reset();
            productIdField.value = '';
            productForm.classList.remove('hidden');
        });
        cancelBtn.addEventListener('click', () => {
            productForm.classList.add('hidden');
        });
        productForm.addEventListener('submit', handleFormSubmit);

        productsTableBody.addEventListener('click', (e) => {
            if (e.target.matches('.edit-product-btn')) {
                showEditForm(parseInt(e.target.dataset.id, 10));
            }
            if (e.target.matches('.delete-product-btn')) {
                deleteProduct(parseInt(e.target.dataset.id, 10));
            }
            if (e.target.matches('.adjust-stock-btn')) {
                showAdjustmentForm(parseInt(e.target.dataset.id, 10));
            }
        });

        scanBtn.addEventListener('click', startScanner);
        closeScannerBtn.addEventListener('click', () => {
            codeReader.reset();
            scannerModal.classList.add('hidden');
        });

        adjForm.addEventListener('submit', handleAdjustmentSubmit);
        closeAdjBtn.addEventListener('click', () => {
            adjModal.classList.add('hidden');
        });
    }

    function init() {
        console.log('Inventory module initialized.');
        setupEventListeners();
        renderProductsTable();
    }

    window.inventory = {
        init
    };

})();

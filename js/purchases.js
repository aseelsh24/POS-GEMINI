// js/purchases.js - Purchase Management Logic

(function() {
    'use strict';

    // --- DOM Elements ---
    const newPurchaseBtn = document.getElementById('new-purchase-invoice-btn');
    const modal = document.getElementById('purchase-invoice-modal');
    const form = document.getElementById('purchase-invoice-form');
    const closeBtn = document.getElementById('close-purchase-invoice-btn');
    const supplierSelect = document.getElementById('purchase-supplier-select');
    const itemsBody = document.getElementById('purchase-items-body');
    const addItemBtn = document.getElementById('add-purchase-item-btn');
    const totalSpan = document.getElementById('purchase-total');

    let products = [];
    let suppliers = [];

    async function openPurchaseModal() {
        products = await window.db.getAll('products');
        suppliers = await window.db.getAll('suppliers');

        supplierSelect.innerHTML = '<option value="">اختر موردًا...</option>';
        suppliers.forEach(s => {
            supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });

        itemsBody.innerHTML = '';
        addPurchaseItemRow(); // Add the first row
        modal.classList.remove('hidden');
    }

    function addPurchaseItemRow() {
        const row = itemsBody.insertRow();
        row.innerHTML = `
            <td><select class="purchase-item-product"></select></td>
            <td><input type="number" class="purchase-item-qty" value="1" min="1"></td>
            <td><input type="number" class="purchase-item-cost" step="0.01" value="0"></td>
            <td class="purchase-item-total">0.00</td>
            <td><button type="button" class="remove-item-btn">X</button></td>
        `;
        const productSelect = row.querySelector('.purchase-item-product');
        productSelect.innerHTML = '<option value="">اختر منتجًا...</option>';
        products.forEach(p => {
            productSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    }

    function calculateTotal() {
        let total = 0;
        itemsBody.querySelectorAll('tr').forEach(row => {
            const qty = parseFloat(row.querySelector('.purchase-item-qty').value) || 0;
            const cost = parseFloat(row.querySelector('.purchase-item-cost').value) || 0;
            const itemTotal = qty * cost;
            row.querySelector('.purchase-item-total').textContent = itemTotal.toFixed(2);
            total += itemTotal;
        });
        totalSpan.textContent = total.toFixed(2);
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const supplierId = parseInt(supplierSelect.value, 10);
        if (isNaN(supplierId)) {
            alert('يرجى اختيار مورد.');
            return;
        }

        const items = Array.from(itemsBody.rows).map(row => ({
            productId: parseInt(row.querySelector('.purchase-item-product').value, 10),
            quantity: parseInt(row.querySelector('.purchase-item-qty').value, 10),
            cost: parseFloat(row.querySelector('.purchase-item-cost').value)
        })).filter(item => !isNaN(item.productId) && item.quantity > 0);

        if (items.length === 0) {
            alert('يرجى إضافة منتجات للفاتورة.');
            return;
        }

        const purchase = {
            supplierId,
            items,
            total: parseFloat(totalSpan.textContent),
            timestamp: new Date().toISOString()
        };

        try {
            const db = await window.db.init();
            const tx = db.transaction(['purchases', 'products', 'suppliers'], 'readwrite');

            tx.objectStore('purchases').add(purchase);

            const productStore = tx.objectStore('products');
            items.forEach(item => {
                const req = productStore.get(item.productId);
                req.onsuccess = () => {
                    const product = req.result;
                    product.stock += item.quantity;
                    // For simplicity, we're not recalculating average cost here yet.
                    // This would be a feature for a later stage.
                    product.purchaseCost = item.cost;
                    productStore.put(product);
                };
            });

            const supplierReq = tx.objectStore('suppliers').get(supplierId);
            supplierReq.onsuccess = () => {
                const supplier = supplierReq.result;
                supplier.balance = (supplier.balance || 0) + purchase.total;
                tx.objectStore('suppliers').put(supplier);
            };

            tx.oncomplete = () => {
                alert('تم حفظ فاتورة الشراء بنجاح!');
                modal.classList.add('hidden');
                form.reset();
                // We would need to refresh the supplier and product tables if they are visible
            };

        } catch (error) {
            console.error('Failed to save purchase', error);
            alert('فشل حفظ الفاتورة.');
        }
    }

    function setupEventListeners() {
        newPurchaseBtn.addEventListener('click', openPurchaseModal);
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        addItemBtn.addEventListener('click', addPurchaseItemRow);
        form.addEventListener('submit', handleFormSubmit);
        itemsBody.addEventListener('change', calculateTotal);
        itemsBody.addEventListener('keyup', calculateTotal);
        itemsBody.addEventListener('click', (e) => {
            if (e.target.matches('.remove-item-btn')) {
                e.target.closest('tr').remove();
                calculateTotal();
            }
        });
    }

    function init() {
        setupEventListeners();
    }

    // The init for this module will just be setting up the listener for the main button
    // The main logic is modal-driven.
    document.addEventListener('DOMContentLoaded', init);

})();

// js/suppliers.js - Supplier Management Logic

(function() {
    'use strict';

    // --- DOM Elements ---
    const addSupplierBtn = document.getElementById('add-supplier-btn');
    const supplierForm = document.getElementById('supplier-form');
    const cancelBtn = document.getElementById('cancel-supplier-form-btn');
    const suppliersTableBody = document.getElementById('suppliers-table-body');
    const supplierIdField = document.getElementById('supplier-id');

    async function renderSuppliersTable() {
        try {
            const suppliers = await window.db.getAll('suppliers');
            suppliersTableBody.innerHTML = '';
            suppliers.forEach(s => {
                const row = suppliersTableBody.insertRow();
                row.innerHTML = `
                    <td>${s.name}</td>
                    <td>${s.contact || ''}</td>
                    <td>${(s.balance || 0).toFixed(2)}</td>
                    <td>
                        <button class="edit-supplier-btn" data-id="${s.id}">تعديل</button>
                        <button class="delete-supplier-btn" data-id="${s.id}">حذف</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error rendering suppliers table:', error);
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const id = parseInt(supplierIdField.value, 10);
        const supplier = {
            name: document.getElementById('supplier-name').value,
            contact: document.getElementById('supplier-contact').value,
        };

        try {
            if (isNaN(id)) {
                supplier.balance = 0;
                await window.db.add('suppliers', supplier);
            } else {
                const existing = await window.db.getByIndex('suppliers', 'id', id);
                supplier.id = id;
                supplier.balance = existing.balance || 0;
                await window.db.put('suppliers', supplier);
            }
            supplierForm.classList.add('hidden');
            supplierForm.reset();
            supplierIdField.value = '';
            await renderSuppliersTable();
        } catch (error) {
            console.error('Error saving supplier:', error);
        }
    }

    async function showEditForm(id) {
        try {
            const suppliers = await window.db.getAll('suppliers');
            const supplier = suppliers.find(s => s.id === id);
            if (supplier) {
                supplierIdField.value = supplier.id;
                document.getElementById('supplier-name').value = supplier.name;
                document.getElementById('supplier-contact').value = supplier.contact || '';
                document.getElementById('supplier-balance').value = (supplier.balance || 0).toFixed(2);
                supplierForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching supplier for edit:', error);
        }
    }

    async function deleteSupplier(id) {
        if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
            try {
                await window.db.delete('suppliers', id);
                await renderSuppliersTable();
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
    }

    function setupEventListeners() {
        addSupplierBtn.addEventListener('click', () => {
            supplierForm.reset();
            supplierIdField.value = '';
            supplierForm.classList.remove('hidden');
        });
        cancelBtn.addEventListener('click', () => {
            supplierForm.classList.add('hidden');
        });
        supplierForm.addEventListener('submit', handleFormSubmit);

        suppliersTableBody.addEventListener('click', (e) => {
            if (e.target.matches('.edit-supplier-btn')) {
                showEditForm(parseInt(e.target.dataset.id, 10));
            }
            if (e.target.matches('.delete-supplier-btn')) {
                deleteSupplier(parseInt(e.target.dataset.id, 10));
            }
        });
    }

    function init() {
        console.log('Suppliers module initialized.');
        setupEventListeners();
        renderSuppliersTable();
    }

    window.suppliers = {
        init
    };

})();

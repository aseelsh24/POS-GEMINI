// js/customers.js - Customer Management Module

(function() {
    'use strict';

    // --- DOM Elements ---
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const customerForm = document.getElementById('customer-form');
    const cancelCustomerFormBtn = document.getElementById('cancel-customer-form');
    const customersTableBody = document.getElementById('customers-table-body');
    const customerIdField = document.getElementById('customer-id');

    /**
     * Renders the customers table from database data.
     */
    async function renderCustomersTable() {
        try {
            const customers = await window.db.crud.getAll('customers');
            customersTableBody.innerHTML = ''; // Clear existing table
            customers.forEach(customer => {
                const row = customersTableBody.insertRow();
                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.phone || ''}</td>
                    <td>${customer.address || ''}</td>
                    <td>${(customer.balance || 0).toFixed(2)}</td>
                    <td>
                        <button class="edit-customer-btn" data-id="${customer.id}">تعديل</button>
                        <button class="delete-customer-btn" data-id="${customer.id}">حذف</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error rendering customers table:', error);
        }
    }

    /**
     * Handles the customer form submission for both add and edit.
     */
    async function handleCustomerFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const customerId = parseInt(customerIdField.value, 10);
        const customer = {
            name: form.name.value,
            phone: form.phone.value,
            address: form.address.value,
        };

        try {
            if (isNaN(customerId)) {
                // Add new customer
                customer.balance = 0; // Initial balance
                await window.db.crud.add('customers', customer);
            } else {
                // Update existing customer, preserving their balance
                const existingCustomer = await window.db.crud.get('customers', customerId);
                customer.id = customerId;
                customer.balance = existingCustomer.balance || 0;
                await window.db.crud.update('customers', customer);
            }
            form.reset();
            customerIdField.value = '';
            customerForm.classList.add('hidden');
            await renderCustomersTable();
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    }

    /**
     * Populates the customer form for editing.
     */
    async function editCustomer(id) {
        try {
            const customer = await window.db.crud.get('customers', id);
            if (customer) {
                customerIdField.value = customer.id;
                customerForm.name.value = customer.name;
                customerForm.phone.value = customer.phone;
                customerForm.address.value = customer.address;
                customerForm.balance.value = (customer.balance || 0).toFixed(2);
                customerForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching customer for editing:', error);
        }
    }

    /**
     * Deletes a customer after confirmation.
     */
    async function deleteCustomer(id) {
        if (confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع سجلاته.')) {
            try {
                await window.db.crud.delete('customers', id);
                await renderCustomersTable();
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        }
    }

    /**
     * Sets up all event listeners for the customer module.
     */
    function setupEventListeners() {
        addCustomerBtn.addEventListener('click', () => {
            customerForm.reset();
            customerIdField.value = '';
            customerForm.classList.remove('hidden');
        });

        cancelCustomerFormBtn.addEventListener('click', () => {
            customerForm.classList.add('hidden');
        });

        customerForm.addEventListener('submit', handleCustomerFormSubmit);

        customersTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const id = parseInt(target.getAttribute('data-id'), 10);
            if (target.classList.contains('edit-customer-btn')) editCustomer(id);
            if (target.classList.contains('delete-customer-btn')) deleteCustomer(id);
        });
    }

    /**
     * Initializes the customer module.
     */
    function init() {
        setupEventListeners();
        renderCustomersTable();
        console.log('Customers module initialized.');
    }

    window.customers = {
        init: init
    };

})();

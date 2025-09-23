// js/customers.js - Customer Management Logic

(function() {
    'use strict';

    // --- DOM Elements ---
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const customerForm = document.getElementById('customer-form');
    const cancelBtn = document.getElementById('cancel-customer-form-btn');
    const customersTableBody = document.getElementById('customers-table-body');
    const customerIdField = document.getElementById('customer-id');
    // Payment Modal
    const paymentModal = document.getElementById('customer-payment-modal');
    const paymentForm = document.getElementById('customer-payment-form');
    const closePaymentBtn = document.getElementById('close-payment-modal-btn');
    const paymentCustomerId = document.getElementById('payment-customer-id');
    const paymentCustomerName = document.getElementById('payment-customer-name');

    async function renderCustomersTable() {
        try {
            const customers = await window.db.getAll('customers');
            customersTableBody.innerHTML = '';
            customers.forEach(c => {
                const row = customersTableBody.insertRow();
                row.innerHTML = `
                    <td>${c.name}</td>
                    <td>${c.phone || ''}</td>
                    <td>${(c.balance || 0).toFixed(2)}</td>
                    <td>
                        <button class="edit-customer-btn" data-id="${c.id}">تعديل</button>
                        <button class="record-payment-btn" data-id="${c.id}">تسجيل دفعة</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error rendering customers table:', error);
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const id = parseInt(customerIdField.value, 10);
        const customer = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value,
        };

        try {
            if (isNaN(id)) {
                customer.balance = 0;
                await window.db.add('customers', customer);
            } else {
                const existing = (await window.db.getAll('customers')).find(c => c.id === id);
                customer.id = id;
                customer.balance = existing.balance || 0;
                await window.db.put('customers', customer);
            }
            customerForm.classList.add('hidden');
            customerForm.reset();
            customerIdField.value = '';
            await renderCustomersTable();
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    }

    async function showEditForm(id) {
        try {
            const customers = await window.db.getAll('customers');
            const customer = customers.find(c => c.id === id);
            if (customer) {
                customerIdField.value = customer.id;
                document.getElementById('customer-name').value = customer.name;
                document.getElementById('customer-phone').value = customer.phone || '';
                document.getElementById('customer-balance').value = (customer.balance || 0).toFixed(2);
                customerForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching customer for edit:', error);
        }
    }

    async function showPaymentModal(id) {
        try {
            const customers = await window.db.getAll('customers');
            const customer = customers.find(c => c.id === id);
            if(customer) {
                paymentCustomerId.value = id;
                paymentCustomerName.textContent = customer.name;
                paymentModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching customer for payment:', error);
        }
    }

    async function handlePaymentSubmit(event) {
        event.preventDefault();
        const id = parseInt(paymentCustomerId.value, 10);
        const amount = parseFloat(document.getElementById('payment-amount').value);
        if (isNaN(id) || isNaN(amount) || amount <= 0) {
            alert('يرجى إدخال مبلغ صحيح.');
            return;
        }

        try {
            const customers = await window.db.getAll('customers');
            const customer = customers.find(c => c.id === id);
            if (customer) {
                customer.balance = (customer.balance || 0) - amount;
                await window.db.put('customers', customer);
                paymentModal.classList.add('hidden');
                paymentForm.reset();
                await renderCustomersTable();
            }
        } catch (error) {
            console.error('Error processing payment:', error);
        }
    }

    function setupEventListeners() {
        addCustomerBtn.addEventListener('click', () => {
            customerForm.reset();
            customerIdField.value = '';
            customerForm.classList.remove('hidden');
        });
        cancelBtn.addEventListener('click', () => {
            customerForm.classList.add('hidden');
        });
        customerForm.addEventListener('submit', handleFormSubmit);

        customersTableBody.addEventListener('click', (e) => {
            if (e.target.matches('.edit-customer-btn')) {
                showEditForm(parseInt(e.target.dataset.id, 10));
            }
            if (e.target.matches('.record-payment-btn')) {
                showPaymentModal(parseInt(e.target.dataset.id, 10));
            }
        });

        closePaymentBtn.addEventListener('click', () => {
            paymentModal.classList.add('hidden');
        });
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    function init() {
        console.log('Customers module initialized.');
        setupEventListeners();
        renderCustomersTable();
    }

    window.customers = {
        init
    };

})();

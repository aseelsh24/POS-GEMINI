// js/pos.js - Point of Sale Module

(function() {
    'use strict';

    // --- State ---
    let currentCart = [];
    let allProducts = [];
    let selectedCustomerId = null;

    // --- DOM Elements ---
    const productListDiv = document.getElementById('pos-product-list');
    const cartItemsUl = document.getElementById('pos-cart-items');
    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartTotalSpan = document.getElementById('cart-total');
    const clearCartBtn = document.getElementById('pos-clear-btn');
    const payBtn = document.getElementById('pos-pay-btn');
    const payLaterBtn = document.getElementById('pos-pay-later-btn');
    const customerSelect = document.getElementById('pos-customer-select');
    // Payment Modal Elements
    const paymentModal = document.getElementById('payment-modal');
    const closePaymentModalBtn = document.getElementById('close-payment-modal-btn');
    const paymentForm = document.getElementById('payment-form');
    const paymentTotalSpan = document.getElementById('payment-total');
    const amountPaidInput = document.getElementById('amount-paid');
    const changeDueSpan = document.getElementById('change-due');

    async function populateCustomerDropdown() {
        try {
            const customers = await window.db.crud.getAll('customers');
            customerSelect.innerHTML = '<option value="">بيع نقدي</option>';
            customers.forEach(c => {
                customerSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        } catch (error) {
            console.error('Error populating customer dropdown:', error);
        }
    }

    function renderProductGrid(products = allProducts) {
        productListDiv.innerHTML = '';
        products.forEach(product => {
            if (product.quantity > 0) {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.id = product.id;
                card.innerHTML = `<div class="product-card-name">${product.name}</div><div class="product-card-price">${product.salePrice.toFixed(2)}</div>`;
                productListDiv.appendChild(card);
            }
        });
    }

    function renderCart() {
        cartItemsUl.innerHTML = '';
        let subtotal = 0;
        currentCart.forEach(item => {
            const li = document.createElement('li');
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            li.innerHTML = `<span>${item.name} (x${item.quantity})</span><span>${itemTotal.toFixed(2)}</span>`;
            cartItemsUl.appendChild(li);
        });
        cartSubtotalSpan.textContent = subtotal.toFixed(2);
        cartTotalSpan.textContent = subtotal.toFixed(2);
    }

    function addToCart(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;
        const cartItem = currentCart.find(item => item.productId === productId);
        if (cartItem) {
            if (cartItem.quantity < product.quantity) cartItem.quantity++;
            else alert('لا يوجد المزيد من هذا المنتج في المخزون.');
        } else {
            currentCart.push({
                productId: product.id, name: product.name, price: product.salePrice, quantity: 1, cost: product.avgCost
            });
        }
        renderCart();
    }

    function clearCart() {
        currentCart = [];
        selectedCustomerId = null;
        customerSelect.value = '';
        renderCart();
    }

    function handlePayment() {
        if (currentCart.length === 0) {
            alert('الفاتورة فارغة!');
            return;
        }
        const total = parseFloat(cartTotalSpan.textContent);
        paymentTotalSpan.textContent = total.toFixed(2);
        amountPaidInput.value = total.toFixed(2);
        changeDueSpan.textContent = '0.00';
        paymentModal.classList.remove('hidden');
        amountPaidInput.focus();
    }

    async function processSale(saleRecord) {
        await window.db.performTransaction(['sales', 'products', 'customers'], 'readwrite', async (tx) => {
            const salesStore = tx.objectStore('sales');
            salesStore.add(saleRecord);

            // Update product quantities
            for (const item of saleRecord.items) {
                const productReq = tx.objectStore('products').get(item.productId);
                productReq.onsuccess = () => {
                    const product = productReq.result;
                    if (product) {
                        product.quantity -= item.quantity;
                        tx.objectStore('products').put(product);
                    }
                };
            }

            // Update customer balance if it's a credit sale
            if (saleRecord.customerId && saleRecord.status === 'deferred') {
                const customerReq = tx.objectStore('customers').get(saleRecord.customerId);
                customerReq.onsuccess = () => {
                    const customer = customerReq.result;
                    if (customer) {
                        customer.balance = (customer.balance || 0) + saleRecord.totalAmount;
                        tx.objectStore('customers').put(customer);
                    }
                };
            }
        });

        alert('تمت عملية البيع بنجاح!');
        clearCart();
        allProducts = await window.db.crud.getAll('products');
        renderProductGrid();
    }

    async function handlePaymentSubmit(event) {
        event.preventDefault();
        const amountPaid = parseFloat(amountPaidInput.value);
        const total = parseFloat(paymentTotalSpan.textContent);
        if (amountPaid < total) {
            alert('المبلغ المدفوع أقل من الإجمالي!');
            return;
        }

        const saleRecord = {
            items: currentCart,
            totalAmount: total,
            amountPaid: amountPaid,
            change: amountPaid - total,
            date: new Date().toISOString(),
            customerId: selectedCustomerId,
            status: 'paid'
        };

        try {
            await processSale(saleRecord);
            paymentModal.classList.add('hidden');
        } catch (error) {
            console.error('Cash sale transaction failed:', error);
            alert('فشلت عملية البيع. يرجى المحاولة مرة أخرى.');
        }
    }

    async function handlePayLater() {
        if (currentCart.length === 0) {
            alert('الفاتورة فارغة!');
            return;
        }
        if (!selectedCustomerId) {
            alert('يرجى اختيار عميل للبيع الآجل.');
            return;
        }

        const total = parseFloat(cartTotalSpan.textContent);
        const saleRecord = {
            items: currentCart,
            totalAmount: total,
            amountPaid: 0,
            change: 0,
            date: new Date().toISOString(),
            customerId: selectedCustomerId,
            status: 'deferred' // Deferred payment
        };

        try {
            await processSale(saleRecord);
        } catch (error) {
            console.error('Credit sale transaction failed:', error);
            alert('فشلت عملية البيع الآجل. يرجى المحاولة مرة أخرى.');
        }
    }

    function setupEventListeners() {
        productListDiv.addEventListener('click', (event) => {
            const card = event.target.closest('.product-card');
            if (card) addToCart(parseInt(card.dataset.id, 10));
        });
        clearCartBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟')) clearCart();
        });
        payBtn.addEventListener('click', handlePayment);
        payLaterBtn.addEventListener('click', handlePayLater);
        customerSelect.addEventListener('change', () => {
            selectedCustomerId = customerSelect.value ? parseInt(customerSelect.value, 10) : null;
        });

        // Payment Modal Listeners
        closePaymentModalBtn.addEventListener('click', () => paymentModal.classList.add('hidden'));
        paymentForm.addEventListener('submit', handlePaymentSubmit);
        amountPaidInput.addEventListener('input', () => {
            const total = parseFloat(paymentTotalSpan.textContent);
            const paid = parseFloat(amountPaidInput.value) || 0;
            const change = paid - total;
            changeDueSpan.textContent = change >= 0 ? change.toFixed(2) : '0.00';
        });
    }

    async function init() {
        try {
            allProducts = await window.db.crud.getAll('products');
            renderProductGrid();
            populateCustomerDropdown();
            setupEventListeners();
            console.log('POS module initialized.');
        } catch (error) {
            console.error('Error initializing POS module:', error);
        }
    }

    window.pos = {
        init: init
    };

})();

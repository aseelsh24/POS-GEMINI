// js/pos.js - Point of Sale Logic

(function() {
    'use strict';

    // --- State ---
    let currentCart = [];
    let allProducts = [];

    // --- DOM Elements ---
    const productListDiv = document.getElementById('pos-product-list');
    const cartItemsUl = document.getElementById('pos-cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const discountInput = document.getElementById('cart-discount');
    const finalTotalSpan = document.getElementById('cart-final-total');
    const clearCartBtn = document.getElementById('pos-clear-cart');
    const payCashBtn = document.getElementById('pos-pay-cash');
    const payCardBtn = document.getElementById('pos-pay-card');
    const payCreditBtn = document.getElementById('pos-pay-credit');

    async function renderProductGrid() {
        allProducts = await window.db.getAll('products');
        productListDiv.innerHTML = '';
        allProducts.forEach(p => {
            if (p.stock > 0) {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.id = p.id;
                card.innerHTML = `<div>${p.name}</div><div>${p.salePrice.toFixed(2)}</div>`;
                productListDiv.appendChild(card);
            }
        });
    }

    function renderCart() {
        cartItemsUl.innerHTML = '';
        let total = 0;
        currentCart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name} x${item.quantity}</span><span>${(item.salePrice * item.quantity).toFixed(2)}</span>`;
            cartItemsUl.appendChild(li);
            total += item.salePrice * item.quantity;
        });
        cartTotalSpan.textContent = total.toFixed(2);
        updateFinalTotal();
    }

    function updateFinalTotal() {
        const total = parseFloat(cartTotalSpan.textContent);
        const discount = parseFloat(discountInput.value) || 0;
        const finalTotal = total - discount;
        finalTotalSpan.textContent = finalTotal.toFixed(2);
    }

    function addToCart(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const cartItem = currentCart.find(item => item.id === productId);
        if (cartItem) {
            if (cartItem.quantity < product.stock) {
                cartItem.quantity++;
            } else {
                alert('لا يوجد المزيد من هذا المنتج في المخزون.');
            }
        } else {
            currentCart.push({ ...product, quantity: 1 });
        }
        renderCart();
    }

    async function generateReceipt(sale) {
        try {
            const response = await fetch('/templates/receipt-for-print.html');
            const template = await response.text();
            const user = window.auth.getCurrentUser();

            const itemsHtml = sale.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.salePrice.toFixed(2)}</td>
                    <td>${(item.salePrice * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('');

            const populatedHtml = template
                .replace('{{storeName}}', 'متجري') // Placeholder
                .replace('{{storeAddress}}', '') // Placeholder
                .replace('{{saleDate}}', new Date(sale.timestamp).toLocaleString())
                .replace('{{saleId}}', sale.id)
                .replace('{{cashierName}}', user ? user.username : 'N/A')
                .replace('{{items}}', itemsHtml)
                .replace('{{total}}', sale.total.toFixed(2))
                .replace('{{discount}}', sale.discount.toFixed(2))
                .replace('{{finalTotal}}', sale.finalTotal.toFixed(2));

            const receiptWindow = window.open('', '_blank');
            receiptWindow.document.write(populatedHtml);
            receiptWindow.document.close();

        } catch (error) {
            console.error('Failed to generate receipt:', error);
        }
    }

    async function processSale(paymentMethod) {
        if (currentCart.length === 0) {
            alert('الفاتورة فارغة.');
            return;
        }

        const sale = {
            items: currentCart,
            total: parseFloat(cartTotalSpan.textContent),
            discount: parseFloat(discountInput.value) || 0,
            finalTotal: parseFloat(finalTotalSpan.textContent),
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString()
        };

        try {
            const db = await window.db.init();
            const tx = db.transaction(['sales', 'products'], 'readwrite');
            const salesStore = tx.objectStore('sales');
            const productsStore = tx.objectStore('products');

            const addRequest = salesStore.add(sale);

            addRequest.onsuccess = (event) => {
                sale.id = event.target.result; // Get the ID of the newly created sale
                generateReceipt(sale);
            };

            const updatePromises = currentCart.map(item => {
                return new Promise((resolve, reject) => {
                    const request = productsStore.get(item.id);
                    request.onsuccess = () => {
                        const product = request.result;
                        product.stock -= item.quantity;
                        productsStore.put(product);
                        resolve();
                    };
                    request.onerror = () => reject(request.error);
                });
            });

            await Promise.all(updatePromises);

            tx.oncomplete = () => {
                currentCart = [];
                discountInput.value = 0;
                renderCart();
                renderProductGrid();
                alert('تمت عملية البيع بنجاح!');
            };

        } catch (error) {
            console.error('Sale failed:', error);
            alert('فشلت عملية البيع.');
        }
    }

    function setupEventListeners() {
        productListDiv.addEventListener('click', (e) => {
            if (e.target.closest('.product-card')) {
                const id = parseInt(e.target.closest('.product-card').dataset.id, 10);
                addToCart(id);
            }
        });
        discountInput.addEventListener('input', updateFinalTotal);
        clearCartBtn.addEventListener('click', () => {
            currentCart = [];
            renderCart();
        });
        payCashBtn.addEventListener('click', () => processSale('cash'));
        payCardBtn.addEventListener('click', () => processSale('card'));
        payCreditBtn.addEventListener('click', () => processSale('credit'));
    }

    function init() {
        console.log('POS module initialized.');
        setupEventListeners();
        renderProductGrid();
    }

    window.pos = {
        init
    };

})();

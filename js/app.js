// js/app.js - Main application logic

(function() {
    'use strict';

    const mainNav = document.querySelector('.main-nav');
    const mainContent = document.getElementById('app-main');

    // Define the application's views
    const views = {
        'pos-view': { title: 'نقطة البيع', initialized: false },
        'inventory-view': { title: 'المخزون', initialized: false },
        'reports-view': { title: 'التقارير', initialized: false },
        'customers-view': { title: 'العملاء', initialized: false },
        'settings-view': { title: 'الإعدادات', initialized: false }
    };

    /**
     * Shows a specific view and hides all others.
     * @param {string} viewId The ID of the view to show.
     */
    function showView(viewId) {
        // Hide all views
        Object.keys(views).forEach(id => {
            const viewElement = document.getElementById(id);
            if (viewElement) {
                viewElement.classList.add('hidden');
            }
        });

        // Show the selected view
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }

        // Update active button state
        const navButtons = mainNav.querySelectorAll('.nav-button');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        // Initialize module if it hasn't been already
        if (views[viewId] && !views[viewId].initialized) {
            switch(viewId) {
                case 'pos-view':
                     if (window.pos && typeof window.pos.init === 'function') {
                        window.pos.init();
                    }
                    break;
                case 'inventory-view':
                    if (window.inventory && typeof window.inventory.init === 'function') {
                        window.inventory.init();
                    }
                    break;
                case 'customers-view':
                    if (window.customers && typeof window.customers.init === 'function') {
                        window.customers.init();
                    }
                    break;
                case 'reports-view':
                    if (window.reports && typeof window.reports.init === 'function') {
                        window.reports.init();
                    }
                    break;
                case 'settings-view':
                    if (window.settings && typeof window.settings.init === 'function') {
                        window.settings.init();
                    }
                    break;
                // Add cases for other modules here as they are built
            }
            views[viewId].initialized = true;
        }
    }

    /**
     * Creates the main navigation buttons dynamically.
     */
    function setupNavigation() {
        Object.keys(views).forEach(viewId => {
            const button = document.createElement('button');
            button.className = 'nav-button';
            button.dataset.view = viewId;
            button.textContent = views[viewId].title;
            button.addEventListener('click', () => showView(viewId));
            mainNav.appendChild(button);
        });
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('SW registered:', registration.scope))
                    .catch(error => console.error('SW registration failed:', error));
            });
        }
    }

    async function initializeDatabase() {
        try {
            await window.db.init();
            document.getElementById('status-indicator').textContent = 'قاعدة البيانات جاهزة';
        } catch (error) {
            console.error('Error initializing database:', error);
            document.getElementById('status-indicator').textContent = 'خطأ في قاعدة البيانات';
        }
    }

    function setupSampleDataButton() {
        const loadButton = document.getElementById('load-sample-data-btn');
        if (!loadButton) return;

        loadButton.addEventListener('click', async () => {
            if (!confirm('هل أنت متأكد؟ سيتم حذف جميع المنتجات والموردين الحاليين واستبدالهم ببيانات العيّنة.')) {
                return;
            }

            try {
                const response = await fetch('/cr_samples/inventory-data.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Clear existing data
                await window.db.crud.clear('products');
                await window.db.crud.clear('suppliers');
                console.log('Cleared products and suppliers stores.');

                // Load new data
                for (const product of data.products) {
                    await window.db.crud.add('products', product);
                }
                for (const supplier of data.suppliers) {
                    await window.db.crud.add('suppliers', supplier);
                }
                console.log('Loaded sample data.');

                // Refresh views if the inventory module is loaded
                if (window.inventory) {
                    await window.inventory.renderProductsTable();
                    await window.inventory.renderSuppliersTable();
                }

                alert('تم تحميل بيانات العيّنة بنجاح!');

            } catch (error) {
                console.error('Failed to load sample data:', error);
                alert('فشل تحميل بيانات العيّنة.');
            }
        });
    }

    /**
     * Main application entry point.
     */
    async function main() {
        console.log('Application starting...');
        setupNavigation();
        setupSampleDataButton(); // Set up the new button
        registerServiceWorker();
        await initializeDatabase();

        // Show the POS view by default
        showView('pos-view');
    }

    document.addEventListener('DOMContentLoaded', main);

})();

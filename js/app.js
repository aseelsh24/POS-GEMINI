// js/app.js - Main application logic

(function() {
    'use strict';

    // DOM Elements
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const appContainer = document.getElementById('app-container');
    const header = document.querySelector('#app-container header');
    const views = document.querySelectorAll('.view');
    const loadDataBtn = document.getElementById('load-sample-data-btn');
    const statusIndicator = document.getElementById('status-indicator');

    const viewModules = {
        'pos-view': { module: window.pos, title: 'نقطة البيع', roles: ['Owner', 'Manager', 'Cashier'] },
        'inventory-view': { module: window.inventory, title: 'المخزون', roles: ['Owner', 'Manager'] },
        'suppliers-view': { module: window.suppliers, title: 'الموردين', roles: ['Owner', 'Manager'] },
        'customers-view': { module: window.customers, title: 'العملاء', roles: ['Owner', 'Manager', 'Cashier'] },
        'reports-view': { module: window.reports, title: 'التقارير', roles: ['Owner', 'Manager'] },
        'backup-view': { module: window.backup, title: 'النسخ الاحتياطي', roles: ['Owner'] }
    };

    function showView(viewId) {
        views.forEach(view => view.classList.add('hidden'));
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.remove('hidden');
        }

        // Initialize module if it has an init function and hasn't been initialized
        const moduleDef = viewModules[viewId];
        if (moduleDef && moduleDef.module && !moduleDef.module.initialized) {
            moduleDef.module.init();
            moduleDef.module.initialized = true;
        }
    }

    function setupHeader() {
        const user = window.auth.getCurrentUser();
        if (!user) return;

        const nav = document.createElement('nav');
        let navHtml = '';

        for (const viewId in viewModules) {
            const viewDef = viewModules[viewId];
            if (viewDef.roles.includes(user.role)) {
                navHtml += `<button data-view="${viewId}">${viewDef.title}</button>`;
            }
        }
        navHtml += `<button id="logout-btn" style="margin-right: auto;">تسجيل الخروج</button>`;
        nav.innerHTML = navHtml;

        // Clear previous nav if any, then append
        const existingNav = header.querySelector('nav');
        if(existingNav) existingNav.remove();
        header.appendChild(nav);

        nav.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]')) {
                showView(e.target.dataset.view);
            } else if (e.target.matches('#logout-btn')) {
                window.auth.logout();
            }
        });
    }

    function startApp() {
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        setupHeader();
        showView('pos-view'); // Default view after login
        statusIndicator.textContent = `مرحباً ${window.auth.getCurrentUser().username}`;
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW reg failed:', err));
        }
    }

    function setupLoadDataButton() {
        loadDataBtn.addEventListener('click', async () => {
            if (!confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات الحالية.')) return;
            try {
                const response = await fetch('/cr_samples/sample-data.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                // This requires a more robust db helper, but for now we add
                for (const storeName in data) {
                    if (data.hasOwnProperty(storeName)) {
                        for (const item of data[storeName]) {
                            // The user object in sample-data.json already has a pinHash.
                            // No need to re-hash it here. Just add the item directly.
                            await window.db.add(storeName, item);
                        }
                    }
                }
                alert('تم تحميل بيانات العيّنة بنجاح! يرجى إعادة تحميل الصفحة.');
                window.location.reload();
            } catch (error) {
                console.error('Failed to load sample data:', error);
            }
        });
    }

    async function main() {
        registerServiceWorker();
        setupLoadDataButton();

        try {
            await window.db.init();
            window.auth.init();

            if (window.auth.checkSession()) {
                startApp();
            } else {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const success = await window.auth.login(loginForm.username.value, loginForm.pin.value);
                    if (success) {
                        startApp();
                    } else {
                        loginError.textContent = 'اسم المستخدم أو الرقم السري غير صحيح.';
                        loginError.classList.remove('hidden');
                    }
                });
            }
        } catch (error) {
            document.body.innerHTML = '<h1>فشل تهيئة التطبيق.</h1>';
            console.error(error);
        }
    }

    window.addEventListener('load', main);

})();

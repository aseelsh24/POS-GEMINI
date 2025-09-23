// js/backup.js - Data Backup and Restore Logic

(function() {
    'use strict';

    // --- DOM Elements ---
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    const STORE_NAMES = ['products', 'sales', 'purchases', 'suppliers', 'customers', 'users', 'settings', 'counters'];

    async function exportData() {
        try {
            const backupData = {};
            for (const storeName of STORE_NAMES) {
                backupData[storeName] = await window.db.getAll(storeName);
            }

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `grocery-pos-backup-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('تم تصدير النسخة الاحتياطية بنجاح!');

        } catch (error) {
            console.error('Export failed:', error);
            alert('فشل تصدير النسخة الاحتياطية.');
        }
    }

    async function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm('هل أنت متأكد؟ سيتم مسح جميع البيانات الحالية واستبدالها بالبيانات الموجودة في ملف النسخة الاحتياطية.')) {
            importFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backupData = JSON.parse(e.target.result);

                const db = await window.db.init();
                const tx = db.transaction(STORE_NAMES, 'readwrite');

                // Clear all stores
                for (const storeName of STORE_NAMES) {
                    tx.objectStore(storeName).clear();
                }

                // Add all new data
                for (const storeName of STORE_NAMES) {
                    if (backupData[storeName]) {
                        const store = tx.objectStore(storeName);
                        backupData[storeName].forEach(item => {
                            store.add(item);
                        });
                    }
                }

                tx.oncomplete = () => {
                    alert('تم استعادة النسخة الاحتياطية بنجاح! سيتم إعادة تحميل التطبيق.');
                    window.location.reload();
                };

                tx.onerror = () => {
                    alert('فشل استعادة النسخة الاحتياطية.');
                };

            } catch (error) {
                console.error('Import failed:', error);
                alert('فشل استعادة النسخة الاحتياطية. الملف غير صالح.');
            } finally {
                importFileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    function setupEventListeners() {
        exportBtn.addEventListener('click', exportData);
        importFileInput.addEventListener('change', (e) => {
            importBtn.disabled = !e.target.files || e.target.files.length === 0;
        });
        importBtn.addEventListener('click', () => {
            if(importFileInput.files.length > 0) {
                importData({ target: { files: importFileInput.files } });
            }
        });
    }

    function init() {
        console.log('Backup module initialized.');
        setupEventListeners();
    }

    window.backup = {
        init
    };

})();

// js/db.js - IndexedDB Schema and Initialization

(function() {
    'use strict';

    const DB_NAME = 'grocery-app-db';
    const DB_VERSION = 2; // Incremented version for schema change
    const STORES = [
        'products', 'sales', 'purchases', 'suppliers', 'customers', 'users', 'settings', 'counters'
    ];

    let db;

    /**
     * Initializes the IndexedDB database and creates/upgrades object stores.
     * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
     */
    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => reject('Database error: ' + event.target.error);

            request.onupgradeneeded = (event) => {
                const dbInstance = event.target.result;
                const transaction = event.target.transaction;
                console.log(`Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);

                if (event.oldVersion < 1) {
                    // Initial schema creation
                    STORES.forEach(storeName => {
                        if (!dbInstance.objectStoreNames.contains(storeName)) {
                            if (storeName === 'settings' || storeName === 'counters') {
                                dbInstance.createObjectStore(storeName, { keyPath: 'key' });
                            } else {
                                dbInstance.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            }
                        }
                    });
                }
                if (event.oldVersion < 2) {
                    // Add username index to users store
                    const usersStore = transaction.objectStore('users');
                    if (!usersStore.indexNames.contains('username')) {
                        usersStore.createIndex('username', 'username', { unique: true });
                    }
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('Database opened successfully.');
                resolve(db);
            };
        });
    }

    // Expose public functions
    window.db = {
        init: initDB,
        add: (storeName, item) => {
            return new Promise((resolve, reject) => {
                if (!db) return reject('DB not initialized.');
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(item);
                transaction.oncomplete = () => resolve(request.result);
                transaction.onerror = (event) => reject(event.target.error);
            });
        },
        /**
         * Retrieves an item from a store by a specific index.
         * @param {string} storeName The name of the object store.
         * @param {string} indexName The name of the index to query.
         * @param {*} query The value to search for in the index.
         * @returns {Promise<object|undefined>} A promise that resolves with the found item or undefined.
         */
        getByIndex: (storeName, indexName, query) => {
            return new Promise((resolve, reject) => {
                if (!db) return reject('DB not initialized.');
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.get(query);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            });
        },
        getAll: (storeName) => {
            return new Promise((resolve, reject) => {
                if (!db) return reject('DB not initialized.');
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(event.target.error);
            });
        },
        put: (storeName, item) => {
            return new Promise((resolve, reject) => {
                if (!db) return reject('DB not initialized.');
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(item);
                transaction.oncomplete = () => resolve(request.result);
                transaction.onerror = (event) => reject(event.target.error);
            });
        },
        delete: (storeName, key) => {
            return new Promise((resolve, reject) => {
                if (!db) return reject('DB not initialized.');
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                transaction.oncomplete = () => resolve();
                transaction.onerror = (event) => reject(event.target.error);
            });
        }
    };

})();

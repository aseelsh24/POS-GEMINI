// js/db.js - IndexedDB Initialization and Helpers

(function() {
    'use strict';

    const DB_NAME = 'grocery-pos-db';
    const DB_VERSION = 1;

    // Define all object stores and their configurations
    const STORES = [
        {
            name: 'products',
            key: { keyPath: 'id', autoIncrement: true },
            indexes: [
                { name: 'barcode', keyPath: 'barcode', options: { unique: true } },
                { name: 'name', keyPath: 'name', options: { unique: false } }
            ]
        },
        {
            name: 'suppliers',
            key: { keyPath: 'id', autoIncrement: true },
            indexes: [
                { name: 'name', keyPath: 'name', options: { unique: false } }
            ]
        },
        {
            name: 'customers',
            key: { keyPath: 'id', autoIncrement: true },
            indexes: [
                { name: 'name', keyPath: 'name', options: { unique: false } },
                { name: 'phone', keyPath: 'phone', options: { unique: false } }
            ]
        },
        {
            name: 'sales',
            key: { keyPath: 'id', autoIncrement: true },
            indexes: [
                { name: 'date', keyPath: 'date', options: { unique: false } },
                { name: 'customerId', keyPath: 'customerId', options: { unique: false } }
            ]
        },
        {
            name: 'purchases',
            key: { keyPath: 'id', autoIncrement: true },
            indexes: [
                { name: 'date', keyPath: 'date', options: { unique: false } },
                { name: 'supplierId', keyPath: 'supplierId', options: { unique: false } }
            ]
        },
        {
            name: 'settings',
            key: { keyPath: 'key' },
            indexes: []
        }
    ];

    let db;

    /**
     * Initializes the IndexedDB database and creates object stores.
     * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
     */
    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) {
                return resolve(db);
            }

            console.log(`Opening database ${DB_NAME} version ${DB_VERSION}...`);
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject('Database error: ' + event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const dbInstance = event.target.result;
                console.log('Database upgrade needed.');

                STORES.forEach(storeConfig => {
                    if (!dbInstance.objectStoreNames.contains(storeConfig.name)) {
                        console.log(`Creating object store: ${storeConfig.name}`);
                        const store = dbInstance.createObjectStore(storeConfig.name, storeConfig.key);

                        storeConfig.indexes.forEach(indexConfig => {
                            console.log(`  - Creating index: ${indexConfig.name}`);
                            store.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
                        });
                    }
                });
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('Database opened successfully.');

                db.onerror = (errorEvent) => {
                    console.error('Database error:', errorEvent.target.error);
                };

                resolve(db);
            };
        });
    }

    // Expose the initDB function to the global scope
    window.db = {
        init: initDB,

        /**
         * Performs a transaction with multiple operations.
         * @param {string[]} storeNames An array of store names to include in the transaction.
         * @param {'readonly'|'readwrite'} mode The transaction mode.
         * @param {function(IDBTransaction): Promise<any>} callback The function to execute within the transaction.
         * @returns {Promise<any>} A promise that resolves with the result of the callback.
         */
        performTransaction: (storeNames, mode, callback) => {
            return new Promise((resolve, reject) => {
                if (!db) {
                    return reject('Database is not initialized.');
                }
                const transaction = db.transaction(storeNames, mode);
                const promise = callback(transaction);

                promise.then(result => {
                    transaction.oncomplete = () => resolve(result);
                }).catch(err => {
                    transaction.abort();
                    reject(err);
                });

                transaction.onerror = (event) => {
                    reject(event.target.error);
                };
            });
        },

        // Generic CRUD helper functions
        crud: {
            /**
             * Adds an item to a specified store.
             * @param {string} storeName The name of the object store.
             * @param {object} item The item to add.
             * @returns {Promise<number>} A promise that resolves with the key of the added item.
             */
            add: (storeName, item) => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.add(item);
                    transaction.oncomplete = () => resolve(request.result);
                    transaction.onerror = (event) => reject(event.target.error);
                });
            },

            /**
             * Retrieves an item by its key from a specified store.
             * @param {string} storeName The name of the object store.
             * @param {*} key The key of the item to retrieve.
             * @returns {Promise<object>} A promise that resolves with the retrieved item.
             */
            get: (storeName, key) => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);
                    transaction.oncomplete = () => resolve(request.result);
                    transaction.onerror = (event) => reject(event.target.error);
                });
            },

            /**
             * Retrieves all items from a specified store.
             * @param {string} storeName The name of the object store.
             * @returns {Promise<Array<object>>} A promise that resolves with an array of all items.
             */
            getAll: (storeName) => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();
                    transaction.oncomplete = () => resolve(request.result);
                    transaction.onerror = (event) => reject(event.target.error);
                });
            },

            /**
             * Updates an item in a specified store.
             * @param {string} storeName The name of the object store.
             * @param {object} item The item to update.
             * @returns {Promise<number>} A promise that resolves with the key of the updated item.
             */
            update: (storeName, item) => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.put(item);
                    transaction.oncomplete = () => resolve(request.result);
                    transaction.onerror = (event) => reject(event.target.error);
                });
            },

            /**
             * Deletes an item by its key from a specified store.
             * @param {string} storeName The name of the object store.
             * @param {*} key The key of the item to delete.
             * @returns {Promise<void>} A promise that resolves when the item is deleted.
             */
            delete: (storeName, key) => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    store.delete(key);
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = (event) => reject(event.target.error);
                });
            },

            /**
             * Clears all items from a specified store.
             * @param {string} storeName The name of the object store.
             * @returns {Promise<void>} A promise that resolves when the store is cleared.
             */
            clear: (storeName) => {
                return new Promise((resolve, reject) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    store.clear();
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = (event) => reject(event.target.error);
                });
            }
        }
    };

})();

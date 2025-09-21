// js/settings.js - Settings Management Module

(function() {
    'use strict';

    // --- DOM Elements ---
    const settingsForm = document.getElementById('settings-form');
    const formInputs = settingsForm.querySelectorAll('input[data-key]');

    /**
     * Loads all settings from the database and populates the form fields.
     */
    async function loadSettings() {
        try {
            const allSettings = await window.db.crud.getAll('settings');
            const settingsMap = new Map(allSettings.map(s => [s.key, s.value]));

            formInputs.forEach(input => {
                const key = input.dataset.key;
                if (settingsMap.has(key)) {
                    input.value = settingsMap.get(key);
                }
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Handles the settings form submission.
     */
    async function handleSettingsFormSubmit(event) {
        event.preventDefault();
        try {
            const promises = [];
            formInputs.forEach(input => {
                const setting = {
                    key: input.dataset.key,
                    value: input.value
                };
                promises.push(window.db.crud.update('settings', setting));
            });

            await Promise.all(promises);
            alert('تم حفظ الإعدادات بنجاح!');

        } catch (error) {
            console.error('Error saving settings:', error);
            alert('فشل حفظ الإعدادات.');
        }
    }

    /**
     * Initializes the settings module.
     */
    function init() {
        settingsForm.addEventListener('submit', handleSettingsFormSubmit);
        loadSettings();
        console.log('Settings module initialized.');
    }

    window.settings = {
        init: init
    };

})();

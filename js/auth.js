// js/auth.js - Authentication and User Session Management

(function() {
    'use strict';

    const SESSION_KEY = 'grocery-app-user';

    async function hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function login(username, pin) {
        try {
            const user = await window.db.getByIndex('users', 'username', username);
            if (!user) {
                console.log('User not found');
                return false; // User not found
            }

            const hashedPin = await hashPin(pin);
            if (hashedPin === user.pinHash) {
                // Don't store the hash in the session
                const sessionUser = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
                return true; // Login successful
            }
            return false; // Incorrect PIN
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        // Force a reload to go back to the login screen
        window.location.reload();
    }

    function getCurrentUser() {
        const userJson = sessionStorage.getItem(SESSION_KEY);
        try {
            return JSON.parse(userJson);
        } catch (e) {
            return null;
        }
    }

    function checkSession() {
        return getCurrentUser() !== null;
    }

    function init() {
        // The main app.js will handle the initial check and UI toggle
        console.log('Auth module initialized.');
    }

    window.auth = {
        init,
        login,
        logout,
        checkSession,
        getCurrentUser,
        hashPin
    };

})();

/**
 * ==========================================================
 * Professional Live Dashboard V2
 * File : js/api.js
 * Final Version
 * ==========================================================
 */

const API = (() => {

    // ==============================
    // Configuration
    // ==============================

    const CONFIG = {
        BASE_URL: "",
        TIMEOUT: 15000
    };

    // ==============================
    // Generic Request
    // ==============================

    async function request(url, options = {}) {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, CONFIG.TIMEOUT);

        try {

            const response = await fetch(CONFIG.BASE_URL + url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status} : ${response.statusText}`
                );
            }

            return await response.json();

        } catch (error) {

            clearTimeout(timeout);

            console.error("API Error:", error);

            throw error;
        }
    }

    // ==============================
    // GET
    // ==============================

    async function get(url) {
        return request(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
    }

    // ==============================
    // POST
    // ==============================

    async function post(url, data = {}) {

        return request(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });
    }

    // ==============================
    // PUT
    // ==============================

    async function put(url, data = {}) {

        return request(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });
    }

    // ==============================
    // DELETE
    // ==============================

    async function remove(url) {

        return request(url, {
            method: "DELETE",
            headers: {
                "Accept": "application/json"
            }
        });
    }

    // ==============================
    // Public API
    // ==============================

    return {

        config(config = {}) {
            Object.assign(CONFIG, config);
        },

        get,

        post,

        put,

        delete: remove
    };

})();

// Global Access
window.API = API;

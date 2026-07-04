/**
 * Professional Live Dashboard V2
 * File: js/ui.js
 * Final Version
 */

const UI = {
    /**
     * Show Loading
     */
    showLoader() {
        const loader = document.getElementById("loader");
        if (loader) {
            loader.classList.remove("hidden");
        }
    },

    /**
     * Hide Loading
     */
    hideLoader() {
        const loader = document.getElementById("loader");
        if (loader) {
            loader.classList.add("hidden");
        }
    },

    /**
     * Update Text
     * @param {string} id
     * @param {string|number} value
     */
    setText(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value ?? "--";
        }
    },

    /**
     * Update HTML
     * @param {string} id
     * @param {string} html
     */
    setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = html;
        }
    },

    /**
     * Show Toast
     * @param {string} message
     * @param {string} type
     */
    toast(message, type = "info") {

        const toast = document.createElement("div");

        toast.className = `
            fixed
            bottom-5
            right-5
            px-4
            py-3
            rounded-xl
            shadow-lg
            text-white
            z-50
            transition
            duration-300
        `;

        switch (type) {

            case "success":
                toast.classList.add("bg-green-600");
                break;

            case "error":
                toast.classList.add("bg-red-600");
                break;

            case "warning":
                toast.classList.add("bg-yellow-500");
                break;

            default:
                toast.classList.add("bg-blue-600");
        }

        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("opacity-0");

            setTimeout(() => {
                toast.remove();
            }, 300);

        }, 2500);
    },

    /**
     * Format Number
     * @param {number} num
     */
    formatNumber(num) {

        if (num === null || num === undefined || isNaN(num)) {
            return "--";
        }

        return Number(num).toLocaleString("en-IN");
    },

    /**
     * Format Currency
     * @param {number} amount
     */
    formatCurrency(amount) {

        if (amount === null || amount === undefined || isNaN(amount)) {
            return "₹0";
        }

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(amount);
    }
};

// Global Access
window.UI = UI;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANS = void 0;
exports.PLANS = {
    FREE: {
        credits: 3,
        name: "Free",
        pricing: {
            INR: { amount: 0, display: "₹0" },
            USD: { amount: 0, display: "$0" },
        },
    },
    CREATOR: {
        credits: 30,
        name: "Creator",
        pricing: {
            INR: { amount: 49900, display: "₹499" },
            USD: { amount: 999, display: "$9.99" },
        },
    },
    PRO: {
        credits: 100,
        name: "Pro",
        pricing: {
            INR: { amount: 129900, display: "₹1,299" },
            USD: { amount: 1999, display: "$19.99" },
        },
    },
};

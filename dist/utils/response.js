"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = void 0;
const sendError = (res, status, message, error) => {
    res.status(status).json({
        success: false,
        message,
        error: process.env.NODE_ENV === "development" ? (error === null || error === void 0 ? void 0 : error.message) || error : undefined,
    });
};
exports.sendError = sendError;

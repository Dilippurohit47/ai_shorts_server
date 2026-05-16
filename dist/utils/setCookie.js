"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTokenCookie = void 0;
const setTokenCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 24 * 60 * 60 * 1000,
    });
};
exports.setTokenCookie = setTokenCookie;

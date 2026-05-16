"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.getMe = exports.signUp = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, googleId, image, name } = req.body;
        let user = yield prisma_1.prisma.user.findUnique({ where: { googleId } });
        if (!user) {
            user = yield prisma_1.prisma.user.create({
                data: {
                    googleId,
                    email,
                    name,
                    image,
                    credits: 10,
                    transactions: {
                        create: {
                            amount: 10,
                            type: "BONUS",
                            description: "Signup bonus",
                        }
                    }
                }
            });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        (0, response_1.sendError)(res, 500, "Internal server error", error);
    }
});
exports.signUp = signUp;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({ user: req.user });
    }
    catch (error) {
        (0, response_1.sendError)(res, 500, "Internal server error", error);
    }
});
exports.getMe = getMe;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email: email }
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.status(200).json({ user });
    }
    catch (error) {
        console.log(error);
        (0, response_1.sendError)(res, 500, "Internal server error", error);
    }
});
exports.getUser = getUser;

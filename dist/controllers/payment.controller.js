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
exports.getPaymentHistory30d = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const getPaymentHistory30d = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const data = yield prisma_1.prisma.payment.findMany({
            where: {
                userId: userId,
            }, select: {
                amount: true,
                createdAt: true,
                planId: true,
                status: true,
                currency: true,
                razorpayPaymentId: true,
            }
        });
        return res.json(data);
    }
    catch (error) {
        (0, response_1.sendError)(res, 500, "Internal server error");
    }
});
exports.getPaymentHistory30d = getPaymentHistory30d;

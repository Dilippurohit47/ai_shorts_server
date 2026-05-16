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
exports.activateSubscription = void 0;
const client_1 = require("@prisma/client");
const plans_1 = require("../config/plans");
const prisma = new client_1.PrismaClient();
const activateSubscription = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const planKey = input === null || input === void 0 ? void 0 : input.planId.toUpperCase();
    const plan = plans_1.PLANS[planKey];
    const existing = yield prisma.payment.findUnique({
        where: { razorpayPaymentId: input.razorpayPaymentId },
    });
    if (existing)
        return { alreadyProcessed: true };
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.payment.create({
            data: {
                razorpayOrderId: input.razorpayOrderId,
                razorpayPaymentId: input.razorpayPaymentId,
                razorpaySignature: input.razorpaySignature,
                userId: input.userId,
                planId: planKey,
                amount: plan.pricing.INR.amount,
            },
        });
        const currentUser = yield tx.user.findUnique({
            where: { id: input.userId },
            select: { credits: true, totalCredits: true, plan: true },
        });
        if (!currentUser)
            throw new Error("User not found");
        const user = yield tx.user.update({
            where: { id: input.userId },
            data: {
                plan: planKey,
                credits: currentUser.credits + plan.credits,
                totalCredits: currentUser.totalCredits + plan.credits,
                planExpiresAt: expiresAt,
            },
        });
        return user;
    }));
    return { alreadyProcessed: false, user: result };
});
exports.activateSubscription = activateSubscription;

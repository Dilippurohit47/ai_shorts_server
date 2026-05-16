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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const subscription_service_1 = require("../services/subscription.service");
dotenv_1.default.config();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const PLANS = {
    creator: { amount: 49900, name: "Creator" },
    pro: { amount: 129900, name: "Pro" },
};
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { planId } = req.body;
        const plan = PLANS[planId];
        if (!plan) {
            return res.status(400).json({ error: "Invalid plan" });
        }
        const order = yield razorpay.orders.create({
            amount: plan.amount,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
            notes: {
                planId,
                userId: req.user.id,
            },
        });
        return res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: plan.name,
        });
    }
    catch (error) {
        console.error("Razorpay order error:", error);
        return res.status(500).json({ error: "Failed to create order" });
    }
});
exports.createOrder = createOrder;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, } = req.body;
        const userId = req.user.id;
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }
        const data = yield (0, subscription_service_1.activateSubscription)({ userId, planId: planId, razorpayOrderId: razorpay_order_id, razorpaySignature: razorpay_signature, razorpayPaymentId: razorpay_payment_id });
        return res.json({ success: true, data });
    }
    catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({ success: false });
    }
});
exports.verifyPayment = verifyPayment;

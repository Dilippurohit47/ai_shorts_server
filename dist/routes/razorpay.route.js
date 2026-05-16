"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const razorpay_controller_1 = require("../controllers/razorpay.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/create-order", auth_middleware_1.authMiddleware, razorpay_controller_1.createOrder);
router.post("/verify", auth_middleware_1.authMiddleware, razorpay_controller_1.verifyPayment);
exports.default = router;

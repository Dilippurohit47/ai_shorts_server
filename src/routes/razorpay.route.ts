import express from "express"
import { createOrder, verifyPayment } from "../controllers/razorpay.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const router = express.Router()

router.post("/create-order",authMiddleware ,createOrder)
router.post("/verify",authMiddleware ,verifyPayment)

export default router
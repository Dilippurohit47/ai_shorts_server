import Razorpay from 'razorpay';
import { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from "dotenv"
import { activateSubscription } from '../services/subscription.service';
dotenv.config()
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLANS: Record<string, { amount: number; name: string }> = {
  creator: { amount: 49900, name: "Creator" },   
  pro:     { amount: 129900, name: "Pro" },      
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const order = await razorpay.orders.create({
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
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
};


export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;
    
    const userId = req.user.id
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
 const data =   await activateSubscription({userId ,planId:planId,razorpayOrderId:razorpay_order_id ,razorpaySignature:razorpay_signature ,razorpayPaymentId:razorpay_payment_id})

    return res.json({ success: true ,data });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ success: false });
  }
};
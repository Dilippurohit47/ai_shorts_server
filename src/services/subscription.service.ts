import { PrismaClient, Plan } from '@prisma/client';
import { PLANS } from '../config/plans';

const prisma = new PrismaClient();

interface ActivateInput {
  userId: string;
  planId: Plan;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const activateSubscription = async (input: ActivateInput) => {
const planKey = input?.planId.toUpperCase() as keyof typeof PLANS;
const plan = PLANS[planKey];
  const existing = await prisma.payment.findUnique({
    where: { razorpayPaymentId: input.razorpayPaymentId },
  });
  if (existing) return { alreadyProcessed: true };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const result = await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        userId: input.userId,
        planId: planKey,
        amount: plan.pricing.INR.amount,
      },
    });

      const currentUser = await tx.user.findUnique({
    where: { id: input.userId },
    select: { credits: true, totalCredits: true, plan: true },
  });

  if (!currentUser) throw new Error("User not found");


    const user = await tx.user.update({
      where: { id: input.userId },
      data: {
        plan: planKey,
       credits: currentUser.credits + plan.credits,           
      totalCredits: currentUser.totalCredits + plan.credits,
        planExpiresAt: expiresAt,
      },
    });

    return user;
  });

  return { alreadyProcessed: false, user: result };
};
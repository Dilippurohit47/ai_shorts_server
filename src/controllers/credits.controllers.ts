import { prisma } from "../lib/prisma"
import { sendError } from "../utils/response"

import { Response ,Request } from "express"
export const getCredits = async (req: Request, res: Response) => {
  try {
    const userId = req?.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        totalCredits: true,
        plan: true,
        planExpiresAt: true,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Failed to fetch credits");
  }
};
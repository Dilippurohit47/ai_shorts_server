import { Request, Response, NextFunction } from "express"
import { prisma } from "../lib/prisma"
import { sendError } from "../utils/response"

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers["x-user-id"] as string
    if (!userId) {
      return sendError(res, 401, "Not authenticated")
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return sendError(res, 401, "User not found")
    }
    req.user = user
    next()
  } catch (error) {
    return sendError(res, 401, "Unauthorized")
  }
}
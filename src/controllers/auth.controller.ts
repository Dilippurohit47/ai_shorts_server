import { prisma } from "../lib/prisma"
import  {Response ,Request} from "express"
import { sendError } from "../utils/response"

import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken";
import { setTokenCookie } from "../utils/setCookie";
export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, googleId, image, name } = req.body
    let user = await prisma.user.findUnique({ where: { googleId } })

    if (!user) {
      user = await prisma.user.create({
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
      })
    }



    res.status(200).json({ user })
  } catch (error) {
    sendError(res, 500, "Internal server error", error)
  }
}

export const getMe = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ user: req.user })
  } catch (error) {
    sendError(res, 500, "Internal server error", error)
  }
}

export const getUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.query
    const user = await prisma.user.findUnique({
      where: { email: email as string }
    })

    if (!user) return res.status(404).json({ message: "User not found" })

    res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    sendError(res, 500, "Internal server error", error)
  }
}
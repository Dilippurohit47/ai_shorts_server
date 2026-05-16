
import { Response ,Request } from "express"
import { prisma } from "../lib/prisma"
import { sendError } from "../utils/response"
export const getPaymentHistory30d = async(req:Request , res:Response) =>{
    try {
        
        const userId  = req.user.id


        const data = await prisma.payment.findMany({
            where:{
                userId:userId ,
            },select:{
                amount:true,
                createdAt:true,
                planId:true,
                status:true,
                currency:true,
                razorpayPaymentId:true,
            }
        })
        return res.json(data)

    } catch (error) {
        sendError(res,500,"Internal server error")
    }
}
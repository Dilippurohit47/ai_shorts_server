import express from "express"
import { getPaymentHistory30d } from "../controllers/payment.controller"

const app = express.Router()

app.get("/30d" , getPaymentHistory30d)

export default app
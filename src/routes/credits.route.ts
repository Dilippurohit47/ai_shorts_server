import express from "express"
import { getCredits } from "../controllers/credits.controllers"
import { authMiddleware } from "../middleware/auth.middleware"

const app = express.Router()

app.get("/", authMiddleware,getCredits)


export default app
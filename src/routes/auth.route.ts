import express from "express"
import { getMe, getUser, signUp } from "../controllers/auth.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const app = express.Router()

app.post("/google",signUp)
app.get("/me", authMiddleware, getMe)
app.get("/user", getUser)
export default app
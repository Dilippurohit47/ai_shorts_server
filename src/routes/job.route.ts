import express from 'express'
import { getActiveJobs, getJobStatus } from '../controllers/job.controllers'
import { authMiddleware } from '../middleware/auth.middleware'

const app = express.Router()
app.get("/active",authMiddleware,getActiveJobs)
app.get("/:id", authMiddleware,getJobStatus)

export default app
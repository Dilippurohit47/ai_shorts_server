import express from "express";
import cors from "cors";
import videoRoutes from "./routes/video.route";
import jobRoutes from "./routes/job.route";
import voiceRoutes from "./routes/voice.route";
import authRoutes from "./routes/auth.route";
import connectedRoutes from "./routes/connected.route";
import creditsRoutes from "./routes/credits.route";
import razorpayRoutes from "./routes/razorpay.route";
import paymentRoutes from "./routes/payment.route";
import path from "path";

import dotenv from "dotenv"
import { prisma } from "./lib/prisma";
import { authMiddleware } from "./middleware/auth.middleware";
dotenv.config()

const app = express();
app.use(express.static(path.join(__dirname, "..")))

app.use(express.json());

app.use(cors({
  origin: ["http://localhost:3000","http://dilip-purohit.xyz:3000"],
  credentials:true
}));

app.get("/",(req,res)=>{
  res.send(200)
})
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/video", videoRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/connected", connectedRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/credits", creditsRoutes)
app.use("/api/payments",authMiddleware ,  paymentRoutes)

async function recoverStaleJobs() {
  const stuck = await prisma.job.updateMany({
    where: { status: "PROCESSING" },
    data: { 
      status: "FAILED",
    },
  });
  console.log(`🧹 Marked ${stuck.count} stale jobs as failed`);
}

recoverStaleJobs();

export default app;  
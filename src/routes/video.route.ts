import { Router } from "express";
import { generateVideoController, getRecentVideos, getVideoPlaybackUrl } from "../controllers/video.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/generate",authMiddleware, generateVideoController);
router.get("/recent",authMiddleware, getRecentVideos);
router.get("/:id/playback-url",authMiddleware, getVideoPlaybackUrl);

export default router;
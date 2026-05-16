import { Router } from "express"
import {
  connectYoutube,
  youtubeCallback,
  getConnectedAccounts,
  disconnectAccount,
  connectToFacebook,
  facebookCallback,
} from "../controllers/connected.controller"
import { authMiddleware } from "../middleware/auth.middleware"

const router = Router()

router.get("/youtube/connect",  connectYoutube)
router.get("/facebook/connect",  connectToFacebook)
router.get("/youtube/callback", youtubeCallback)  
router.get("/facebook/callback", facebookCallback)  
router.get("/accounts", authMiddleware, getConnectedAccounts)
router.delete("/:platform", authMiddleware, disconnectAccount)

export default router
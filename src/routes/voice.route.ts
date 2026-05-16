import { Router } from "express";
import {  testSarvamVoice } from "../controllers/voice.controller";

const router = Router();

router.get("/sarvam", testSarvamVoice);

export default router;
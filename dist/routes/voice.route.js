"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voice_controller_1 = require("../controllers/voice.controller");
const router = (0, express_1.Router)();
router.get("/sarvam", voice_controller_1.testSarvamVoice);
exports.default = router;

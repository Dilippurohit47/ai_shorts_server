"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSarvamVoice = void 0;
const axios_1 = __importDefault(require("axios"));
const testSarvamVoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { text = "Namaste, yeh ek test voice hai", voice = "bulbul:v3" } = req.body;
        const response = yield axios_1.default.post("https://api.sarvam.ai/v1/audio/speech", {
            model: voice,
            input: text,
        }, {
            headers: {
                Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
            },
            responseType: "arraybuffer",
        });
        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(response.data);
    }
    catch (error) {
        console.error(((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        return res.status(500).json({
            success: false,
            message: "TTS failed",
        });
    }
});
exports.testSarvamVoice = testSarvamVoice;

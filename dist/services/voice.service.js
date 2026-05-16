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
exports.VOICE_PROVIDERS = void 0;
exports.generateVoice = generateVoice;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const openApi_1 = require("../lib/openApi");
const duration_service_1 = require("./duration.service");
const concatAudios_1 = require("../utils/concatAudios");
// ─── Constants ────────────────────────────────────────────
exports.VOICE_PROVIDERS = {
    sarvam: {
        name: "Sarvam AI",
        model: "bulbul:v3",
        male: ["ashutosh", "aditya", "rahul", "rohan", "amit", "dev", "ratan",
            "varun", "manan", "sumit", "kabir", "aayan", "ashutosh", "advait"],
        female: ["ritu", "priya", "neha", "pooja", "simran", "kavya",
            "ishita", "shreya", "roopa", "amelia", "sophia"],
        languages: {
            hindi: "hi-IN",
            hinglish: "hi-IN",
            english: "en-IN",
            bengali: "bn-IN",
            tamil: "ta-IN",
            telugu: "te-IN",
            gujarati: "gu-IN",
            kannada: "kn-IN",
            marathi: "mr-IN",
            punjabi: "pa-IN",
        }
    },
    openai: {
        name: "OpenAI TTS",
        model: "gpt-4o-mini-tts",
        voices: ["nova", "alloy", "echo", "fable", "onyx", "shimmer"],
    }
};
// voice.service.ts
function generateVoice(scriptData, settings, workDir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (settings.voice.voiceProvider === "sarvam") {
            return yield generateSarvamVoice(scriptData, settings, workDir);
        }
        else {
            return yield generateOpenAIVoice(scriptData, settings, workDir);
        }
    });
}
function generateSarvamVoice(scriptData, settings, workDir) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const langCode = (_a = exports.VOICE_PROVIDERS.sarvam.languages[settings.language]) !== null && _a !== void 0 ? _a : "hi-IN";
        const sceneAudioPaths = [];
        const sceneDurations = [];
        for (let i = 0; i < scriptData.scenes.length; i++) {
            const scene = scriptData.scenes[i];
            const response = yield fetch("https://api.sarvam.ai/text-to-speech", {
                method: "POST",
                headers: {
                    "api-subscription-key": process.env.SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: [scene.narration],
                    target_language_code: langCode,
                    speaker: (_c = (_b = settings.voice.voiceCharacter) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== null && _c !== void 0 ? _c : "shubh",
                    pace: (_d = settings.voice.voiceSpeed) !== null && _d !== void 0 ? _d : 1.15,
                    model: "bulbul:v3",
                    enable_preprocessing: true,
                }),
            });
            const data = yield response.json();
            if (!((_e = data.audios) === null || _e === void 0 ? void 0 : _e[0]))
                throw new Error(`Sarvam TTS failed for scene ${i}: ${JSON.stringify(data)}`);
            const scenePath = path_1.default.join(workDir, `scene_${i}.wav`); // ← .wav not .mp3
            fs_1.default.writeFileSync(scenePath, Buffer.from(data.audios[0], "base64"));
            const duration = yield (0, duration_service_1.getAudioDuration)(scenePath);
            sceneAudioPaths.push(scenePath);
            sceneDurations.push(duration);
            console.log(`✅ Scene ${i} audio: ${duration.toFixed(2)}s`);
        }
        const finalAudioPath = yield (0, concatAudios_1.concatAudios)(sceneAudioPaths, workDir);
        console.log("✅ Sarvam voice concatenated:", finalAudioPath);
        return { audioPath: finalAudioPath, sceneDurations };
    });
}
function generateOpenAIVoice(scriptData, settings, workDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const sceneAudioPaths = [];
        const sceneDurations = [];
        for (let i = 0; i < scriptData.scenes.length; i++) {
            const scene = scriptData.scenes[i];
            const response = yield openApi_1.openai.audio.speech.create({
                model: "gpt-4o-mini-tts",
                voice: "nova",
                input: scene.narration,
                instructions: `Speak in ${settings.language}. Sound natural and energetic like a YouTube creator.`,
            });
            const buffer = Buffer.from(yield response.arrayBuffer());
            if (buffer.length < 1000)
                throw new Error(`OpenAI TTS failed for scene ${i}`);
            let scenePath = path_1.default.join(workDir, `scene_${i}.mp3`);
            // Apply speed if needed
            if (settings.voice.voiceSpeed && settings.voice.voiceSpeed !== 1.0) {
                const originalPath = path_1.default.join(workDir, `scene_${i}_original.mp3`);
                fs_1.default.writeFileSync(originalPath, buffer);
                yield new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(`ffmpeg -y -i "${originalPath}" -filter:a "atempo=${settings.voice.voiceSpeed}" "${scenePath}"`, (err, _, stderr) => {
                        if (err) {
                            console.error(`❌ Speed up failed for scene ${i}:`, stderr);
                            return reject(err);
                        }
                        resolve();
                    });
                });
                fs_1.default.unlinkSync(originalPath);
            }
            else {
                fs_1.default.writeFileSync(scenePath, buffer);
            }
            const duration = yield (0, duration_service_1.getAudioDuration)(scenePath);
            sceneAudioPaths.push(scenePath);
            sceneDurations.push(duration);
            console.log(`✅ Scene ${i} audio: ${duration.toFixed(2)}s`);
        }
        const finalAudioPath = yield (0, concatAudios_1.concatAudios)(sceneAudioPaths, workDir);
        console.log("✅ OpenAI voice concatenated:", finalAudioPath);
        return { audioPath: finalAudioPath, sceneDurations };
    });
}

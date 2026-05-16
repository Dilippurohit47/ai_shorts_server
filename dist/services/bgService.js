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
exports.downloadBgMusic = downloadBgMusic;
const path_1 = __importDefault(require("path"));
const dowload_service_1 = require("./dowload.service");
function downloadBgMusic(niche, workDir) {
    return __awaiter(this, void 0, void 0, function* () {
        // use pre-selected free background music URLs from mixkit (no API needed)
        const musicMap = {
            motivational: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
            energetic: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749a911.mp3",
            inspiring: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3",
            corporate: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_5b31e8d2d3.mp3",
            epic: "https://cdn.pixabay.com/download/audio/2022/05/13/audio_7b28c3a960.mp3",
            happy: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_2dde668d05.mp3",
            electronic: "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3",
        };
        const moodMap = {
            health: "motivational",
            fitness: "energetic",
            psychology: "inspiring",
            finance: "corporate",
            motivation: "epic",
            food: "happy",
            tech: "electronic",
        };
        const mood = moodMap[niche.toLowerCase()] || "motivational";
        const audioUrl = musicMap[mood];
        const bgMusicPath = path_1.default.join(workDir, "bgmusic.mp3");
        console.log(`🎵 Downloading bg music for mood: ${mood}`);
        yield (0, dowload_service_1.downloadFile)(audioUrl, bgMusicPath);
        console.log("✅ BG Music downloaded");
        return bgMusicPath;
    });
}

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
exports.fetchClipsForScenes = fetchClipsForScenes;
const path_1 = __importDefault(require("path")); // ← NEW import
const aiVision_service_1 = require("./aiVision.service");
const dowload_service_1 = require("./dowload.service");
const sleep = (ms) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res("");
        }, ms);
    });
};
function fetchClipsForScenes(scenes, workDir // ← NEW parameter
) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const clipPaths = [];
        const usedVideoIds = new Set();
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            console.log(`🎬 Fetching clip for scene ${i + 1}: "${scene.keyword}"`);
            if (i > 0)
                yield sleep(1500);
            const res = yield fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(scene.keyword)}&per_page=15&orientation=portrait&size=medium`, { headers: { Authorization: process.env.PEXELS_API_KEY } });
            console.log("Pexels status:", res.status);
            const data = yield res.json();
            const validVideos = (_a = data.videos) === null || _a === void 0 ? void 0 : _a.filter((v) => v.duration >= scene.duration &&
                v.height > v.width);
            console.log(`Found ${(validVideos === null || validVideos === void 0 ? void 0 : validVideos.length) || 0} valid portrait clips for "${scene.keyword}"`);
            // 👇 AI vision check — loop through until GPT approves one
            let selectedVideo = null;
            for (const v of validVideos || []) {
                if (usedVideoIds.has(v.id))
                    continue;
                const isGood = yield (0, aiVision_service_1.isClipRelevant)(v.image, scene.keyword);
                if (isGood) {
                    selectedVideo = v;
                    break;
                }
                console.log(`⏭️ Skipping video ${v.id} — not relevant`);
            }
            if (!selectedVideo) {
                // retry with simpler keyword
                console.warn(`⚠️ No AI-approved clip for "${scene.keyword}", retrying...`);
                yield sleep(1500);
                const keyword = scene.keyword.split(" ").slice(0, 2).join(" ");
                const retry = yield fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=15&orientation=portrait`, { headers: { Authorization: process.env.PEXELS_API_KEY } });
                const retryData = yield retry.json();
                // 👇 AI check on retry results too
                for (const v of retryData.videos || []) {
                    if (usedVideoIds.has(v.id))
                        continue;
                    if (v.duration < scene.duration)
                        continue;
                    const isGood = yield (0, aiVision_service_1.isClipRelevant)(v.image, scene.keyword);
                    if (isGood) {
                        selectedVideo = v;
                        break;
                    }
                }
                if (!selectedVideo) {
                    console.warn(`⚠️ Retry also failed, using fallback black screen`);
                    clipPaths.push("");
                    continue;
                }
            }
            usedVideoIds.add(selectedVideo.id);
            console.log(`🎥 Video ID: ${selectedVideo.id} | ${selectedVideo.width}x${selectedVideo.height} | ${selectedVideo.duration}s`);
            const file = selectedVideo.video_files.find((f) => f.quality === "hd" && f.height >= 1080) ||
                selectedVideo.video_files.find((f) => f.quality === "hd") ||
                selectedVideo.video_files[0];
            console.log(`📹 File quality: ${file.quality} | ${file.width}x${file.height}`);
            const clipPath = path_1.default.join(workDir, `clip_${i}.mp4`); // ← CHANGED line
            yield (0, dowload_service_1.downloadFile)(file.link, clipPath);
            console.log(`✅ Downloaded clip ${i + 1}`);
            clipPaths.push(clipPath);
        }
        return clipPaths;
    });
}

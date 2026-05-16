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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoService = void 0;
const script_service_1 = require("./script.service");
const voice_service_1 = require("./voice.service");
const clip_service_1 = require("./clip.service");
const youtube_service_1 = require("./youtube.service");
const videoProcessing_1 = require("./videoProcessing");
const jobStore_1 = require("../lib/jobStore");
const prisma_1 = require("../lib/prisma");
const workspace_1 = require("../lib/workspace");
const storage_keys_1 = require("../lib/storage-keys");
const storage_service_1 = require("./storage.service");
const processManualScript_1 = require("./processManualScript");
const facebook_service_1 = require("./facebook.service");
const generateVideoService = (_a) => __awaiter(void 0, [_a], void 0, function* ({ niche, context, settings, actionMode, jobId, platforms, userId, scriptMode, script }) {
    var _b;
    console.log(scriptMode, niche, script);
    const workDir = yield (0, workspace_1.createWorkspace)(jobId);
    try {
        (0, jobStore_1.updateStep)(jobId, "script-generated", { status: "running" });
        const totalSteps = 4 + Number((_b = platforms === null || platforms === void 0 ? void 0 : platforms.length) !== null && _b !== void 0 ? _b : 0);
        const progressPerStep = 100 / totalSteps;
        let progress = 0;
        const scriptData = scriptMode === "ai" ? yield (0, script_service_1.generateScript)(niche, context, settings.language, settings.langaugeInstructions, settings.duration, settings.voice.voiceProvider) : yield (0, processManualScript_1.processManualScript)(script, settings.duration, settings.language, settings.voice.voiceProvider);
        (0, jobStore_1.updateStep)(jobId, "script-generated", { status: "completed", duration: "0.8s" });
        progress += progressPerStep;
        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress), title: scriptData.title });
        (0, jobStore_1.updateStep)(jobId, "voice-generated", { status: "running" });
        //generate voice
        const { audioPath, sceneDurations } = yield (0, voice_service_1.generateVoice)(scriptData, settings, workDir);
        (0, jobStore_1.updateStep)(jobId, "voice-generated", { status: "completed", duration: "2.1s" });
        progress += progressPerStep;
        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress) });
        (0, jobStore_1.updateStep)(jobId, "clips-fetched", { status: "running" });
        //fetch clips
        const clipPaths = yield (0, clip_service_1.fetchClipsForScenes)(scriptData.scenes, workDir);
        (0, jobStore_1.updateStep)(jobId, "clips-fetched", { status: "completed", duration: "4.3s" });
        progress += progressPerStep;
        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress) });
        (0, jobStore_1.updateStep)(jobId, "video-stitched", { status: "running" });
        //create video
        const { videoPath: finalVideoPath, thumbnailPath } = yield (0, videoProcessing_1.createVideo)(scriptData.scenes, clipPaths, niche, settings.voice.voiceSpeed, workDir, audioPath, sceneDurations);
        (0, jobStore_1.updateStep)(jobId, "video-stitched", { status: "completed", duration: "12s" });
        progress += progressPerStep;
        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress) });
        const videoKey = storage_keys_1.storageKeys.finalVideo(userId, jobId);
        yield storage_service_1.storage.uploadFile(finalVideoPath, videoKey, "video/mp4");
        const thumbnailKey = storage_keys_1.storageKeys.thumbnail(userId, jobId);
        yield storage_service_1.storage.uploadFile(thumbnailPath, thumbnailKey, "image/jpeg");
        let youtubeUrl = null;
        let facebookUrl = null;
        if (actionMode === "upload") {
            for (const p of platforms || []) {
                let stepId = p;
                (0, jobStore_1.updateStep)(jobId, stepId, { status: "running" });
                try {
                    if (p === "youtube") {
                        (0, jobStore_1.updateStep)(jobId, "upload to youtube", { status: "running" });
                        youtubeUrl = yield (0, youtube_service_1.uploadToYouTube)(scriptData, finalVideoPath, userId);
                        (0, jobStore_1.updateStep)(jobId, "upload to youtube", { status: "completed", duration: '30s' });
                        progress += progressPerStep;
                        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress) });
                    }
                    if (p === "instagram") {
                        console.log("uploaded to instagram");
                        progress += progressPerStep;
                        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress) });
                    }
                    if (p === "facebook") {
                        (0, jobStore_1.updateStep)(jobId, "upload to facebook", { status: "running" });
                        facebookUrl = yield (0, facebook_service_1.uploadReelToFacebook)(scriptData, finalVideoPath, userId);
                        progress += progressPerStep;
                        (0, jobStore_1.updateJob)(jobId, { progress: Math.round(progress) });
                        (0, jobStore_1.updateStep)(jobId, "upload to youtube", { status: "running", duration: "40s" });
                        console.log("uploaded to facebook");
                    }
                    (0, jobStore_1.updateStep)(jobId, stepId, {
                        status: "completed",
                        duration: "8s",
                    });
                }
                catch (err) {
                    console.log("error in updaing job");
                    (0, jobStore_1.updateStep)(jobId, stepId, {
                        status: "failed",
                    });
                }
            }
        }
        yield prisma_1.prisma.job.update({
            where: {
                id: jobId
            },
            data: {
                status: "COMPLETED",
            }
        });
        yield prisma_1.prisma.video.create({
            data: {
                title: scriptData.title,
                status: "COMPLETED",
                userId: userId,
                videoUrl: youtubeUrl,
                jobId: jobId,
                videoKey: videoKey,
                thumbnailKey: thumbnailKey,
            }
        });
        (0, jobStore_1.updateJob)(jobId, {
            status: "COMPLETED",
            progress: 100,
            result: {
                videoUrl: "http://localhost:3000/output.mp4",
                youtubeUrl
            }
        });
        return { jobId };
    }
    catch (error) {
        console.log(error);
    }
    finally {
        yield (0, workspace_1.cleanupWorkspace)(workDir);
    }
});
exports.generateVideoService = generateVideoService;

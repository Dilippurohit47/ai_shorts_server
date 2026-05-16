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
exports.getVideoPlaybackUrl = exports.getRecentVideos = exports.generateVideoController = void 0;
const video_service_1 = require("../services/video.service");
const uuid_1 = require("uuid");
const jobStore_1 = require("../lib/jobStore");
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const storage_service_1 = require("../services/storage.service");
const generateVideoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const jobId = (0, uuid_1.v4)();
    try {
        const { niche, actionMode, context, settings, platforms, script, scriptMode } = req.body;
        console.log(req.body);
        let user = req.user;
        if (!user) {
            return (0, response_1.sendError)(res, 403, "Bad Request");
        }
        const currentUser = yield prisma_1.prisma.user.findUnique({
            where: { id: user.id },
            select: { credits: true }
        });
        if (!currentUser || currentUser.credits < 1) {
            return (0, response_1.sendError)(res, 403, "Insufficient credits");
        }
        yield prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { credits: { decrement: 1 } }
        });
        (0, jobStore_1.createJob)({ jobId, niche, actionMode, context, settings, platforms });
        yield prisma_1.prisma.job.create({
            data: {
                id: jobId,
                userId: user === null || user === void 0 ? void 0 : user.id,
                jobId,
                actionMode,
                errorMessage: null,
                niche,
                context,
                settings,
                platforms,
                status: "PROCESSING",
                script,
                scriptMode,
            }
        });
        let job = (0, jobStore_1.getJob)(jobId);
        res.status(200).json(job);
        yield (0, video_service_1.generateVideoService)({
            niche,
            actionMode,
            context,
            settings,
            jobId,
            platforms,
            userId: user === null || user === void 0 ? void 0 : user.id,
            scriptMode,
            script
        });
    }
    catch (err) {
        console.log(err);
        yield prisma_1.prisma.job.update({
            where: {
                id: jobId
            },
            data: {
                status: "FAILED"
            }
        });
        if (!res.headersSent) {
            res.status(500).json({ error: err.message || "Something went wrong" });
        }
    }
});
exports.generateVideoController = generateVideoController;
const getRecentVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return (0, response_1.sendError)(res, 403, "Unauthorized");
        const limit = Math.min(Number(req.query.limit) || 10, 50);
        const videos = yield prisma_1.prisma.video.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                status: true,
                thumbnailUrl: true,
                createdAt: true,
                videoKey: true,
                videoUrl: true,
                thumbnailKey: true,
                job: {
                    select: { platforms: true, niche: true },
                },
            },
            orderBy: { createdAt: "desc" },
            // take: limit,
        });
        const normalizedVideos = videos.map((video) => {
            var _a, _b;
            let thumbnailUrl = null;
            if (video.thumbnailKey) {
                thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${video.thumbnailKey}`;
            }
            return {
                id: video.id,
                title: video.title,
                thumbnailUrl: thumbnailUrl,
                createdAt: video.createdAt,
                status: video.status.toLowerCase(),
                platforms: ((_b = (_a = video.job) === null || _a === void 0 ? void 0 : _a.platforms) !== null && _b !== void 0 ? _b : []).map((p) => p.toLowerCase()),
                videoKey: video.videoKey,
                youtubeUrl: video.videoUrl,
                niche: video.job.niche || null,
            };
        });
        res.status(200).json(normalizedVideos);
    }
    catch (error) {
        console.log(error);
        (0, response_1.sendError)(res, 500, "Internal server error");
    }
});
exports.getRecentVideos = getRecentVideos;
const getVideoPlaybackUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return (0, response_1.sendError)(res, 403, "Unauthorized");
        const { id } = req.params;
        const video = yield prisma_1.prisma.video.findUnique({
            where: { id },
            select: {
                userId: true,
                videoKey: true,
            },
        });
        if (!video)
            return (0, response_1.sendError)(res, 404, "Video not found");
        if (video.userId !== userId)
            return (0, response_1.sendError)(res, 403, "Forbidden");
        if (!video.videoKey)
            return (0, response_1.sendError)(res, 404, "Video file not available");
        const url = yield storage_service_1.storage.getPresignedUrl(video.videoKey, 3600);
        res.status(200).json({ url });
    }
    catch (error) {
        console.log(error);
        (0, response_1.sendError)(res, 500, "Internal server error");
    }
});
exports.getVideoPlaybackUrl = getVideoPlaybackUrl;

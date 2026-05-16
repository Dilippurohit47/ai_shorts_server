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
exports.getActiveJobs = exports.getJobStatus = void 0;
const response_1 = require("../utils/response");
const jobStore_1 = require("../lib/jobStore");
const prisma_1 = require("../lib/prisma");
const getJobStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const job = (0, jobStore_1.getJob)(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }
        return res.json({
            success: true,
            data: job
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, 500, "Internal server error", error);
    }
});
exports.getJobStatus = getJobStatus;
const getActiveJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return (0, response_1.sendError)(res, 403, "Unauthorized");
        const dbJobs = yield prisma_1.prisma.job.findMany({
            where: {
                userId,
                status: { in: ["PENDING", "PROCESSING", "FAILED", "COMPLETED"] },
            },
            include: {
                video: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });
        const activeJobs = dbJobs.map((job) => {
            var _a, _b, _c;
            const inMemory = (0, jobStore_1.getJob)(job.jobId);
            return {
                id: job.id,
                title: (_a = job.video) === null || _a === void 0 ? void 0 : _a.title,
                jobId: job.jobId,
                status: job.status,
                niche: job.niche,
                platforms: job.platforms,
                createdAt: job.createdAt,
                progress: (_b = inMemory === null || inMemory === void 0 ? void 0 : inMemory.progress) !== null && _b !== void 0 ? _b : 0,
                steps: (_c = inMemory === null || inMemory === void 0 ? void 0 : inMemory.steps) !== null && _c !== void 0 ? _c : null,
            };
        });
        res.status(200).json(activeJobs);
    }
    catch (error) {
        console.log(error);
        (0, response_1.sendError)(res, 500, "Internal server error");
    }
});
exports.getActiveJobs = getActiveJobs;

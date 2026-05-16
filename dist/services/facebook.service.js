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
exports.uploadReelToFacebook = uploadReelToFacebook;
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../lib/prisma");
const GRAPH = "https://graph.facebook.com/v21.0";
const RUPLOAD = "https://rupload.facebook.com/video-upload/v21.0";
function uploadReelToFacebook(scriptData, videoPath, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("📤 Uploading reel to FB...");
        try {
            const account = yield prisma_1.prisma.connectedAccount.findUnique({
                where: { userId_platform: { userId, platform: "FACEBOOK" } },
                select: { accountId: true, accessToken: true, }, // accountId = Page ID
            });
            if (!(account === null || account === void 0 ? void 0 : account.accountId))
                throw new Error("No FB Page linked for this user");
            const pageId = account.accountId;
            const pageToken = account.accessToken;
            const fileSize = fs_1.default.statSync(videoPath).size;
            console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
            // 3. START — initiate upload session
            console.log("🚀 Starting upload session...");
            const startRes = yield fetch(`${GRAPH}/${pageId}/video_reels?upload_phase=start&access_token=${pageToken}`, { method: "POST" });
            const startData = yield startRes.json();
            if (!startRes.ok)
                throw new Error(`Start failed: ${JSON.stringify(startData)}`);
            const videoId = startData.video_id;
            const fileBuffer = fs_1.default.readFileSync(videoPath);
            // 4. TRANSFER — stream the file bytes to the rupload host
            console.log("⬆️ Uploading bytes...");
            const transferRes = yield fetch(`${RUPLOAD}/${videoId}`, {
                method: "POST",
                headers: {
                    "Authorization": `OAuth ${pageToken}`,
                    "Content-Type": "application/octet-stream",
                    "Content-Length": fileSize.toString(),
                    "X-Entity-Length": fileSize.toString(),
                    "X-Entity-Name": videoId,
                    "offset": "0",
                },
                body: fileBuffer,
            });
            const transferData = yield transferRes.json();
            if (!transferRes.ok || !transferData.success) {
                throw new Error(`Transfer failed: ${JSON.stringify(transferData)}`);
            }
            // 5. FINISH — publish with title/description
            console.log("📢 Publishing...");
            const finishParams = new URLSearchParams({
                access_token: pageToken,
                video_id: videoId,
                upload_phase: "finish",
                video_state: "PUBLISHED", // or "SCHEDULED" / "DRAFT"
                description: `${scriptData.title}\n\n${scriptData.description}`,
            });
            const finishRes = yield fetch(`${GRAPH}/${pageId}/video_reels?${finishParams.toString()}`, { method: "POST" });
            const finishData = yield finishRes.json();
            if (!finishRes.ok || !finishData.success) {
                throw new Error(`Finish failed: ${JSON.stringify(finishData)}`);
            }
            console.log("\n✅ Upload done!");
            console.log("✅ Uploaded reel:", videoId);
            return `https://www.facebook.com/reel/${videoId}`;
        }
        catch (error) {
            console.log(error);
        }
    });
}

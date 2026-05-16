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
exports.uploadToyt = exports.uploadToFb = void 0;
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../lib/prisma");
const path_1 = __importDefault(require("path"));
const google_token_1 = require("../lib/google-token");
const google_1 = require("../lib/google");
const googleapis_1 = require("googleapis");
const videoPath = path_1.default.join(__dirname, "..", "..", "..", "final.mp4");
const GRAPH = "https://graph.facebook.com/v21.0";
const RUPLOAD = "https://rupload.facebook.com/video-upload/v21.0";
function verifyPageAccess(userAccessToken, pageId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const response = yield fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`);
            const data = yield response.json();
            if (data.error) {
                throw new Error(`FB token error: ${data.error.message}`);
            }
            // Find the page the user still manages
            const page = (_a = data.data) === null || _a === void 0 ? void 0 : _a.find((p) => p.id === pageId);
            if (!page) {
                throw new Error(`User no longer manages Page ${pageId}. ` +
                    `Available pages: ${((_b = data.data) === null || _b === void 0 ? void 0 : _b.map((p) => p.id).join(', ')) || 'none'}`);
            }
            // Return the PAGE access token (not the user token!)
            return page.access_token;
        }
        catch (error) {
            console.log(error);
        }
    });
}
const uploadToFb = () => __awaiter(void 0, void 0, void 0, function* () {
    // return
    try {
        let userId = "cmo08mv4m00004zuvtizvhkvc";
        const account = yield prisma_1.prisma.connectedAccount.findUnique({
            where: { userId_platform: { userId, platform: "FACEBOOK" } },
            select: { accountId: true, accessToken: true }, // accountId = Page ID
        });
        if (!(account === null || account === void 0 ? void 0 : account.accountId))
            throw new Error("No FB Page linked for this user");
        const pageId = account.accountId;
        const pageToken = account.accessToken;
        const fileSize = fs_1.default.statSync(videoPath).size;
        console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log("🚀 Starting upload session...");
        const startRes = yield fetch(`${GRAPH}/${pageId}/video_reels?upload_phase=start&access_token=${pageToken}`, { method: "POST" });
        const startData = yield startRes.json();
        if (!startRes.ok)
            throw new Error(`Start failed: ${JSON.stringify(startData)}`);
        const videoId = startData.video_id;
        const fileBuffer = fs_1.default.readFileSync(videoPath);
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
        console.log("📢 Publishing...");
        const finishParams = new URLSearchParams({
            access_token: pageToken,
            video_id: videoId,
            upload_phase: "finish",
            video_state: "PUBLISHED",
            description: `How to drink water\n\n be bold`,
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
exports.uploadToFb = uploadToFb;
const uploadToyt = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let userId = "cmo08mv4m00004zuvtizvhkvc";
        const accessToken = yield (0, google_token_1.getValidAccessToken)(userId, "YOUTUBE");
        google_1.oauth2Client.setCredentials({ access_token: accessToken });
        const youtube = googleapis_1.google.youtube({ version: "v3", auth: google_1.oauth2Client });
        console.log("🚀 Starting upload...");
        const fileSize = fs_1.default.statSync(videoPath).size;
        console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
        const response = yield youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: "Pani limit me piya karo ",
                    description: "pani",
                    tags: "water",
                    categoryId: "22",
                },
                status: {
                    privacyStatus: "public",
                },
            },
            media: {
                body: fs_1.default.createReadStream(videoPath),
            },
        }, {
            onUploadProgress: (evt) => {
                const progress = (evt.bytesRead / fileSize) * 100;
                process.stdout.write(`⬆️ Upload progress: ${progress.toFixed(1)}%\r`);
            },
        });
        console.log("\n✅ Upload done!");
        const videoId = response.data.id;
        console.log("✅ Uploaded:", videoId);
        return `https://youtube.com/watch?v=${videoId}`;
    }
    catch (error) {
        console.log("❌ Upload error:", error);
        throw error;
    }
});
exports.uploadToyt = uploadToyt;

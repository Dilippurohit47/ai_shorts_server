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
exports.uploadToYouTube = uploadToYouTube;
const googleapis_1 = require("googleapis");
const fs_1 = __importDefault(require("fs"));
const google_1 = require("../lib/google");
const google_token_1 = require("../lib/google-token");
function uploadToYouTube(scriptData, videoPath, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("📤 Uploading video to YT...");
        try {
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
                        title: scriptData.title,
                        description: scriptData.description,
                        tags: scriptData.tags,
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
        }
    });
}

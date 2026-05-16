import { google } from "googleapis";
import { ScriptData } from "../types";
import fs from "fs";
import { oauth2Client } from "../lib/google";
import { getValidAccessToken } from "../lib/google-token";

export async function uploadToYouTube(
  scriptData: ScriptData,
  videoPath: string,
  userId:string,
) {
  console.log("📤 Uploading video to YT...");
  try {
    const accessToken = await getValidAccessToken(userId, "YOUTUBE")
oauth2Client.setCredentials({ access_token: accessToken })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    console.log("🚀 Starting upload...");

    const fileSize = fs.statSync(videoPath).size;
    console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    const response = await youtube.videos.insert(
      {
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
          body: fs.createReadStream(videoPath),
        },
      },
      {
        onUploadProgress: (evt) => {
          const progress = (evt.bytesRead / fileSize) * 100;
          process.stdout.write(`⬆️ Upload progress: ${progress.toFixed(1)}%\r`);
        },
      }
    );

    console.log("\n✅ Upload done!");
    const videoId = response.data.id!;
    console.log("✅ Uploaded:", videoId);
    return `https://youtube.com/watch?v=${videoId}`;
  } catch (error) {
    console.log("❌ Upload error:", error);
  }
}
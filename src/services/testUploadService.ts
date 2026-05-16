import fs from "fs"
import { prisma } from "../lib/prisma"
import path from "path"
import { getValidAccessToken } from "../lib/google-token"
import { oauth2Client } from "../lib/google"
import { google } from "googleapis"

const videoPath = path.join(__dirname,"..","..","..","final.mp4")
const GRAPH = "https://graph.facebook.com/v21.0"
const RUPLOAD = "https://rupload.facebook.com/video-upload/v21.0"


async function verifyPageAccess(userAccessToken: string, pageId: string): Promise<string> {
try {
        const response = await fetch(
        `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    );
    const data = await response.json();

    if (data.error) {
        throw new Error(`FB token error: ${data.error.message}`);
    }

    // Find the page the user still manages
    const page = data.data?.find((p: any) => p.id === pageId);

    if (!page) {
        throw new Error(
            `User no longer manages Page ${pageId}. ` +
            `Available pages: ${data.data?.map((p: any) => p.id).join(', ') || 'none'}`
        );
    }

    // Return the PAGE access token (not the user token!)
    return page.access_token;
} catch (error) {
    console.log(error)
}
} 


export const uploadToFb = async ()=>{
    // return
    try {
        let userId = "cmo08mv4m00004zuvtizvhkvc"
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId, platform: "FACEBOOK" } },
    select: { accountId: true ,accessToken:true }, // accountId = Page ID
  })


  if (!account?.accountId) throw new Error("No FB Page linked for this user")
  const pageId = account.accountId


  const pageToken: string = account.accessToken

  const fileSize = fs.statSync(videoPath).size
  console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)

  console.log("🚀 Starting upload session...")
  const startRes = await fetch(
    `${GRAPH}/${pageId}/video_reels?upload_phase=start&access_token=${pageToken}`, 
    { method: "POST" },
  )
  const startData = await startRes.json()
  if (!startRes.ok) throw new Error(`Start failed: ${JSON.stringify(startData)}`)
  const videoId: string = startData.video_id

const fileBuffer = fs.readFileSync(videoPath)

const transferRes = await fetch(`${RUPLOAD}/${videoId}`, {
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
})

const transferData = await transferRes.json()
if (!transferRes.ok || !transferData.success) {
    throw new Error(`Transfer failed: ${JSON.stringify(transferData)}`)
}
  console.log("📢 Publishing...")
  const finishParams = new URLSearchParams({
    access_token: pageToken,
    video_id: videoId,
    upload_phase: "finish",
    video_state: "PUBLISHED", 
    description: `How to drink water\n\n be bold`,
  })

  const finishRes = await fetch(
    `${GRAPH}/${pageId}/video_reels?${finishParams.toString()}`,
    { method: "POST" },
  )
  const finishData = await finishRes.json()
  if (!finishRes.ok || !finishData.success) {
    throw new Error(`Finish failed: ${JSON.stringify(finishData)}`)
  }

  console.log("\n✅ Upload done!")
  console.log("✅ Uploaded reel:", videoId)
  return `https://www.facebook.com/reel/${videoId}`
}catch(error){
    console.log(error)
}
}

export const uploadToyt = async()=>{
  try {
        let userId = "cmo08mv4m00004zuvtizvhkvc"

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
    throw error;
  }
}
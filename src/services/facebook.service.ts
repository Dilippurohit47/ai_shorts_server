import fs from "fs"
import { ScriptData } from "../types"
import { prisma } from "../lib/prisma"

const GRAPH = "https://graph.facebook.com/v21.0"
const RUPLOAD = "https://rupload.facebook.com/video-upload/v21.0"

export async function uploadReelToFacebook(
  scriptData: ScriptData,
  videoPath: string,
  userId: string,
 ) {
  console.log("📤 Uploading reel to FB...")

try {
    const account = await prisma.connectedAccount.findUnique({
    where: { userId_platform: { userId, platform: "FACEBOOK" } },
    select: { accountId: true , accessToken:true , }, // accountId = Page ID
  })
  if (!account?.accountId) throw new Error("No FB Page linked for this user")
  const pageId = account.accountId
  const pageToken: string = account.accessToken

  const fileSize = fs.statSync(videoPath).size
  console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)

  // 3. START — initiate upload session
  console.log("🚀 Starting upload session...")
  const startRes = await fetch(
    `${GRAPH}/${pageId}/video_reels?upload_phase=start&access_token=${pageToken}`,
    { method: "POST" },
  )
  const startData = await startRes.json()
  if (!startRes.ok) throw new Error(`Start failed: ${JSON.stringify(startData)}`)
  const videoId: string = startData.video_id

  const fileBuffer = fs.readFileSync(videoPath)
  
  // 4. TRANSFER — stream the file bytes to the rupload host
  console.log("⬆️ Uploading bytes...")
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

  // 5. FINISH — publish with title/description
  console.log("📢 Publishing...")
  const finishParams = new URLSearchParams({
    access_token: pageToken,
    video_id: videoId,
    upload_phase: "finish",
    video_state: "PUBLISHED", // or "SCHEDULED" / "DRAFT"
    description: `${scriptData.title}\n\n${scriptData.description}`,
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
} catch (error) {
 console.log(error) 
}
}
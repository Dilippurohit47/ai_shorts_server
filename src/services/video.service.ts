import { generateScript } from "./script.service";
import { generateVoice } from "./voice.service";
import { fetchClipsForScenes } from "./clip.service";

import { uploadToYouTube } from "./youtube.service";
import { createVideo } from "./videoProcessing";
import { updateJob, updateStep } from "../lib/jobStore";
import { prisma } from "../lib/prisma";
import { cleanupWorkspace, createWorkspace } from "../lib/workspace";
import { storageKeys } from "../lib/storage-keys";
import { storage } from "./storage.service";
import { processManualScript } from "./processManualScript";
import { uploadReelToFacebook } from "./facebook.service";

export const generateVideoService = async ({
  niche, context, settings, actionMode , jobId,platforms,
  userId,scriptMode , script
}: any) => {
console.log(scriptMode ,niche ,script)
   const workDir = await createWorkspace(jobId)  
  try {  
  updateStep(jobId, "script-generated", { status: "running" })

  const totalSteps  = 4  + Number(platforms?.length ?? 0)
  const progressPerStep=  100/totalSteps
let progress = 0;

  const scriptData =  scriptMode === "ai" ? await generateScript(niche, context, settings.language ,settings.langaugeInstructions , settings.duration,settings.voice.voiceProvider) : await processManualScript(script , settings.duration , settings.language  , settings.voice.voiceProvider)


  updateStep(jobId, "script-generated", { status: "completed", duration: "0.8s" })
  progress += progressPerStep
  updateJob(jobId, { progress: Math.round(progress) ,title:scriptData.title})
  updateStep(jobId, "voice-generated", { status: "running" })

//generate voice
  const {audioPath ,sceneDurations } = await generateVoice(scriptData, settings,workDir)
  updateStep(jobId, "voice-generated", { status: "completed", duration: "2.1s" })
  progress += progressPerStep
  updateJob(jobId, { progress: Math.round(progress)})
  updateStep(jobId, "clips-fetched", { status: "running" })


  //fetch clips
  const clipPaths = await fetchClipsForScenes(scriptData.scenes,workDir)
  updateStep(jobId,"clips-fetched", { status: "completed", duration: "4.3s" })
  progress += progressPerStep
  updateJob(jobId, { progress: Math.round(progress) })
  updateStep(jobId, "video-stitched", { status: "running" })


  //create video
const { videoPath: finalVideoPath, thumbnailPath } = await createVideo(scriptData.scenes, clipPaths, niche,settings.voice.voiceSpeed,workDir,audioPath , sceneDurations)
  updateStep(jobId, "video-stitched", { status: "completed", duration: "12s" })
  progress += progressPerStep
  updateJob(jobId, { progress: Math.round(progress) })


    const videoKey = storageKeys.finalVideo(userId, jobId);
    await storage.uploadFile(finalVideoPath, videoKey, "video/mp4");
    const thumbnailKey = storageKeys.thumbnail(userId , jobId)
    await storage.uploadFile(thumbnailPath, thumbnailKey, "image/jpeg");


  let youtubeUrl = null
  let facebookUrl = null
if (actionMode === "upload") {
  for (const p of platforms || []) {

    let stepId = p
    updateStep(jobId, stepId, { status: "running" })

    try {
      if (p === "youtube") {
  updateStep(jobId, "upload to youtube", { status: "running" })
        youtubeUrl = await uploadToYouTube(scriptData,finalVideoPath,userId)
  updateStep(jobId, "upload to youtube", { status: "completed" ,duration:'30s'})

  progress += progressPerStep
  updateJob(jobId, { progress: Math.round(progress) })
      }

      if (p === "instagram") {
        console.log("uploaded to instagram")
  progress += progressPerStep  
  updateJob(jobId, { progress: Math.round(progress) })
}
  
      if (p=== "facebook") {
  updateStep(jobId, "upload to facebook", { status: "running" })

        facebookUrl = await uploadReelToFacebook(scriptData,finalVideoPath,userId)
  progress += progressPerStep
  updateJob(jobId, { progress: Math.round(progress) })
  updateStep(jobId, "upload to youtube", { status: "running" ,duration:"40s" })

        console.log("uploaded to facebook")
      }

      updateStep(jobId,stepId , {
        status: "completed",
        duration: "8s",
      })
    } catch (err) {
      console.log("error in updaing job")
      updateStep(jobId,stepId , {
        status: "failed",
      })
    }
  }
}

  await prisma.job.update({
    where:{
      id:jobId
    }, 
      data:{ 
        status:"COMPLETED",
      }
    })

    await prisma.video.create({
      data:{
        title:scriptData.title,
        status:"COMPLETED",
userId:userId,
videoUrl:youtubeUrl,
jobId:jobId,
videoKey:videoKey,
thumbnailKey:thumbnailKey,
}
    })

  updateJob(jobId, {
    status: "COMPLETED",
    progress: 100,
    result: {
      videoUrl: "http://localhost:3000/output.mp4",
      youtubeUrl
    }
  })

  return { jobId }
  } catch (error) {
    console.log(error)
  } finally{
    await cleanupWorkspace(workDir)
  }
}
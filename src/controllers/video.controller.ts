import { Request, Response } from "express";
import { generateVideoService } from "../services/video.service";
import {v4 as uuid} from "uuid"  
import { createJob, getJob } from "../lib/jobStore"; 
import { prisma } from "../lib/prisma";
import { sendError } from "../utils/response";
import { storage } from "../services/storage.service";
 export const generateVideoController = async (req: Request, res: Response) => {
    const jobId = uuid()

  try {
    const { niche, actionMode, context, settings ,platforms  ,script ,scriptMode} = req.body;  
      console.log(req.body) 
      let user = req.user
      if(!user){
        return sendError(res,403,"Bad Request")
      }
         const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true }
    })

    if (!currentUser || currentUser.credits < 1) {
      return sendError(res, 403, "Insufficient credits")
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1 } }
    })


    createJob({ jobId, niche,actionMode ,context ,settings , platforms } )    
  await prisma.job.create({
      data:{
        id:jobId, 
        userId:user?.id, 
        jobId,
        actionMode,
        errorMessage:null,
        niche,
        context,
        settings,
        platforms,
        status:"PROCESSING",
        script,
        scriptMode,
      }
    })

    let job = getJob(jobId)


    res.status(200).json(job); 


     await generateVideoService({
      niche,
      actionMode,
      context,
      settings,
      jobId,
      platforms,
      userId:user?.id,
      scriptMode,
      script
    }); 


  } catch (err: any) {
    console.log(err)

       await prisma.job.update({
        where:{
          id:jobId
        },
    data:{
      status:"FAILED"
    }
    })
   if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Something went wrong" })
    }
  }
};

export const getRecentVideos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 403, "Unauthorized");

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const videos = await prisma.video.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        status: true,
        thumbnailUrl: true,
        createdAt: true,
        videoKey:true,
        videoUrl:true,
        thumbnailKey:true,
        job: {
          select: { platforms: true ,niche:true },
        },
      },
      orderBy: { createdAt: "desc" },
      // take: limit,
    });


    const normalizedVideos = videos.map((video) => {
       let thumbnailUrl  = null
      if(video.thumbnailKey){
 thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${video.thumbnailKey}`
      }
      return {
      id: video.id,
      title: video.title,
      thumbnailUrl: thumbnailUrl,
      createdAt: video.createdAt,
      status: video.status.toLowerCase(),
      platforms: (video.job?.platforms ?? []).map((p) => p.toLowerCase()),
      videoKey:video.videoKey,
      youtubeUrl:video.videoUrl ,
      niche:video.job.niche || null,
      }
    });

    res.status(200).json(normalizedVideos);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Internal server error");
  }
};



export const getVideoPlaybackUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 403, "Unauthorized");

    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        userId: true,
        videoKey: true,
      },
    });


    if (!video) return sendError(res, 404, "Video not found");
    if (video.userId !== userId) return sendError(res, 403, "Forbidden");
    if (!video.videoKey) return sendError(res, 404, "Video file not available");

    const url = await storage.getPresignedUrl(video.videoKey, 3600);

    res.status(200).json({ url });
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Internal server error");
  }
};
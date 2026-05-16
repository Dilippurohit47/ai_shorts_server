
 
import { Request ,Response } from "express"
import { sendError } from "../utils/response" 
import { getJob } from "../lib/jobStore"
import { prisma } from "../lib/prisma"

export const getJobStatus = async (req: Request, res: Response) => {
  try { 
    const { id } = req.params
    const job = getJob(id)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      })
    }

    return res.json({
      success: true,
      data: job
    })
  } catch (error) {
    sendError(res, 500, "Internal server error", error)
  }
}

export const getActiveJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 403, "Unauthorized");

    const dbJobs = await prisma.job.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "PROCESSING", "FAILED","COMPLETED"] },
      },
      include:{
        video:{
          select:{
            title:true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const activeJobs = dbJobs.map((job) => {
      const inMemory = getJob(job.jobId);

      return {
        id: job.id,
        title:job.video?.title,
        jobId: job.jobId,
        status: job.status,
        niche: job.niche,
        platforms: job.platforms,
        createdAt: job.createdAt,
        progress: inMemory?.progress ?? 0,
        steps: inMemory?.steps ?? null,
      };
    });

    res.status(200).json(activeJobs);
  } catch (error) {
    console.log(error);
    sendError(res, 500, "Internal server error");
  }
};
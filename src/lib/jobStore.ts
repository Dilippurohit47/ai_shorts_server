import { VideoSettings } from "../types";
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type StepStatus = "pending" | "failed" | "completed" | "running";
export interface JobStep {
  id:string,
  label: string;
  status: StepStatus;
  duration?: string; 
}
export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  niche: string;
  title:string,
  actionMode: "create" | "upload";
  context?: string;
  settings: VideoSettings;
  steps: JobStep[];
  result?: {
    videoUrl: string; 
    youtubeUrl?: string | null;
  };
  error?: string;          
  createdAt: string;
}
const jobStore = new Map<string, Job>();


export interface platforms {
      id: string,
    name: string;
  enabled:boolean;
  connected:boolean;
  availableInPlan:boolean
}



const baseSteps: JobStep[] = [
  { id: "script-generated", label: "Script generated", status: "pending" },
  { id: "voice-generated", label: "Voice generated", status: "pending" },
  { id: "clips-fetched", label: "Clips fetched", status: "pending" },
  { id: "video-stitched", label: "Video stitched", status: "pending" },
]
export function createJob(data: {
  niche: string;
  actionMode: "create" | "upload";
  context?: string;
  settings: VideoSettings;
  jobId: string;
  platforms:platforms[];
}): Job {
  const uploadSteps: JobStep[] =
  data.actionMode === "upload"
    ? data.platforms.map((p) => ({
          id:p.id,
          label: `Uploaded to ${p}`,
          status: "pending" as const,
        }))
    : []

const steps: JobStep[] = [...baseSteps, ...uploadSteps]
  const job: Job = {
    id: data.jobId,
    status: "PROCESSING",
    progress: 0,
    niche: data.niche,
    actionMode: data.actionMode,
    context: data.context,
    settings: data.settings,
    steps,
    createdAt: new Date().toISOString(),
    title:"generating..."
  };

  jobStore.set(data.jobId, job);
  return job;
}

export function getJob(jobId: string): Job | undefined {
  return jobStore.get(jobId);
}

export function updateJob(jobId: string, updates: Partial<Job>): void {
  const job = jobStore.get(jobId);
  if (!job) return;
  jobStore.set(jobId, { ...job, ...updates });
}

export function updateStep(
  jobId: string,
  stepId: string,
  updates: Partial<JobStep>
): void {
  const job = jobStore.get(jobId);
  if (!job) return;

  console.log("updating step ",jobId ,stepId ,updates)
  job.steps = job.steps.map((s)=>s.id === stepId ? {...s,...updates} : s)
  jobStore.set(jobId, job);
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.getJob = getJob;
exports.updateJob = updateJob;
exports.updateStep = updateStep;
const jobStore = new Map();
const baseSteps = [
    { id: "script-generated", label: "Script generated", status: "pending" },
    { id: "voice-generated", label: "Voice generated", status: "pending" },
    { id: "clips-fetched", label: "Clips fetched", status: "pending" },
    { id: "video-stitched", label: "Video stitched", status: "pending" },
];
function createJob(data) {
    const uploadSteps = data.actionMode === "upload"
        ? data.platforms.map((p) => ({
            id: p.id,
            label: `Uploaded to ${p}`,
            status: "pending",
        }))
        : [];
    const steps = [...baseSteps, ...uploadSteps];
    const job = {
        id: data.jobId,
        status: "PROCESSING",
        progress: 0,
        niche: data.niche,
        actionMode: data.actionMode,
        context: data.context,
        settings: data.settings,
        steps,
        createdAt: new Date().toISOString(),
        title: "generating..."
    };
    jobStore.set(data.jobId, job);
    return job;
}
function getJob(jobId) {
    return jobStore.get(jobId);
}
function updateJob(jobId, updates) {
    const job = jobStore.get(jobId);
    if (!job)
        return;
    jobStore.set(jobId, Object.assign(Object.assign({}, job), updates));
}
function updateStep(jobId, stepId, updates) {
    const job = jobStore.get(jobId);
    if (!job)
        return;
    console.log("updating step ", jobId, stepId, updates);
    job.steps = job.steps.map((s) => s.id === stepId ? Object.assign(Object.assign({}, s), updates) : s);
    jobStore.set(jobId, job);
}

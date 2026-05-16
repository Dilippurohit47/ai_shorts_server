import path from "path"
import os from "os"
import { mkdir, rm } from "fs/promises"
import { randomUUID } from "crypto"

export async function createWorkspace(jobId: string) {
  const workDir = path.join(os.tmpdir(), `ytauto-${jobId}-${randomUUID().slice(0, 8)}`)
  await mkdir(workDir, { recursive: true })
  return workDir
}

export async function cleanupWorkspace(workDir: string) {
  await rm(workDir, { recursive: true, force: true })
}
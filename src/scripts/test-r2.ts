import { storage } from "../services/storage.service"
import { writeFileSync, unlinkSync } from "fs"
import path from "path"
import os from "os"
 
async function main() {
  const tmpPath = path.join(os.tmpdir(), "hello.txt")
  writeFileSync(tmpPath, "Hello R2")

  console.log("→ Uploading...")
  await storage.uploadFile(tmpPath, "test/hello.txt", "text/plain")
  console.log("✅ Upload worked")

  console.log("→ Checking existence...") 
  const exists = await storage.exists("test/hello.txt")
  console.log("✅ Exists:", exists)

  console.log("→ Generating presigned URL...")
  const url = await storage.getPresignedUrl("test/hello.txt", 300)
  console.log("✅ Presigned URL (valid 5 min):")
  console.log(url)

  console.log("→ Deleting...")
  await storage.deleteFile("test/hello.txt")
  console.log("✅ Delete worked")

  unlinkSync(tmpPath)
  console.log("\n🎉 All R2 operations working.")
}

main().catch((err) => {
  console.error("❌ Test failed:", err)
  process.exit(1)
})
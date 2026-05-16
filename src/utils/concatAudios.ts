
import path from "path"
import fs from "fs"
import { exec } from "child_process";
export async function concatAudios(audioPaths: string[], workDir: string): Promise<string> {
  const concatListPath = path.join(workDir, "audio_concat.txt");
  const concatList = audioPaths
    .map((p) => `file '${p.replace(/\\/g, "/")}'`)
    .join("\n");
  fs.writeFileSync(concatListPath, concatList);

  const finalPath = path.join(workDir, "audio.mp3");

  await new Promise<void>((resolve, reject) => {
    exec(
      `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:a libmp3lame -b:a 192k "${finalPath}"`,
      (err, _, stderr) => {
        if (err) { console.error("❌ Audio concat failed:", stderr); return reject(err); }
        resolve();
      }
    );
  });

  return finalPath;
}
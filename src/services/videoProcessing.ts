import { exec } from "child_process";
import { Scene } from "../types";
import { downloadBgMusic } from "./bgService";
import { generateASS } from "./captionService";
import { getAudioDuration } from "./duration.service";
import fs from "fs";
import path from "path";


export async function createVideo(
  scenes: Scene[],
  clipPaths: string[],
  niche: string,
  voiceSpeed: number,
  workDir: string,
  audioPath: string,
   sceneDurations: number[]   
): Promise<{ videoPath: string; thumbnailPath: string }> {
  const duration = await getAudioDuration(audioPath);
  console.log("🎯 Total audio duration:", duration);

  // generate ASS captions (supports colored words)
  const ass = generateASS(scenes ,sceneDurations);
  const captionsPath = path.join(workDir, "captions.ass");
  fs.writeFileSync(captionsPath, ass);
  console.log("✅ Captions file generated");

  // download bg music (into workDir)
  const bgMusicPath = await downloadBgMusic(niche, workDir);
  console.log("✅ BG Music downloaded");

  const trimmedPaths: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const src = clipPaths[i];
    const trimmed = path.join(workDir, `trimmed_${i}.mp4`);

    if (!src || !fs.existsSync(src)) {
      await new Promise<void>((resolve, reject) => {
        exec(
          `ffmpeg -y -f lavfi -i color=c=black:s=1080x1920:r=30 \
          -t ${scenes[i].duration} \
          -c:v libx264 -pix_fmt yuv420p -r 30 "${trimmed}"`,
          (err, _, stderr) => {
            if (err) { console.error(`❌ Fallback clip ${i} failed:`, stderr); return reject(err); }
            console.log(`✅ Fallback black clip ${i} created`);
            resolve();
          }
        );
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${src}" -t ${scenes[i].duration} \
          -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30" \
          -c:v libx264 -preset fast -pix_fmt yuv420p \
          -r 30 -an "${trimmed}"`,
          (err, _, stderr) => {
            if (err) { console.error(`❌ Trim clip ${i} failed:`, stderr); return reject(err); }
            console.log(`✅ Trimmed clip ${i}`);
            resolve();
          }
        );
      });
    }

    const exists = fs.existsSync(trimmed);
    const size = exists ? fs.statSync(trimmed).size : 0;
    console.log(`📁 Trimmed ${i}: exists=${exists} | size=${size} bytes`);
    trimmedPaths.push(trimmed);
  }

  const concatListPath = path.join(workDir, "clips.txt");
  const concatList = trimmedPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(concatListPath, concatList);
  console.log("📋 Concat list:\n", concatList);

  const assPathForFilter = captionsPath
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):\//, "$1\\:/");

  const outputPath = path.join(workDir, "output.mp4");

  // Stitch final video
  await new Promise<void>((resolve, reject) => {
    const command = `ffmpeg -y \
      -f concat -safe 0 -i "${concatListPath}" \
      -i "${audioPath}" \
      -i "${bgMusicPath}" \
      -t ${duration} \
      -filter_complex "[0:v]fps=30,setsar=1,ass='${assPathForFilter}'[v];[1:a]volume=1.0[voice];[2:a]volume=0.22,afade=t=in:st=0:d=2,afade=t=out:st=${duration - 2}:d=2[music];[voice][music]amix=inputs=2:duration=first[a]" \
      -map "[v]" -map "[a]" \
      -c:v libx264 -preset fast -pix_fmt yuv420p \
      -c:a aac -b:a 192k \
      "${outputPath}"`;

    exec(command, (error, _, stderr) => {
      console.log("FFMPEG LOG:\n", stderr);
      if (error) return reject(error);
      console.log("✅ Final video with captions + bg music created");
      resolve();
    });
  });

  // Extract thumbnail from middle of scene 1
  const thumbnailTimestamp = scenes[0].duration / 2;
  const thumbnailPath = path.join(workDir, "thumbnail.jpg");

  await new Promise<void>((resolve, reject) => {
    const command = `ffmpeg -y -ss ${thumbnailTimestamp} -i "${outputPath}" -vframes 1 -vf "scale=1080:1920" -q:v 2 "${thumbnailPath}"`;

    exec(command, (error, _, stderr) => {
      if (error) { console.error("❌ Thumbnail extraction failed:", stderr); return reject(error); }
      console.log("✅ Thumbnail extracted:", thumbnailPath);
      resolve();
    });
  });

  return { videoPath: outputPath, thumbnailPath };
}
import path from "path";                                          // ← NEW import
import { Scene } from "../types";
import { isClipRelevant } from "./aiVision.service";
import { downloadFile } from "./dowload.service";

const sleep = (ms: number) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res("");
    }, ms);
  });
};

export async function fetchClipsForScenes(
  scenes: Scene[],
  workDir: string                                                 // ← NEW parameter
): Promise<string[]> {
  const clipPaths: string[] = [];
  const usedVideoIds = new Set<number>();

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`🎬 Fetching clip for scene ${i + 1}: "${scene.keyword}"`);

    if (i > 0) await sleep(1500);

    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(scene.keyword)}&per_page=15&orientation=portrait&size=medium`,
      { headers: { Authorization: process.env.PEXELS_API_KEY! } }
    );

    console.log("Pexels status:", res.status);
    const data: any = await res.json();

    const validVideos = data.videos?.filter((v: any) =>
      v.duration >= scene.duration &&
      v.height > v.width
    );

    console.log(`Found ${validVideos?.length || 0} valid portrait clips for "${scene.keyword}"`);

    // 👇 AI vision check — loop through until GPT approves one
    let selectedVideo = null;
    for (const v of validVideos || []) {
      if (usedVideoIds.has(v.id)) continue;
      const isGood = await isClipRelevant(v.image, scene.keyword);
      if (isGood) {
        selectedVideo = v;
        break;
      }
      console.log(`⏭️ Skipping video ${v.id} — not relevant`);
    }

    if (!selectedVideo) {
      // retry with simpler keyword
      console.warn(`⚠️ No AI-approved clip for "${scene.keyword}", retrying...`);
      await sleep(1500);

      const keyword = scene.keyword.split(" ").slice(0, 2).join(" ");
      const retry = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=15&orientation=portrait`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! } }
      );
      const retryData: any = await retry.json();

      // 👇 AI check on retry results too
      for (const v of retryData.videos || []) {
        if (usedVideoIds.has(v.id)) continue;
        if (v.duration < scene.duration) continue;
        const isGood = await isClipRelevant(v.image, scene.keyword);
        if (isGood) {
          selectedVideo = v;
          break;
        }
      }

      if (!selectedVideo) {
        console.warn(`⚠️ Retry also failed, using fallback black screen`);
        clipPaths.push("");
        continue;
      }
    }

    usedVideoIds.add(selectedVideo.id);
    console.log(`🎥 Video ID: ${selectedVideo.id} | ${selectedVideo.width}x${selectedVideo.height} | ${selectedVideo.duration}s`);

    const file =
      selectedVideo.video_files.find((f: any) => f.quality === "hd" && f.height >= 1080) ||
      selectedVideo.video_files.find((f: any) => f.quality === "hd") ||
      selectedVideo.video_files[0];

    console.log(`📹 File quality: ${file.quality} | ${file.width}x${file.height}`);

    const clipPath = path.join(workDir, `clip_${i}.mp4`);         // ← CHANGED line
    await downloadFile(file.link, clipPath);
    console.log(`✅ Downloaded clip ${i + 1}`);
    clipPaths.push(clipPath);
  }

  return clipPaths;
}
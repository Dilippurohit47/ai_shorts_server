import path from "path";
import { downloadFile } from "./dowload.service";

export async function downloadBgMusic(
  niche: string,
  workDir: string
): Promise<string> {
  // use pre-selected free background music URLs from mixkit (no API needed)
  const musicMap: Record<string, string> = {
    motivational: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    energetic: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749a911.mp3",
    inspiring: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3",
    corporate: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_5b31e8d2d3.mp3",
    epic: "https://cdn.pixabay.com/download/audio/2022/05/13/audio_7b28c3a960.mp3",
    happy: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_2dde668d05.mp3",
    electronic: "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3",
  };

  const moodMap: Record<string, string> = {
    health: "motivational",
    fitness: "energetic",
    psychology: "inspiring",
    finance: "corporate",
    motivation: "epic",
    food: "happy",
    tech: "electronic",
  };

  const mood = moodMap[niche.toLowerCase()] || "motivational";
  const audioUrl = musicMap[mood];

  const bgMusicPath = path.join(workDir, "bgmusic.mp3");

  console.log(`🎵 Downloading bg music for mood: ${mood}`);
  await downloadFile(audioUrl, bgMusicPath);
  console.log("✅ BG Music downloaded");
  return bgMusicPath;
}
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { ScriptData, VideoSettings } from "../types";
import { openai } from "../lib/openApi";
import { getAudioDuration } from "./duration.service";

import  {concatAudios} from "../utils/concatAudios"
// ─── Constants ────────────────────────────────────────────

export const VOICE_PROVIDERS = {
  sarvam: {
    name: "Sarvam AI",
    model: "bulbul:v3",
    male: ["ashutosh", "aditya", "rahul", "rohan", "amit", "dev", "ratan", 
           "varun", "manan", "sumit", "kabir", "aayan", "ashutosh", "advait"],
    female: ["ritu", "priya", "neha", "pooja", "simran", "kavya", 
             "ishita", "shreya", "roopa", "amelia", "sophia"],
    languages: {
      hindi:    "hi-IN",
      hinglish: "hi-IN",
      english:  "en-IN",
      bengali:  "bn-IN",
      tamil:    "ta-IN",
      telugu:   "te-IN",
      gujarati: "gu-IN",
      kannada:  "kn-IN",
      marathi:  "mr-IN",
      punjabi:  "pa-IN",
    }
  },
  openai: {
    name: "OpenAI TTS",
    model: "gpt-4o-mini-tts",
    voices: ["nova", "alloy", "echo", "fable", "onyx", "shimmer"],
  }
}


// voice.service.ts

export async function generateVoice(
  scriptData: ScriptData,
  settings: VideoSettings,
  workDir: string
): Promise<{ audioPath: string; sceneDurations: number[] }> {
  if (settings.voice.voiceProvider === "sarvam") {
    return await generateSarvamVoice(scriptData, settings, workDir);
  } else {
    return await generateOpenAIVoice(scriptData, settings, workDir);
  }
}


async function generateSarvamVoice(
  scriptData: ScriptData,
  settings: VideoSettings,
  workDir: string
): Promise<{ audioPath: string; sceneDurations: number[] }> {
  const langCode = VOICE_PROVIDERS.sarvam.languages[
    settings.language as keyof typeof VOICE_PROVIDERS.sarvam.languages 
  ] ?? "hi-IN";

  const sceneAudioPaths: string[] = [];
  const sceneDurations: number[] = [];

  for (let i = 0; i < scriptData.scenes.length; i++) {
    const scene = scriptData.scenes[i];

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [scene.narration],
        target_language_code: langCode,
        speaker: settings.voice.voiceCharacter?.toLowerCase() ?? "shubh",
        pace: settings.voice.voiceSpeed ?? 1.15,
        model: "bulbul:v3",
        enable_preprocessing: true,
      }),
    });

    const data = await response.json();
    if (!data.audios?.[0]) throw new Error(`Sarvam TTS failed for scene ${i}: ${JSON.stringify(data)}`);

  const scenePath = path.join(workDir, `scene_${i}.wav`);  // ← .wav not .mp3
    fs.writeFileSync(scenePath, Buffer.from(data.audios[0], "base64"));

    const duration = await getAudioDuration(scenePath);
    sceneAudioPaths.push(scenePath);
    sceneDurations.push(duration);

    console.log(`✅ Scene ${i} audio: ${duration.toFixed(2)}s`);
  }

  const finalAudioPath = await concatAudios(sceneAudioPaths, workDir);
  console.log("✅ Sarvam voice concatenated:", finalAudioPath);

  return { audioPath: finalAudioPath, sceneDurations };
}
async function generateOpenAIVoice(
  scriptData: ScriptData,
  settings: VideoSettings,
  workDir: string
): Promise<{ audioPath: string; sceneDurations: number[] }> {
  const sceneAudioPaths: string[] = [];
  const sceneDurations: number[] = [];

  for (let i = 0; i < scriptData.scenes.length; i++) {
    const scene = scriptData.scenes[i];

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "nova",
      input: scene.narration,
      instructions: `Speak in ${settings.language}. Sound natural and energetic like a YouTube creator.`,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1000) throw new Error(`OpenAI TTS failed for scene ${i}`);

    let scenePath = path.join(workDir, `scene_${i}.mp3`);

    // Apply speed if needed
    if (settings.voice.voiceSpeed && settings.voice.voiceSpeed !== 1.0) {
      const originalPath = path.join(workDir, `scene_${i}_original.mp3`);
      fs.writeFileSync(originalPath, buffer);

      await new Promise<void>((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${originalPath}" -filter:a "atempo=${settings.voice.voiceSpeed}" "${scenePath}"`,
          (err, _, stderr) => {
            if (err) { console.error(`❌ Speed up failed for scene ${i}:`, stderr); return reject(err); }
            resolve();
          }
        );
      });

      fs.unlinkSync(originalPath);
    } else {
      fs.writeFileSync(scenePath, buffer);
    }

    const duration = await getAudioDuration(scenePath);
    sceneAudioPaths.push(scenePath);
    sceneDurations.push(duration);

    console.log(`✅ Scene ${i} audio: ${duration.toFixed(2)}s`);
  }

  const finalAudioPath = await concatAudios(sceneAudioPaths, workDir);
  console.log("✅ OpenAI voice concatenated:", finalAudioPath);

  return { audioPath: finalAudioPath, sceneDurations };
}
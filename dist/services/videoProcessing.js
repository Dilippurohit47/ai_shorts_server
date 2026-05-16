"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVideo = createVideo;
const child_process_1 = require("child_process");
const bgService_1 = require("./bgService");
const captionService_1 = require("./captionService");
const duration_service_1 = require("./duration.service");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function createVideo(scenes, clipPaths, niche, voiceSpeed, workDir, audioPath, sceneDurations) {
    return __awaiter(this, void 0, void 0, function* () {
        const duration = yield (0, duration_service_1.getAudioDuration)(audioPath);
        console.log("🎯 Total audio duration:", duration);
        // generate ASS captions (supports colored words)
        const ass = (0, captionService_1.generateASS)(scenes, sceneDurations);
        const captionsPath = path_1.default.join(workDir, "captions.ass");
        fs_1.default.writeFileSync(captionsPath, ass);
        console.log("✅ Captions file generated");
        // download bg music (into workDir)
        const bgMusicPath = yield (0, bgService_1.downloadBgMusic)(niche, workDir);
        console.log("✅ BG Music downloaded");
        const trimmedPaths = [];
        for (let i = 0; i < scenes.length; i++) {
            const src = clipPaths[i];
            const trimmed = path_1.default.join(workDir, `trimmed_${i}.mp4`);
            if (!src || !fs_1.default.existsSync(src)) {
                yield new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(`ffmpeg -y -f lavfi -i color=c=black:s=1080x1920:r=30 \
          -t ${scenes[i].duration} \
          -c:v libx264 -pix_fmt yuv420p -r 30 "${trimmed}"`, (err, _, stderr) => {
                        if (err) {
                            console.error(`❌ Fallback clip ${i} failed:`, stderr);
                            return reject(err);
                        }
                        console.log(`✅ Fallback black clip ${i} created`);
                        resolve();
                    });
                });
            }
            else {
                yield new Promise((resolve, reject) => {
                    (0, child_process_1.exec)(`ffmpeg -y -i "${src}" -t ${scenes[i].duration} \
          -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30" \
          -c:v libx264 -preset ultrafast -threads 0 -pix_fmt yuv420p \
          -r 30 -an "${trimmed}"`, (err, _, stderr) => {
                        if (err) {
                            console.error(`❌ Trim clip ${i} failed:`, stderr);
                            return reject(err);
                        }
                        console.log(`✅ Trimmed clip ${i}`);
                        resolve();
                    });
                });
            }
            const exists = fs_1.default.existsSync(trimmed);
            const size = exists ? fs_1.default.statSync(trimmed).size : 0;
            console.log(`📁 Trimmed ${i}: exists=${exists} | size=${size} bytes`);
            trimmedPaths.push(trimmed);
        }
        const concatListPath = path_1.default.join(workDir, "clips.txt");
        const concatList = trimmedPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
        fs_1.default.writeFileSync(concatListPath, concatList);
        console.log("📋 Concat list:\n", concatList);
        const assPathForFilter = captionsPath
            .replace(/\\/g, "/")
            .replace(/^([A-Za-z]):\//, "$1\\:/");
        const outputPath = path_1.default.join(workDir, "output.mp4");
        // Stitch final video
        yield new Promise((resolve, reject) => {
            const command = `ffmpeg -y \
      -f concat -safe 0 -i "${concatListPath}" \
      -i "${audioPath}" \
      -i "${bgMusicPath}" \
      -t ${duration} \
      -filter_complex "[0:v]fps=30,setsar=1,ass='${assPathForFilter}'[v];[1:a]volume=1.0[voice];[2:a]volume=0.22,afade=t=in:st=0:d=2,afade=t=out:st=${duration - 2}:d=2[music];[voice][music]amix=inputs=2:duration=first[a]" \
      -map "[v]" -map "[a]" \
      -c:v libx264 -preset ultrafast -threads 0 -pix_fmt yuv420p \
      -c:a aac -b:a 192k \
      "${outputPath}"`;
            (0, child_process_1.exec)(command, (error, _, stderr) => {
                console.log("FFMPEG LOG:\n", stderr);
                if (error)
                    return reject(error);
                console.log("✅ Final video with captions + bg music created");
                resolve();
            });
        });
        // Extract thumbnail from middle of scene 1
        const thumbnailTimestamp = scenes[0].duration / 2;
        const thumbnailPath = path_1.default.join(workDir, "thumbnail.jpg");
        yield new Promise((resolve, reject) => {
            const command = `ffmpeg -y -ss ${thumbnailTimestamp} -i "${outputPath}" -vframes 1 -vf "scale=1080:1920" -q:v 2 "${thumbnailPath}"`;
            (0, child_process_1.exec)(command, (error, _, stderr) => {
                if (error) {
                    console.error("❌ Thumbnail extraction failed:", stderr);
                    return reject(error);
                }
                console.log("✅ Thumbnail extracted:", thumbnailPath);
                resolve();
            });
        });
        return { videoPath: outputPath, thumbnailPath };
    });
}

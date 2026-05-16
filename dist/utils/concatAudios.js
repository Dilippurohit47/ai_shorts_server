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
exports.concatAudios = concatAudios;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
function concatAudios(audioPaths, workDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const concatListPath = path_1.default.join(workDir, "audio_concat.txt");
        const concatList = audioPaths
            .map((p) => `file '${p.replace(/\\/g, "/")}'`)
            .join("\n");
        fs_1.default.writeFileSync(concatListPath, concatList);
        const finalPath = path_1.default.join(workDir, "audio.mp3");
        yield new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:a libmp3lame -b:a 192k "${finalPath}"`, (err, _, stderr) => {
                if (err) {
                    console.error("❌ Audio concat failed:", stderr);
                    return reject(err);
                }
                resolve();
            });
        });
        return finalPath;
    });
}

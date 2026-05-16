"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudioDuration = void 0;
const child_process_1 = require("child_process");
const getAudioDuration = (audioPath) => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`, (err, stdout) => {
            if (err)
                return reject(err);
            resolve(parseFloat(stdout));
        });
    });
};
exports.getAudioDuration = getAudioDuration;

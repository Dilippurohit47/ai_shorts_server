import { exec } from "child_process";

export const getAudioDuration = (audioPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    exec(
      `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      (err, stdout) => {
        if (err) return reject(err);
        resolve(parseFloat(stdout));
      }
    );
  });
};
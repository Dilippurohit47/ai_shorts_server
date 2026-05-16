import fs from "fs";
import https from "https";
import http from "http";

export async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        // handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          return downloadFile(response.headers.location!, dest)
            .then(resolve)
            .catch(reject);
        }
        response.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}
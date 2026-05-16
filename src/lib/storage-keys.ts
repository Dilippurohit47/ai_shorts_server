export const storageKeys = {
  finalVideo: (userId: string, jobId: string) =>
    `users/${userId}/videos/${jobId}/final.mp4`,

  thumbnail: (userId: string, jobId: string) =>
    `users/${userId}/videos/${jobId}/thumbnail.jpg`,

  clipCache: (hash: string) => `clips-cache/${hash}.mp4`,
}
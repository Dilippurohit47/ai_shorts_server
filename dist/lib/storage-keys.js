"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageKeys = void 0;
exports.storageKeys = {
    finalVideo: (userId, jobId) => `users/${userId}/videos/${jobId}/final.mp4`,
    thumbnail: (userId, jobId) => `users/${userId}/videos/${jobId}/thumbnail.jpg`,
    clipCache: (hash) => `clips-cache/${hash}.mp4`,
};

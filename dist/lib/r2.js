"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2_BUCKET = exports.r2 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("../config/env");
exports.r2 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: env_1.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: env_1.env.R2_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.R2_SECRET_ACCESS_KEY,
    },
});
exports.R2_BUCKET = env_1.env.R2_BUCKET;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
require("dotenv/config");
const envSchema = zod_1.z.object({
    R2_ACCOUNT_ID: zod_1.z.string().min(1),
    R2_ACCESS_KEY_ID: zod_1.z.string().min(1),
    R2_SECRET_ACCESS_KEY: zod_1.z.string().min(1),
    R2_BUCKET: zod_1.z.string().min(1),
    R2_ENDPOINT: zod_1.z.string().url(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;

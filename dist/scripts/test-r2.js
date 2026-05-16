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
const storage_service_1 = require("../services/storage.service");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const tmpPath = path_1.default.join(os_1.default.tmpdir(), "hello.txt");
        (0, fs_1.writeFileSync)(tmpPath, "Hello R2");
        console.log("→ Uploading...");
        yield storage_service_1.storage.uploadFile(tmpPath, "test/hello.txt", "text/plain");
        console.log("✅ Upload worked");
        console.log("→ Checking existence...");
        const exists = yield storage_service_1.storage.exists("test/hello.txt");
        console.log("✅ Exists:", exists);
        console.log("→ Generating presigned URL...");
        const url = yield storage_service_1.storage.getPresignedUrl("test/hello.txt", 300);
        console.log("✅ Presigned URL (valid 5 min):");
        console.log(url);
        console.log("→ Deleting...");
        yield storage_service_1.storage.deleteFile("test/hello.txt");
        console.log("✅ Delete worked");
        (0, fs_1.unlinkSync)(tmpPath);
        console.log("\n🎉 All R2 operations working.");
    });
}
main().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});

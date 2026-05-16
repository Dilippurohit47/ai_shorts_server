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
exports.createWorkspace = createWorkspace;
exports.cleanupWorkspace = cleanupWorkspace;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const promises_1 = require("fs/promises");
const crypto_1 = require("crypto");
function createWorkspace(jobId) {
    return __awaiter(this, void 0, void 0, function* () {
        const workDir = path_1.default.join(os_1.default.tmpdir(), `ytauto-${jobId}-${(0, crypto_1.randomUUID)().slice(0, 8)}`);
        yield (0, promises_1.mkdir)(workDir, { recursive: true });
        return workDir;
    });
}
function cleanupWorkspace(workDir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, promises_1.rm)(workDir, { recursive: true, force: true });
    });
}

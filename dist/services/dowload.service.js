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
exports.downloadFile = downloadFile;
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
function downloadFile(url, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const file = fs_1.default.createWriteStream(dest);
            const protocol = url.startsWith("https") ? https_1.default : http_1.default;
            protocol
                .get(url, (response) => {
                // handle redirects
                if (response.statusCode === 302 || response.statusCode === 301) {
                    file.close();
                    return downloadFile(response.headers.location, dest)
                        .then(resolve)
                        .catch(reject);
                }
                response.pipe(file);
                file.on("finish", () => file.close(() => resolve()));
            })
                .on("error", (err) => {
                fs_1.default.unlink(dest, () => { });
                reject(err);
            });
        });
    });
}

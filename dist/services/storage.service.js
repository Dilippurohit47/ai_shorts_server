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
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = require("fs");
const promises_1 = require("stream/promises");
const r2_1 = require("../lib/r2");
exports.storage = {
    uploadFile(localPath, key, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const upload = new lib_storage_1.Upload({
                client: r2_1.r2,
                params: {
                    Bucket: r2_1.R2_BUCKET,
                    Key: key,
                    Body: (0, fs_1.createReadStream)(localPath),
                    ContentType: contentType,
                },
            });
            yield upload.done();
            return key;
        });
    },
    downloadFile(key, localPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield r2_1.r2.send(new client_s3_1.GetObjectCommand({ Bucket: r2_1.R2_BUCKET, Key: key }));
            yield (0, promises_1.pipeline)(res.Body, (0, fs_1.createWriteStream)(localPath));
            return localPath;
        });
    },
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                yield r2_1.r2.send(new client_s3_1.HeadObjectCommand({ Bucket: r2_1.R2_BUCKET, Key: key }));
                return true;
            }
            catch (err) {
                if (err.name === "NotFound" || ((_a = err.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) === 404) {
                    return false;
                }
                throw err;
            }
        });
    },
    deleteFile(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield r2_1.r2.send(new client_s3_1.DeleteObjectCommand({ Bucket: r2_1.R2_BUCKET, Key: key }));
        });
    },
    getPresignedUrl(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, expiresInSeconds = 3600) {
            return (0, s3_request_presigner_1.getSignedUrl)(r2_1.r2, new client_s3_1.GetObjectCommand({ Bucket: r2_1.R2_BUCKET, Key: key }), { expiresIn: expiresInSeconds });
        });
    },
};

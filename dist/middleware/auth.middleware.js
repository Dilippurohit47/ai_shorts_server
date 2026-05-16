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
exports.authMiddleware = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return (0, response_1.sendError)(res, 401, "Not authenticated");
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return (0, response_1.sendError)(res, 401, "User not found");
        }
        req.user = user;
        next();
    }
    catch (error) {
        return (0, response_1.sendError)(res, 401, "Unauthorized");
    }
});
exports.authMiddleware = authMiddleware;

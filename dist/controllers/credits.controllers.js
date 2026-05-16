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
exports.getCredits = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const getCredits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req === null || req === void 0 ? void 0 : req.user.id;
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                credits: true,
                totalCredits: true,
                plan: true,
                planExpiresAt: true,
            },
        });
        return res.status(200).json(user);
    }
    catch (error) {
        console.log(error);
        (0, response_1.sendError)(res, 500, "Failed to fetch credits");
    }
});
exports.getCredits = getCredits;

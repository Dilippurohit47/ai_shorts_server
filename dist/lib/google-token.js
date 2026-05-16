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
exports.getValidAccessToken = getValidAccessToken;
const prisma_1 = require("./prisma");
const google_1 = require("./google");
/**
 * Returns a valid access token for the user's connected platform account.
 * Refreshes the token if it's expired. Marks account as disconnected if refresh fails.
 */
var Platform;
(function (Platform) {
    Platform[Platform["YOUTUBE"] = 0] = "YOUTUBE";
    Platform[Platform["INSTAGRAM"] = 1] = "INSTAGRAM";
    Platform[Platform["FACEBOOK"] = 2] = "FACEBOOK";
})(Platform || (Platform = {}));
function getValidAccessToken(userId, platform) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const account = yield prisma_1.prisma.connectedAccount.findFirst({
            where: { userId, platform, isConnected: true },
        });
        if (!account) {
            throw new Error(`No connected ${platform} account for user`);
        }
        // Is the access token still valid? (with 1 min buffer to avoid edge-of-expiry failures)
        const now = Date.now();
        const expiresAt = (_a = account === null || account === void 0 ? void 0 : account.expiresAt) === null || _a === void 0 ? void 0 : _a.getTime();
        const oneMinute = 60 * 1000;
        if (expiresAt - oneMinute > now) {
            return account.accessToken;
        }
        // Expired — refresh it
        try {
            google_1.oauth2Client.setCredentials({
                refresh_token: account.refreshToken,
            });
            const { credentials } = yield google_1.oauth2Client.refreshAccessToken();
            if (!credentials.access_token || !credentials.expiry_date) {
                throw new Error("Refresh returned incomplete credentials");
            }
            // Save the new access token + expiry back to DB
            const updated = yield prisma_1.prisma.connectedAccount.update({
                where: { id: account.id },
                data: {
                    accessToken: credentials.access_token,
                    expiresAt: new Date(credentials.expiry_date),
                },
            });
            return updated.accessToken;
        }
        catch (err) {
            console.error("Token refresh failed:", err.message);
            // Refresh token is dead — mark account as disconnected
            if ((_b = err.message) === null || _b === void 0 ? void 0 : _b.includes("invalid_grant")) {
                yield prisma_1.prisma.connectedAccount.update({
                    where: { id: account.id },
                    data: { isConnected: false },
                });
                throw new Error(`${platform} account needs reconnection`);
            }
            throw err;
        }
    });
}

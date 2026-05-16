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
exports.disconnectAccount = exports.facebookCallback = exports.getConnectedAccounts = exports.connectToFacebook = exports.youtubeCallback = exports.connectYoutube = void 0;
const googleapis_1 = require("googleapis");
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.YOUTUBE_REDIRECT_URI);
const connectYoutube = (req, res) => {
    const userId = req.query.userId;
    if (!userId)
        return (0, response_1.sendError)(res, 400, "userId required");
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
        ],
        state: userId,
    });
    res.redirect(url);
};
exports.connectYoutube = connectYoutube;
const youtubeCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { code, state: userId } = req.query;
        if (!code || !userId)
            return (0, response_1.sendError)(res, 400, "Missing code or userId");
        // exchange code for tokens
        const { tokens } = yield oauth2Client.getToken(code);
        const { access_token, refresh_token, expiry_date } = tokens;
        // get their YouTube channel info
        oauth2Client.setCredentials(tokens);
        const youtube = googleapis_1.google.youtube({ version: "v3", auth: oauth2Client });
        const channelRes = yield youtube.channels.list({
            part: ["snippet"],
            mine: true,
        });
        const channel = (_a = channelRes.data.items) === null || _a === void 0 ? void 0 : _a[0];
        // save to ConnectedAccount
        yield prisma_1.prisma.connectedAccount.upsert({
            where: {
                userId_platform: {
                    userId: userId,
                    platform: "YOUTUBE",
                }
            },
            update: {
                accessToken: access_token,
                refreshToken: refresh_token !== null && refresh_token !== void 0 ? refresh_token : undefined,
                expiresAt: expiry_date ? new Date(expiry_date) : null,
                accountName: (_c = (_b = channel === null || channel === void 0 ? void 0 : channel.snippet) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : null,
                accountId: (_d = channel === null || channel === void 0 ? void 0 : channel.id) !== null && _d !== void 0 ? _d : null,
            },
            create: {
                userId: userId,
                platform: "YOUTUBE",
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: expiry_date ? new Date(expiry_date) : null,
                accountName: (_f = (_e = channel === null || channel === void 0 ? void 0 : channel.snippet) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : null,
                accountId: (_g = channel === null || channel === void 0 ? void 0 : channel.id) !== null && _g !== void 0 ? _g : null,
            }
        });
        // redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=youtube`);
    }
    catch (error) {
        console.error(error);
        (0, response_1.sendError)(res, 500, "Failed to connect YouTube", error);
    }
});
exports.youtubeCallback = youtubeCallback;
const connectToFacebook = (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId)
            return (0, response_1.sendError)(res, 400, "userId required");
        const params = new URLSearchParams({
            client_id: process.env.FACEBOOK_APP_ID,
            redirect_uri: `${process.env.BASE_URL}/api/connected/facebook/callback`,
            state: userId,
            scope: [
                "pages_show_list",
                "pages_read_engagement",
                "pages_manage_posts",
                "business_management",
            ].join(","),
            response_type: "code",
        });
        const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
        return res.redirect(authUrl);
    }
    catch (error) {
        (0, response_1.sendError)(res, 500, "Failed to connect facebook", error);
    }
};
exports.connectToFacebook = connectToFacebook;
const getConnectedAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["x-user-id"];
        const accounts = yield prisma_1.prisma.connectedAccount.findMany({
            where: { userId },
            select: {
                id: true, // need this for the update
                platform: true,
                accountName: true,
                accountId: true,
                createdAt: true,
                expiresAt: true,
                refreshToken: true,
            },
        });
        const now = Date.now();
        const SKEW_MS = 60000;
        const normalized = yield Promise.all(accounts.map((acc) => __awaiter(void 0, void 0, void 0, function* () {
            const expiredAtMs = acc.expiresAt ? acc.expiresAt.getTime() : null;
            const isExpired = expiredAtMs !== null && expiredAtMs - SKEW_MS <= now;
            const canAutoRefresh = Boolean(acc.refreshToken);
            let status = !isExpired ? "connected" : canAutoRefresh ? "expired" : "needs_reconnect";
            let expiresAt = acc.expiresAt;
            // Only try to refresh YouTube tokens that are expired but have a refresh token
            if (status === "expired" && acc.platform === "YOUTUBE") {
                try {
                    const oauth2 = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
                    oauth2.setCredentials({ refresh_token: acc.refreshToken });
                    const { credentials } = yield oauth2.refreshAccessToken();
                    const newExpiresAt = credentials.expiry_date
                        ? new Date(credentials.expiry_date)
                        : null;
                    yield prisma_1.prisma.connectedAccount.update({
                        where: { id: acc.id },
                        data: Object.assign({ accessToken: credentials.access_token, expiresAt: newExpiresAt }, (credentials.refresh_token
                            ? { refreshToken: credentials.refresh_token }
                            : {})),
                    });
                    expiresAt = newExpiresAt;
                    status = "connected";
                }
                catch (err) {
                    // invalid_grant => user revoked, password changed, token too old, etc.
                    console.error(`Refresh failed for account ${acc.id}:`, err === null || err === void 0 ? void 0 : err.message);
                    status = "needs_reconnect";
                }
            }
            return {
                id: acc.platform.toLowerCase(),
                platform: acc.platform,
                accountName: acc.accountName,
                accountId: acc.accountId,
                createdAt: acc.createdAt,
                expiresAt,
                status,
                needsReconnect: status === "needs_reconnect",
            };
        })));
        return res.json({ accounts: normalized });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch accounts" });
    }
});
exports.getConnectedAccounts = getConnectedAccounts;
const facebookCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { code, state: userId, error: fbError, error_description } = req.query;
        if (fbError) {
            return (0, response_1.sendError)(res, 400, `Facebook auth failed: ${error_description !== null && error_description !== void 0 ? error_description : fbError}`);
        }
        if (!code || !userId)
            return (0, response_1.sendError)(res, 400, "Missing code or userId");
        const redirectUri = `${process.env.BASE_URL}/api/connected/facebook/callback`;
        const shortRes = yield fetch(`https://graph.facebook.com/v21.0/oauth/access_token?` +
            new URLSearchParams({
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: redirectUri,
                code: code,
            }));
        const shortData = yield shortRes.json();
        if (!shortRes.ok)
            return (0, response_1.sendError)(res, 400, "Token exchange failed", shortData);
        const longRes = yield fetch(`https://graph.facebook.com/v21.0/oauth/access_token?` +
            new URLSearchParams({
                grant_type: "fb_exchange_token",
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                fb_exchange_token: shortData.access_token,
            }));
        const longData = yield longRes.json();
        if (!longRes.ok)
            return (0, response_1.sendError)(res, 400, "Long-lived token exchange failed", longData);
        const userAccessToken = longData.access_token;
        const expiresIn = longData.expires_in;
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
        // ✅ Fetch pages the user manages
        const pagesRes = yield fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`);
        const pagesData = yield pagesRes.json();
        if (!pagesRes.ok)
            return (0, response_1.sendError)(res, 400, "Failed to fetch pages", pagesData);
        // ✅ Pick the first page (or you can let user choose later)
        const page = (_a = pagesData.data) === null || _a === void 0 ? void 0 : _a[0];
        if (!page)
            return (0, response_1.sendError)(res, 400, "No Facebook Pages found for this account");
        yield prisma_1.prisma.connectedAccount.upsert({
            where: {
                userId_platform: {
                    userId: userId,
                    platform: "FACEBOOK",
                },
            },
            update: {
                accessToken: page.access_token, // ✅ Page token (never expires)
                refreshToken: null,
                expiresAt,
                accountName: page.name, // ✅ Page name
                accountId: page.id, // ✅ Page ID
            },
            create: {
                userId: userId,
                platform: "FACEBOOK",
                accessToken: page.access_token, // ✅ Page token
                refreshToken: null,
                expiresAt,
                accountName: page.name, // ✅ Page name
                accountId: page.id, // ✅ Page ID
            },
        });
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=facebook`);
    }
    catch (error) {
        console.error(error);
        (0, response_1.sendError)(res, 500, "Failed to connect Facebook", error);
    }
});
exports.facebookCallback = facebookCallback;
const disconnectAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["x-user-id"];
        const { platform } = req.params;
        yield prisma_1.prisma.connectedAccount.delete({
            where: {
                userId_platform: {
                    userId,
                    platform: platform.toUpperCase(),
                }
            }
        });
        res.status(200).json({ message: "Account disconnected" });
    }
    catch (error) {
        (0, response_1.sendError)(res, 500, "Internal server error", error);
    }
});
exports.disconnectAccount = disconnectAccount;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2Client = void 0;
const googleapis_1 = require("googleapis");
exports.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, "http://localhost:3000/auth/callback");

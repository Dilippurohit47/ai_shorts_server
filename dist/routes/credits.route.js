"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const credits_controllers_1 = require("../controllers/credits.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const app = express_1.default.Router();
app.get("/", auth_middleware_1.authMiddleware, credits_controllers_1.getCredits);
exports.default = app;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const app = express_1.default.Router();
app.post("/google", auth_controller_1.signUp);
app.get("/me", auth_middleware_1.authMiddleware, auth_controller_1.getMe);
app.get("/user", auth_controller_1.getUser);
exports.default = app;

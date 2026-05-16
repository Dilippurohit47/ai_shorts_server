"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const job_controllers_1 = require("../controllers/job.controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const app = express_1.default.Router();
app.get("/active", auth_middleware_1.authMiddleware, job_controllers_1.getActiveJobs);
app.get("/:id", auth_middleware_1.authMiddleware, job_controllers_1.getJobStatus);
exports.default = app;

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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const video_route_1 = __importDefault(require("./routes/video.route"));
const job_route_1 = __importDefault(require("./routes/job.route"));
const voice_route_1 = __importDefault(require("./routes/voice.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const connected_route_1 = __importDefault(require("./routes/connected.route"));
const credits_route_1 = __importDefault(require("./routes/credits.route"));
const razorpay_route_1 = __importDefault(require("./routes/razorpay.route"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
const auth_middleware_1 = require("./middleware/auth.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, "..")));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:3000"],
    credentials: true
}));
app.get("/", (req, res) => {
    res.send(200);
});
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/video", video_route_1.default);
app.use("/api/job", job_route_1.default);
app.use("/api/voice", voice_route_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api/connected", connected_route_1.default);
app.use("/api/razorpay", razorpay_route_1.default);
app.use("/api/credits", credits_route_1.default);
app.use("/api/payments", auth_middleware_1.authMiddleware, payment_route_1.default);
function recoverStaleJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        const stuck = yield prisma_1.prisma.job.updateMany({
            where: { status: "PROCESSING" },
            data: {
                status: "FAILED",
            },
        });
        console.log(`🧹 Marked ${stuck.count} stale jobs as failed`);
    });
}
recoverStaleJobs();
exports.default = app;

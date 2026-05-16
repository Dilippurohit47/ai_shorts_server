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
exports.isClipRelevant = isClipRelevant;
const openApi_1 = require("../lib/openApi");
function isClipRelevant(thumbnailUrl, keyword) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            return true;
            const response = yield openApi_1.openai.chat.completions.create({
                model: "gpt-4o-mini",
                max_tokens: 10,
                messages: [{
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: { url: thumbnailUrl }
                            },
                            {
                                type: "text",
                                text: `Does this image visually match "${keyword}"? Reply only YES or NO.`
                            }
                        ]
                    }]
            });
            const answer = ((_a = response.choices[0].message.content) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase()) || "NO";
            console.log(`🤖 AI check for "${keyword}": ${answer}`);
            return answer.includes("YES");
        }
        catch (err) {
            console.warn("⚠️ Vision check failed, allowing clip");
            return true;
        }
    });
}

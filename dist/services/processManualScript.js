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
exports.processManualScript = processManualScript;
const openApi_1 = require("../lib/openApi");
// services/processManualScript.ts
function processManualScript(script, language, duration, voiceProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        const languageRules = voiceProvider === "sarvam" ? `
- narration must be in pure Hindi Devanagari script
- caption must be same sentence in Hinglish Roman script
` : `
- narration in Hinglish Roman script  
- caption is SAME as narration
`;
        const response = yield openApi_1.openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{
                    role: "user",
                    content: `
You are processing a USER-PROVIDED script for a ${duration}s YouTube Short.

DO NOT rewrite the script. DO NOT change the meaning, tone, or words significantly.
Your ONLY job:
1. Split the script into scenes (2–5 sec each)
2. Generate a cinematic stock footage keyword per scene
3. Format narration + caption per voice rules below
4. Create title, description, tags based on the script

USER'S SCRIPT:
"""
${script}
"""

RULES:
- Total duration MUST equal ${duration}s
- Scene durations can vary (2–5 sec), not all equal
- Keep user's words — only split, don't rewrite
${languageRules}

Return ONLY valid JSON:
{
  "title": "...",
  "description": "...",
  "tags": [...],
  "scenes": [{ "duration": number, "narration": "...", "caption": "...", "keyword": "..." }]
}`
                }],
        });
        const raw = response.choices[0].message.content || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
    });
}

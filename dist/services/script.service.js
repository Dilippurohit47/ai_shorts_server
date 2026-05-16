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
exports.generateScript = generateScript;
const openApi_1 = require("../lib/openApi");
function generateScript(niche, context, language, languageInstructions, duration, voiceProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        const getLanguageRules = () => {
            const lang = language.toLowerCase();
            if (lang === "hindi" || lang === "hinglish") {
                if (voiceProvider === "sarvam") {
                    return `
NARRATION RULES (what voice speaks):
- narration field must be in pure Hindi Devanagari script ONLY
- Example: "क्या तुम जानते हो यह राज़?"
- Sarvam reads Devanagari perfectly — use it

CAPTION RULES (what shows on screen):
- caption field must be same sentence in Hinglish Roman script
- Example: "Kya tum jaante ho yeh raaz?"
- Captions must be readable to Hindi audience
`;
                }
                return `
NARRATION RULES (what voice speaks):
- narration field must be in Hinglish Roman script
- Example: "Kya tum jaante ho yeh raaz?"
- OpenAI reads Hinglish naturally

CAPTION RULES (what shows on screen):
- caption field is SAME as narration — no need to change
- OpenAI already speaks what captions show
`;
            }
            return `
NARRATION RULES (what voice speaks):
- narration field must be in clear, natural ${language}
- Example (for English): "Did you know this hidden secret?"
- Use conversational, engaging ${language}

CAPTION RULES (what shows on screen):
- caption field is SAME as narration
- Both must be in ${language}
- Do NOT use Hindi, Devanagari, or Hinglish
`;
        };
        const languageRules = getLanguageRules();
        const response = yield openApi_1.openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "user",
                    content: `
You are a viral YouTube Shorts script writer focused on HIGH RETENTION.

Create a ${duration} second viral YouTube Shorts script in ${language}.

Niche: "${niche}"
Context: "${context}"
Language: ${language}
Extra instructions: "${languageInstructions}"

⚠️ CRITICAL LANGUAGE REQUIREMENT:
- The ENTIRE script (title, description, narration, captions) MUST be in ${language}
- Do NOT mix languages unless explicitly instructed
- Tags can remain in English for SEO

GOAL:
- Keep viewer watching till the end
- Build curiosity + payoff
- Natural storytelling (NOT robotic)

STRICT RULES:
- Total duration MUST be EXACTLY ${duration} seconds
- Scene durations can vary (2–5 sec)
- Sum of all scene durations MUST equal ${duration}
- Do NOT make all scenes same duration

STORY STRUCTURE (VERY IMPORTANT):
1. Hook (first 1–2 scenes)
   - Create strong curiosity or shock
   - Make user NEED to continue

2. Build (middle scenes)
   - Add new info gradually
   - Each scene should open a loop
   - Avoid repeating same idea

3. Payoff
   - Reveal main insight or answer

4. End
   - Light CTA (comment / follow / question)

WRITING STYLE:
- Conversational, not robotic
- Short sentences but natural (no strict word limit)
- Avoid filler words
- Each line must push curiosity forward

AVOID:
- Repetitive lines
- Generic facts
- Same duration for all scenes
- Boring tone

${languageRules}

Before returning JSON, VERIFY:
- Total duration = ${duration}
- Scene durations are varied
- Script is in ${language} as requested
- Script feels engaging and not repetitive

Return ONLY valid JSON:
{
  "title": "catchy title under 60 chars",
  "description": "youtube description with hashtags",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "scenes": [
    {
      "duration": number,
      "narration": "text voice will read",
      "caption": "text shown on screen",
      "keyword": "cinematic stock footage keyword"
    }
  ]
}`,
                },
            ],
        });
        const raw = response.choices[0].message.content || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        console.log("Generated script:", JSON.stringify(parsed, null, 2));
        return parsed;
    });
}

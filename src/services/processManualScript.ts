import { openai } from "../lib/openApi";
import { ScriptData } from "../types";

// services/processManualScript.ts
export async function processManualScript(
  script: string,
  language: string,
  duration: string,
  voiceProvider: string
): Promise<ScriptData> {

  const languageRules = voiceProvider === "sarvam" ? `
- narration must be in pure Hindi Devanagari script
- caption must be same sentence in Hinglish Roman script
` : `
- narration in Hinglish Roman script  
- caption is SAME as narration
`;

  const response = await openai.chat.completions.create({
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
}
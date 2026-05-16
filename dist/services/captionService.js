"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateASS = generateASS;
function highlightKeyWords(text) {
    const impactWords = [
        "never", "always", "stop", "start", "now", "today", "secret",
        "truth", "fact", "warning", "must", "only", "best", "worst",
        "aaj", "kal", "zaroor", "sirf", "bilkul", "abhi", "karo",
        "sach", "galat", "sabse", "zyada", "danger", "free", "instantly"
    ];
    return text.split(" ").map(word => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
        // yellow for impact words, cyan for ALL CAPS words
        if (word === word.toUpperCase() && word.length > 1) {
            return `{\\c&H00FFFF&}${word}{\\c&H00FFFFFF&}`; // cyan
        }
        if (impactWords.includes(clean)) {
            return `{\\c&H00D7FF&}${word}{\\c&H00FFFFFF&}`; // yellow
        }
        return word;
    }).join(" ");
}
function formatASSTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}
function generateASS(scenes, sceneDurations) {
    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,100,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,2,2,20,20,190,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    let ass = header;
    let currentTime = 0;
    scenes.forEach((scene, i) => {
        const realDuration = sceneDurations[i]; // ← REAL, not guessed
        const start = formatASSTime(currentTime);
        const end = formatASSTime(currentTime + realDuration);
        const text = highlightKeyWords(scene.caption);
        const words = text.split(" ");
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(" ");
        const line2 = words.slice(mid).join(" ");
        const finalText = line2 ? `${line1}\\N${line2}` : line1;
        ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${finalText}\n`;
        currentTime += realDuration;
    });
    return ass;
}

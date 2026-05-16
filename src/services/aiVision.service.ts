import { openai } from "../lib/openApi";

export async function isClipRelevant(thumbnailUrl: string, keyword: string): Promise<boolean> {
  try {

    return true
    const response = await openai.chat.completions.create({
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

    const answer = response.choices[0].message.content?.trim().toUpperCase() || "NO";
    console.log(`🤖 AI check for "${keyword}": ${answer}`);
    return answer.includes("YES");
  } catch (err) {
    console.warn("⚠️ Vision check failed, allowing clip");
    return true;
  }
}


import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

async function assertUserExists(ctx, uid) {
  if (!uid) return;
  const user = await ctx.runQuery(api.Users.GetUserById, { uid });
  if (!user) throw new Error("User not found");
}

/** Strip markdown-style formatting from health coach replies (plain text in-app). */
function sanitizeHealthCoachReply(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = raw
    .replace(/\*\*\*([^*]*)\*\*\*/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_{1,2}([^_\n]+)_{1,2}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n");
  s = s.replace(/[`*]{2,}/g, "").trim();
  return s;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-4o-mini";

const isRateLimitError = (err) => {
  const msg = (err && err.message) || "";
  const status = err?.status || err?.response?.status;
  return status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate limit");
};

const retryWithBackoff = async (fn, maxRetries = 3, initialDelayMs = 750) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = i === maxRetries - 1;
      if (!isLast && isRateLimitError(err)) {
        const wait = initialDelayMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
};

const callOpenAIMessages = async ({
  system,
  messages,
  temperature = 0.2,
  max_tokens = 700,
}) => {
  if (!OPENAI_API_KEY) {
    throw new Error("AI service not configured (missing OPENAI_API_KEY).");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens,
      temperature,
      messages: system
        ? [{ role: "system", content: system }, ...messages]
        : messages,
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    const err = new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const errMsg =
      json?.error?.message ||
      json?.message ||
      JSON.stringify(json).slice(0, 300);
    const err = new Error(`OpenAI error ${res.status}: ${errMsg}`);
    err.status = res.status;
    throw err;
  }

  return json;
};

export const ParseNutritionTextAI = action({
  args: {
    uid: v.optional(v.id("users")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const text = (args.text || "").trim();
    if (text.length < 10) {
      return {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
        sugar: 0,
        servingSize: "1 serving",
        servingsPerContainer: 1,
      };
    }

    await assertUserExists(ctx, args.uid);

    const prompt = `Extract nutritional information from this food label text. Return ONLY a JSON object, no other text. Do NOT return an array.

Text from label:
${text}

Return JSON with this exact structure (as an object, NOT an array):
{
  "calories": number,
  "protein": number (in grams),
  "carbohydrates": number (in grams),
  "fat": number (in grams),
  "sodium": number (in milligrams),
  "sugar": number (in grams),
  "servingSize": string,
  "servingsPerContainer": number
}

Rules:
- If any value is not found, use 0
- Extract numbers only (no units in numbers)
- Keep servingSize as it appears (string)`;

    const started = Date.now();
    const response = await retryWithBackoff(
      async () =>
        await callOpenAIMessages({
          system: "Return ONLY valid JSON. No markdown. No code fences.",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 450,
        }),
      3,
      750
    );

    const content = response?.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
      if (Array.isArray(parsed)) parsed = parsed[0] || {};
    } catch (e) {
      console.warn("ParseNutritionTextAI: invalid JSON, falling back to zeros", {
        ms: Date.now() - started,
      });
      parsed = {};
    }

    return {
      calories: parsed.calories || 0,
      protein: parsed.protein || 0,
      carbohydrates: parsed.carbohydrates || 0,
      fat: parsed.fat || 0,
      sodium: parsed.sodium || 0,
      sugar: parsed.sugar || 0,
      servingSize: parsed.servingSize || "1 serving",
      servingsPerContainer: parsed.servingsPerContainer || 1,
    };
  },
});

export const ChatWithHealthCoachAI = action({
  args: {
    uid: v.optional(v.id("users")),
    userContext: v.string(),
    userMessage: v.string(),
    chatHistory: v.optional(v.array(v.object({ role: v.string(), content: v.string() }))),
  },
  handler: async (ctx, args) => {
    await assertUserExists(ctx, args.uid);

    const systemPrompt = `You are a dietitian nutritionist coaching the user in the WELLUS app.
Reply in 2-4 plain sentences. No markdown, no bullet points, no emojis.
Be specific using their numbers when relevant. One actionable suggestion when it fits.
For medical concerns, refer them to a clinician.

User Context:
${args.userContext || ""}`.trim();

    const history = Array.isArray(args.chatHistory) ? args.chatHistory.slice(-10) : [];

    const response = await retryWithBackoff(
      async () =>
        await callOpenAIMessages({
          system: systemPrompt,
          messages: [
            ...history,
            { role: "user", content: args.userMessage },
          ],
          temperature: 0.45,
          max_tokens: 380,
        }),
      3,
      750
    );

    const content = response?.choices?.[0]?.message?.content || "";
    return sanitizeHealthCoachReply(content);
  },
});

export const GenerateAIRecipe = action({
  args: {
    uid: v.optional(v.id("users")),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await assertUserExists(ctx, args.uid);

    const prompt = (args.prompt || "").trim();
    if (!prompt) throw new Error("Missing prompt");

    const response = await retryWithBackoff(
      async () =>
        await callOpenAIMessages({
          system:
            "Return ONLY a valid JSON array. No markdown. No code fences. No extra text.",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 1200,
        }),
      3,
      750
    );

    // Return an OpenAI-compatible shape so existing UI code doesn't need refactors.
    return {
      choices: [
        {
          message: {
            content: response?.choices?.[0]?.message?.content || "",
          },
        },
      ],
    };
  },
});

export const CalculateCaloriesAI = action({
  args: {
    uid: v.optional(v.id("users")),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await assertUserExists(ctx, args.uid);

    // Client sends JSON.stringify(profile fields); parse the leading JSON object.
    let data = {};
    try {
      const jsonMatch = (args.prompt || "").match(/^\s*(\{.*?\})/s);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      data = {};
    }

    const weight = parseFloat(data.weight) || 70; // kg
    const height = parseFloat(data.height) || 170; // cm
    const gender = (data.gender || "male").toLowerCase();
    const goal = (data.goal || "maintenance").toLowerCase();
    const age = 28; // fixed baseline for Mifflin–St Jeor

    // Mifflin-St Jeor BMR
    const bmr =
      gender === "female"
        ? 10 * weight + 6.25 * height - 5 * age - 161
        : 10 * weight + 6.25 * height - 5 * age + 5;

    // TDEE with moderate activity (1.55)
    const tdee = bmr * 1.55;

    // Adjust calories by goal
    const calories =
      goal.includes("loss") || goal.includes("lose")
        ? tdee - 500
        : goal.includes("gain") || goal.includes("muscle") || goal.includes("bulk")
        ? tdee + 300
        : tdee;

    const roundedCalories = Math.round(calories);

    // Macro split by goal
    let proteinPct;
    let carbPct;
    let fatPct;
    if (goal.includes("loss") || goal.includes("lose")) {
      proteinPct = 0.35;
      carbPct = 0.35;
      fatPct = 0.3;
    } else if (
      goal.includes("gain") ||
      goal.includes("muscle") ||
      goal.includes("bulk")
    ) {
      proteinPct = 0.3;
      carbPct = 0.45;
      fatPct = 0.25;
    } else {
      proteinPct = 0.3;
      carbPct = 0.4;
      fatPct = 0.3;
    }

    const result = {
      calories: roundedCalories,
      proteins: Math.round((roundedCalories * proteinPct) / 4),
      carbohydrates: Math.round((roundedCalories * carbPct) / 4),
      fat: Math.round((roundedCalories * fatPct) / 9),
      sodium: 2300,
      sugar: 50,
    };

    return {
      choices: [
        {
          message: {
            content: JSON.stringify(result),
          },
        },
      ],
    };
  },
});

export const ExtractNutritionFromImageAI = action({
  args: {
    uid: v.optional(v.id("users")),
    base64Image: v.string(),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertUserExists(ctx, args.uid);

    if (!args.base64Image || args.base64Image.length < 100) {
      return {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
        sugar: 0,
        servingSize: "1 serving",
        servingsPerContainer: 1,
      };
    }

    const base64Data = args.base64Image.replace(
      /^data:image\/[a-z0-9.+-]+;base64,/i,
      ""
    );
    const mimeType = args.mimeType || "image/jpeg";

    const systemPrompt =
      "Return ONLY valid JSON. No markdown. No code fences. No extra text.";

    const userPrompt = `Look at this food nutrition label image and extract the nutritional information.
Return ONLY a JSON object with this exact structure:
{
  "calories": number,
  "protein": number (grams),
  "carbohydrates": number (grams),
  "fat": number (grams),
  "sodium": number (milligrams),
  "sugar": number (grams),
  "servingSize": string,
  "servingsPerContainer": number
}
Rules:
- Extract numbers only (no units in the number fields)
- If a value is not visible or not found, use 0
- servingSize should be the string as it appears on the label
- Return a single JSON object, NOT an array`;

    const response = await retryWithBackoff(
      async () => {
        if (!OPENAI_API_KEY) {
          throw new Error("AI service not configured (missing OPENAI_API_KEY).");
        }

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            max_tokens: 450,
            temperature: 0.1,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Data}`,
                      detail: "low",
                    },
                  },
                  {
                    type: "text",
                    text: userPrompt,
                  },
                ],
              },
            ],
          }),
        });

        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          const err = new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
          err.status = res.status;
          throw err;
        }

        if (!res.ok) {
          const errMsg =
            json?.error?.message || JSON.stringify(json).slice(0, 300);
          const err = new Error(`OpenAI error ${res.status}: ${errMsg}`);
          err.status = res.status;
          throw err;
        }

        return json;
      },
      3,
      750
    );

    const content = response?.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) parsed = parsed[0] || {};
    } catch (e) {
      parsed = {};
    }

    return {
      calories: parsed.calories || 0,
      protein: parsed.protein || 0,
      carbohydrates: parsed.carbohydrates || 0,
      fat: parsed.fat || 0,
      sodium: parsed.sodium || 0,
      sugar: parsed.sugar || 0,
      servingSize: parsed.servingSize || "1 serving",
      servingsPerContainer: parsed.servingsPerContainer || 1,
    };
  },
});


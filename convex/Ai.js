import { v } from "convex/values";
import { action } from "./_generated/server";

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

    if (args.uid) {
      const user = await ctx.db.get(args.uid);
      if (!user) throw new Error("User not found");
    }

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
    if (args.uid) {
      const user = await ctx.db.get(args.uid);
      if (!user) throw new Error("User not found");
    }

    const systemPrompt = `You are a friendly and knowledgeable AI Health Coach for the WELLUS app. You have access to the user's complete health profile, daily nutrition goals, current intake, and meal history.

Your role:
- Provide personalized, actionable health and nutrition advice
- Help users understand their progress and make better choices
- Answer questions about nutrition, fitness, and wellness
- Use the user's data to give specific, relevant recommendations
- Keep responses concise (2-3 sentences when possible, up to 5 for complex questions)
- Avoid medical advice - suggest consulting healthcare professionals for medical concerns

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
          temperature: 0.7,
          max_tokens: 500,
        }),
      3,
      750
    );

    return response?.choices?.[0]?.message?.content || "";
  },
});

export const GenerateAIRecipe = action({
  args: {
    uid: v.optional(v.id("users")),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.uid) {
      const user = await ctx.db.get(args.uid);
      if (!user) throw new Error("User not found");
    }

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
    if (args.uid) {
      const user = await ctx.db.get(args.uid);
      if (!user) throw new Error("User not found");
    }

    const prompt = (args.prompt || "").trim();
    if (!prompt) throw new Error("Missing prompt");

    const response = await retryWithBackoff(
      async () =>
        await callOpenAIMessages({
          system: "Return ONLY valid JSON. No markdown. No code fences.",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 450,
        }),
      3,
      750
    );

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


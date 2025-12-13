// utils/openai.js
import OpenAI from "openai";

// NOTE: This exposes your key to the client. OK for local testing.
// For production, call your own backend instead.
export const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY, // <-- from .env.local
  dangerouslyAllowBrowser: true, // needed for RN/Expo usage of the SDK
});

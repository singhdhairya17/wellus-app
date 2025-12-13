import axios from "axios"
import OpenAI from "openai"
import { logger } from "../../utils/logger"

// Detect which provider to use based on available API keys
const useOpenAI = !!process.env.EXPO_PUBLIC_OPENAI_API_KEY
const useOpenRouter = !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY

let openai

if (useOpenAI) {
    // Use OpenAI (ChatGPT, GPT-4, etc.)
    openai = new OpenAI({
        apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
    })
} else if (useOpenRouter) {
    // Use OpenRouter (Gemini, Claude, etc.)
    openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
        dangerouslyAllowBrowser: true
    })
} else {
    // No API key - will use manual fallback
    openai = null
}

// Model selection based on provider
const AIMODELNAME = useOpenAI ? "gpt-4o-mini" : "google/gemini-2.0-flash-exp:free"

// Helper: Check if error is rate limit related
const isRateLimitError = (error) => {
    return error?.message?.includes('429') || 
           error?.status === 429 ||
           error?.message?.includes('Rate limit') ||
           error?.message?.includes('rate_limit') ||
           error?.response?.status === 429 ||
           error?.statusCode === 429
}

// Helper: Retry with exponential backoff for rate limits
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = i === maxRetries - 1;
            
            // Only retry on rate limit errors
            if (isRateLimitError(error) && !isLastAttempt) {
                const waitTime = initialDelay * Math.pow(2, i); // Exponential backoff: 2s, 4s, 8s
                logger.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Retry
            }
            
            // Don't retry for other errors or if it's the last attempt
            throw error;
        }
    }
}

export const CalculateCaloriesAI = async (PROMPT) => {
    if (!openai) {
        throw new Error('RATE_LIMIT_FALLBACK: No API key available. Use manual calculation.')
    }
    
    try {
        return await openai.chat.completions.create({
            model: AIMODELNAME,
            messages: [
                { role: "user", content: PROMPT }
            ],
            response_format: "json_object"
        })
    } catch (error) {
        // Check if it's a rate limit error
        if (isRateLimitError(error)) {
            throw new Error('RATE_LIMIT_FALLBACK: API rate limit exceeded. Use manual calculation.')
        }
        // Re-throw other errors
        throw error
    }
}

export const GenerateAIRecipe = async (PROMPT) => {
    if (!openai) {
        throw new Error('RATE_LIMIT_FALLBACK: No API key available. Recipe generation unavailable.')
    }
    
    // Retry with exponential backoff for rate limits
    return await retryWithBackoff(async () => {
        try {
            return await openai.chat.completions.create({
                model: AIMODELNAME,
                messages: [
                    { role: "user", content: PROMPT }
                ],
                response_format: "json_object"
            })
        } catch (error) {
            // Check if it's a rate limit error
            if (isRateLimitError(error)) {
                throw new Error('RATE_LIMIT_FALLBACK: API rate limit exceeded. Recipe generation temporarily unavailable.')
            }
            // Re-throw other errors
            throw error
        }
    }, 3, 2000) // 3 retries, starting with 2 second delay
}

const BASE_URL = 'https://aigurulab.tech';
export const GenerateRecipeImage = async (prompt) => await axios.post(BASE_URL + '/api/generate-image',
    {
        width: 1024,
        height: 1024,
        input: prompt,
        model: 'sdxl',
        aspectRatio: "1:1"
    },
    {
        headers: {
            'x-api-key': process.env.EXPO_PUBLIC_AIRGURU_LAB_API_KEY,
            'Content-Type': 'application/json',
        },
    })
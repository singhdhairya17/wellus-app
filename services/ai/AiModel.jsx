import axios from "axios"
import { logger } from "../../utils/logger"
import { getConvexClient } from "../../utils/convexClient"
import { api } from "../../convex/_generated/api"

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
    try {
        const convex = getConvexClient()
        if (!convex) {
            throw new Error('RATE_LIMIT_FALLBACK: Missing EXPO_PUBLIC_CONVEX_URL. Use manual calculation.')
        }
        return await convex.action(api.Ai.CalculateCaloriesAI, { prompt: PROMPT })
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
    // Retry with exponential backoff for rate limits
    return await retryWithBackoff(async () => {
        try {
            const convex = getConvexClient()
            if (!convex) {
                throw new Error('RATE_LIMIT_FALLBACK: Missing EXPO_PUBLIC_CONVEX_URL. Recipe generation unavailable.')
            }
            return await convex.action(api.Ai.GenerateAIRecipe, { prompt: PROMPT })
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
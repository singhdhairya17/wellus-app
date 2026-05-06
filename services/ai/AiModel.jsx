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

// CalculateCaloriesAI was removed: it had a height-parsing bug that overwrote
// correct manual calorie targets with a value near 425 kcal. All nutrition
// goal calculations now go through CalculateNutritionGoalsManually.

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

/**
 * Vision estimate for non-label meals (plate / home-cooked). Uses Convex with purpose meal_photo.
 * @param {{ base64Image: string, mimeType?: string, userHint?: string, uid?: string }} args
 */
export const estimateMealFromPhoto = async (args) => {
    return await retryWithBackoff(async () => {
        const convex = getConvexClient()
        if (!convex) {
            throw new Error('Missing EXPO_PUBLIC_CONVEX_URL. Meal photo estimation unavailable.')
        }
        return await convex.action(api.Ai.ExtractNutritionFromImageAI, {
            uid: args.uid,
            base64Image: args.base64Image,
            mimeType: args.mimeType,
            purpose: 'meal_photo',
            userHint: args.userHint,
        })
    }, 3, 2000)
}

/** Teal placeholder when external image API (AiGuru / aigurulab) fails or key is missing */
export const FALLBACK_RECIPE_CARD_IMAGE_URL =
    'https://placehold.co/1024x1024/14B8A6/FFFFFF/png?text=WELLUS+Recipe'

const BASE_URL = 'https://aigurulab.tech'
export const GenerateRecipeImage = async (prompt) => {
    const key = process.env.EXPO_PUBLIC_AIRGURU_LAB_API_KEY
    if (!key || !String(key).trim()) {
        const err = new Error('IMAGE_GEN_SKIPPED: Missing EXPO_PUBLIC_AIRGURU_LAB_API_KEY')
        err.code = 'SKIP_IMAGE'
        throw err
    }
    const safePrompt = typeof prompt === 'string' && prompt.trim() ? prompt : 'Healthy plated meal, food photography'
    try {
        return await axios.post(
            `${BASE_URL}/api/generate-image`,
            {
                width: 1024,
                height: 1024,
                input: safePrompt.slice(0, 2000),
                model: 'sdxl',
                aspectRatio: '1:1',
            },
            {
                headers: {
                    'x-api-key': key.trim(),
                    'Content-Type': 'application/json',
                },
                timeout: 120000,
            }
        )
    } catch (e) {
        const status = e?.response?.status
        const raw = e?.response?.data
        let snippet = ''
        if (typeof raw === 'string') snippet = raw.slice(0, 200)
        else if (raw && typeof raw === 'object') {
            snippet = raw.message || raw.error || JSON.stringify(raw).slice(0, 200)
        }
        const msg = new Error(`Image API failed${status ? ` (${status})` : ''}${snippet ? `: ${snippet}` : ''}`)
        msg.status = status
        msg.cause = e
        throw msg
    }
}

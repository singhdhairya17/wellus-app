/**
 * AI Health Coach Service
 * Provides personalized health coaching with full user context
 */

import { logger } from "../../utils/logger"
import { getConvexClient } from "../../utils/convexClient"
import { api } from "../../convex/_generated/api"

/**
 * Build user context for AI health coach
 */
export const BuildUserContext = (user, dailyMacros, recentMeals, progressData) => {
    if (!user) return ""
    
    // Ensure all inputs are safe
    const safeDailyMacros = dailyMacros || {}
    const safeRecentMeals = Array.isArray(recentMeals) ? recentMeals : []
    const safeProgressData = progressData || {}
    
    const context = {
        profile: {
            name: user.name || "User",
            age: user.age || "Not specified",
            weight: user.weight ? `${user.weight} kg` : "Not set",
            height: user.height ? `${user.height} ft` : "Not set",
            gender: user.gender || "Not specified",
            goal: user.goal || "Not set"
        },
        goals: {
            calories: user.calories || 0,
            proteins: user.proteins || 0,
            carbohydrates: user.carbohydrates || 0,
            fat: user.fat || 0,
            sodium: user.sodium || 0,
            sugar: user.sugar || 0
        },
        today: {
            calories: safeDailyMacros.calories || 0,
            // Convex GetDailyMacronutrients returns `protein` (singular).
            // Keep backward compatibility if any older callsite returns `proteins`.
            protein: safeDailyMacros.protein ?? safeDailyMacros.proteins ?? 0,
            carbs: safeDailyMacros.carbohydrates || 0,
            fat: safeDailyMacros.fat || 0,
            sodium: safeDailyMacros.sodium || 0,
            sugar: safeDailyMacros.sugar || 0
        },
        recentMeals: safeRecentMeals,
        progress: safeProgressData
    }
    
    // Build context string
    let contextString = `USER PROFILE:
- Name: ${context.profile.name}
- Weight: ${context.profile.weight}
- Height: ${context.profile.height}
- Gender: ${context.profile.gender}
- Goal: ${context.profile.goal}

DAILY NUTRITION GOALS:
- Calories: ${context.goals.calories} kcal
- Protein: ${context.goals.proteins} g
- Carbohydrates: ${context.goals.carbohydrates} g
- Fat: ${context.goals.fat} g
- Sodium: ${context.goals.sodium} mg
- Sugar: ${context.goals.sugar} g

TODAY'S INTAKE:
- Calories: ${context.today.calories.toFixed(0)} / ${context.goals.calories || 1} kcal (${context.goals.calories ? ((context.today.calories / context.goals.calories) * 100).toFixed(0) : 0}%)
- Protein: ${context.today.protein.toFixed(0)} / ${context.goals.proteins || 1} g (${context.goals.proteins ? ((context.today.protein / context.goals.proteins) * 100).toFixed(0) : 0}%)
- Carbs: ${context.today.carbs.toFixed(0)} / ${context.goals.carbohydrates || 1} g (${context.goals.carbohydrates ? ((context.today.carbs / context.goals.carbohydrates) * 100).toFixed(0) : 0}%)
- Fat: ${context.today.fat.toFixed(0)} / ${context.goals.fat || 1} g (${context.goals.fat ? ((context.today.fat / context.goals.fat) * 100).toFixed(0) : 0}%)
- Sodium: ${context.today.sodium.toFixed(0)} / ${context.goals.sodium || 1} mg (${context.goals.sodium ? ((context.today.sodium / context.goals.sodium) * 100).toFixed(0) : 0}%)
- Sugar: ${context.today.sugar.toFixed(0)} / ${context.goals.sugar || 1} g (${context.goals.sugar ? ((context.today.sugar / context.goals.sugar) * 100).toFixed(0) : 0}%)

RECENT MEALS: ${context.recentMeals && Array.isArray(context.recentMeals) && context.recentMeals.length > 0 
    ? context.recentMeals.slice(0, 5).map(m => `- ${m?.mealType || 'Meal'}: ${m?.foodName || 'Meal'} (${m?.calories || 0} kcal)`).join('\n')
    : 'No meals logged today'}

PROGRESS NOTES:
${context.progress.notes || 'No specific progress notes available'}`

    return contextString
}

/**
 * Chat with AI Health Coach
 */
export const ChatWithHealthCoach = async (userMessage, userContext, chatHistory = [], uid) => {
    const convex = getConvexClient()
    if (!convex) {
        throw new Error('AI service not available. Missing EXPO_PUBLIC_CONVEX_URL.')
    }
    
    try {
        const response = await convex.action(api.Ai.ChatWithHealthCoachAI, {
            uid: uid || undefined,
            userContext: userContext || '',
            userMessage,
            chatHistory: Array.isArray(chatHistory) ? chatHistory.slice(-10) : []
        })
        
        return response
    } catch (error) {
        logger.error('Health Coach AI Error:', error)
        
        if (error?.message?.includes('429') || error?.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.')
        }
        
        throw new Error('Failed to get response from health coach. Please try again.')
    }
}


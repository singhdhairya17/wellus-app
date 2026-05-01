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
export const BuildUserContext = (user, dailyMacros, recentMeals, progressData, waterData, exerciseLogs) => {
    if (!user) return ""

    const safeDailyMacros  = dailyMacros   || {}
    const safeRecentMeals  = Array.isArray(recentMeals)   ? recentMeals   : []
    const safeExerciseLogs = Array.isArray(exerciseLogs)  ? exerciseLogs  : []
    const safeWater        = waterData     || {}

    const g = {
        calories:      user.calories      || 0,
        proteins:      user.proteins      || 0,
        carbohydrates: user.carbohydrates || 0,
        fat:           user.fat           || 0,
        sodium:        user.sodium        || 0,
        sugar:         user.sugar         || 0,
    }
    const t = {
        calories: safeDailyMacros.calories || 0,
        protein:  safeDailyMacros.protein ?? safeDailyMacros.proteins ?? 0,
        carbs:    safeDailyMacros.carbohydrates || 0,
        fat:      safeDailyMacros.fat || 0,
        sodium:   safeDailyMacros.sodium || 0,
        sugar:    safeDailyMacros.sugar  || 0,
    }

    const pct = (a, b) => b ? `${((a / b) * 100).toFixed(0)}%` : '0%'
    const has = (v) => v && v !== 'Not specified' && v !== 'Not set'

    // Profile line — only include fields that have real values
    const profileParts = [
        `Name: ${user.name || 'User'}`,
        has(user.weight)    && `Weight: ${user.weight} kg`,
        has(user.height)    && `Height: ${user.height} ft`,
        has(user.gender)    && `Gender: ${user.gender}`,
        has(user.goal)      && `Goal: ${user.goal}`,
        user.goalWeight     && `Target: ${user.goalWeight} kg`,
    ].filter(Boolean).join(', ')

    const goalsSet = g.calories > 0

    const intakeLine = goalsSet ? [
        `Cal: ${t.calories.toFixed(0)}/${g.calories} kcal (${pct(t.calories, g.calories)})`,
        g.proteins      > 0 && `Pro: ${t.protein.toFixed(0)}/${g.proteins}g (${pct(t.protein, g.proteins)})`,
        g.carbohydrates > 0 && `Carb: ${t.carbs.toFixed(0)}/${g.carbohydrates}g (${pct(t.carbs, g.carbohydrates)})`,
        g.fat           > 0 && `Fat: ${t.fat.toFixed(0)}/${g.fat}g (${pct(t.fat, g.fat)})`,
    ].filter(Boolean).join(' | ') : 'Goals not set'

    const mealLines = safeRecentMeals.length > 0
        ? safeRecentMeals.slice(0, 5).map(m => `- ${m?.mealType || 'Meal'}: ${m?.foodName || 'Item'} (${m?.calories || 0} kcal)`).join('\n')
        : 'None logged'

    // Water: only include if logged today
    const waterMl   = safeWater.total || 0
    const waterLine = waterMl > 0 ? `${waterMl} ml today` : null

    // Exercise: summarise calories burned and activities
    const totalBurned = safeExerciseLogs.reduce((s, e) => s + (e.caloriesBurned || 0), 0)
    const exerciseLine = safeExerciseLogs.length > 0
        ? safeExerciseLogs.map(e => `${e.exerciseType} ${e.duration}min (~${e.caloriesBurned} kcal)`).join(', ')
        : null

    let ctx = `Profile: ${profileParts}
Goals (daily): ${goalsSet ? `Cal ${g.calories} kcal | Pro ${g.proteins}g | Carb ${g.carbohydrates}g | Fat ${g.fat}g` : 'Not set'}
Today intake: ${intakeLine}${totalBurned > 0 ? ` | Net cal: ~${Math.round(t.calories - totalBurned)} kcal` : ''}
Meals: ${mealLines}`

    if (exerciseLine) ctx += `\nExercise: ${exerciseLine}`
    if (waterLine)    ctx += `\nWater: ${waterLine}`
    if (progressData?.notes) ctx += `\nNotes: ${progressData.notes}`

    return ctx
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


/**
 * AI Health Coach Service
 * Provides personalized health coaching with full user context
 */

import { logger } from "../../utils/logger"
import { getConvexClient } from "../../utils/convexClient"
import { api } from "../../convex/_generated/api"
import { resolveHeightCm, cmToFeetInches, bmiFromKgCm } from "../../utils/measurements"

/** Matches profile / preference activity keys for readable coach context. */
const ACTIVITY_DISPLAY = {
    sedentary: "Sedentary (little or no exercise)",
    light: "Light (1–3 days/week)",
    moderate: "Moderate (3–5 days/week)",
    active: "Active (6–7 days/week)",
    very_active: "Very active (physical job or 2× training)",
}

const fin = (x) => {
    const n = Number(x)
    return Number.isFinite(n) ? n : null
}

const hasText = (v) => Boolean(v && v !== "Not specified" && v !== "Not set")

const activityLabel = (level) => {
    if (level == null || level === "") return null
    const key = String(level).trim().toLowerCase().replace(/\s+/g, "_")
    return ACTIVITY_DISPLAY[key] || String(level).replace(/_/g, " ")
}

/** One row for today's meal plan item (recipe + mealPlan shape from Convex). */
const formatMealRow = (m) => {
    const mealType = m?.mealPlan?.mealType || "Meal"
    const foodName = m?.recipe?.recipeName ?? m?.mealPlan?.foodName ?? "Item"
    const cal = fin(m?.mealPlan?.calories ?? m?.recipe?.jsonData?.calories) ?? 0
    const jd = m?.recipe?.jsonData
    const bits = [`${mealType}: ${String(foodName)}`, `${Math.round(cal)} kcal`]
    if (jd && typeof jd === "object") {
        const p = fin(jd.proteins ?? jd.protein)
        const c = fin(jd.carbohydrates)
        const f = fin(jd.fat)
        const na = fin(jd.sodium)
        const su = fin(jd.sugar)
        if (p != null) bits.push(`P${p.toFixed(0)}g`)
        if (c != null) bits.push(`C${c.toFixed(0)}g`)
        if (f != null) bits.push(`F${f.toFixed(0)}g`)
        if (na != null && na > 0) bits.push(`Na${Math.round(na)}mg`)
        if (su != null && su > 0) bits.push(`Sugar${su.toFixed(0)}g`)
    }
    return `- ${bits.join(", ")}`
}

const formatWeightHistory = (logs) => {
    if (!Array.isArray(logs) || logs.length === 0) return null
    const tail = logs.slice(-8)
    return tail
        .map((log) => {
            const d = log?.timestamp ? new Date(log.timestamp).toISOString().slice(0, 10) : "?"
            const w = fin(log?.weight)
            return w != null ? `${d}: ${w} kg` : null
        })
        .filter(Boolean)
        .join("; ")
}

/**
 * Build user context for AI health coach
 * @param {object} weightLogs - optional recent rows from Tracking.GetWeightLogs (oldest→newest)
 */
export const BuildUserContext = (
    user,
    dailyMacros,
    recentMeals,
    progressData,
    waterData,
    exerciseLogs,
    weightLogs = []
) => {
    if (!user) return ""

    const safeDailyMacros = dailyMacros || {}
    const safeRecentMeals = Array.isArray(recentMeals) ? recentMeals : []
    const safeExerciseLogs = Array.isArray(exerciseLogs) ? exerciseLogs : []
    const safeWater = waterData || {}
    const safeWeightLogs = Array.isArray(weightLogs) ? weightLogs : []

    const g = {
        calories: fin(user.calories) ?? 0,
        proteins: fin(user.proteins) ?? 0,
        carbohydrates: fin(user.carbohydrates) ?? 0,
        fat: fin(user.fat) ?? 0,
        sodium: fin(user.sodium) ?? 0,
        sugar: fin(user.sugar) ?? 0,
    }
    const t = {
        calories: fin(safeDailyMacros.calories) ?? 0,
        protein: fin(safeDailyMacros.protein ?? safeDailyMacros.proteins) ?? 0,
        carbs: fin(safeDailyMacros.carbohydrates) ?? 0,
        fat: fin(safeDailyMacros.fat) ?? 0,
        sodium: fin(safeDailyMacros.sodium) ?? 0,
        sugar: fin(safeDailyMacros.sugar) ?? 0,
    }

    const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(0)}%` : "0%")
    const heightCm = resolveHeightCm({ heightCm: user.heightCm, height: user.height })
    let heightLine = null
    if (heightCm != null && heightCm > 0) {
        const { feet, inches } = cmToFeetInches(heightCm)
        heightLine = `${heightCm.toFixed(0)} cm (~${feet} ft ${inches} in)`
    } else if (hasText(user.height)) {
        heightLine = `Height (legacy encoding): ${user.height}`
    }

    const ageNum = fin(user.age)
    const activityStr = activityLabel(user.activityLevel)

    const weightKg = fin(user.weight)
    let bmiLine = null
    if (weightKg != null && weightKg > 0 && heightCm != null && heightCm > 0) {
        const bmi = bmiFromKgCm(weightKg, heightCm)
        if (bmi != null && Number.isFinite(bmi)) {
            bmiLine = bmi.toFixed(1)
        }
    }

    const profileLines = [
        `Display name: ${user.name || "User"}`,
        ageNum != null && ageNum > 0 && `Age: ${Math.round(ageNum)} y`,
        hasText(user.gender) && `Sex: ${user.gender}`,
        heightLine && `Height: ${heightLine}`,
        hasText(user.weight) && `Weight: ${user.weight} kg`,
        user.goalWeight != null && fin(user.goalWeight) != null && fin(user.goalWeight) > 0 && `Goal weight: ${fin(user.goalWeight)} kg`,
        bmiLine && `BMI (from profile weight/height): ${bmiLine}`,
        hasText(user.goal) && `Nutrition goal: ${user.goal}`,
        activityStr && `Activity level: ${activityStr}`,
    ].filter(Boolean)

    const goalsSet = g.calories > 0

    const goalParts = [
        goalsSet && `Cal ${g.calories} kcal`,
        g.proteins > 0 && `Pro ${g.proteins}g`,
        g.carbohydrates > 0 && `Carb ${g.carbohydrates}g`,
        g.fat > 0 && `Fat ${g.fat}g`,
        g.sodium > 0 && `Sodium ${g.sodium}mg`,
        g.sugar > 0 && `Sugar ${g.sugar}g`,
    ].filter(Boolean)

    const intakeLine = goalsSet
        ? [
              `Cal: ${t.calories.toFixed(0)}/${g.calories} kcal (${pct(t.calories, g.calories)})`,
              g.proteins > 0 && `Pro: ${t.protein.toFixed(0)}/${g.proteins}g (${pct(t.protein, g.proteins)})`,
              g.carbohydrates > 0 && `Carb: ${t.carbs.toFixed(0)}/${g.carbohydrates}g (${pct(t.carbs, g.carbohydrates)})`,
              g.fat > 0 && `Fat: ${t.fat.toFixed(0)}/${g.fat}g (${pct(t.fat, g.fat)})`,
              g.sodium > 0 && `Sodium: ${t.sodium.toFixed(0)}/${g.sodium}mg (${pct(t.sodium, g.sodium)})`,
              g.sugar > 0 && `Sugar: ${t.sugar.toFixed(0)}/${g.sugar}g (${pct(t.sugar, g.sugar)})`,
          ]
              .filter(Boolean)
              .join(" | ")
        : "Daily macro targets not fully set"

    const mealLines =
        safeRecentMeals.length > 0
            ? safeRecentMeals.slice(0, 12).map((m) => formatMealRow(m)).join("\n")
            : "None logged today"

    const waterMl = safeWater.total || 0
    const waterLine = waterMl > 0 ? `${waterMl} ml logged today` : null

    const totalBurned = safeExerciseLogs.reduce((s, e) => s + (fin(e.caloriesBurned) || 0), 0)
    const exerciseLine =
        safeExerciseLogs.length > 0
            ? safeExerciseLogs.map((e) => `${e.exerciseType} ${e.duration}min (~${e.caloriesBurned || 0} kcal burned)`).join(", ")
            : null

    const weightHistoryLine = formatWeightHistory(safeWeightLogs)

    let ctx = `User profile:\n${profileLines.map((s) => `- ${s}`).join("\n")}

Daily targets: ${goalParts.length ? goalParts.join(" | ") : "Not configured"}
Today's intake vs targets: ${intakeLine}${totalBurned > 0 ? ` | Activity burn (logged today): ~${Math.round(totalBurned)} kcal | Net cal (~intake minus burn): ~${Math.round(t.calories - totalBurned)} kcal` : ""}

Today's meals:\n${mealLines}`

    if (exerciseLine) ctx += `\n\nExercise (today): ${exerciseLine}`
    if (waterLine) ctx += `\nWater: ${waterLine}`
    if (weightHistoryLine) ctx += `\nRecent weight log (oldest→newest in window): ${weightHistoryLine}`
    if (progressData?.notes) ctx += `\nUser notes: ${progressData.notes}`

    return ctx
}

/**
 * Chat with AI Health Coach
 */
export const ChatWithHealthCoach = async (userMessage, userContext, chatHistory = [], uid) => {
    const convex = getConvexClient()
    if (!convex) {
        throw new Error("AI service not available. Missing EXPO_PUBLIC_CONVEX_URL.")
    }

    try {
        const response = await convex.action(api.Ai.ChatWithHealthCoachAI, {
            uid: uid || undefined,
            userContext: userContext || "",
            userMessage,
            chatHistory: Array.isArray(chatHistory) ? chatHistory.slice(-10) : [],
        })

        return response
    } catch (error) {
        logger.error("Health Coach AI Error:", error)

        if (error?.message?.includes("429") || error?.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a moment.")
        }

        throw new Error("Failed to get response from health coach. Please try again.")
    }
}

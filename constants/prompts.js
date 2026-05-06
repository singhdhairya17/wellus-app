/**
 * AI prompts for meal / recipe generation.
 * Macros in saved JSON power GetDailyMacronutrients once the meal is on the plan and marked eaten (not skipped).
 */

const COMPLETE_JSON_SCHEMA = `Return ONLY a valid JSON object (no markdown, no code fences, no prose). Exact keys:
{
  "recipeName": "string",
  "description": "string (1–3 sentences)",
  "nutritionLabel": "string (short clarification, e.g. Totals for the plate you specified OR Per serving)",
  "calories": number,
  "proteins": number,
  "carbohydrates": number,
  "fat": number,
  "sodium": number,
  "sugar": number,
  "category": ["string"] (subset of: Breakfast, Lunch, Dinner, Salad, Dessert, Fastfood, Drink, Cake),
  "cookTime": number (minutes, estimate OK),
  "serveTo": number (integer ≥ 1),
  "imagePrompt": "string (realistic hero food photo description)",
  "ingredients": [{ "icon": "single emoji", "ingredient": "string", "quantity": "string with units" }],
  "steps": ["string"]
}

All numeric fields MUST be finite non-negative numbers (use 0 if unknown). Estimate sodium (mg) and sugar (grams) realistically for restaurant-style totals.`;

/**
 * @param {{ dishDescription?: string, portionNotes?: string, userSummary?: string }} opts
 */
export function buildRecipeOptionsPrompt({ dishDescription, portionNotes, userSummary }) {
    const dish = (dishDescription || "").trim() || "(user did not name a dish — infer from context)"
    let body = ""
    if ((userSummary || "").trim()) {
        body += `${userSummary.trim()}\n\n`
    }
    body += `Dish / craving / ingredient focus:\n${dish}\n`
    if ((portionNotes || "").trim()) {
        body += `\nUser-specified amounts they plan to eat in one sitting (carry this through all 3 variants; descriptions must reflect these portions):\n${(
            portionNotes || ""
        ).trim()}\n`
    }
    body += `\nTask: Produce exactly 3 diverse recipe VARIANTS as a JSON array ONLY (no markdown, no code fences, no commentary).
Each array element MUST be an object with:
  - recipeName: string beginning with one relevant emoji
  - description: string, maximum 2 sentences; if portions were given, mention how each variant honours those amounts
  - ingredients: array of plain ingredient NAME strings only (omit quantities here).

Rules:
- If the user names Indian combos (dal chawal, rajma rice, etc.), include authentic-style variants suitable for home cooking unless they ask otherwise.
- Respect personalization lines (goals / calorie targets) when choosing balance (e.g. higher protein variant), without claiming medical certainty.`;
    return body
}

/**
 * @param {{ recipeName?: string, description?: string, portionNotes?: string, userSummary?: string }} opts
 */
export function buildCompleteRecipePrompt({ recipeName, description, portionNotes, userSummary }) {
    const rn = (recipeName || "").trim()
    const desc = (description || "").trim()
    let body = ""
    if ((userSummary || "").trim()) {
        body += `${userSummary.trim()}\n\n`
    }
    body += `Selected recipe variant:\n- Name: ${rn}\n- Pitch: ${desc}\n`

    const hasPortions = !!(portionNotes || "").trim()

    if (hasPortions) {
        body += `\nUSER PORTIONS FOR THIS SINGLE MEAL / PLATE (non-negotiable for nutrition maths):\n${(portionNotes || "").trim()}\n`
        body += `\nmacronutrient_rule: Estimate calories, proteins, carbohydrates, fat, sodium, and sugar as TOTALS FOR THIS ENTIRE composite meal eaten once (everything on the plate together). NOT per 100 g. NOT generic recipe defaults.\n`
        body += `serveTo_rule: Set "serveTo" to 1. Every numeric nutrition field MUST describe that one plated meal.\n`
        body += `ingredients_rule: List ingredients with gram/ml/cup quantities that reconcile with the user's amounts (adjust oil/spices realistically).\n`
    } else {
        body += `\nmacronutrient_rule: Nutrition numbers are PER SERVING.\nserveTo_rule: Set "serveTo" to how many servings the batch makes (integer ≥ 1).\n`
    }

    body += `\n${COMPLETE_JSON_SCHEMA}\nFill "nutritionLabel" to state whether nutrition is totals for one plate vs per serving.`
    return body
}

/** One-line personalization block for Convex / OpenAI text calls (from hydrated user). */
export function buildUserRecipePersonalizationSummary(user) {
    if (!user) return ""
    const lines = []
    if (user.goal && String(user.goal).trim()) lines.push(`Primary goal: ${String(user.goal).trim()}`)
    if (user.calories && Number(user.calories) > 0) lines.push(`Daily calorie target ~${Math.round(Number(user.calories))} kcal`)
    if (user.proteins && Number(user.proteins) > 0) lines.push(`Daily protein target ~${Math.round(Number(user.proteins))} g`)
    if (user.age && Number(user.age) > 0) lines.push(`Age ~${Math.round(Number(user.age))}`)
    if (user.activityLevel && String(user.activityLevel).trim())
        lines.push(`Activity level: ${String(user.activityLevel).trim()}`)
    if (user.goalWeight && Number(user.goalWeight) > 0) lines.push(`Goal weight ${Number(user.goalWeight)} kg`)
    if (!lines.length) return ""
    return (
        `Personalization from app profile (inform reasonable meal balance only; general wellness not medical):\n` +
        lines.map((x) => `- ${x}`).join("\n")
    )
}

export default {
    buildRecipeOptionsPrompt,
    buildCompleteRecipePrompt,
    buildUserRecipePersonalizationSummary,
}

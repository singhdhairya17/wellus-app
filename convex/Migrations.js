import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * One-shot migration that runs on login until heightCm is populated:
 *   1. Backfills `heightCm` on the active profile from the legacy "X.YY"
 *      feet+inches `height` string (parseFloat would silently mangle "5.10").
 *   2. If the persisted calorie target is implausibly low (the AI bug
 *      produced ~425 kcal for a 5'10" / 70 kg user), recompute calories +
 *      macros via Mifflin-St Jeor and overwrite.
 *   3. Clears stale nutrition fields off the `users` row so the active
 *      profile is the only source of truth going forward.
 *
 * Idempotent: returns { migrated: false } once heightCm is set.
 */

const ACTIVITY = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

const parseLegacyHeightToCm = (legacy) => {
    if (legacy == null) return null;
    const s = String(legacy).trim();
    const match = s.match(/^([0-9]+)(?:\.([0-9]{1,2}))?$/);
    if (!match) return null;
    const feet = parseInt(match[1], 10);
    const inches = match[2] ? parseInt(match[2], 10) : 0;
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;
    if (inches > 11) return null;
    return (feet * 12 + inches) * 2.54;
};

const computeNutritionGoals = ({ weightKg, heightCm, gender, goal, age, activityLevel }) => {
    const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 70;
    const height = Number.isFinite(heightCm) && heightCm > 0 ? heightCm : 170;
    const ageYears = Number.isFinite(age) && age > 0 ? age : 28;
    const isMale = typeof gender === "string" && gender.trim().toLowerCase() === "male";
    const bmr = isMale
        ? 10 * weight + 6.25 * height - 5 * ageYears + 5
        : 10 * weight + 6.25 * height - 5 * ageYears - 161;

    const multiplier = ACTIVITY[activityLevel] ?? ACTIVITY.moderate;
    const tdee = bmr * multiplier;

    let target = tdee;
    if (goal === "Weight Loss") target = tdee - 500;
    else if (goal === "Muscle Gain") target = tdee + 300;
    else if (goal === "Weight Gain") target = tdee + 500;

    let carbPct, proteinPct, fatPct;
    if (goal === "Weight Loss") {
        carbPct = 0.40; proteinPct = 0.30; fatPct = 0.30;
    } else if (goal === "Muscle Gain") {
        carbPct = 0.45; proteinPct = 0.30; fatPct = 0.25;
    } else if (goal === "Weight Gain") {
        carbPct = 0.50; proteinPct = 0.20; fatPct = 0.30;
    } else {
        carbPct = 0.45; proteinPct = 0.30; fatPct = 0.25;
    }

    return {
        calories: Math.round(target),
        proteins: Math.round((target * proteinPct) / 4),
        carbohydrates: Math.round((target * carbPct) / 4),
        fat: Math.round((target * fatPct) / 9),
        sodium: 2300,
        sugar: Math.round((target * 0.10) / 4),
    };
};

export const MigrateLegacyProfile = mutation({
    args: { uid: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.uid);
        if (!user) return { migrated: false, reason: "user not found" };

        const activeProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", args.uid))
            .filter((q) => q.eq(q.field("isActive"), true))
            .first();

        const updates = {};

        // --- Active profile backfill -------------------------------------
        if (activeProfile) {
            const profileUpdates = {};
            const hasHeightCm = Number.isFinite(activeProfile.heightCm) && activeProfile.heightCm > 0;
            let resolvedHeightCm = hasHeightCm ? activeProfile.heightCm : null;

            if (!hasHeightCm) {
                const cm = parseLegacyHeightToCm(activeProfile.height);
                if (cm) {
                    resolvedHeightCm = Math.round(cm * 10) / 10;
                    profileUpdates.heightCm = resolvedHeightCm;
                }
            }

            // Recompute when calorie target looks corrupted (the AI bug case
            // produced ~425 kcal). Threshold: clearly below any plausible
            // adult Mifflin-St Jeor + activity result, even at deficit.
            const looksCorrupted =
                Number.isFinite(activeProfile.calories) &&
                activeProfile.calories > 0 &&
                activeProfile.calories < 800;

            if (
                looksCorrupted &&
                resolvedHeightCm &&
                activeProfile.weight &&
                activeProfile.gender &&
                activeProfile.goal
            ) {
                const recomputed = computeNutritionGoals({
                    weightKg: parseFloat(activeProfile.weight),
                    heightCm: resolvedHeightCm,
                    gender: activeProfile.gender,
                    goal: activeProfile.goal,
                    age: activeProfile.age,
                    activityLevel: activeProfile.activityLevel,
                });
                Object.assign(profileUpdates, recomputed);
            }

            if (Object.keys(profileUpdates).length > 0) {
                await ctx.db.patch(activeProfile._id, profileUpdates);
                updates.activeProfile = profileUpdates;
            }
        }

        // --- Clear stale nutrition fields off the users row -------------
        // The active profile is the source of truth from now on.
        const userClears = {};
        const fieldsToClear = [
            "calories",
            "proteins",
            "carbohydrates",
            "fat",
            "sodium",
            "sugar",
        ];
        for (const f of fieldsToClear) {
            if (user[f] !== undefined) userClears[f] = undefined;
        }
        if (Object.keys(userClears).length > 0) {
            await ctx.db.patch(args.uid, userClears);
            updates.userCleared = Object.keys(userClears);
        }

        return {
            migrated: Object.keys(updates).length > 0,
            ...updates,
        };
    },
});

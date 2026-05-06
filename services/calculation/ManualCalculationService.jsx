/**
 * Manual BMR / TDEE / macro calculator (Mifflin-St Jeor + activity multipliers).
 * This is the only nutrition-goal calculator the app uses; the AI-based path
 * was removed because it was producing impossibly low calorie targets due to
 * a height-parsing bug.
 */

import {
    activityMultiplier,
    legacyHeightToCm,
} from '../../utils/measurements';

const DEFAULT_AGE = 28;
const DEFAULT_ACTIVITY_LEVEL = 'moderate';
const DEFAULT_HEIGHT_CM = 170;

/**
 * Resolve a height in cm from inputs. Accepts either a numeric heightCm
 * or the legacy "X.YY" feet+inches string. Falls back to DEFAULT_HEIGHT_CM.
 */
const resolveHeightCm = (heightCm, legacyHeight) => {
    if (Number.isFinite(heightCm) && heightCm > 0) return heightCm;
    const parsed = legacyHeightToCm(legacyHeight);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return DEFAULT_HEIGHT_CM;
};

const calculateBMR = (weightKg, heightCm, gender, age) => {
    const weight = parseFloat(weightKg) || 70;
    const height = Number.isFinite(heightCm) && heightCm > 0 ? heightCm : DEFAULT_HEIGHT_CM;
    const ageYears = Number.isFinite(age) && age > 0 ? age : DEFAULT_AGE;
    const isMale = typeof gender === 'string' && gender.trim().toLowerCase() === 'male';
    if (isMale) {
        return (10 * weight) + (6.25 * height) - (5 * ageYears) + 5;
    }
    return (10 * weight) + (6.25 * height) - (5 * ageYears) - 161;
};

const calculateTDEE = (bmr, activityLevel) => {
    return bmr * activityMultiplier(activityLevel);
};

const adjustCaloriesForGoal = (tdee, goal) => {
    switch (goal) {
        case 'Weight Loss':
            return tdee - 500;
        case 'Muscle Gain':
            return tdee + 300;
        case 'Weight Gain':
            return tdee + 500;
        default:
            return tdee;
    }
};

const calculateMacros = (calories, goal) => {
    let carbPercent;
    let proteinPercent;
    let fatPercent;

    switch (goal) {
        case 'Weight Loss':
            carbPercent = 0.40;
            proteinPercent = 0.30;
            fatPercent = 0.30;
            break;
        case 'Muscle Gain':
            carbPercent = 0.45;
            proteinPercent = 0.30;
            fatPercent = 0.25;
            break;
        case 'Weight Gain':
            carbPercent = 0.50;
            proteinPercent = 0.20;
            fatPercent = 0.30;
            break;
        default:
            carbPercent = 0.45;
            proteinPercent = 0.30;
            fatPercent = 0.25;
    }

    const proteins = Math.round((calories * proteinPercent) / 4);
    const carbohydrates = Math.round((calories * carbPercent) / 4);
    const fat = Math.round((calories * fatPercent) / 9);
    const sodium = 2300;
    const sugar = Math.round((calories * 0.10) / 4);

    return {
        calories: Math.round(calories),
        proteins,
        carbohydrates,
        fat,
        sodium,
        sugar,
    };
};

/**
 * Compute calorie + macro targets.
 *
 * Backwards-compatible signature: existing callers that pass
 * (weight, height, gender, goal) still work and get DEFAULT_AGE +
 * 'moderate' activity. New callers should use the (weight, options) form:
 *
 *   CalculateNutritionGoalsManually(weight, {
 *     heightCm, height, gender, goal, age, activityLevel,
 *   })
 */
export const CalculateNutritionGoalsManually = (weight, heightOrOptions, gender, goal) => {
    try {
        let heightCm;
        let legacyHeight;
        let resolvedGender = gender;
        let resolvedGoal = goal;
        let age;
        let activityLevel;

        if (heightOrOptions && typeof heightOrOptions === 'object') {
            const opts = heightOrOptions;
            heightCm = opts.heightCm;
            legacyHeight = opts.height;
            resolvedGender = opts.gender ?? gender;
            resolvedGoal = opts.goal ?? goal;
            age = opts.age;
            activityLevel = opts.activityLevel;
        } else {
            // Legacy positional call: heightOrOptions is the legacy "X.YY" string
            legacyHeight = heightOrOptions;
        }

        const cm = resolveHeightCm(heightCm, legacyHeight);
        const bmr = calculateBMR(weight, cm, resolvedGender, age);
        const tdee = calculateTDEE(bmr, activityLevel);
        const targetCalories = adjustCaloriesForGoal(tdee, resolvedGoal);
        return calculateMacros(targetCalories, resolvedGoal);
    } catch (error) {
        console.error('Manual calculation error:', error);
        return {
            calories: 2000,
            proteins: 100,
            carbohydrates: 225,
            fat: 56,
            sodium: 2300,
            sugar: 50,
        };
    }
};

/**
 * Explainable AI (XAI) Service for WELLUS
 * Provides clear, percentage-based explanations for nutrition recommendations
 */

/**
 * Generate explanation for a specific macronutrient
 * @param {string} macroName - Name of the macronutrient (calories, protein, carbs, fat, sodium, sugar)
 * @param {number} current - Current consumed amount
 * @param {number} goal - Daily goal amount
 * @param {string} unit - Unit of measurement (kcal, g, mg)
 * @returns {object} Explanation object with message, percentage, and recommendation
 */
export const GenerateMacroExplanation = (macroName, current, goal, unit) => {
    if (!goal || goal === 0) {
        return {
            message: `No goal set for ${macroName}.`,
            percentage: 0,
            status: 'info',
            recommendation: 'Set your daily goals in preferences.'
        };
    }

    const percentage = Math.round((current / goal) * 100);
    const remaining = Math.max(0, goal - current);
    const over = Math.max(0, current - goal);

    let message = '';
    let status = 'good'; // good, warning, danger
    let recommendation = '';
    let healthImportance = ''; // Why this macro is important for health

    // Customize messages based on macro type
    switch (macroName.toLowerCase()) {
        case 'calories':
            healthImportance = 'Calories provide energy for daily activities and bodily functions.';
            if (percentage >= 100) {
                message = `${percentage}% of daily calories consumed.`;
                status = 'warning';
                recommendation = 'Choose lighter options for remaining meals.';
            } else if (percentage >= 80) {
                message = `${percentage}% consumed (${current.toFixed(0)}/${goal.toFixed(0)} ${unit}).`;
                status = 'warning';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining. Choose nutrient-dense foods.`;
            } else if (percentage >= 50) {
                message = `${percentage}% of calorie goal reached.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            } else {
                message = `${percentage}% of daily calories consumed.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            }
            break;

        case 'protein':
            healthImportance = 'Protein builds and repairs muscles, supports immune function, and keeps you full.';
            if (percentage >= 100) {
                message = `${percentage}% of protein goal reached.`;
                status = 'good';
                recommendation = 'Excellent! Maintain this level.';
            } else if (percentage >= 80) {
                message = `${percentage}% consumed (${current.toFixed(0)}/${goal.toFixed(0)} ${unit}).`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} more needed.`;
            } else if (percentage >= 50) {
                message = `${percentage}% of protein goal reached.`;
                status = 'warning';
                recommendation = `Add ${remaining.toFixed(0)} ${unit} from lean sources.`;
            } else {
                message = `${percentage}% of daily protein consumed.`;
                status = 'warning';
                recommendation = `Add ${remaining.toFixed(0)} ${unit} more.`;
            }
            break;

        case 'carbohydrates':
        case 'carbs':
            healthImportance = 'Carbs fuel your brain and muscles, providing quick energy for daily activities.';
            if (percentage >= 100) {
                message = `${percentage}% of carb goal reached.`;
                status = 'warning';
                recommendation = 'Reduce carbs in remaining meals.';
            } else if (percentage >= 80) {
                message = `${percentage}% consumed (${current.toFixed(0)}/${goal.toFixed(0)} ${unit}).`;
                status = 'warning';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining. Choose complex carbs.`;
            } else if (percentage >= 50) {
                message = `${percentage}% of carb goal reached.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            } else {
                message = `${percentage}% of daily carbs consumed.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            }
            break;

        case 'fat':
            healthImportance = 'Healthy fats support brain function, hormone production, and vitamin absorption.';
            if (percentage >= 100) {
                message = `${percentage}% of fat goal reached.`;
                status = 'warning';
                recommendation = 'Limit high-fat foods in remaining meals.';
            } else if (percentage >= 80) {
                message = `${percentage}% consumed (${current.toFixed(0)}/${goal.toFixed(0)} ${unit}).`;
                status = 'warning';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining. Choose healthy fats.`;
            } else if (percentage >= 50) {
                message = `${percentage}% of fat goal reached.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            } else {
                message = `${percentage}% of daily fat consumed.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            }
            break;

        case 'sodium':
            healthImportance = 'Sodium maintains fluid balance, but excess can raise blood pressure and cause health issues.';
            if (percentage >= 100) {
                message = `Exceeded limit by ${over.toFixed(0)} ${unit}.`;
                status = 'danger';
                recommendation = 'Avoid high-sodium foods. Drink more water.';
            } else if (percentage >= 80) {
                message = `${percentage}% consumed (${current.toFixed(0)}/${goal.toFixed(0)} ${unit}).`;
                status = 'warning';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining. Choose low-sodium options.`;
            } else if (percentage >= 50) {
                message = `${percentage}% of sodium limit reached.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            } else {
                message = `${percentage}% of daily sodium consumed.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            }
            break;

        case 'sugar':
            healthImportance = 'Natural sugars from fruits provide energy, but excess added sugar can lead to weight gain and health problems.';
            if (percentage >= 100) {
                message = `Exceeded limit by ${over.toFixed(0)} ${unit}.`;
                status = 'danger';
                recommendation = 'Avoid sugary foods and drinks.';
            } else if (percentage >= 80) {
                message = `${percentage}% consumed (${current.toFixed(0)}/${goal.toFixed(0)} ${unit}).`;
                status = 'warning';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining. Choose natural sugars from fruits.`;
            } else if (percentage >= 50) {
                message = `${percentage}% of sugar goal reached.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            } else {
                message = `${percentage}% of daily sugar consumed.`;
                status = 'good';
                recommendation = `${remaining.toFixed(0)} ${unit} remaining.`;
            }
            break;

        default:
            healthImportance = 'This nutrient is essential for maintaining overall health and bodily functions.';
            message = `${percentage}% of ${macroName} goal consumed.`;
            status = percentage >= 100 ? 'warning' : 'good';
            recommendation = percentage >= 100 
                ? 'Reduce intake for remaining meals.'
                : `${remaining.toFixed(0)} ${unit} remaining.`;
    }

    return {
        message,
        percentage,
        status,
        recommendation,
        healthImportance,
        current: current.toFixed(1),
        goal: goal.toFixed(1),
        unit
    };
};

/**
 * Generate explanation for a food item being added
 * @param {object} foodData - Nutrition data of the food item
 * @param {object} userGoals - User's daily goals
 * @param {object} currentIntake - Current daily intake
 * @returns {string} Explanation message
 */
export const GenerateFoodItemExplanation = (foodData, userGoals, currentIntake) => {
    const { calories, protein, carbohydrates, fat, sodium, sugar } = foodData;
    
    const explanations = [];
    
    // Calculate impact on each macro
    const caloriesImpact = ((calories / (userGoals.calories || 2000)) * 100).toFixed(1);
    const proteinImpact = ((protein / (userGoals.proteins || 100)) * 100).toFixed(1);
    const carbsImpact = ((carbohydrates / (userGoals.carbohydrates || 225)) * 100).toFixed(1);
    const fatImpact = ((fat / (userGoals.fat || 56)) * 100).toFixed(1);
    const sodiumImpact = ((sodium / (userGoals.sodium || 2300)) * 100).toFixed(1);
    const sugarImpact = ((sugar / (userGoals.sugar || 50)) * 100).toFixed(1);

    // Build explanation
    let mainMessage = `This item provides ${caloriesImpact}% of your daily calories.`;
    
    if (protein > 0) {
        explanations.push(`Protein: ${proteinImpact}% of daily goal`);
    }
    if (carbohydrates > 0) {
        explanations.push(`Carbs: ${carbsImpact}% of daily goal`);
    }
    if (fat > 0) {
        explanations.push(`Fat: ${fatImpact}% of daily goal`);
    }
    if (sodium > 0 && sodiumImpact > 10) {
        explanations.push(`Sodium: ${sodiumImpact}% of daily limit (high)`);
    }
    if (sugar > 0 && sugarImpact > 10) {
        explanations.push(`Sugar: ${sugarImpact}% of daily limit (high)`);
    }

    // Check if adding this would exceed limits
    const newCalories = (currentIntake.calories || 0) + calories;
    const newSodium = (currentIntake.sodium || 0) + sodium;
    const newSugar = (currentIntake.sugar || 0) + sugar;

    let warning = '';
    if (newCalories > (userGoals.calories || 2000)) {
        warning = 'Adding this will exceed your daily calorie goal.';
    } else if (newSodium > (userGoals.sodium || 2300)) {
        warning = 'Adding this will exceed your daily sodium limit.';
    } else if (newSugar > (userGoals.sugar || 50)) {
        warning = 'Adding this will exceed your daily sugar limit.';
    }

    return {
        mainMessage,
        details: explanations,
        warning
    };
};


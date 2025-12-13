/**
 * Manual BMR/TDEE Calculation Service
 * Fallback when AI API is unavailable (rate limits, etc.)
 */

/**
 * Convert height from feet (e.g., "5.10") to centimeters
 */
const convertHeightToCm = (heightFt) => {
    if (!heightFt) return 170; // Default 5'7"
    const parts = heightFt.toString().split('.');
    const feet = parseFloat(parts[0]) || 5;
    const inches = parseFloat(parts[1]) || 7;
    const totalInches = feet * 12 + inches;
    return totalInches * 2.54;
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 */
const calculateBMR = (weightKg, heightCm, gender, age = 28) => {
    const weight = parseFloat(weightKg) || 70;
    const height = heightCm || 170;
    
    if (gender === 'Male') {
        // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * Using moderate activity level (1.55) as default
 */
const calculateTDEE = (bmr, activityLevel = 1.55) => {
    return bmr * activityLevel;
};

/**
 * Adjust calories based on goal
 */
const adjustCaloriesForGoal = (tdee, goal) => {
    switch (goal) {
        case 'Weight Loss':
            return tdee - 500; // Deficit for weight loss
        case 'Muscle Gain':
            return tdee + 300; // Surplus for muscle gain
        case 'Weight Gain':
            return tdee + 500; // Surplus for weight gain
        default:
            return tdee;
    }
};

/**
 * Calculate macronutrients based on calories and goal
 */
const calculateMacros = (calories, goal) => {
    let carbPercent, proteinPercent, fatPercent;
    
    switch (goal) {
        case 'Weight Loss':
            carbPercent = 0.40; // 40% carbs
            proteinPercent = 0.30; // 30% protein
            fatPercent = 0.30; // 30% fat
            break;
        case 'Muscle Gain':
            carbPercent = 0.45; // 45% carbs
            proteinPercent = 0.30; // 30% protein
            fatPercent = 0.25; // 25% fat
            break;
        case 'Weight Gain':
            carbPercent = 0.50; // 50% carbs
            proteinPercent = 0.20; // 20% protein
            fatPercent = 0.30; // 30% fat
            break;
        default:
            carbPercent = 0.45;
            proteinPercent = 0.30;
            fatPercent = 0.25;
    }
    
    // Calculate macros (1g protein = 4 cal, 1g carb = 4 cal, 1g fat = 9 cal)
    const proteins = Math.round((calories * proteinPercent) / 4);
    const carbohydrates = Math.round((calories * carbPercent) / 4);
    const fat = Math.round((calories * fatPercent) / 9);
    const sodium = 2300; // FDA recommendation
    const sugar = Math.round((calories * 0.10) / 4); // 10% of calories from sugar (WHO recommendation)
    
    return {
        calories: Math.round(calories),
        proteins,
        carbohydrates,
        fat,
        sodium,
        sugar
    };
};

/**
 * Main function to calculate all nutrition goals manually
 * @param {string} weight - Weight in kg
 * @param {string} height - Height in feet (e.g., "5.10")
 * @param {string} gender - "Male" or "Female"
 * @param {string} goal - "Weight Loss", "Muscle Gain", or "Weight Gain"
 * @returns {object} Nutrition goals object
 */
export const CalculateNutritionGoalsManually = (weight, height, gender, goal) => {
    try {
        // Convert height to cm
        const heightCm = convertHeightToCm(height);
        
        // Calculate BMR
        const bmr = calculateBMR(weight, heightCm, gender, 28);
        
        // Calculate TDEE (moderate activity level)
        const tdee = calculateTDEE(bmr, 1.55);
        
        // Adjust for goal
        const targetCalories = adjustCaloriesForGoal(tdee, goal);
        
        // Calculate macros
        const macros = calculateMacros(targetCalories, goal);
        
        // Calculation complete - no logging needed for performance
        
        return macros;
    } catch (error) {
        console.error('Manual calculation error:', error);
        // Return safe defaults
        return {
            calories: 2000,
            proteins: 100,
            carbohydrates: 225,
            fat: 56,
            sodium: 2300,
            sugar: 50
        };
    }
};


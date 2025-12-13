/**
 * Adaptive Monitoring Service for WELLUS
 * Detects eating patterns and provides adaptive recommendations
 */

/**
 * Detect eating patterns from event history
 * @param {Array} events - Array of eating events from the last N days
 * @param {object} userGoals - User's daily goals
 * @returns {object} Detected patterns and recommendations
 */
export const DetectEatingPatterns = (events, userGoals) => {
    if (!events || events.length === 0) {
        return {
            patterns: [],
            recommendations: []
        };
    }

    const patterns = [];
    const recommendations = [];

    // Pattern 1: Late-night eating (after 9 PM)
    const lateNightEvents = events.filter(e => e.hour >= 21 || e.hour < 6);
    const lateNightCount = lateNightEvents.length;
    const lateNightPercentage = (lateNightCount / events.length) * 100;

    if (lateNightPercentage >= 30) {
        patterns.push({
            type: 'late_night_eating',
            severity: lateNightPercentage >= 50 ? 'high' : 'medium',
            frequency: lateNightCount,
            percentage: lateNightPercentage.toFixed(1),
            description: `You're eating ${lateNightPercentage.toFixed(0)}% of your meals after 9 PM or before 6 AM.`
        });

        recommendations.push({
            type: 'late_night_eating',
            title: '🌙 Late-Night Eating Pattern Detected',
            message: `You've been eating ${lateNightCount} times during late hours. Late-night eating can disrupt sleep and lead to weight gain.`,
            suggestion: 'Try to finish dinner by 8 PM. If you feel hungry later, opt for light snacks like a small apple or herbal tea.',
            priority: lateNightPercentage >= 50 ? 'high' : 'medium'
        });
    }

    // Pattern 2: High sodium consumption
    const avgSodium = events.reduce((sum, e) => sum + (e.sodium || 0), 0) / events.length;
    const sodiumGoal = userGoals?.sodium || 2300;
    const sodiumPercentage = (avgSodium / sodiumGoal) * 100;

    if (sodiumPercentage >= 120) {
        patterns.push({
            type: 'high_sodium',
            severity: sodiumPercentage >= 150 ? 'high' : 'medium',
            average: avgSodium.toFixed(0),
            percentage: sodiumPercentage.toFixed(1),
            description: `Your average daily sodium intake is ${avgSodium.toFixed(0)}mg (${sodiumPercentage.toFixed(0)}% of limit).`
        });

        recommendations.push({
            type: 'high_sodium',
            title: '🧂 High Sodium Consumption Detected',
            message: `You're averaging ${avgSodium.toFixed(0)}mg of sodium per day, which exceeds the recommended limit.`,
            suggestion: 'Choose fresh foods over processed ones. Read labels and opt for low-sodium alternatives. Add flavor with herbs and spices instead of salt.',
            priority: sodiumPercentage >= 150 ? 'high' : 'medium'
        });
    }

    // Pattern 3: High sugar consumption
    const avgSugar = events.reduce((sum, e) => sum + (e.sugar || 0), 0) / events.length;
    const sugarGoal = userGoals?.sugar || 50;
    const sugarPercentage = (avgSugar / sugarGoal) * 100;

    if (sugarPercentage >= 120) {
        patterns.push({
            type: 'high_sugar',
            severity: sugarPercentage >= 150 ? 'high' : 'medium',
            average: avgSugar.toFixed(0),
            percentage: sugarPercentage.toFixed(1),
            description: `Your average daily sugar intake is ${avgSugar.toFixed(0)}g (${sugarPercentage.toFixed(0)}% of limit).`
        });

        recommendations.push({
            type: 'high_sugar',
            title: '🍬 High Sugar Consumption Detected',
            message: `You're averaging ${avgSugar.toFixed(0)}g of sugar per day, which exceeds the recommended limit.`,
            suggestion: 'Replace sugary drinks with water or unsweetened beverages. Choose whole fruits over fruit juices. Check labels for hidden sugars in processed foods.',
            priority: sugarPercentage >= 150 ? 'high' : 'medium'
        });
    }

    // Pattern 4: Skipping meals (low meal frequency)
    const daysWithMeals = new Set(events.map(e => e.date)).size;
    const totalDays = 7; // Analyze last 7 days
    const mealFrequency = (daysWithMeals / totalDays) * 100;

    if (mealFrequency < 70 && events.length < 14) { // Less than 2 meals per day on average
        patterns.push({
            type: 'low_meal_frequency',
            severity: 'medium',
            daysWithMeals,
            percentage: mealFrequency.toFixed(1),
            description: `You're eating on only ${daysWithMeals} out of the last ${totalDays} days.`
        });

        recommendations.push({
            type: 'low_meal_frequency',
            title: '⏰ Irregular Meal Pattern Detected',
            message: 'You might be skipping meals, which can slow metabolism and lead to overeating later.',
            suggestion: 'Try to eat regular meals throughout the day. Even small, balanced meals are better than skipping.',
            priority: 'medium'
        });
    }

    // Pattern 5: High calorie density in snacks
    const snackEvents = events.filter(e => e.mealType === 'Snack');
    if (snackEvents.length > 0) {
        const avgSnackCalories = snackEvents.reduce((sum, e) => sum + (e.calories || 0), 0) / snackEvents.length;
        if (avgSnackCalories > 300) {
            patterns.push({
                type: 'high_calorie_snacks',
                severity: avgSnackCalories > 400 ? 'high' : 'medium',
                average: avgSnackCalories.toFixed(0),
                description: `Your snacks average ${avgSnackCalories.toFixed(0)} calories each.`
            });

            recommendations.push({
                type: 'high_calorie_snacks',
                title: '🍪 High-Calorie Snacks Detected',
                message: `Your snacks are averaging ${avgSnackCalories.toFixed(0)} calories, which is quite high.`,
                suggestion: 'Choose nutrient-dense snacks under 200 calories. Examples: Greek yogurt, nuts (small portion), vegetables with hummus, or a piece of fruit.',
                priority: avgSnackCalories > 400 ? 'high' : 'medium'
            });
        }
    }

    // Pattern 6: Protein deficiency
    const avgProtein = events.reduce((sum, e) => sum + (e.protein || 0), 0) / events.length;
    const proteinGoal = userGoals?.proteins || 100;
    const proteinPercentage = (avgProtein / proteinGoal) * 100;

    if (proteinPercentage < 70) {
        patterns.push({
            type: 'low_protein',
            severity: proteinPercentage < 50 ? 'high' : 'medium',
            average: avgProtein.toFixed(0),
            percentage: proteinPercentage.toFixed(1),
            description: `Your average daily protein intake is ${avgProtein.toFixed(0)}g (${proteinPercentage.toFixed(0)}% of goal).`
        });

        recommendations.push({
            type: 'low_protein',
            title: '💪 Low Protein Intake Detected',
            message: `You're averaging ${avgProtein.toFixed(0)}g of protein per day, which is below your goal of ${proteinGoal}g.`,
            suggestion: 'Include protein in every meal. Good sources: lean meats, fish, eggs, legumes, Greek yogurt, and protein-rich grains like quinoa.',
            priority: proteinPercentage < 50 ? 'high' : 'medium'
        });
    }

    return {
        patterns,
        recommendations: recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
    };
};

/**
 * Generate adaptive recommendation based on current intake and patterns
 * This function ADAPTS suggestions based on detected patterns
 * @param {object} currentIntake - Today's intake so far
 * @param {object} userGoals - User's daily goals
 * @param {Array} patterns - Detected patterns from eating history
 * @returns {object} Adaptive recommendation message that changes based on patterns
 */
export const GenerateAdaptiveRecommendation = (currentIntake, userGoals, patterns = []) => {
    const caloriesRemaining = (userGoals?.calories || 2000) - (currentIntake?.calories || 0);
    const proteinRemaining = (userGoals?.proteins || 100) - (currentIntake?.protein || 0);
    const carbsRemaining = (userGoals?.carbohydrates || 225) - (currentIntake?.carbohydrates || 0);
    const fatRemaining = (userGoals?.fat || 56) - (currentIntake?.fat || 0);
    const sodiumCurrent = currentIntake?.sodium || 0;
    const sugarCurrent = currentIntake?.sugar || 0;
    const sodiumGoal = userGoals?.sodium || 2300;
    const sugarGoal = userGoals?.sugar || 50;
    const sodiumPercentage = (sodiumCurrent / sodiumGoal) * 100;
    const sugarPercentage = (sugarCurrent / sugarGoal) * 100;

    // Get current time for time-based recommendations
    const currentHour = new Date().getHours();

    // PRIORITY 1: Check for active patterns and adapt recommendations accordingly
    const highPriorityPattern = patterns.find(p => p.severity === 'high');
    const lateNightPattern = patterns.find(p => p.type === 'late_night_eating');
    const highSodiumPattern = patterns.find(p => p.type === 'high_sodium');
    const highSugarPattern = patterns.find(p => p.type === 'high_sugar');
    const lowProteinPattern = patterns.find(p => p.type === 'low_protein');

    // ADAPTIVE: If user has late-night eating pattern AND it's late, give specific warning
    if (lateNightPattern && currentHour >= 21) {
        return {
            message: `🌙 Late-night eating detected in your patterns. It's ${currentHour}:00 - consider skipping food until tomorrow morning to break this habit.`,
            type: 'warning',
            priority: 'high',
            patternBased: true
        };
    }

    // ADAPTIVE: If user has high sodium pattern AND already exceeded today
    if (highSodiumPattern && sodiumPercentage > 100) {
        return {
            message: `⚠️ You've exceeded your sodium limit today (${sodiumCurrent.toFixed(0)}mg). Given your pattern of high sodium intake, focus on fresh, unprocessed foods for the rest of the day.`,
            type: 'warning',
            priority: 'high',
            patternBased: true
        };
    }

    // ADAPTIVE: If user has high sodium pattern AND approaching limit
    if (highSodiumPattern && sodiumPercentage >= 80 && sodiumPercentage < 100) {
        return {
            message: `🧂 You're at ${sodiumPercentage.toFixed(0)}% of your sodium limit. Since you tend to exceed sodium, choose low-sodium options for remaining meals.`,
            type: 'warning',
            priority: 'medium',
            patternBased: true
        };
    }

    // ADAPTIVE: If user has high sugar pattern AND already exceeded today
    if (highSugarPattern && sugarPercentage > 100) {
        return {
            message: `🍬 You've exceeded your sugar limit today (${sugarCurrent.toFixed(0)}g). Given your pattern of high sugar intake, avoid sugary foods for the rest of the day.`,
            type: 'warning',
            priority: 'high',
            patternBased: true
        };
    }

    // ADAPTIVE: If user has high sugar pattern AND approaching limit
    if (highSugarPattern && sugarPercentage >= 80 && sugarPercentage < 100) {
        return {
            message: `🍬 You're at ${sugarPercentage.toFixed(0)}% of your sugar limit. Since you tend to exceed sugar, choose whole fruits or unsweetened options.`,
            type: 'warning',
            priority: 'medium',
            patternBased: true
        };
    }

    // ADAPTIVE: If user has low protein pattern AND needs more protein today
    if (lowProteinPattern && proteinRemaining > 30) {
        return {
            message: `💪 You need ${proteinRemaining.toFixed(0)}g more protein today. Your pattern shows low protein intake - prioritize protein-rich foods in your next meal.`,
            type: 'info',
            priority: 'high',
            patternBased: true
        };
    }

    // PRIORITY 2: Time-based adaptive recommendations
    if (currentHour >= 21 && caloriesRemaining > 300) {
        // If late-night pattern exists, make it more urgent
        if (lateNightPattern) {
            return {
                message: `🌙 It's late (${currentHour}:00)! You have ${caloriesRemaining.toFixed(0)} calories remaining, but consider skipping to break your late-night eating pattern.`,
                type: 'warning',
                priority: 'high',
                patternBased: true
            };
        }
        return {
            message: `🌙 It's late! Consider a light snack (under 200 calories) or skip eating until tomorrow morning.`,
            type: 'info',
            priority: 'medium',
            patternBased: false
        };
    }

    // PRIORITY 3: Calorie-based recommendations (adapt based on patterns)
    if (caloriesRemaining < 0) {
        // If high-calorie snack pattern exists, mention it
        const highCalorieSnackPattern = patterns.find(p => p.type === 'high_calorie_snacks');
        if (highCalorieSnackPattern) {
            return {
                message: `⚠️ You've exceeded your calorie goal. Your pattern shows high-calorie snacks - consider lighter snack options going forward.`,
                type: 'warning',
                priority: 'high',
                patternBased: true
            };
        }
        return {
            message: `You've exceeded your daily calorie goal. Consider lighter options for any remaining meals.`,
            type: 'warning',
            priority: 'high',
            patternBased: false
        };
    } else if (caloriesRemaining < 300) {
        // Adapt suggestion based on low protein pattern
        if (lowProteinPattern) {
            return {
                message: `You have ${caloriesRemaining.toFixed(0)} calories remaining. Use them wisely - prioritize protein-rich foods to address your low protein pattern.`,
                type: 'info',
                priority: 'medium',
                patternBased: true
            };
        }
        return {
            message: `You have ${caloriesRemaining.toFixed(0)} calories remaining. Choose nutrient-dense foods to maximize nutrition.`,
            type: 'info',
            priority: 'medium',
            patternBased: false
        };
    } else if (proteinRemaining > 30) {
        // If low protein pattern exists, make it more urgent
        if (lowProteinPattern) {
            return {
                message: `💪 You need ${proteinRemaining.toFixed(0)}g more protein today. Your eating pattern shows low protein - make protein a priority in your next meal.`,
                type: 'warning',
                priority: 'high',
                patternBased: true
            };
        }
        return {
            message: `You need ${proteinRemaining.toFixed(0)}g more protein today. Include lean protein in your next meal.`,
            type: 'info',
            priority: 'medium',
            patternBased: false
        };
    }

    // PRIORITY 4: Positive feedback (adapt if patterns are improving)
    if (patterns.length === 0) {
        return {
            message: `✅ Great job! You're on track with ${caloriesRemaining.toFixed(0)} calories remaining. No concerning patterns detected in your recent eating habits.`,
            type: 'success',
            priority: 'low',
            patternBased: false
        };
    }

    // Default: On track but with pattern awareness
    return {
        message: `You're on track! ${caloriesRemaining.toFixed(0)} calories remaining. Keep monitoring your eating patterns.`,
        type: 'success',
        priority: 'low',
        patternBased: false
    };
};


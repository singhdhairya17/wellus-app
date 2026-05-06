import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/** Coerce stored macro values to finite numbers (JSON / AI may use strings). */
const num = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
}

/**
 * Planned recipe meals count unless status === false. Legacy docs with no status still count (undefined treated as logged).
 * New inserts use status: false until the user ticks the checkbox.
 */
const mealPlansForIntake = (rows) => rows.filter((mp) => mp.status !== false)

const scannedFoodsForIntake = (foods) =>
    foods.filter((f) => f.includeInDailyTotal !== false)

async function deleteMatchingRecipeEatingEvents(ctx, mealPlan) {
    const recipe = await ctx.db.get(mealPlan.recipeId)
    const events = await ctx.db
        .query('eatingEvents')
        .filter((q) =>
            q.and(
                q.eq(q.field('uid'), mealPlan.uid),
                q.eq(q.field('date'), mealPlan.date),
                q.eq(q.field('mealType'), mealPlan.mealType),
                q.eq(q.field('source'), 'recipe')
            )
        )
        .collect()
    const target = num(recipe?.jsonData?.calories ?? mealPlan.calories ?? 0)
    for (const e of events) {
        if (Math.abs(num(e.calories) - target) <= Math.max(30, target * 0.2)) {
            await ctx.db.delete(e._id)
        }
    }
}

async function deleteMatchingScannedEatingEvents(ctx, food) {
    const events = await ctx.db
        .query('eatingEvents')
        .filter((q) =>
            q.and(
                q.eq(q.field('uid'), food.uid),
                q.eq(q.field('date'), food.date),
                q.eq(q.field('mealType'), food.mealType),
                q.eq(q.field('source'), 'scanned')
            )
        )
        .collect()
    const target = num(food.calories)
    for (const e of events) {
        if (Math.abs(num(e.calories) - target) < 15) {
            await ctx.db.delete(e._id)
            break
        }
    }
}

export const CreateMealPlan = mutation({
    args: {
        recipeId: v.id('recipes'),
        date: v.string(),
        mealType: v.string(),
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('mealPlan', {
            recipeId: args.recipeId,
            date: args.date,
            mealType: args.mealType,
            uid: args.uid,
            status: false,
        })
        return result
    }
})

export const GetTodaysMealPlan = query({
    args: {
        uid: v.id('users'),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            // Fetch meal plans and scanned foods in parallel for faster loading
            const [mealPlans, scannedFoods] = await Promise.all([
                ctx.db.query('mealPlan')
                    .filter(q =>
                        q.and(
                            q.eq(q.field('uid'), args.uid),
                            q.eq(q.field('date'), args.date)
                        )
                    )
                    .collect(),
                ctx.db.query('scannedFoods')
                    .filter(q =>
                        q.and(
                            q.eq(q.field('uid'), args.uid),
                            q.eq(q.field('date'), args.date)
                        )
                    )
                    .collect()
            ]);

            // Ensure we have arrays (safety check)
            const safeMealPlans = Array.isArray(mealPlans) ? mealPlans : [];
            const safeScannedFoods = Array.isArray(scannedFoods) ? scannedFoods : [];

            // Process meal plans (with recipe lookups) - optimize by batching
            const recipeIds = safeMealPlans.map(mp => mp?.recipeId).filter(Boolean);
            const recipes = await Promise.all(
                recipeIds.map(id => ctx.db.get(id))
            );
            const recipeMap = new Map(recipes.filter(Boolean).map(r => [r._id, r]));
            
            const results = safeMealPlans.map((mealPlan) => {
                if (!mealPlan) return null;
                const recipe = recipeMap.get(mealPlan.recipeId);
                return {
                    mealPlan,
                    recipe: recipe || null,
                };
            }).filter(Boolean);

            // Process scanned foods immediately (no async lookups needed - faster!)
            // Also fetch eating event for timestamp
            const scannedFoodResults = await Promise.all(
                safeScannedFoods.map(async (food) => {
                    if (!food) return null;
                    
                    // Get eating event timestamp for this scanned food
                    const eatingEvents = await ctx.db.query('eatingEvents')
                        .filter(q =>
                            q.and(
                                q.eq(q.field('uid'), args.uid),
                                q.eq(q.field('date'), food.date),
                                q.eq(q.field('source'), 'scanned')
                            )
                        )
                        .collect();
                    
                    // Find matching event by calories and mealType (best match)
                    const matchingEvent = eatingEvents.find(e => 
                        e.mealType === food.mealType && 
                        Math.abs(e.calories - food.calories) < 5 // Within 5 calories
                    );
                    
                    return {
                        mealPlan: {
                            _id: food._id,
                            date: food.date,
                            mealType: food.mealType,
                            calories: food.calories,
                            foodName: food.foodName,
                            imageUri: food.imageUri || '',
                            isScannedFood: true,
                            includeInDailyTotal: food.includeInDailyTotal !== false,
                            _creationTime: food._creationTime,
                            finishedEatingTime: matchingEvent?.timestamp || null,
                        },
                        recipe: {
                            _id: food._id,
                            recipeName: food.foodName,
                            imageUrl: food.imageUri || '',
                            jsonData: {
                                calories: food.calories,
                                proteins: food.protein,
                                carbohydrates: food.carbohydrates,
                                fat: food.fat,
                                sodium: food.sodium || 0,
                                sugar: food.sugar || 0
                            },
                            isScannedFood: true // Flag to identify scanned foods
                        }
                    };
                })
            );
            
            const filteredScannedFoodResults = scannedFoodResults.filter(Boolean);

            // Return scanned foods first so they render immediately, then regular meals
            return [...filteredScannedFoodResults, ...results];
        } catch (error) {
            console.error('Error in GetTodaysMealPlan:', error);
            // Return empty array on error to prevent .map() errors
            return [];
        }
    },
});

/**
 * Get meal plan summary for a date range (for calendar view)
 */
export const GetMealPlanSummary = query({
    args: {
        uid: v.id('users'),
        startDate: v.string(), // DD/MM/YYYY
        endDate: v.string() // DD/MM/YYYY
    },
    handler: async (ctx, args) => {
        // Parse dates
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('/');
            return new Date(year, month - 1, day);
        };

        const start = parseDate(args.startDate);
        const end = parseDate(args.endDate);

        // Get all meal plans in range
        const allMealPlans = await ctx.db.query('mealPlan')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect();

        // Get all scanned foods in range
        const allScannedFoods = await ctx.db.query('scannedFoods')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect();

        // Filter by date range and group by date
        const summary = {};

        // Process meal plans
        for (const mealPlan of allMealPlans) {
            const mealDate = parseDate(mealPlan.date);
            if (mealDate >= start && mealDate <= end) {
                if (!summary[mealPlan.date]) {
                    summary[mealPlan.date] = {
                        date: mealPlan.date,
                        totalMeals: 0,
                        eatenMeals: 0,
                        skippedMeals: 0,
                        meals: []
                    };
                }
                summary[mealPlan.date].totalMeals++
                const recipeCounted =
                    mealPlan.status === true || mealPlan.status === undefined
                if (recipeCounted) {
                    summary[mealPlan.date].eatenMeals++
                } else {
                    summary[mealPlan.date].skippedMeals++
                }
            }
        }

        // Scanned foods: respect includeInDailyTotal for summary
        for (const food of allScannedFoods) {
            const foodDate = parseDate(food.date);
            if (foodDate >= start && foodDate <= end) {
                if (!summary[food.date]) {
                    summary[food.date] = {
                        date: food.date,
                        totalMeals: 0,
                        eatenMeals: 0,
                        skippedMeals: 0,
                        meals: []
                    };
                }
                summary[food.date].totalMeals++
                const counted = food.includeInDailyTotal !== false
                if (counted) {
                    summary[food.date].eatenMeals++
                } else {
                    summary[food.date].skippedMeals++
                }
            }
        }

        return Object.values(summary);
    }
});

export const updateStatus = mutation({
    args: {
        id: v.id('mealPlan'),
        status: v.boolean(),
        calories: v.number()
    },
    handler: async (ctx, args) => {
        const mealPlan = await ctx.db.get(args.id)
        if (!mealPlan) return

        await deleteMatchingRecipeEatingEvents(ctx, mealPlan)

        const result = await ctx.db.patch(args.id, {
            status: args.status,
            calories: args.calories,
        })

        if (args.status && mealPlan) {
            const recipe = await ctx.db.get(mealPlan.recipeId)
            if (recipe?.jsonData) {
                const now = new Date()
                const hour = now.getHours()
                const jd = recipe.jsonData
                await ctx.db.insert('eatingEvents', {
                    uid: mealPlan.uid,
                    date: mealPlan.date,
                    timestamp: now.toISOString(),
                    mealType: mealPlan.mealType,
                    hour,
                    calories: num(jd.calories ?? args.calories ?? 0),
                    protein: num(jd.proteins ?? jd.protein ?? 0),
                    carbohydrates: num(jd.carbohydrates ?? 0),
                    fat: num(jd.fat ?? 0),
                    sodium: num(jd.sodium ?? 0),
                    sugar: num(jd.sugar ?? 0),
                    source: 'recipe',
                })
            }
        }

        return result
    },
})


export const GetTotalCaloriesConsumed = query({
    args: {
        date: v.string(),
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const mealPlanRows = await ctx.db.query('mealPlan')
            .filter(q =>
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('date'), args.date)
                )
            )
            .collect();
        const mealPlanResult = mealPlansForIntake(mealPlanRows);

        const scannedFoodsResult = scannedFoodsForIntake(
            (await ctx.db.query('scannedFoods')
                .filter((q) =>
                    q.and(
                        q.eq(q.field('uid'), args.uid),
                        q.eq(q.field('date'), args.date)
                    )
                )
                .collect()) || []
        )

        let totalCaloriesFromMeals = 0
        for (const mealPlan of mealPlanResult) {
            const recipe = await ctx.db.get(mealPlan.recipeId)
            totalCaloriesFromMeals += num(
                recipe?.jsonData?.calories ?? mealPlan.calories
            )
        }

        const totalCaloriesFromScanned =
            scannedFoodsResult.reduce((sum, food) => sum + num(food.calories), 0) || 0

        return totalCaloriesFromMeals + totalCaloriesFromScanned
    }
})

// Save scanned food item
export const SaveScannedFood = mutation({
    args: {
        uid: v.id('users'),
        date: v.string(),
        mealType: v.string(),
        foodName: v.optional(v.string()),
        calories: v.number(),
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        sodium: v.number(),
        sugar: v.number(),
        servingSize: v.optional(v.string()),
        servingsPerContainer: v.optional(v.number()),
        imageUri: v.optional(v.string()),
        includeInDailyTotal: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const included = args.includeInDailyTotal !== false

        const result = await ctx.db.insert('scannedFoods', {
            uid: args.uid,
            date: args.date,
            mealType: args.mealType,
            foodName: args.foodName,
            calories: args.calories,
            protein: args.protein,
            carbohydrates: args.carbohydrates,
            fat: args.fat,
            sodium: args.sodium,
            sugar: args.sugar,
            servingSize: args.servingSize,
            servingsPerContainer: args.servingsPerContainer,
            imageUri: args.imageUri,
            ...(included ? {} : { includeInDailyTotal: false }),
        })

        if (included) {
            const now = new Date()
            const hour = now.getHours()
            await ctx.db.insert('eatingEvents', {
                uid: args.uid,
                date: args.date,
                timestamp: now.toISOString(),
                mealType: args.mealType,
                hour,
                calories: args.calories,
                protein: args.protein,
                carbohydrates: args.carbohydrates,
                fat: args.fat,
                sodium: args.sodium,
                sugar: args.sugar,
                source: 'scanned',
            })
        }

        return result
    },
})

export const setScannedFoodIncludeInDailyTotal = mutation({
    args: {
        id: v.id('scannedFoods'),
        includeInDailyTotal: v.boolean(),
    },
    handler: async (ctx, args) => {
        const food = await ctx.db.get(args.id)
        if (!food) {
            throw new Error('Scanned food not found')
        }

        await deleteMatchingScannedEatingEvents(ctx, food)
        await ctx.db.patch(args.id, {
            includeInDailyTotal: args.includeInDailyTotal,
        })

        if (args.includeInDailyTotal) {
            const now = new Date()
            const hour = now.getHours()
            await ctx.db.insert('eatingEvents', {
                uid: food.uid,
                date: food.date,
                timestamp: now.toISOString(),
                mealType: food.mealType,
                hour,
                calories: food.calories,
                protein: food.protein,
                carbohydrates: food.carbohydrates,
                fat: food.fat,
                sodium: food.sodium,
                sugar: food.sugar,
                source: 'scanned',
            })
        }

        return args.id
    },
})

// Update scanned food item
export const UpdateScannedFood = mutation({
    args: {
        id: v.id('scannedFoods'),
        foodName: v.optional(v.string()),
        calories: v.optional(v.number()),
        protein: v.optional(v.number()),
        carbohydrates: v.optional(v.number()),
        fat: v.optional(v.number()),
        sodium: v.optional(v.number()),
        sugar: v.optional(v.number()),
        servingSize: v.optional(v.string()),
        servingsPerContainer: v.optional(v.number()),
        mealType: v.optional(v.string()),
        date: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        
        // Get existing scanned food
        const existingFood = await ctx.db.get(id);
        if (!existingFood) {
            throw new Error('Scanned food not found');
        }
        
        // Build update object (only include fields that are provided)
        const updateData = {};
        if (updates.foodName !== undefined) updateData.foodName = updates.foodName;
        if (updates.calories !== undefined) updateData.calories = updates.calories;
        if (updates.protein !== undefined) updateData.protein = updates.protein;
        if (updates.carbohydrates !== undefined) updateData.carbohydrates = updates.carbohydrates;
        if (updates.fat !== undefined) updateData.fat = updates.fat;
        if (updates.sodium !== undefined) updateData.sodium = updates.sodium;
        if (updates.sugar !== undefined) updateData.sugar = updates.sugar;
        if (updates.servingSize !== undefined) updateData.servingSize = updates.servingSize;
        if (updates.servingsPerContainer !== undefined) updateData.servingsPerContainer = updates.servingsPerContainer;
        if (updates.mealType !== undefined) updateData.mealType = updates.mealType;
        if (updates.date !== undefined) updateData.date = updates.date;
        
        // Update the scanned food
        await ctx.db.patch(id, updateData);
        
        // Update the corresponding eating event if it exists
        const eatingEvents = await ctx.db.query('eatingEvents')
            .filter(q =>
                q.and(
                    q.eq(q.field('uid'), existingFood.uid),
                    q.eq(q.field('date'), existingFood.date),
                    q.eq(q.field('source'), 'scanned')
                )
            )
            .collect();
        
        // Find matching event
        const matchingEvent = eatingEvents.find(e => 
            e.mealType === existingFood.mealType && 
            Math.abs(e.calories - existingFood.calories) < 5
        );
        
        if (matchingEvent) {
            // Update eating event with new values
            const eventUpdates = {};
            if (updates.calories !== undefined) eventUpdates.calories = updates.calories;
            if (updates.protein !== undefined) eventUpdates.protein = updates.protein;
            if (updates.carbohydrates !== undefined) eventUpdates.carbohydrates = updates.carbohydrates;
            if (updates.fat !== undefined) eventUpdates.fat = updates.fat;
            if (updates.sodium !== undefined) eventUpdates.sodium = updates.sodium;
            if (updates.sugar !== undefined) eventUpdates.sugar = updates.sugar;
            if (updates.mealType !== undefined) eventUpdates.mealType = updates.mealType;
            if (updates.date !== undefined) eventUpdates.date = updates.date;
            
            if (Object.keys(eventUpdates).length > 0) {
                await ctx.db.patch(matchingEvent._id, eventUpdates);
            }
        }
        
        return true;
    }
})

// Get daily macronutrients totals
export const GetDailyMacronutrients = query({
    args: {
        date: v.string(),
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const mealPlanRows = await ctx.db.query('mealPlan')
            .filter(q =>
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('date'), args.date)
                )
            )
            .collect();
        const mealPlans = mealPlansForIntake(mealPlanRows);

        const scannedFoods = scannedFoodsForIntake(
            (await ctx.db.query('scannedFoods')
                .filter((q) =>
                    q.and(
                        q.eq(q.field('uid'), args.uid),
                        q.eq(q.field('date'), args.date)
                    )
                )
                .collect()) || []
        )

        let totalCalories = 0
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalSodium = 0;
        let totalSugar = 0;

        for (const mealPlan of mealPlans) {
            const recipe = await ctx.db.get(mealPlan.recipeId);
            totalCalories += num(recipe?.jsonData?.calories ?? mealPlan.calories);
            totalProtein += num(
                recipe?.jsonData?.proteins ?? recipe?.jsonData?.protein
            );
            totalCarbs += num(recipe?.jsonData?.carbohydrates);
            totalFat += num(recipe?.jsonData?.fat);
            totalSodium += num(recipe?.jsonData?.sodium);
            totalSugar += num(recipe?.jsonData?.sugar);
        }

        for (const food of scannedFoods) {
            totalCalories += num(food.calories);
            totalProtein += num(food.protein);
            totalCarbs += num(food.carbohydrates);
            totalFat += num(food.fat);
            totalSodium += num(food.sodium);
            totalSugar += num(food.sugar);
        }

        return {
            calories: totalCalories,
            protein: totalProtein,
            carbohydrates: totalCarbs,
            fat: totalFat,
            sodium: totalSodium,
            sugar: totalSugar
        };
    }
})
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

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
            uid: args.uid
        });
        return result;
    }
})

export const GetTodaysMealPlan = query({
    args: {
        uid: v.id('users'),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        // Fetch All Meal Plans for the user on a specific date
        const mealPlans = await ctx.db.query('mealPlan')
            .filter(q =>
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('date'), args.date)
                )
            )
            .collect();

        const results = await Promise.all(
            mealPlans.map(async (mealPlan) => {
                const recipe = await ctx.db.get(mealPlan.recipeId);
                return {
                    mealPlan,
                    recipe,
                };
            })
        );

        return results;
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id('mealPlan'),
        status: v.boolean(),
        calories: v.number()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.patch(args.id, {
            status: args.status,
            calories: args.calories
        })
    }
})


export const GetTotalCaloriesConsumed = query({
    args: {
        date: v.string(),
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const mealPlanResult = await ctx.db.query('mealPlan')
            .filter(q =>
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('date'), args.date),
                    q.eq(q.field('status'), true)
                )
            )
            .collect();

        const totalCalories = mealPlanResult?.reduce((sum, meal) => {
            return sum + (meal.calories ?? 0);
        }, 0)

        return totalCalories
    }

})
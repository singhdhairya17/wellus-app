import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const ToggleMealReminder = mutation({
    args: {
        uid: v.id('users'),
        mealType: v.string(),
        enabled: v.boolean(),
        hour: v.number(),
        minute: v.number(),
        daysOfWeek: v.array(v.number())
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            throw new Error("User not found")
        }
        
        // Check if reminder exists
        const existing = await ctx.db
            .query('mealReminders')
            .withIndex('by_user')
            .filter(q => 
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('mealType'), args.mealType)
                )
            )
            .first()
        
        if (existing) {
            // Update existing reminder
            return await ctx.db.patch(existing._id, {
                enabled: args.enabled,
                hour: args.hour,
                minute: args.minute,
                daysOfWeek: args.daysOfWeek
            })
        } else {
            // Create new reminder
            return await ctx.db.insert('mealReminders', {
                uid: args.uid,
                mealType: args.mealType,
                enabled: args.enabled,
                hour: args.hour,
                minute: args.minute,
                daysOfWeek: args.daysOfWeek
            })
        }
    }
})

export const GetMealReminders = query({
    args: {
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return []
        }
        
        return await ctx.db
            .query('mealReminders')
            .withIndex('by_user', q => q.eq('uid', args.uid))
            .collect()
    }
})


import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get user's billing history
 */
export const GetBillingHistory = query({
    args: {
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const history = await ctx.db.query('billingHistory')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .order('desc')
            .collect();
        
        return history;
    }
});

/**
 * Get user's current subscription status
 */
export const GetSubscriptionStatus = query({
    args: {
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.uid);
        if (!user) return null;

        // Check if user has an active subscription
        const activeSubscription = await ctx.db.query('billingHistory')
            .filter(q =>
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('type'), 'subscription'),
                    q.eq(q.field('status'), 'completed')
                )
            )
            .order('desc')
            .first();

        const isActive = activeSubscription && 
            activeSubscription.expiresAt && 
            activeSubscription.expiresAt > Date.now();

        return {
            isActive,
            planName: isActive ? activeSubscription.planName : 'Free',
            expiresAt: activeSubscription?.expiresAt || null,
            credits: user.credits || 0
        };
    }
});

/**
 * Purchase credits
 */
export const PurchaseCredits = mutation({
    args: {
        uid: v.id('users'),
        credits: v.number(),
        amount: v.number(),
        transactionId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Add credits to user account
        const user = await ctx.db.get(args.uid);
        if (!user) {
            throw new Error('User not found');
        }

        // Record billing history
        await ctx.db.insert('billingHistory', {
            uid: args.uid,
            type: 'credits',
            amount: args.amount,
            credits: args.credits,
            status: 'completed',
            transactionId: args.transactionId,
            createdAt: Date.now()
        });

        // Update user credits
        await ctx.db.patch(args.uid, {
            credits: (user.credits || 0) + args.credits
        });

        return { success: true, newCredits: (user.credits || 0) + args.credits };
    }
});

/**
 * Subscribe to a plan
 */
export const SubscribeToPlan = mutation({
    args: {
        uid: v.id('users'),
        planName: v.string(), // 'Premium' or 'Pro'
        amount: v.number(),
        duration: v.number(), // Duration in days (30 for monthly, 365 for yearly)
        transactionId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.uid);
        if (!user) {
            throw new Error('User not found');
        }

        const expiresAt = Date.now() + (args.duration * 24 * 60 * 60 * 1000);

        // Record billing history
        await ctx.db.insert('billingHistory', {
            uid: args.uid,
            type: 'subscription',
            planName: args.planName,
            amount: args.amount,
            status: 'completed',
            transactionId: args.transactionId,
            createdAt: Date.now(),
            expiresAt: expiresAt
        });

        // Update user subscription
        await ctx.db.patch(args.uid, {
            subscriptionId: args.transactionId || `sub_${Date.now()}`
        });

        return { success: true, expiresAt };
    }
});

/**
 * Cancel subscription
 */
export const CancelSubscription = mutation({
    args: {
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.uid);
        if (!user) {
            throw new Error('User not found');
        }

        // Remove subscription ID
        await ctx.db.patch(args.uid, {
            subscriptionId: undefined
        });

        return { success: true };
    }
});


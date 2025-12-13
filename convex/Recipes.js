import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateRecipe = mutation({
    args: {
        jsonData: v.any(),
        uid: v.id('users'),
        recipeName: v.string(),
        imageUrl: v.string()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('recipes', {
            jsonData: args.jsonData,
            uid: args.uid,
            recipeName: args.recipeName,
            imageUrl: args.imageUrl
        });
        return result;
    }
})

export const GetRecipeById = query({
    args: {
        id: v.id('recipes')
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.get(args.id)
        return result;
    }
})


export const GetAllRecipes = query({
    args: {
        uid: v.optional(v.id('users'))
    },
    handler: async (ctx, args) => {
        if (args.uid) {
            // Get recipes for specific user
            const result = await ctx.db.query('recipes')
                .filter(q => q.eq(q.field('uid'), args.uid))
                .collect();
            return result
        }
        // Get all recipes if no uid provided (for backward compatibility)
        const result = await ctx.db.query('recipes').collect();
        return result
    }
})

export const DeleteRecipe = mutation({
    args: {
        recipeId: v.id('recipes'),
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        // Verify the recipe belongs to the user
        const recipe = await ctx.db.get(args.recipeId);
        if (!recipe) {
            throw new Error('Recipe not found');
        }
        if (recipe.uid !== args.uid) {
            throw new Error('You can only delete your own recipes');
        }
        
        // Delete the recipe
        await ctx.db.delete(args.recipeId);
        return { success: true };
    }
})

// Favorite Recipes
export const ToggleFavoriteRecipe = mutation({
    args: {
        uid: v.id('users'),
        recipeId: v.id('recipes')
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Unauthorized")
        }
        
        // Check if already favorited
        const existing = await ctx.db
            .query('favoriteRecipes')
            .withIndex('by_user')
            .filter(q => 
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('recipeId'), args.recipeId)
                )
            )
            .first()
        
        if (existing) {
            // Remove favorite
            await ctx.db.delete(existing._id)
            return { isFavorite: false }
        } else {
            // Add favorite
            await ctx.db.insert('favoriteRecipes', {
                uid: args.uid,
                recipeId: args.recipeId,
                createdAt: Date.now()
            })
            return { isFavorite: true }
        }
    }
})

export const GetFavoriteRecipes = query({
    args: {
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }
        
        const favorites = await ctx.db
            .query('favoriteRecipes')
            .withIndex('by_user', q => q.eq('uid', args.uid))
            .collect()
        
        const recipeIds = favorites.map(f => f.recipeId)
        const recipes = await Promise.all(
            recipeIds.map(id => ctx.db.get(id))
        )
        
        return recipes.filter(Boolean)
    }
})

export const IsRecipeFavorite = query({
    args: {
        uid: v.id('users'),
        recipeId: v.id('recipes')
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return false
        }
        
        const favorite = await ctx.db
            .query('favoriteRecipes')
            .withIndex('by_user')
            .filter(q => 
                q.and(
                    q.eq(q.field('uid'), args.uid),
                    q.eq(q.field('recipeId'), args.recipeId)
                )
            )
            .first()
        
        return !!favorite
    }
})
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Water Intake
export const AddWaterIntake = mutation({
    args: {
        uid: v.id('users'),
        date: v.string(),
        amount: v.number()
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            throw new Error("User not found")
        }
        
        return await ctx.db.insert('waterIntake', {
            uid: args.uid,
            date: args.date,
            amount: args.amount,
            timestamp: Date.now()
        })
    }
})

export const GetWaterIntake = query({
    args: {
        uid: v.id('users'),
        date: v.string()
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return { total: 0, logs: [] }
        }
        
        const logs = await ctx.db
            .query('waterIntake')
            .withIndex('by_user_date', q => 
                q.eq('uid', args.uid).eq('date', args.date)
            )
            .collect()
        
        const total = logs.reduce((sum, log) => sum + log.amount, 0)
        
        return {
            total,
            logs
        }
    }
})

// Get last water intake timestamp for smart reminders
export const GetLastWaterIntake = query({
    args: {
        uid: v.id('users')
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return null
        }
        
        // Get all water intake logs for the user, sorted by timestamp (most recent first)
        const allLogs = await ctx.db
            .query('waterIntake')
            .withIndex('by_user_date', q => q.eq('uid', args.uid))
            .collect()
        
        if (allLogs.length === 0) {
            return null
        }
        
        // Find the most recent log
        const mostRecent = allLogs.reduce((latest, log) => {
            return log.timestamp > latest.timestamp ? log : latest
        }, allLogs[0])
        
        return {
            timestamp: mostRecent.timestamp,
            amount: mostRecent.amount,
            date: mostRecent.date
        }
    }
})

// Weight Tracking
export const AddWeightLog = mutation({
    args: {
        uid: v.id('users'),
        date: v.string(),
        weight: v.number()
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            throw new Error("User not found")
        }
        
        // Check if weight already exists for this date, update if exists
        const existing = await ctx.db
            .query('weightLogs')
            .withIndex('by_user_date', q => 
                q.eq('uid', args.uid).eq('date', args.date)
            )
            .first()
        
        if (existing) {
            return await ctx.db.patch(existing._id, {
                weight: args.weight,
                timestamp: Date.now()
            })
        }
        
        return await ctx.db.insert('weightLogs', {
            uid: args.uid,
            date: args.date,
            weight: args.weight,
            timestamp: Date.now()
        })
    }
})

export const GetWeightLogs = query({
    args: {
        uid: v.id('users'),
        days: v.optional(v.number()) // Number of days to fetch (default: 30)
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return []
        }
        
        const days = args.days || 30
        const logs = await ctx.db
            .query('weightLogs')
            .withIndex('by_user_date')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .order('desc')
            .take(days)
        
        return logs.sort((a, b) => a.timestamp - b.timestamp)
    }
})

// Get weight statistics (averages, trends)
export const GetWeightStatistics = query({
    args: {
        uid: v.id('users'),
        days: v.optional(v.number()) // Number of days to analyze (default: 30)
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return null
        }
        
        const days = args.days || 30
        const logs = await ctx.db
            .query('weightLogs')
            .withIndex('by_user_date')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .order('desc')
            .take(days * 2) // Get more data for better analysis
        
        const sortedLogs = logs.sort((a, b) => a.timestamp - b.timestamp)
        
        if (sortedLogs.length === 0) {
            return {
                weeklyAverage: null,
                monthlyAverage: null,
                trend: null, // 'increasing', 'decreasing', 'stable'
                predictedWeight: null,
                weightChange: null
            }
        }
        
        // Calculate weekly average (last 7 days)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const weeklyLogs = sortedLogs.filter(log => log.timestamp >= weekAgo)
        const weeklyAverage = weeklyLogs.length > 0
            ? weeklyLogs.reduce((sum, log) => sum + log.weight, 0) / weeklyLogs.length
            : null
        
        // Calculate monthly average (last 30 days)
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        const monthlyLogs = sortedLogs.filter(log => log.timestamp >= monthAgo)
        const monthlyAverage = monthlyLogs.length > 0
            ? monthlyLogs.reduce((sum, log) => sum + log.weight, 0) / monthlyLogs.length
            : null
        
        // Calculate trend (simple linear regression)
        let trend = 'stable'
        let predictedWeight = null
        if (sortedLogs.length >= 3) {
            // Use last 7 data points for trend
            const recentLogs = sortedLogs.slice(-7)
            const n = recentLogs.length
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
            
            recentLogs.forEach((log, index) => {
                const x = index
                const y = log.weight
                sumX += x
                sumY += y
                sumXY += x * y
                sumX2 += x * x
            })
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
            const intercept = (sumY - slope * sumX) / n
            
            // Predict weight 7 days from now
            predictedWeight = slope * n + intercept
            
            // Determine trend
            if (slope > 0.1) trend = 'increasing'
            else if (slope < -0.1) trend = 'decreasing'
            else trend = 'stable'
        }
        
        // Calculate weight change
        const weightChange = sortedLogs.length >= 2
            ? sortedLogs[sortedLogs.length - 1].weight - sortedLogs[0].weight
            : null
        
        return {
            weeklyAverage: weeklyAverage ? Math.round(weeklyAverage * 10) / 10 : null,
            monthlyAverage: monthlyAverage ? Math.round(monthlyAverage * 10) / 10 : null,
            trend,
            predictedWeight: predictedWeight ? Math.round(predictedWeight * 10) / 10 : null,
            weightChange: weightChange ? Math.round(weightChange * 10) / 10 : null
        }
    }
})

// Get calorie-weight correlation analysis
export const GetCalorieWeightCorrelation = query({
    args: {
        uid: v.id('users'),
        days: v.optional(v.number()) // Number of days to analyze (default: 30)
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return null
        }
        
        const days = args.days || 30
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000)
        
        // Get weight logs
        const weightLogs = await ctx.db
            .query('weightLogs')
            .withIndex('by_user_date')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .order('desc')
            .take(days * 2)
        
        const sortedWeightLogs = weightLogs
            .filter(log => log.timestamp >= cutoffDate)
            .sort((a, b) => a.timestamp - b.timestamp)
        
        // Get calorie data from eating events
        const eatingEvents = await ctx.db
            .query('eatingEvents')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect()
        
        // Group calories by date
        const caloriesByDate = {}
        eatingEvents.forEach(event => {
            const eventDate = new Date(event.timestamp).toISOString().split('T')[0]
            const dateKey = eventDate.split('-').reverse().join('/') // Convert to DD/MM/YYYY
            if (!caloriesByDate[dateKey]) {
                caloriesByDate[dateKey] = 0
            }
            caloriesByDate[dateKey] += event.calories
        })
        
        // Match weight logs with calorie data
        const correlationData = sortedWeightLogs.map(log => {
            const dateKey = log.date
            return {
                date: log.date,
                weight: log.weight,
                calories: caloriesByDate[dateKey] || 0,
                timestamp: log.timestamp
            }
        }).filter(d => d.calories > 0) // Only include days with calorie data
        
        if (correlationData.length < 3) {
            return {
                correlation: null,
                message: 'Insufficient data for correlation analysis',
                data: correlationData
            }
        }
        
        // Calculate correlation coefficient (Pearson)
        const n = correlationData.length
        const avgWeight = correlationData.reduce((sum, d) => sum + d.weight, 0) / n
        const avgCalories = correlationData.reduce((sum, d) => sum + d.calories, 0) / n
        
        let numerator = 0
        let sumWeightSq = 0
        let sumCaloriesSq = 0
        
        correlationData.forEach(d => {
            const weightDiff = d.weight - avgWeight
            const caloriesDiff = d.calories - avgCalories
            numerator += weightDiff * caloriesDiff
            sumWeightSq += weightDiff * weightDiff
            sumCaloriesSq += caloriesDiff * caloriesDiff
        })
        
        const denominator = Math.sqrt(sumWeightSq * sumCaloriesSq)
        const correlation = denominator > 0 ? numerator / denominator : 0
        
        // Interpret correlation
        let message = ''
        if (Math.abs(correlation) < 0.1) {
            message = 'No significant correlation between calories and weight'
        } else if (correlation > 0.5) {
            message = 'Strong positive correlation: Higher calories associated with weight gain'
        } else if (correlation > 0.3) {
            message = 'Moderate positive correlation: Calories may influence weight'
        } else if (correlation < -0.5) {
            message = 'Strong negative correlation: Higher calories associated with weight loss (unusual)'
        } else if (correlation < -0.3) {
            message = 'Moderate negative correlation: Calories may influence weight'
        } else {
            message = 'Weak correlation between calories and weight'
        }
        
        return {
            correlation: Math.round(correlation * 100) / 100,
            message,
            data: correlationData.slice(-10) // Return last 10 data points
        }
    }
})

// Exercise Tracking
export const AddExerciseLog = mutation({
    args: {
        uid: v.id('users'),
        date: v.string(),
        exerciseType: v.string(),
        duration: v.number(), // minutes
        caloriesBurned: v.number()
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            throw new Error("User not found")
        }
        
        return await ctx.db.insert('exerciseLogs', {
            uid: args.uid,
            date: args.date,
            exerciseType: args.exerciseType,
            duration: args.duration,
            caloriesBurned: args.caloriesBurned,
            timestamp: Date.now()
        })
    }
})

export const GetExerciseLogs = query({
    args: {
        uid: v.id('users'),
        date: v.string()
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return []
        }
        
        return await ctx.db
            .query('exerciseLogs')
            .withIndex('by_user_date', q => 
                q.eq('uid', args.uid).eq('date', args.date)
            )
            .collect()
    }
})

export const GetWeeklyExercise = query({
    args: {
        uid: v.id('users'),
        startDate: v.string()
    },
    handler: async (ctx, args) => {
        // Verify user exists
        const user = await ctx.db.get(args.uid)
        if (!user) {
            return []
        }
        
        // Get logs for 7 days starting from startDate
        const logs = await ctx.db
            .query('exerciseLogs')
            .withIndex('by_user_date')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect()
        
        // Filter by date range (simplified - in production, use proper date comparison)
        return logs.filter(log => {
            // Simple string comparison for DD/MM/YYYY format
            return log.date >= args.startDate
        }).slice(0, 7)
    }
})


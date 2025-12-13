/**
 * Smart Water Reminder Service
 * Sends notifications if user hasn't drunk water in a while
 * 
 * Recommended:
 * - Daily intake: 2-3L (or 30-35ml per kg body weight)
 * - Interval: Every 1.5-2 hours during waking hours (6 AM - 10 PM)
 */

import * as Notifications from 'expo-notifications'
import moment from 'moment'

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
})

/**
 * Calculate recommended daily water intake based on body weight
 * Formula: 30-35ml per kg body weight
 */
export const calculateDailyWaterGoal = (weightKg) => {
    if (!weightKg || weightKg <= 0) {
        return 2500 // Default 2.5L
    }
    // Use 33ml per kg as average
    return Math.round(weightKg * 33)
}

/**
 * Check if current time is within waking hours (6 AM - 10 PM)
 */
export const isWakingHours = () => {
    const currentHour = moment().hour()
    return currentHour >= 6 && currentHour < 22 // 6 AM to 10 PM
}

/**
 * Calculate time since last water intake in hours
 */
export const getHoursSinceLastWater = (lastWaterTimestamp) => {
    if (!lastWaterTimestamp) {
        return null // No water logged yet
    }
    const now = moment()
    const lastWater = moment(lastWaterTimestamp)
    return now.diff(lastWater, 'hours', true) // Return decimal hours
}

/**
 * Check if user needs a water reminder
 * @param {number} lastWaterTimestamp - Unix timestamp of last water intake
 * @returns {boolean} - True if reminder is needed
 */
export const shouldSendWaterReminder = (lastWaterTimestamp) => {
    // Only during waking hours
    if (!isWakingHours()) {
        return false
    }
    
    const hoursSince = getHoursSinceLastWater(lastWaterTimestamp)
    
    // If no water logged today, remind after 2 hours from 6 AM
    if (hoursSince === null) {
        const currentHour = moment().hour()
        return currentHour >= 8 // Remind at 8 AM if no water logged
    }
    
    // Remind if it's been more than 1.5 hours since last water
    return hoursSince >= 1.5
}

/**
 * Schedule smart water reminder notifications
 * This should be called periodically or when water is added
 */
export const scheduleWaterReminders = async (lastWaterTimestamp, dailyGoal = 2500) => {
    try {
        // Cancel existing water reminders
        await Notifications.cancelAllScheduledNotificationsAsync()
        
        // Only schedule if during waking hours
        if (!isWakingHours()) {
            return
        }
        
        const hoursSince = getHoursSinceLastWater(lastWaterTimestamp)
        const currentHour = moment().hour()
        
        // If no water logged, schedule reminder for 2 hours from now (or 8 AM if earlier)
        if (hoursSince === null) {
            const reminderTime = currentHour < 8 ? 8 : currentHour + 2
            if (reminderTime < 22) { // Only if before 10 PM
                await scheduleNotification(reminderTime, 0, dailyGoal)
            }
            return
        }
        
        // If it's been more than 1.5 hours, schedule immediate reminder
        if (hoursSince >= 1.5) {
            await scheduleNotification(currentHour, moment().minute() + 5, dailyGoal)
        } else {
            // Schedule next reminder for 1.5 hours from last water intake
            const nextReminderTime = moment(lastWaterTimestamp).add(1.5, 'hours')
            if (nextReminderTime.hour() < 22) { // Only if before 10 PM
                await scheduleNotification(
                    nextReminderTime.hour(),
                    nextReminderTime.minute(),
                    dailyGoal
                )
            }
        }
    } catch (error) {
        console.error('Error scheduling water reminders:', error)
    }
}

/**
 * Schedule a single water reminder notification
 */
const scheduleNotification = async (hour, minute, dailyGoal) => {
    const triggerDate = moment()
        .hour(hour)
        .minute(minute)
        .second(0)
    
    // If time has passed today, schedule for tomorrow
    if (triggerDate.isBefore(moment())) {
        triggerDate.add(1, 'day')
    }
    
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '💧 Time to Drink Water!',
            body: `You haven't drunk water in a while. Stay hydrated! Your daily goal is ${(dailyGoal / 1000).toFixed(1)}L.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
            date: triggerDate.toDate(),
        },
    })
}

/**
 * Send immediate water reminder notification
 */
export const sendImmediateWaterReminder = async (dailyGoal = 2500) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '💧 Time to Drink Water!',
            body: `You haven't drunk water in a while. Stay hydrated! Your daily goal is ${(dailyGoal / 1000).toFixed(1)}L.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Send immediately
    })
}


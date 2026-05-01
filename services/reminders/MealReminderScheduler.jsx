/**
 * Wellus Meal Reminder Scheduler
 * Schedules recurring daily push notifications for meal and water reminders.
 * Uses a dedicated high-priority Android channel so notifications pop up with sound.
 */

import { Platform } from 'react-native'
import { ensureNotificationHandler, loadExpoNotifications } from '../../utils/expoNotificationsGate'

const CHANNEL_ID = 'wellus-reminders'

const MEAL_MESSAGES = {
    Breakfast: {
        title: 'Wellus · Breakfast Time 🌅',
        body: "Good morning! Time for breakfast — log your meal to stay on track with your nutrition goals.",
    },
    Lunch: {
        title: 'Wellus · Lunchtime 🥗',
        body: "It's lunchtime! Log your meal in Wellus to track your daily nutrition progress.",
    },
    Dinner: {
        title: 'Wellus · Dinner Reminder 🍽️',
        body: "Time for dinner! Log your evening meal and see how close you are to your daily goals.",
    },
    Snack: {
        title: 'Wellus · Snack Reminder 🍎',
        body: "Snack time! Don't forget to log what you eat to keep your nutrition tracking accurate.",
    },
    Water: {
        title: 'Wellus · Hydration Check 💧',
        body: "Time to drink water! Staying hydrated keeps your energy up. Log your intake in Wellus.",
    },
}

/** Create (or update) the Wellus high-priority Android notification channel. */
async function ensureWellusChannel(Notifications) {
    if (Platform.OS !== 'android') return
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Wellus Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14B8A6',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
    })
}

/**
 * Schedule a recurring daily notification for the given meal type.
 * Replaces any previously scheduled notification for the same meal.
 *
 * @param {string} mealType  'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Water'
 * @param {number} hour      0-23
 * @param {number} minute    0-59
 */
export const scheduleMealReminder = async (mealType, hour, minute) => {
    try {
        await ensureNotificationHandler()
        const Notifications = await loadExpoNotifications()
        if (!Notifications) return

        await ensureWellusChannel(Notifications)

        const msg = MEAL_MESSAGES[mealType] ?? {
            title: `Wellus · ${mealType} Reminder`,
            body: `Time for your ${mealType.toLowerCase()}! Log it in Wellus.`,
        }

        await Notifications.scheduleNotificationAsync({
            identifier: `wellus-reminder-${mealType.toLowerCase()}`,
            content: {
                title: msg.title,
                body: msg.body,
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
                data: { type: 'meal-reminder', mealType },
            },
            trigger: {
                hour,
                minute,
                repeats: true,
            },
        })
    } catch (error) {
        console.error(`[MealReminderScheduler] Error scheduling ${mealType}:`, error)
    }
}

/**
 * Cancel the scheduled reminder for a specific meal type.
 */
export const cancelMealReminder = async (mealType) => {
    try {
        const Notifications = await loadExpoNotifications()
        if (!Notifications) return
        await Notifications.cancelScheduledNotificationAsync(
            `wellus-reminder-${mealType.toLowerCase()}`
        )
    } catch {
        // Notification may not exist yet — safe to ignore
    }
}

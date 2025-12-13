// Daily Achievement Summaries - As per WELLUS paper requirements
// "mobile alerts summarizing their achievements each day and give personalized suggestions"
// Implements push notifications for daily summaries

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '../../utils/logger';
import { speakDailySummary } from '../accessibility/VocalAlerts';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Request notification permissions
 * 
 * @returns {Promise<boolean>} - True if permissions granted
 */
export const requestNotificationPermissions = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            logger.warn('⚠️ Notification permissions not granted');
            return false;
        }

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('daily-summaries', {
                name: 'Daily Summaries',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B6B',
                sound: 'default',
            });
        }

        logger.log('✅ Notification permissions granted');
        return true;
    } catch (error) {
        logger.error('❌ Failed to request notification permissions:', error);
        return false;
    }
};

/**
 * Schedule daily summary notification
 * 
 * @param {object} summaryData - Daily summary data
 * @param {number} hour - Hour to send notification (0-23)
 * @param {number} minute - Minute to send notification (0-59)
 */
export const scheduleDailySummary = async (summaryData, hour = 20, minute = 0) => {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            logger.warn('⚠️ Cannot schedule notification - permissions not granted');
            return;
        }

        const {
            caloriesConsumed = 0,
            caloriesGoal = 2000,
            proteinConsumed = 0,
            proteinGoal = 100,
            carbohydratesConsumed = 0,
            carbohydratesGoal = 225,
            fatConsumed = 0,
            fatGoal = 56,
            achievements = [],
            recommendations = [],
        } = summaryData;

        // Calculate percentages
        const caloriesPercent = Math.round((caloriesConsumed / caloriesGoal) * 100);
        const proteinPercent = Math.round((proteinConsumed / proteinGoal) * 100);
        const carbsPercent = Math.round((carbohydratesConsumed / carbohydratesGoal) * 100);
        const fatPercent = Math.round((fatConsumed / fatGoal) * 100);

        // Create notification title
        let title = '📊 Daily Summary';
        if (caloriesPercent >= 90 && caloriesPercent <= 110) {
            title = '🎯 Great Job Today!';
        } else if (caloriesPercent < 80) {
            title = '💪 Keep Going!';
        } else if (caloriesPercent > 120) {
            title = '⚠️ Over Your Goal';
        }

        // Create notification body
        let body = `Calories: ${caloriesConsumed}/${caloriesGoal} (${caloriesPercent}%)`;
        body += `\nProtein: ${proteinConsumed}g/${proteinGoal}g (${proteinPercent}%)`;
        body += `\nCarbs: ${carbohydratesConsumed}g/${carbohydratesGoal}g (${carbsPercent}%)`;
        body += `\nFat: ${fatConsumed}g/${fatGoal}g (${fatPercent}%)`;

        if (achievements.length > 0) {
            body += `\n\n🏆 Achievements: ${achievements.join(', ')}`;
        }

        if (recommendations.length > 0) {
            body += `\n\n💡 Tip: ${recommendations[0]}`;
        }

        // Cancel existing daily summary notifications
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule new notification (daily at specified time)
        const trigger = {
            hour,
            minute,
            repeats: true, // Repeat daily
        };

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: {
                    type: 'daily-summary',
                    summaryData,
                },
            },
            trigger,
        });

        logger.log(`✅ Daily summary scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    } catch (error) {
        logger.error('❌ Failed to schedule daily summary:', error);
    }
};

/**
 * Send immediate daily summary notification
 * 
 * @param {object} summaryData - Daily summary data
 */
export const sendDailySummaryNow = async (summaryData) => {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            logger.warn('⚠️ Cannot send notification - permissions not granted');
            return;
        }

        const {
            caloriesConsumed = 0,
            caloriesGoal = 2000,
            proteinConsumed = 0,
            proteinGoal = 100,
            achievements = [],
            recommendations = [],
        } = summaryData;

        const caloriesPercent = Math.round((caloriesConsumed / caloriesGoal) * 100);

        let title = '📊 Your Daily Summary';
        if (caloriesPercent >= 90 && caloriesPercent <= 110) {
            title = '🎯 Excellent Progress!';
        }

        let body = `You consumed ${caloriesConsumed} of ${caloriesGoal} calories (${caloriesPercent}%)`;
        body += `\nProtein: ${proteinConsumed}g of ${proteinGoal}g`;

        if (achievements.length > 0) {
            body += `\n\n🏆 ${achievements[0]}`;
        }

        if (recommendations.length > 0) {
            body += `\n\n💡 ${recommendations[0]}`;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: {
                    type: 'daily-summary',
                    summaryData,
                },
            },
            trigger: null, // Send immediately
        });

        // Also speak the summary if vocal alerts are enabled
        try {
            await speakDailySummary(summaryData);
        } catch (speechError) {
            // Fail silently - vocal alerts are optional
            logger.warn('⚠️ Could not speak summary:', speechError);
        }

        logger.log('✅ Daily summary sent');
    } catch (error) {
        logger.error('❌ Failed to send daily summary:', error);
    }
};

/**
 * Cancel all scheduled daily summaries
 */
export const cancelDailySummaries = async () => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        logger.log('✅ All daily summaries cancelled');
    } catch (error) {
        logger.error('❌ Failed to cancel daily summaries:', error);
    }
};

/**
 * Get notification token for push notifications (future enhancement)
 * 
 * @returns {Promise<string|null>} - Notification token or null
 */
export const getNotificationToken = async () => {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        });

        logger.log('✅ Notification token obtained');
        return token.data;
    } catch (error) {
        logger.error('❌ Failed to get notification token:', error);
        return null;
    }
};


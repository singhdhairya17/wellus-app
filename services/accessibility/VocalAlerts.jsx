// Vocal Alerts (Text-to-Speech) - As per WELLUS paper requirements
// Provides vocal alerts for XAI explanations and daily summaries
// Improves accessibility and user engagement

import * as Speech from 'expo-speech';
import { logger } from '../../utils/logger';

/**
 * Speak text aloud (vocal alert)
 * As mentioned in WELLUS paper: "The options are text-based alert or vocal alert"
 * 
 * @param {string} text - Text to speak
 * @param {object} options - Speech options
 */
export const speakText = async (text, options = {}) => {
    try {
        const {
            language = 'en-US',
            pitch = 1.0,
            rate = 0.9, // Slightly slower for clarity
            volume = 1.0,
            onStart = null,
            onDone = null,
            onError = null,
        } = options;

        // Stop any ongoing speech first
        Speech.stop();

        // Speak the text
        Speech.speak(text, {
            language,
            pitch,
            rate,
            volume,
            onStart: () => {
                logger.log('🔊 Speech started:', text.substring(0, 50) + '...');
                if (onStart) onStart();
            },
            onDone: () => {
                logger.log('✅ Speech completed');
                if (onDone) onDone();
            },
            onStopped: () => {
                logger.log('⏹️ Speech stopped');
            },
            onError: (error) => {
                logger.error('❌ Speech error:', error);
                if (onError) onError(error);
            },
        });

    } catch (error) {
        logger.error('❌ Failed to speak text:', error);
        // Fail silently - vocal alerts are optional
    }
};

/**
 * Speak XAI explanation aloud
 * Makes explanations accessible via voice
 * 
 * @param {string} explanation - XAI explanation text
 */
export const speakXAIExplanation = async (explanation) => {
    try {
        // Clean up explanation text for better speech
        const cleanText = explanation
            .replace(/%/g, 'percent')
            .replace(/\n/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();

        await speakText(cleanText, {
            rate: 0.85, // Slower for explanations
            pitch: 1.0,
        });

        logger.log('🔊 XAI explanation spoken');
    } catch (error) {
        logger.error('❌ Failed to speak XAI explanation:', error);
    }
};

/**
 * Speak daily achievement summary
 * As mentioned in WELLUS paper: "mobile alerts summarizing their achievements each day"
 * 
 * @param {object} summary - Daily summary data
 */
export const speakDailySummary = async (summary) => {
    try {
        const {
            caloriesConsumed = 0,
            caloriesGoal = 2000,
            proteinConsumed = 0,
            proteinGoal = 100,
            message = '',
        } = summary;

        // Create summary text
        const caloriesPercent = Math.round((caloriesConsumed / caloriesGoal) * 100);
        const proteinPercent = Math.round((proteinConsumed / proteinGoal) * 100);

        let summaryText = `Daily Summary. `;
        summaryText += `You consumed ${caloriesConsumed} calories, which is ${caloriesPercent} percent of your goal. `;
        summaryText += `Protein intake is ${proteinConsumed} grams, ${proteinPercent} percent of your target. `;
        
        if (message) {
            summaryText += message;
        }

        await speakText(summaryText, {
            rate: 0.9,
            pitch: 1.0,
        });

        logger.log('🔊 Daily summary spoken');
    } catch (error) {
        logger.error('❌ Failed to speak daily summary:', error);
    }
};

/**
 * Stop any ongoing speech
 */
export const stopSpeech = () => {
    try {
        Speech.stop();
        logger.log('⏹️ Speech stopped');
    } catch (error) {
        logger.error('❌ Failed to stop speech:', error);
    }
};

/**
 * Check if speech is available on device
 * 
 * @returns {Promise<boolean>} - True if speech is available
 */
export const isSpeechAvailable = async () => {
    try {
        // expo-speech is available on iOS and Android
        // Just check if the module is loaded
        return typeof Speech !== 'undefined' && Speech.speak !== undefined;
    } catch (error) {
        return false;
    }
};


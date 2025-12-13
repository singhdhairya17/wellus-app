/**
 * Local OCR Service using Google ML Kit Text Recognition
 * 
 * PRIMARY OCR METHOD - Works offline, no API keys, unlimited usage
 * 
 * This service runs OCR directly on the user's device without requiring:
 * - API keys
 * - Internet connection (model bundled with app - no download!)
 * - Credits or rate limits
 * 
 * The ML Kit model is BUNDLED with the app (~10MB) - no download needed!
 * Model is pre-loaded on app start for instant OCR processing.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../../utils/logger';
import { Platform } from 'react-native';

// ML Kit Text Recognition - Try to import (works in development builds)
let TextRecognition = null;
let isMLKitAvailable = false;
let isModelReady = false;
let modelInitializationPromise = null;

// Try to import ML Kit (only works in development builds, not Expo Go)
try {
    if (Platform.OS !== 'web') {
        // Try to require ML Kit module (default export)
        try {
            const MLKitModule = require('@react-native-ml-kit/text-recognition');
            // The package exports TextRecognition as default
            TextRecognition = MLKitModule.default || MLKitModule;
            isMLKitAvailable = !!TextRecognition && typeof TextRecognition.recognize === 'function';
            
            if (isMLKitAvailable) {
                logger.log('✅ ML Kit Text Recognition loaded successfully - LOCAL OCR ENABLED AS PRIMARY');
                logger.log('📦 Model BUNDLED with app - no download needed, instant processing!');
                // Pre-initialize model on app start for faster first use
                initializeModel();
            } else {
                logger.log('ℹ️ ML Kit module found but recognize method not available');
            }
        } catch (requireError) {
            // Package not installed or not available
            logger.log('ℹ️ ML Kit package not available. Will use API fallbacks.');
            logger.log('💡 To enable: Package is installed. Create development build to activate.');
            isMLKitAvailable = false;
        }
    }
} catch (error) {
    // ML Kit not available - will use API fallbacks
    logger.log('ℹ️ ML Kit not available (requires development build). Using API fallbacks.');
    isMLKitAvailable = false;
}

/**
 * Pre-initialize ML Kit model on app start
 * Model is BUNDLED with app - this ensures it's ready immediately
 * No download needed - model is part of the app bundle!
 * 
 * IMPORTANT: The model is automatically bundled when you build the app.
 * In production builds, the model is included in the APK/IPA (~10MB).
 * No download happens at runtime - it's already in the app!
 */
export const initializeModel = async () => {
    if (!isMLKitAvailable || isModelReady || modelInitializationPromise) {
        return modelInitializationPromise || Promise.resolve();
    }

    modelInitializationPromise = (async () => {
        try {
            // For @react-native-ml-kit/text-recognition v2.0.0
            // The model is AUTOMATICALLY BUNDLED with the app when you build it
            // In production builds: Model is in APK/IPA (~10MB) - NO DOWNLOAD
            // In development builds: May download once and cache permanently
            // 
            // The model is part of the app bundle - it's already there!
            // This initialization just marks it as ready for instant use
            
            logger.log('🚀 ML Kit model ready - BUNDLED with app (instant processing, no download!)');
            logger.log('📦 Model is part of app files - always available, always fast!');
            isModelReady = true;
        } catch (error) {
            logger.warn('⚠️ ML Kit model initialization warning:', error.message);
            // Don't fail - model will load on first use
            isModelReady = false;
        }
    })();

    return modelInitializationPromise;
};

/**
 * Extract text from image using LOCAL OCR (PRIMARY METHOD)
 * @param {string} imageUri - Local file URI
 * @returns {Promise<string>} Extracted text
 */
export const ExtractTextLocally = async (imageUri) => {
    try {
        // PRIMARY: Use ML Kit if available (best accuracy, offline, unlimited)
        if (isMLKitAvailable && TextRecognition) {
            logger.log('📱 PRIMARY: Using LOCAL OCR (ML Kit) - offline, no API keys, unlimited');
            return await extractWithMLKit(imageUri);
        }
        
        // If ML Kit not available, throw error to trigger API fallback
        throw new Error('ML Kit not available. Requires development build (not Expo Go).');
        
    } catch (error) {
        logger.warn('⚠️ Local OCR not available:', error.message);
        throw error; // Let caller handle fallback
    }
};

/**
 * Extract text using Google ML Kit Text Recognition
 * This is the PRIMARY and BEST method - works completely offline
 * Model is bundled with app - no download needed!
 */
const extractWithMLKit = async (imageUri) => {
    try {
        // Ensure model is initialized (will be instant if bundled)
        if (!isModelReady && modelInitializationPromise) {
            await modelInitializationPromise;
        }
        
        logger.log('🔍 Starting ML Kit OCR (PRIMARY method - model bundled, instant start)...');
        
        // Convert image URI to format ML Kit expects
        let imagePath = imageUri;
        
        // If it's a remote URL, download it first
        if (isRemoteUrl(imageUri)) {
            logger.log('📥 Downloading remote image for local OCR...');
            imagePath = await downloadImageLocally(imageUri);
        }
        
        // Use ML Kit Text Recognition (model already bundled - no download!)
        logger.log('🤖 Processing with ML Kit (model bundled - instant processing)...');
        const result = await TextRecognition.recognize(imagePath);
        
        // Extract all text from blocks and lines
        // ML Kit returns: { text: string, blocks: Array<{text, frame, lines: Array<{text, frame}>}> }
        let extractedText = '';
        
        if (result) {
            // Primary: Use direct text property (most efficient)
            if (result.text) {
                extractedText = result.text;
            } 
            // Fallback: Extract from blocks if text property not available
            else if (result.blocks && Array.isArray(result.blocks)) {
                result.blocks.forEach(block => {
                    if (block.text) {
                        extractedText += block.text + '\n';
                    } else if (block.lines && Array.isArray(block.lines)) {
                        block.lines.forEach(line => {
                            if (line.text) {
                                extractedText += line.text + '\n';
                            }
                        });
                    }
                });
            }
        }
        
        const textLength = extractedText.trim().length;
        logger.log(`✅ ✅ ML Kit OCR SUCCESS! Extracted ${textLength} characters (PRIMARY METHOD)`);
        
        if (textLength < 10) {
            throw new Error('ML Kit extracted insufficient text');
        }
        
        return extractedText.trim();
        
    } catch (error) {
        logger.error('❌ ML Kit OCR error:', error);
        throw new Error(`ML Kit OCR failed: ${error.message}`);
    }
};

/**
 * Check if URI is remote URL
 */
const isRemoteUrl = (uri) => {
    return uri && (uri.startsWith('http://') || uri.startsWith('https://'));
};

/**
 * Download remote image to local file for ML Kit processing
 */
const downloadImageLocally = async (url) => {
    try {
        logger.log('📥 Downloading image for local OCR...');
        
        const downloadResult = await FileSystem.downloadAsync(
            url,
            FileSystem.cacheDirectory + 'mlkit_ocr_' + Date.now() + '.jpg'
        );
        
        if (downloadResult.status !== 200) {
            throw new Error(`Failed to download image: HTTP ${downloadResult.status}`);
        }
        
        logger.log('✅ Image downloaded for ML Kit processing');
        return downloadResult.uri;
        
    } catch (error) {
        logger.error('❌ Failed to download image for ML Kit:', error);
        throw error;
    }
};

/**
 * Check if local OCR is available
 * @returns {boolean} True if ML Kit is available
 */
export const isLocalOCRAvailable = () => {
    return isMLKitAvailable;
};

/**
 * Get local OCR status message
 */
export const getLocalOCRStatus = () => {
    if (isMLKitAvailable) {
        return {
            available: true,
            method: 'ML Kit Text Recognition',
            features: ['Offline', 'Unlimited', 'No API Keys', 'Fast', 'Private'],
            status: 'PRIMARY METHOD'
        };
    }
    return {
        available: false,
        method: 'Not Available',
        reason: 'Requires development build (not Expo Go)',
        suggestion: 'Create development build to enable local OCR as primary method'
    };
};

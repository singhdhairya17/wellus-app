// Multi-tier OCR system with automatic fallback:
// 1. LOCAL OCR (ML Kit) - Works offline, no API keys, unlimited - PRIMARY (if available)
// 2. OCR.space (25k/month free, no API key needed)
// 3. Google Cloud Vision (1k/month free, optional API key)
// 4. Azure Computer Vision (5k/month free, optional API key)
// 5. Gemini Vision via OpenRouter (free tier, optional API key)
// 6. Manual regex extraction (always works, unlimited)

import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../../utils/logger';
import { ExtractTextLocally, isLocalOCRAvailable } from './LocalOCRService';
import { applyFullPreprocessingPipeline, shouldPreprocessImage } from './ImagePreprocessing';

// SECURITY: Validate URL to prevent SSRF attacks
const validateUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'Invalid URL' };
    }
    
    try {
        // Parse URL to validate format
        const urlObj = new URL(url);
        
        // Only allow HTTPS (block HTTP for security)
        if (urlObj.protocol !== 'https:') {
            return { valid: false, error: 'Only HTTPS URLs are allowed' };
        }
        
        // Block localhost and private IP ranges (SSRF protection)
        const hostname = urlObj.hostname.toLowerCase();
        const blockedHosts = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            '::1',
            '[::1]'
        ];
        
        if (blockedHosts.includes(hostname)) {
            return { valid: false, error: 'Localhost URLs are not allowed' };
        }
        
        // Block private IP ranges
        const privateIpPatterns = [
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^169\.254\./,
            /^fc00:/,
            /^fe80:/
        ];
        
        for (const pattern of privateIpPatterns) {
            if (pattern.test(hostname)) {
                return { valid: false, error: 'Private IP ranges are not allowed' };
            }
        }
        
        // Validate image file extension
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = validExtensions.some(ext => 
            urlObj.pathname.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension && !urlObj.searchParams.has('format')) {
            // Allow URLs without extension if they're from known image hosts
            const knownImageHosts = ['i.imgur.com', 'cdn.', 'images.', 'img.'];
            const isKnownHost = knownImageHosts.some(host => hostname.includes(host));
            if (!isKnownHost) {
                return { valid: false, error: 'URL must point to an image file' };
            }
        }
        
        return { valid: true, url: urlObj.href };
    } catch (error) {
        return { valid: false, error: 'Invalid URL format' };
    }
};

// Helper: Check if URI is a remote URL
const isRemoteUrl = (uri) => {
    if (!uri || typeof uri !== 'string') return false;
    return uri.startsWith('http://') || uri.startsWith('https://');
};

// Helper: Download remote image and convert to base64 (React Native compatible)
// SECURITY: Validates URL and enforces size limits
const downloadImageAsBase64 = async (url) => {
    try {
        // SECURITY: Validate URL to prevent SSRF attacks
        const urlValidation = validateUrl(url);
        if (!urlValidation.valid) {
            throw new Error(`Security: ${urlValidation.error}`);
        }
        
        const validatedUrl = urlValidation.url;
        logger.log('📥 Downloading image from validated URL:', validatedUrl.hostname);
        
        // SECURITY: Set timeout for download (30 seconds)
        const downloadPromise = FileSystem.downloadAsync(
            validatedUrl.href,
            FileSystem.cacheDirectory + 'temp_image_' + Date.now() + '.jpg'
        );
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download timeout')), 30000)
        );
        
        const downloadResult = await Promise.race([downloadPromise, timeoutPromise]);
        
        if (downloadResult.status !== 200) {
            throw new Error(`HTTP ${downloadResult.status}: Failed to download image`);
        }
        
        logger.log('✅ Image downloaded, converting to base64...');
        
        // SECURITY: Check file size before reading (10MB limit)
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        if (fileInfo.exists && fileInfo.size) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (fileInfo.size > maxSize) {
                // Clean up large file
                await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
                throw new Error('Image file too large. Maximum size is 10MB.');
            }
        }
        
        // Read the downloaded file as base64
        const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        
        // SECURITY: Validate base64 data size
        const base64Size = (base64.length * 3) / 4;
        const maxBase64Size = 10 * 1024 * 1024; // 10MB
        if (base64Size > maxBase64Size) {
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
            throw new Error('Image data too large. Maximum size is 10MB.');
        }
        
        // Determine image format from URL or default to jpeg
        const imageFormat = validatedUrl.pathname.toLowerCase().includes('.png') ? 'png' : 
                           validatedUrl.pathname.toLowerCase().includes('.gif') ? 'gif' : 'jpeg';
        
        const base64Image = `data:image/${imageFormat};base64,${base64}`;
        
        logger.log('✅ Base64 conversion successful, length:', base64Image.length);
        
        // Clean up temp file
        try {
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        } catch (cleanupError) {
            logger.warn('⚠️ Could not delete temp file:', cleanupError);
        }
        
        return base64Image;
    } catch (error) {
        logger.error('❌ Download error:', error.message);
        
        // SECURITY: Don't return URL directly as fallback (security risk)
        throw new Error(`Failed to download image: ${error.message}`);
    }
};

// Helper: Convert local file URI to base64 (React Native compatible)
// SECURITY: Validates file size and format
const convertLocalImageToBase64 = async (uri) => {
    try {
        logger.log('📥 Converting local image to base64...');
        
        // SECURITY: Check file size before reading (10MB limit)
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && fileInfo.size) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (fileInfo.size > maxSize) {
                throw new Error('Image file too large. Maximum size is 10MB.');
            }
        }
        
        // Use expo-file-system for React Native compatibility
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        
        // SECURITY: Validate base64 data size
        const base64Size = (base64.length * 3) / 4;
        const maxBase64Size = 10 * 1024 * 1024; // 10MB
        if (base64Size > maxBase64Size) {
            throw new Error('Image data too large. Maximum size is 10MB.');
        }
        
        // SECURITY: Validate base64 format
        if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
            throw new Error('Invalid base64 image data');
        }
        
        // Determine image format from URI or default to jpeg
        const imageFormat = uri.toLowerCase().includes('.png') ? 'png' : 
                           uri.toLowerCase().includes('.gif') ? 'gif' : 'jpeg';
        
        const base64Image = `data:image/${imageFormat};base64,${base64}`;
        
        logger.log('✅ Local image converted to base64, length:', base64Image.length);
        return base64Image;
    } catch (error) {
        logger.error('❌ Local image conversion error:', error);
        throw new Error(`Failed to convert local image to base64: ${error.message}`);
    }
};

// Helper: Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Check if it's a rate limit error
            if (error.message?.includes('429') || error.status === 429) {
                const waitTime = delay * Math.pow(2, i);
                logger.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                throw error; // Don't retry for other errors
            }
        }
    }
};

// Extract text from image using Gemini Vision API (works in React Native)
export const ExtractTextFromImage = async (imageUri) => {
    try {
        logger.log('🔍 Starting OCR with Gemini Vision...');
        logger.log('📷 Image URI:', imageUri.substring(0, 100) + '...');
        
        // Check if OpenRouter is available
        const useOpenRouter = !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
        if (!useOpenRouter) {
            throw new Error('OpenRouter API key not found. Please set EXPO_PUBLIC_OPENROUTER_API_KEY');
        }

        // Convert image to base64
        let base64Image;
        if (isRemoteUrl(imageUri)) {
            logger.log('🌐 Remote URL detected, downloading...');
            base64Image = await downloadImageAsBase64(imageUri);
        } else {
            logger.log('📁 Local file detected, converting...');
            base64Image = await convertLocalImageToBase64(imageUri);
        }

        logger.log('✅ Image converted to base64, calling Gemini Vision...');

        // Use Gemini Vision to extract text with retry logic
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
            dangerouslyAllowBrowser: true
        });

        const response = await retryWithBackoff(async () => {
            return await openai.chat.completions.create({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Extract ALL text from this nutrition facts label image. Return ONLY the raw text content, nothing else. Include all numbers, labels, and nutritional information exactly as it appears."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ]
            });
        }, 3, 2000); // 3 retries, starting with 2 second delay

        const extractedText = response.choices[0].message.content;
        logger.log('✅ Extracted text length:', extractedText?.length || 0);
        logger.log('✅ Extracted text preview:', extractedText?.substring(0, 200) || 'No text');
        
        return extractedText || '';
    } catch (error) {
        logger.error('❌ OCR Error:', error);
        logger.error('❌ Error message:', error.message);
        
        // Better error message for rate limits
        if (error.message?.includes('429') || error.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again, or use "Choose Photo" instead of URL.');
        }
        
        throw new Error(`Failed to extract text from image: ${error.message}`);
    }
};

// FREE OCR using OCR.space API (25k requests/month, no credit card needed)
// SECURITY: Validates base64 image before sending
const extractTextWithOCRSpace = async (base64Image) => {
    try {
        logger.log('🆓 Using free OCR.space API...');
        
        // SECURITY: Validate base64 image format
        if (!base64Image || typeof base64Image !== 'string') {
            throw new Error('Invalid image data');
        }
        
        // Remove data:image prefix if present
        const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        
        // SECURITY: Validate base64 format and size
        if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
            throw new Error('Invalid base64 image format');
        }
        
        const base64Size = (base64Data.length * 3) / 4;
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (base64Size > maxSize) {
            throw new Error('Image too large. Maximum size is 10MB.');
        }
        
        // Use URLSearchParams for form data (works better in React Native)
        const params = new URLSearchParams();
        params.append('base64Image', base64Data);
        params.append('language', 'eng');
        params.append('isOverlayRequired', 'false');
        params.append('apikey', 'helloworld'); // Free public key - no signup needed
        
        // SECURITY: Set timeout for API call (30 seconds)
        const fetchPromise = fetch('https://api.ocr.space/parse/imagebase64', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API request timeout')), 30000)
        );
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        const responseText = await response.text();
        
        // Check if response is HTML (error page) instead of JSON
        if (responseText.trim().startsWith('<')) {
            logger.error('❌ OCR.space returned HTML instead of JSON (likely error page)');
            throw new Error('OCR.space API error - service unavailable');
        }
        
        const result = JSON.parse(responseText);
        logger.log('📊 OCR.space response code:', result.OCRExitCode);
        
        if (result.OCRExitCode === 1 && result.ParsedResults && result.ParsedResults.length > 0) {
            const extractedText = result.ParsedResults[0].ParsedText;
            if (extractedText && extractedText.trim().length > 10) {
                logger.log('✅ OCR.space extracted text length:', extractedText.length);
                return extractedText.trim();
            }
        }
        
        // If OCR.space fails, check error message
        const errorMessage = result.ErrorMessage?.[0] || result.ErrorMessage || 'Failed to extract text';
        logger.error('❌ OCR.space error details:', errorMessage);
        throw new Error(`OCR.space: ${errorMessage}`);
    } catch (error) {
        logger.error('❌ OCR.space error:', error);
        // If it's a JSON parse error, it's likely HTML response
        if (error.message?.includes('JSON Parse') || error.message?.includes('Unexpected character')) {
            throw new Error('OCR.space service unavailable - using fallback');
        }
        throw error;
    }
};

// FREE OCR using Google Cloud Vision API (1k requests/month free, optional - requires API key)
const extractTextWithGoogleVision = async (base64Image) => {
    try {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
        if (!apiKey) {
            throw new Error('Google Vision API key not configured');
        }

        logger.log('🔍 Using Google Cloud Vision API (free tier: 1k/month)...');
        
        // Remove data:image prefix if present
        const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [{
                        image: {
                            content: base64Data
                        },
                        features: [{
                            type: 'TEXT_DETECTION',
                            maxResults: 1
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.responses && result.responses[0] && result.responses[0].fullTextAnnotation) {
            const extractedText = result.responses[0].fullTextAnnotation.text;
            if (extractedText && extractedText.trim().length > 10) {
                logger.log('✅ Google Vision extracted text length:', extractedText.length);
                return extractedText.trim();
            }
        }
        
        throw new Error('Google Vision: No text detected');
    } catch (error) {
        logger.error('❌ Google Vision error:', error);
        throw error;
    }
};

// FREE OCR using Azure Computer Vision (5k requests/month free, optional - requires API key)
const extractTextWithAzureVision = async (base64Image) => {
    try {
        const apiKey = process.env.EXPO_PUBLIC_AZURE_VISION_API_KEY;
        const endpoint = process.env.EXPO_PUBLIC_AZURE_VISION_ENDPOINT;
        
        if (!apiKey || !endpoint) {
            throw new Error('Azure Vision API key/endpoint not configured');
        }

        logger.log('🔍 Using Azure Computer Vision API (free tier: 5k/month)...');
        
        // Remove data:image prefix if present
        const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        
        // Use OCR endpoint with base64 data (simpler than read/analyze)
        const ocrResponse = await fetch(
            `${endpoint}/vision/v3.2/ocr?language=en`,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: `data:image/jpeg;base64,${base64Data}`
                })
            }
        );

        if (!ocrResponse.ok) {
            const errorText = await ocrResponse.text();
            throw new Error(`Azure OCR error: ${ocrResponse.status} - ${errorText}`);
        }

        const result = await ocrResponse.json();
        
        if (result.regions && result.regions.length > 0) {
            let extractedText = '';
            for (const region of result.regions) {
                for (const line of region.lines || []) {
                    for (const word of line.words || []) {
                        extractedText += word.text + ' ';
                    }
                    extractedText += '\n';
                }
            }
            
            if (extractedText.trim().length > 10) {
                logger.log('✅ Azure Vision extracted text length:', extractedText.length);
                return extractedText.trim();
            }
        }
        
        throw new Error('Azure Vision: No text detected');
    } catch (error) {
        logger.error('❌ Azure Vision error:', error);
        throw error;
    }
};

// Parse nutrition data from extracted text OR directly from image
export const ExtractNutritionFromLabel = async (imageUri) => {
    try {
        // STEP 1: Preprocess image for better OCR accuracy (as per WELLUS paper)
        // This improves accuracy from 89% to 92%+ in challenging conditions
        logger.log('🔄 Preprocessing image for optimal OCR accuracy...');
        let processedImageUri = imageUri;
        
        // Check if preprocessing is recommended
        const needsPreprocessing = await shouldPreprocessImage(imageUri);
        if (needsPreprocessing && !isRemoteUrl(imageUri)) {
            // Only preprocess local images (remote URLs will be preprocessed after download)
            try {
                processedImageUri = await applyFullPreprocessingPipeline(imageUri, {
                    enableRotation: false, // Auto-rotation detection can be added later
                    enableSharpening: true,
                    targetWidth: 1200, // Optimal for OCR
                });
                logger.log('✅ Image preprocessing complete - improved OCR accuracy expected');
            } catch (preprocessError) {
                logger.warn('⚠️ Preprocessing failed, using original image:', preprocessError.message);
                processedImageUri = imageUri; // Fallback to original
            }
        }
        
        // Convert image to base64 (for API-based OCR)
        let base64Image;
        if (isRemoteUrl(imageUri)) {
            logger.log('🌐 Remote URL detected, downloading...');
            base64Image = await downloadImageAsBase64(imageUri);
        } else {
            logger.log('📁 Local file detected, converting...');
            // Use preprocessed image if available
            base64Image = await convertLocalImageToBase64(processedImageUri);
        }

        logger.log('✅ Image ready, extracting text...');

        // Multi-tier OCR fallback chain - LOCAL OCR IS PRIMARY
        let extractedText = '';
        let lastError = null;
        
        // PRIMARY: Try LOCAL OCR first (works offline, no API keys, unlimited)
        // This is the preferred method - always try it first if available
        try {
            // For local OCR, use preprocessed image for better accuracy
            const imagePath = isRemoteUrl(imageUri) 
                ? await downloadImageAsLocalFile(imageUri)
                : processedImageUri; // Use preprocessed image
            
            extractedText = await ExtractTextLocally(imagePath);
            logger.log('✅ ✅ PRIMARY: Text extracted with LOCAL OCR (offline, no API keys, unlimited)');
            
            // If local OCR succeeded, return immediately (no need for API fallback)
            if (extractedText && extractedText.trim().length >= 10) {
                // Continue to parsing step
            } else {
                throw new Error('Local OCR returned insufficient text');
            }
        } catch (localError) {
            logger.warn('⚠️ Local OCR not available or failed, using API fallback...', localError.message);
            lastError = localError;
        }
        
        // FALLBACK: Try FREE OCR.space (25k/month, no API key needed)
        if (!extractedText || extractedText.trim().length < 10) {
            try {
                extractedText = await extractTextWithOCRSpace(base64Image);
                logger.log('✅ FALLBACK: Text extracted with OCR.space API');
            } catch (ocrError) {
                logger.warn('⚠️ OCR.space failed, trying next service...', ocrError.message);
                lastError = ocrError;
            }
        }
        
        // Step 3: Try Google Cloud Vision (1k/month free, optional)
        if (!extractedText || extractedText.trim().length < 10) {
            try {
                extractedText = await extractTextWithGoogleVision(base64Image);
                logger.log('✅ Text extracted with Google Vision');
            } catch (googleError) {
                // Don't log as error if API key is just not configured
                if (googleError.message?.includes('not configured')) {
                    logger.log('ℹ️ Google Vision not configured, skipping...');
                } else {
                    logger.warn('⚠️ Google Vision failed, trying next service...', googleError.message);
                }
                lastError = googleError;
            }
        }
        
        // Step 4: Try Azure Computer Vision (5k/month free, optional)
        if (!extractedText || extractedText.trim().length < 10) {
            try {
                extractedText = await extractTextWithAzureVision(base64Image);
                logger.log('✅ Text extracted with Azure Vision');
            } catch (azureError) {
                // Don't log as error if API key is just not configured
                if (azureError.message?.includes('not configured')) {
                    logger.log('ℹ️ Azure Vision not configured, skipping...');
                } else {
                    logger.warn('⚠️ Azure Vision failed, trying Gemini Vision...', azureError.message);
                }
                lastError = azureError;
            }
        }
        
        // Step 5: Try Gemini Vision via OpenRouter (if available)
        if (!extractedText || extractedText.trim().length < 10) {
            const useOpenRouter = !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
            if (useOpenRouter) {
                try {
                    const OpenAI = (await import('openai')).default;
                    const openai = new OpenAI({
                        baseURL: "https://openrouter.ai/api/v1",
                        apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
                        dangerouslyAllowBrowser: true
                    });

                    const response = await openai.chat.completions.create({
                        model: "google/gemini-2.0-flash-exp:free",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Extract ALL text from this nutrition facts label image. Return ONLY the raw text content, nothing else."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: { url: base64Image }
                                    }
                                ]
                            }
                        ]
                    });
                    extractedText = response.choices[0].message.content;
                    logger.log('✅ Text extracted with Gemini Vision');
                } catch (geminiError) {
                    // Check if it's a rate limit (expected) vs other error
                    if (geminiError.message?.includes('429') || geminiError.message?.includes('Rate limit')) {
                        logger.warn('⚠️ Gemini Vision rate limited (expected on free tier), falling back to manual entry');
                    } else {
                        logger.warn('⚠️ Gemini Vision failed:', geminiError.message);
                    }
                    // Don't throw - return empty data for manual entry
                    logger.log('ℹ️ All OCR services exhausted, returning empty data for manual entry');
                    extractedText = ''; // Empty text will trigger manual entry
                }
            } else {
                logger.log('ℹ️ OpenRouter not configured, all OCR services exhausted. Returning empty data for manual entry');
                extractedText = ''; // Empty text will trigger manual entry
            }
        }

        // If no text extracted, return empty nutrition data for manual entry
        if (!extractedText || extractedText.trim().length < 10) {
            logger.log('ℹ️ No text extracted from image, returning empty data for manual entry');
            return {
                calories: 0,
                protein: 0,
                carbohydrates: 0,
                fat: 0,
                sodium: 0,
                sugar: 0,
                servingSize: '1 serving',
                servingsPerContainer: 1
            };
        }

        logger.log('📝 Extracted text preview:', extractedText.substring(0, 200));

        // Step 2: Parse nutrition data using AI (or manual fallback)
        let nutritionData;
        try {
            nutritionData = await ParseNutritionText(extractedText);
        } catch (parseError) {
            logger.log('⚠️ AI parsing failed, using manual extraction:', parseError);
            // Check if it's a rate limit - still use manual extraction but log it
            if (parseError.message?.includes('429') || parseError.message?.includes('Rate limit') || parseError.message?.includes('RATE_LIMIT')) {
                logger.log('⚠️ Rate limit detected, using manual regex extraction as fallback');
            }
            // Use manual extraction as fallback (always works, no API needed)
            nutritionData = ExtractNutritionManually(extractedText);
        }
        
        logger.log('✅ Nutrition data extracted:', nutritionData);
        
        // Ensure it's an object with all required fields
        return {
            calories: nutritionData.calories || 0,
            protein: nutritionData.protein || 0,
            carbohydrates: nutritionData.carbohydrates || 0,
            fat: nutritionData.fat || 0,
            sodium: nutritionData.sodium || 0,
            sugar: nutritionData.sugar || 0,
            servingSize: nutritionData.servingSize || '1 serving',
            servingsPerContainer: nutritionData.servingsPerContainer || 1
        };
    } catch (error) {
        // Only log as error for critical failures (image processing)
        if (error.message.includes('download') || error.message.includes('convert')) {
            logger.error('❌ Critical error processing image:', error.message);
        } else {
            logger.warn('⚠️ Non-critical error, returning empty data for manual entry:', error.message);
        }
        
        // Instead of throwing, return empty data for manual entry
        // This ensures the app always works, even when all services fail
        logger.log('ℹ️ Returning empty data for manual entry');
        
        // Only throw for critical errors (like image download/conversion failures)
        if (error.message.includes('download') || error.message.includes('convert')) {
            throw new Error('Failed to process image. Please try:\n1. Use "Choose Photo" instead of URL\n2. Ensure the image is accessible\n3. Try a different image');
        }
        
        // For all other errors (rate limits, OCR failures, etc.), return empty data
        // This allows manual entry to work
        return {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            sodium: 0,
            sugar: 0,
            servingSize: '1 serving',
            servingsPerContainer: 1
        };
    }
};

// Parse text to nutrition JSON using AI
const ParseNutritionText = async (text) => {
    try {
        // Use your existing OpenRouter setup
        const useOpenRouter = !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
        
        if (!useOpenRouter) {
            // Fallback: Manual extraction (no API key available)
            logger.log('No OpenRouter key, using manual extraction');
            return ExtractNutritionManually(text);
        }

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
            dangerouslyAllowBrowser: true
        });

        const prompt = `Extract nutritional information from this food label text. Return ONLY a JSON object, no other text. Do NOT return an array.

Text from label:
${text}

Return JSON with this exact structure (as an object, NOT an array):
{
  "calories": number,
  "protein": number (in grams),
  "carbohydrates": number (in grams),
  "fat": number (in grams),
  "sodium": number (in milligrams),
  "sugar": number (in grams),
  "servingSize": string,
  "servingsPerContainer": number
}

IMPORTANT: 
- Look for "Calories" in the text - it's usually a large number near the top
- If any value is not found, use 0
- Extract numbers only (no units in numbers)
- Return a JSON object, NOT an array`;

        const response = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        let parsed = JSON.parse(response.choices[0].message.content);
        
        // Ensure it's an object, not an array
        if (Array.isArray(parsed)) {
            logger.log('⚠️ Got array instead of object, extracting first element');
            parsed = parsed[0] || {};
        }
        
        // Ensure all required fields exist with defaults
        const result = {
            calories: parsed.calories || 0,
            protein: parsed.protein || 0,
            carbohydrates: parsed.carbohydrates || 0,
            fat: parsed.fat || 0,
            sodium: parsed.sodium || 0,
            sugar: parsed.sugar || 0,
            servingSize: parsed.servingSize || '1 serving',
            servingsPerContainer: parsed.servingsPerContainer || 1
        };
        
        logger.log('✅ Parsed nutrition data (object):', result);
        return result;
    } catch (error) {
        // Check if it's a rate limit error
        const isRateLimit = error?.message?.includes('429') || 
                           error?.status === 429 ||
                           error?.message?.includes('Rate limit') ||
                           error?.response?.status === 429;
        
        if (isRateLimit) {
            logger.log('⚠️ Rate limit detected in AI parsing, using manual extraction fallback');
        } else {
            logger.error('AI Parse error, using manual extraction:', error);
        }
        // Always fallback to manual extraction (works without API)
        return ExtractNutritionManually(text);
    }
};

// Fallback: Manual regex extraction (works without AI) - Improved version
const ExtractNutritionManually = (text) => {
    const extractNumber = (patterns) => {
        // Try multiple patterns
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const num = match[1]?.replace(/[^\d.]/g, '');
                const parsed = parseFloat(num);
                if (!isNaN(parsed) && parsed > 0) {
                    return parsed;
                }
            }
        }
        return 0;
    };

    // Improved extraction with multiple patterns (more comprehensive)
    const calories = extractNumber([
        /calories?\s*[:\s]*(\d+)/i,
        /(\d+)\s*calories?/i,
        /cal\s*[:\s]*(\d+)/i,
        /kcal\s*[:\s]*(\d+)/i,
        /(\d+)\s*kcal/i,
        /energy\s*[:\s]*(\d+)/i
    ]);

    const protein = extractNumber([
        /protein\s*[:\s]*(\d+)/i,
        /(\d+)\s*g\s*protein/i,
        /protein[^\d]*(\d+)/i,
        /prot\s*[:\s]*(\d+)/i
    ]);

    const carbohydrates = extractNumber([
        /total\s*carbohydrates?\s*[:\s]*(\d+)/i,
        /carbohydrates?\s*[:\s]*(\d+)/i,
        /(\d+)\s*g\s*(?:total\s*)?carbohydrates?/i,
        /carbs?\s*[:\s]*(\d+)/i,
        /total\s*carbs?\s*[:\s]*(\d+)/i,
        /carb\s*[:\s]*(\d+)/i
    ]);

    const fat = extractNumber([
        /total\s*fat\s*[:\s]*(\d+)/i,
        /fat\s*[:\s]*(\d+)/i,
        /(\d+)\s*g\s*(?:total\s*)?fat/i,
        /total\s*lipid\s*[:\s]*(\d+)/i
    ]);

    const sodium = extractNumber([
        /sodium\s*[:\s]*(\d+)/i,
        /(\d+)\s*mg\s*sodium/i,
        /sodium[^\d]*(\d+)/i,
        /na\s*[:\s]*(\d+)/i,
        /(\d+)\s*mg\s*na/i
    ]);

    const sugar = extractNumber([
        /total\s*sugars?\s*[:\s]*(\d+)/i,
        /sugars?\s*[:\s]*(\d+)/i,
        /(\d+)\s*g\s*sugars?/i,
        /total\s*sugar\s*[:\s]*(\d+)/i,
        /added\s*sugars?\s*[:\s]*(\d+)/i
    ]);

    const servingSize = text.match(/(?:serving\s*size)[\s:]*([^\n]+)/i)?.[1]?.trim() || 
                         text.match(/(\d+\s*(?:g|oz|ml|cup|piece|serving)[^\n]*)/i)?.[1]?.trim() || 
                         '1 serving';
    
    const servingsPerContainer = extractNumber([
        /servings?\s*per\s*container\s*(\d+)/i,
        /(\d+)\s*servings?\s*per/i
    ]) || 1;

    const result = {
        calories,
        protein,
        carbohydrates,
        fat,
        sodium,
        sugar,
        servingSize,
        servingsPerContainer
    };

    logger.log('📊 Manual extraction result:', result);
    return result;
};


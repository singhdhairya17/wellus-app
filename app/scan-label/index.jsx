import { View, Text, Image, Alert, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { useState, useContext } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { ExtractNutritionFromLabel } from '../../services/ocr/OCRService'
import { isLocalOCRAvailable } from '../../services/ocr/LocalOCRService'
import { logger } from '../../utils/logger'
import Button from '../../components/common/shared/Button'
import Colors from '../../constants/colors'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Camera01Icon, ImageAddIcon } from '@hugeicons/core-free-icons'
import Input from '../../components/common/shared/Input'
import { useRouter } from 'expo-router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import moment from 'moment'
import { GenerateFoodItemExplanation } from '../../services/ai/XAIService'
import { useConvex } from 'convex/react'

const formatGrams = (n) => {
    const v = Number(n) || 0
    const r = parseFloat(v.toFixed(1))
    return `${r}g`
}

export default function ScanLabel() {
    console.log('ML Kit available:', isLocalOCRAvailable())
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [nutritionData, setNutritionData] = useState(null)
    const [editing, setEditing] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [mealType, setMealType] = useState('Snack')
    const [saving, setSaving] = useState(false)
    const router = useRouter()
    const { user } = useContext(UserContext)
    const { setRefreshData } = useContext(RefreshDataContext)
    const SaveScannedFood = useMutation(api.MealPlan.SaveScannedFood)
    const convex = useConvex()
    const [currentIntake, setCurrentIntake] = useState({
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
        sugar: 0
    })

    const recropCurrentImage = async () => {
        if (!image) return

        try {
            const cropperModule = await import('react-native-image-crop-picker')
            const Cropper = cropperModule?.default || cropperModule
            if (!Cropper?.openCropper) {
                Alert.alert('Cropper unavailable', 'Re-crop requires a dev build (not Expo Go).')
                return
            }

            let localUri = image

            // If current image is a remote URL, download to local before cropping
            if (typeof localUri === 'string' && (localUri.startsWith('http://') || localUri.startsWith('https://'))) {
                const downloadRes = await FileSystem.downloadAsync(
                    localUri,
                    FileSystem.cacheDirectory + `label_recrop_${Date.now()}.jpg`
                )
                if (!downloadRes?.uri) throw new Error('Failed to download image for cropping')
                localUri = downloadRes.uri
            }

            // Cropper expects a filesystem path (no file:// prefix)
            const cropPath = localUri.startsWith('file://') ? localUri.replace('file://', '') : localUri

            const cropped = await Cropper.openCropper({
                path: cropPath,
                cropping: true,
                freeStyleCropEnabled: true,
                compressImageQuality: 1,
                includeBase64: false,
                forceJpg: true,
            })

            const croppedUri = cropped?.path ? `file://${cropped.path}` : null
            if (croppedUri) {
                logger.log('✅ Re-cropped image:', croppedUri)
                setImage(croppedUri)
                setNutritionData(null)
            }
        } catch (e) {
            logger.warn('⚠️ Re-crop failed:', e?.message || e)
            Alert.alert('Re-crop failed', 'Could not open cropper. Please try again.')
        }
    }

    const pickImage = async () => {
        // Prefer a true crop/straighten UX (works offline).
        // Fallback to expo-image-picker if the native cropper isn't available.
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'We need camera roll permission to scan labels')
                return
            }

            const cropperModule = await import('react-native-image-crop-picker')
            const Cropper = cropperModule?.default || cropperModule
            if (Cropper?.openPicker) {
                logger.log('✂️ Using on-device cropper for gallery image...')
                const cropped = await Cropper.openPicker({
                    cropping: true,
                    freeStyleCropEnabled: true,
                    mediaType: 'photo',
                    compressImageQuality: 1,
                    includeBase64: false,
                    forceJpg: true,
                })

                const croppedUri = cropped?.path ? `file://${cropped.path}` : null
                if (croppedUri) {
                    logger.log('✅ Cropped image:', croppedUri)
                    setImage(croppedUri)
                    setNutritionData(null)
                    return
                }
            }
        } catch (e) {
            logger.warn('⚠️ Cropper unavailable, falling back to image picker:', e?.message || e)
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            const uri = result.assets[0].uri
            logger.log('🖼️ Image selected from library:', uri)
            setImage(uri)
            setNutritionData(null)
        }
    }

    const takePhoto = async () => {
        // Prefer a true "document scanner" capture (edge detect + crop + perspective fix)
        // Fallback to normal camera capture if scanner isn't available.
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'We need camera permission to scan labels')
                return
            }

            // Dynamically import so builds without the native module won't crash.
            const scannerModule = await import('react-native-document-scanner-plugin')
            const DocumentScanner = scannerModule?.default || scannerModule

            if (DocumentScanner?.scanDocument) {
                logger.log('📄 Using on-device document scanner capture...')
                const scanResult = await DocumentScanner.scanDocument({
                    croppedImageQuality: 100,
                    responseType: 'imageFilePath',
                    maxNumDocuments: 1,
                })

                const scannedUri = scanResult?.scannedImages?.[0]
                if (scannedUri) {
                    logger.log('✅ Document scanned:', scannedUri)
                    setImage(scannedUri)
                    setNutritionData(null)
                    return
                }

                // User cancelled or scan failed; fall through to normal camera.
                logger.log('ℹ️ Document scan cancelled/empty, falling back to camera capture')
            }
        } catch (e) {
            logger.warn('⚠️ Document scanner unavailable, falling back to camera capture:', e?.message || e)
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            const uri = result.assets[0].uri
            logger.log('📸 Photo captured:', uri)
            setImage(uri)
            setNutritionData(null)
        }
    }

    const loadImageFromUrl = async () => {
        if (!imageUrl.trim()) {
            Alert.alert('Error', 'Please enter an image URL')
            return
        }

        // Validate URL
        try {
            new URL(imageUrl)
        } catch {
            Alert.alert('Error', 'Please enter a valid URL')
            return
        }

        // For consistency, download URL → crop/straighten locally → run OCR
        try {
            const downloadRes = await FileSystem.downloadAsync(
                imageUrl,
                FileSystem.cacheDirectory + `label_${Date.now()}.jpg`
            )

            const localUri = downloadRes?.uri
            if (!localUri) throw new Error('Failed to download image')

            try {
                const cropperModule = await import('react-native-image-crop-picker')
                const Cropper = cropperModule?.default || cropperModule
                if (Cropper?.openCropper) {
                    logger.log('✂️ Using on-device cropper for URL image...')
                    const cropped = await Cropper.openCropper({
                        path: localUri.replace('file://', ''),
                        cropping: true,
                        freeStyleCropEnabled: true,
                        compressImageQuality: 1,
                        includeBase64: false,
                        forceJpg: true,
                    })

                    const croppedUri = cropped?.path ? `file://${cropped.path}` : localUri
                    logger.log('✅ URL image prepared:', croppedUri)
                    setImage(croppedUri)
                } else {
                    logger.log('ℹ️ Cropper not available; using downloaded image')
                    setImage(localUri)
                }
            } catch (cropErr) {
                logger.warn('⚠️ Cropper failed; using downloaded image:', cropErr?.message || cropErr)
                setImage(localUri)
            }
        } catch (err) {
            logger.warn('⚠️ URL download/crop failed; using URL directly:', err?.message || err)
            setImage(imageUrl)
        }

        setImageUrl('')
        setShowUrlInput(false)
        setNutritionData(null)
    }

    // Fetch current daily intake when nutrition data is available
    React.useEffect(() => {
        if (nutritionData && user?._id) {
            const fetchCurrentIntake = async () => {
                try {
                    const result = await convex.query(api.MealPlan.GetDailyMacronutrients, {
                        date: moment().format('DD/MM/YYYY'),
                        uid: user._id
                    })
                    setCurrentIntake(result || {
                        calories: 0,
                        protein: 0,
                        carbohydrates: 0,
                        fat: 0,
                        sodium: 0,
                        sugar: 0
                    })
                } catch (error) {
                    console.error('Error fetching current intake:', error)
                }
            }
            fetchCurrentIntake()
        }
    }, [nutritionData, user])

    const scanLabel = async () => {
        if (!image) {
            Alert.alert('No Image', 'Please select or take a photo first')
            return
        }

        setLoading(true)
        try {
            const startMs = Date.now()
            logger.log('🔎 Scan started:', {
                source: image.startsWith('http') ? 'remote_url' : 'local_file',
                imagePreview: image?.substring?.(0, 80),
            })
            const data = await ExtractNutritionFromLabel(image)
            setNutritionData(data)
            setEditing(false)
            logger.log('✅ Scan completed:', {
                ms: Date.now() - startMs,
                dataPreview: data,
                debug: data?.__debug,
            })
            Alert.alert('Success!', 'Nutrition data extracted successfully')
        } catch (error) {
            console.error(error)
            logger.error('❌ Scan failed:', error?.message || error)
            // Always show manual entry option when OCR fails
            const shouldShowManual = error.message?.includes('Both OCR services failed') || 
                                    error.message?.includes('Rate limit') ||
                                    error.message?.includes('failed');
            
            if (shouldShowManual) {
                // Automatically open manual entry
                setNutritionData({
                    calories: 0,
                    protein: 0,
                    carbohydrates: 0,
                    fat: 0,
                    sodium: 0,
                    sugar: 0,
                    servingSize: '1 serving',
                    servingsPerContainer: 1
                })
                setEditing(true)
                Alert.alert(
                    'OCR Services Unavailable', 
                    'Free OCR services are currently limited.\n\nPlease enter the nutrition data manually using the form below.',
                    [{ text: 'OK' }]
                )
            } else {
                Alert.alert(
                    'OCR Failed', 
                    error.message || 'Failed to extract nutrition data automatically.\n\nWould you like to enter the data manually?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        },
                        {
                            text: 'Enter Manually',
                            onPress: () => {
                                setNutritionData({
                                    calories: 0,
                                    protein: 0,
                                    carbohydrates: 0,
                                    fat: 0,
                                    sodium: 0,
                                    sugar: 0,
                                    servingSize: '1 serving',
                                    servingsPerContainer: 1
                                })
                                setEditing(true)
                            }
                        }
                    ]
                )
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Scan food label</Text>
                <Text style={styles.subtitle}>Take a photo, select from gallery, or paste image URL</Text>
            </View>

            {/* Image Selection */}
            <View style={styles.imageSection}>
                {image ? (
                    <View>
                        <Image source={{ uri: image }} style={styles.image} />
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                                <Text style={styles.loadingText}>Scanning label...</Text>
                                <Text style={styles.loadingSubtext}>This may take 10-30 seconds</Text>
                            </View>
                        )}
                        <View style={styles.imageButtons}>
                            <Button
                                title="Rescan"
                                onPress={() => {
                                    setImage(null)
                                    setNutritionData(null)
                                }}
                            />
                            <View style={{ height: 10 }} />
                            <Button
                                title="Re-crop"
                                onPress={recropCurrentImage}
                                disabled={loading}
                            />
                            <View style={{ height: 10 }} />
                            <Button
                                title={loading ? "Scanning..." : "Extract Data"}
                                onPress={scanLabel}
                                loading={loading}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        {showUrlInput ? (
                            <View style={styles.urlInputContainer}>
                                <Input
                                    label="Paste Image URL from Google Images"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                />
                                <View style={styles.urlButtons}>
                                    <Button
                                        title="Load Image"
                                        onPress={loadImageFromUrl}
                                    />
                                    <View style={{ height: 10 }} />
                                    <Button
                                        title="Cancel"
                                        onPress={() => {
                                            setShowUrlInput(false)
                                            setImageUrl('')
                                        }}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.buttonRow}>
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Take photo"
                                        onPress={takePhoto}
                                        icon={<HugeiconsIcon icon={Camera01Icon} size={20} color={Colors.WHITE} />}
                                    />
                                </View>
                                <View style={{ height: 10 }} />
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Choose photo"
                                        onPress={pickImage}
                                        icon={<HugeiconsIcon icon={ImageAddIcon} size={20} color={Colors.WHITE} />}
                                    />
                                </View>
                                <View style={{ height: 10 }} />
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="Paste image URL"
                                        onPress={() => setShowUrlInput(true)}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Extracted Nutrition Data */}
            {nutritionData && (
                <View style={styles.nutritionCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Nutrition facts</Text>
                            <Text style={styles.cardSubtitle}>
                                {editing ? 'Adjust values below' : 'Tap Edit to correct any value'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setEditing(!editing)}
                            style={styles.editChip}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.editChipText}>{editing ? 'Done' : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>

                    {editing ? (
                        <ScrollView style={styles.editForm}>
                            <Input
                                label="Calories"
                                placeholder="Calories"
                                value={nutritionData.calories?.toString()}
                                onChangeText={(text) => setNutritionData({...nutritionData, calories: parseFloat(text) || 0})}
                            />
                            <Input
                                label="Protein (g)"
                                placeholder="Protein"
                                value={nutritionData.protein?.toString()}
                                onChangeText={(text) => setNutritionData({...nutritionData, protein: parseFloat(text) || 0})}
                            />
                            <Input
                                label="Carbs (g)"
                                placeholder="Carbohydrates"
                                value={nutritionData.carbohydrates?.toString()}
                                onChangeText={(text) => setNutritionData({...nutritionData, carbohydrates: parseFloat(text) || 0})}
                            />
                            <Input
                                label="Fat (g)"
                                placeholder="Fat"
                                value={nutritionData.fat?.toString()}
                                onChangeText={(text) => setNutritionData({...nutritionData, fat: parseFloat(text) || 0})}
                            />
                            <Input
                                label="Sodium (mg)"
                                placeholder="Sodium"
                                value={nutritionData.sodium?.toString()}
                                onChangeText={(text) => setNutritionData({...nutritionData, sodium: parseFloat(text) || 0})}
                            />
                            <Input
                                label="Sugar (g)"
                                placeholder="Sugar"
                                value={nutritionData.sugar?.toString()}
                                onChangeText={(text) => setNutritionData({...nutritionData, sugar: parseFloat(text) || 0})}
                            />
                        </ScrollView>
                    ) : (
                        <View style={styles.nutritionGrid}>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                    {Math.round(Number(nutritionData.calories) || 0)}
                                </Text>
                                <Text style={styles.nutritionLabel}>Calories</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                    {formatGrams(nutritionData.protein)}
                                </Text>
                                <Text style={styles.nutritionLabel}>Protein</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                    {formatGrams(nutritionData.carbohydrates)}
                                </Text>
                                <Text style={styles.nutritionLabel}>Carbs</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                    {formatGrams(nutritionData.fat)}
                                </Text>
                                <Text style={styles.nutritionLabel}>Fat</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                    {Math.round(Number(nutritionData.sodium) || 0)} mg
                                </Text>
                                <Text style={styles.nutritionLabel}>Sodium</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                                    {formatGrams(nutritionData.sugar)}
                                </Text>
                                <Text style={styles.nutritionLabel}>Sugar</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.sectionBelowGrid}>
                        <View style={styles.mealTypeSelector}>
                            <Text style={styles.mealTypeLabel}>Meal type</Text>
                            <View style={styles.mealTypeButtons}>
                                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setMealType(type)}
                                        style={[
                                            styles.mealTypeButton,
                                            mealType === type && styles.mealTypeButtonActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.mealTypeButtonText,
                                            mealType === type && styles.mealTypeButtonTextActive
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* XAI Explanation Card */}
                        {nutritionData && user && (
                            <View style={styles.xaiCard}>
                                <Text style={styles.xaiTitle}>How this fits your day</Text>
                                {(() => {
                                    const userGoals = {
                                        calories: user.calories || 2000,
                                        proteins: user.proteins || 100,
                                        carbohydrates: user.carbohydrates || 225,
                                        fat: user.fat || 56,
                                        sodium: user.sodium || 2300,
                                        sugar: user.sugar || 50
                                    }
                                    const explanation = GenerateFoodItemExplanation(nutritionData, userGoals, currentIntake)
                                    return (
                                        <>
                                            {explanation?.mainMessage && (
                                                <Text style={styles.xaiMessage}>{explanation.mainMessage}</Text>
                                            )}
                                            {explanation?.details && Array.isArray(explanation.details) && explanation.details.length > 0 && (
                                                <View style={styles.xaiDetails}>
                                                    {explanation.details.map((detail, idx) => (
                                                        <Text
                                                            key={idx}
                                                            style={[
                                                                styles.xaiDetail,
                                                                typeof detail === 'string' &&
                                                                /\(high\)|daily limit/i.test(detail) &&
                                                                styles.xaiDetailNote,
                                                            ]}
                                                        >
                                                            {detail}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                            {explanation?.warning && (
                                                <View style={styles.xaiWarningBox}>
                                                    <Text style={styles.xaiWarningText}>{explanation.warning}</Text>
                                                </View>
                                            )}
                                        </>
                                    )
                                })()}
                            </View>
                        )}
                        
                        <View style={styles.saveSpacer} />
                        <Button
                            title={saving ? 'Saving…' : 'Save to meal plan'}
                            onPress={async () => {
                                if (!nutritionData) {
                                    Alert.alert('Error', 'No nutrition data to save')
                                    return
                                }

                                if (!user?._id) {
                                    Alert.alert('Error', 'Please login first')
                                    return
                                }

                                setSaving(true)
                                try {
                                    // Copy image to permanent storage before saving
                                    let permanentImageUri = image
                                    if (image && image.startsWith('file://')) {
                                        try {
                                            const fileName = `scanned_food_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
                                            const permanentPath = FileSystem.documentDirectory + fileName
                                            
                                            // Ensure document directory exists
                                            const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory)
                                            if (!dirInfo.exists) {
                                                await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true })
                                            }
                                            
                                            // Copy file to permanent location
                                            await FileSystem.copyAsync({
                                                from: image,
                                                to: permanentPath
                                            })
                                            
                                            permanentImageUri = permanentPath
                                            console.log('Image copied to permanent storage:', permanentImageUri)
                                        } catch (copyError) {
                                            console.warn('Failed to copy image to permanent storage, using original:', copyError)
                                            // Continue with original URI if copy fails
                                        }
                                    }
                                    
                                    await SaveScannedFood({
                                        uid: user._id,
                                        date: moment().format('DD/MM/YYYY'),
                                        mealType: mealType,
                                        foodName: 'Scanned Food Item',
                                        calories: nutritionData.calories || 0,
                                        protein: nutritionData.protein || 0,
                                        carbohydrates: nutritionData.carbohydrates || 0,
                                        fat: nutritionData.fat || 0,
                                        sodium: nutritionData.sodium || 0,
                                        sugar: nutritionData.sugar || 0,
                                        servingSize: nutritionData.servingSize,
                                        servingsPerContainer: nutritionData.servingsPerContainer,
                                        imageUri: permanentImageUri
                                    })
                                    
                                    setRefreshData(Date.now())
                                    Alert.alert('Success!', 'Nutrition data saved to your meal plan!')
                                    router.back()
                                } catch (error) {
                                    console.error('Save error:', error)
                                    Alert.alert('Error', 'Failed to save. Please try again.')
                                } finally {
                                    setSaving(false)
                                }
                            }}
                            loading={saving}
                        />
                    </View>
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        padding: 20,
    },
    header: {
        marginTop: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.GRAY,
        marginTop: 5,
    },
    imageSection: {
        marginVertical: 20,
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        marginBottom: 15,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    loadingText: {
        color: Colors.WHITE,
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    loadingSubtext: {
        color: Colors.WHITE,
        marginTop: 5,
        fontSize: 14,
        opacity: 0.8,
    },
    placeholder: {
        minHeight: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.GRAY + '20',
        borderRadius: 12,
        padding: 20,
    },
    buttonRow: {
        width: '100%',
    },
    buttonContainer: {
        width: '100%',
    },
    urlInputContainer: {
        width: '100%',
    },
    urlButtons: {
        marginTop: 15,
    },
    imageButtons: {
        width: '100%',
    },
    nutritionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.12)',
        elevation: 2,
        shadowColor: '#0f766e',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 18,
        gap: 12,
    },
    cardHeaderText: {
        flex: 1,
        minWidth: 0,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 18,
    },
    editChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.35)',
    },
    editChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    nutritionItem: {
        width: '31%',
        flexGrow: 1,
        maxWidth: '33%',
        minHeight: 96,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(20, 184, 166, 0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.14)',
    },
    nutritionValue: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.PRIMARY,
        textAlign: 'center',
    },
    nutritionLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 6,
        fontWeight: '600',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    sectionBelowGrid: {
        marginTop: 24,
    },
    editForm: {
        marginTop: 10,
    },
    mealTypeSelector: {
        marginBottom: 4,
    },
    mealTypeLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
        color: '#334155',
    },
    mealTypeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    mealTypeButton: {
        flex: 1,
        paddingVertical: 11,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        minWidth: '22%',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    mealTypeButtonActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    mealTypeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    mealTypeButtonTextActive: {
        color: Colors.WHITE,
    },
    xaiCard: {
        marginTop: 20,
        padding: 16,
        backgroundColor: 'rgba(20, 184, 166, 0.06)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.18)',
    },
    xaiTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 10,
        color: '#0f766e',
    },
    xaiMessage: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 6,
        lineHeight: 21,
    },
    xaiDetails: {
        marginTop: 6,
        marginBottom: 4,
        gap: 6,
    },
    xaiDetail: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
    },
    xaiDetailNote: {
        color: '#b45309',
        backgroundColor: 'rgba(180, 83, 9, 0.08)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    xaiWarningBox: {
        marginTop: 10,
        padding: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(220, 38, 38, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
    },
    xaiWarningText: {
        fontSize: 13,
        color: '#b91c1c',
        fontWeight: '600',
        lineHeight: 19,
    },
    saveSpacer: {
        height: 20,
    },
})


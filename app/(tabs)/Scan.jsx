import { View, Text, Image, Alert, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native'
import React, { useState, useContext, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { ExtractNutritionFromLabel } from '../../services/ocr/OCRService'
import Button from '../../components/common/shared/Button'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Camera01Icon, ImageAddIcon, Link01Icon } from '@hugeicons/core-free-icons'
import Input from '../../components/common/shared/Input'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import moment from 'moment'
import { GenerateFoodItemExplanation } from '../../services/ai/XAIService'
import { useConvex } from 'convex/react'
import Colors from '../../constants/colors'

export default function Scan() {
    const insets = useSafeAreaInsets()
    const { colors } = useTheme()
    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [nutritionData, setNutritionData] = useState(null)
    const [editing, setEditing] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [mealType, setMealType] = useState('Snack')
    const [saving, setSaving] = useState(false)
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

    // Fetch current daily intake when nutrition data is available
    useEffect(() => {
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

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera roll permission to scan labels')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            setImage(result.assets[0].uri)
            setNutritionData(null)
        }
    }

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera permission to scan labels')
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            setImage(result.assets[0].uri)
            setNutritionData(null)
        }
    }

    const loadImageFromUrl = async () => {
        if (!imageUrl.trim()) {
            Alert.alert('Error', 'Please enter an image URL')
            return
        }

        try {
            new URL(imageUrl)
        } catch {
            Alert.alert('Error', 'Please enter a valid URL')
            return
        }

        setImage(imageUrl)
        setImageUrl('')
        setShowUrlInput(false)
        setNutritionData(null)
    }

    const scanLabel = async () => {
        if (!image) {
            Alert.alert('No Image', 'Please select or take a photo first')
            return
        }

        setLoading(true)
        try {
            const data = await ExtractNutritionFromLabel(image)
            setNutritionData(data)
            
            // Check if data is empty (all zeros) - means OCR failed, need manual entry
            const isEmpty = data.calories === 0 && data.protein === 0 && data.carbohydrates === 0 && 
                           data.fat === 0 && data.sodium === 0 && data.sugar === 0;
            
            if (isEmpty) {
                // Automatically open manual entry when OCR fails
                setEditing(true)
                Alert.alert(
                    'Manual Entry Required',
                    'OCR services are currently unavailable or rate-limited.\n\nPlease enter the nutrition data manually using the form below.',
                    [{ text: 'OK' }]
                )
            } else {
                // Some data was extracted
                setEditing(false)
                const isPartial = data.calories === 0 || data.protein === 0 || data.carbohydrates === 0;
                if (isPartial) {
                    Alert.alert(
                        'Partial Extraction',
                        'Some nutrition data was extracted. Please review and edit the values below.',
                        [{ text: 'OK' }]
                    )
                    setEditing(true) // Open for editing
                } else {
                    Alert.alert('Success!', 'Nutrition data extracted successfully')
                }
            }
        } catch (error) {
            console.error(error)
            
            // Only show error for critical failures (image processing issues)
            // For OCR failures, ExtractNutritionFromLabel now returns empty data instead of throwing
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
                'Manual Entry Required',
                error.message || 'Failed to process image. Please enter the nutrition data manually.',
                [{ text: 'OK' }]
            )
        } finally {
            setLoading(false)
        }
    }

    // Calculate tab bar height for proper spacing
    // Tab bar is typically 60px + safe area bottom (iOS) or 60px (Android)
    const tabBarHeight = Platform.OS === 'ios' 
        ? 60 + Math.max(insets.bottom - 10, 0) 
        : 60;
    // Add extra padding to ensure buttons don't overlap (tab bar + 120px clearance for large buttons)
    const bottomPadding = tabBarHeight + 120;

    return (
        <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            <ScrollView 
                style={[styles.container, { backgroundColor: colors.BACKGROUND }]}
                contentContainerStyle={{
                    paddingBottom: Platform.OS === 'ios' 
                        ? bottomPadding + Math.max(insets.bottom, 20) + 20
                        : bottomPadding + 20
                }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
            >
            <View style={{
                paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : Math.max(insets.top + 10, 20),
                paddingHorizontal: 20,
                paddingBottom: 20
            }}>
                <View style={styles.header}>
                    <View style={[styles.headerIconContainer, {
                        backgroundColor: colors.PRIMARY + '15',
                        shadowColor: colors.PRIMARY,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6
                    }]}>
                        <HugeiconsIcon icon={Camera01Icon} size={36} color={colors.PRIMARY} />
                    </View>
                    <Text style={[styles.title, { color: colors.TEXT }]}>Scan Food Label</Text>
                    <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>Extract nutrition facts from food labels instantly</Text>
                </View>

                {/* Image Selection Section */}
                {!image ? (
                    <View style={styles.imageSection}>
                        {showUrlInput ? (
                            <LinearGradient
                                colors={colors.isDark 
                                    ? [colors.CARD, colors.SURFACE] 
                                    : ['#FFFFFF', '#F8F9FA']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.urlInputCard, {
                                    borderWidth: colors.isDark ? 1 : 0,
                                    borderColor: colors.BORDER
                                }]}
                            >
                                <Text style={[styles.urlInputTitle, { color: colors.TEXT }]}>📎 Paste Image URL</Text>
                                <Input
                                    label="Image URL from Google Images"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrl}
                                    onChangeText={setImageUrl}
                                />
                                <View style={styles.urlButtons}>
                                    <TouchableOpacity
                                        style={[styles.urlLoadButton, { backgroundColor: colors.PRIMARY }]}
                                        onPress={loadImageFromUrl}
                                    >
                                        <Text style={styles.urlLoadButtonText}>Load Image</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.urlCancelButton, {
                                            backgroundColor: colors.CARD,
                                            borderColor: colors.BORDER
                                        }]}
                                        onPress={() => {
                                            setShowUrlInput(false)
                                            setImageUrl('')
                                        }}
                                    >
                                        <Text style={[styles.urlCancelButtonText, { color: colors.TEXT_SECONDARY }]}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        ) : (
                            <View style={styles.optionsContainer}>
                                <Text style={[styles.optionsTitle, { color: colors.TEXT_SECONDARY }]}>Choose an option</Text>
                                
                                <LinearGradient
                                    colors={colors.isDark 
                                        ? [colors.CARD, colors.SURFACE] 
                                        : ['#FFFFFF', '#F8F9FA']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.optionCard, {
                                        borderColor: colors.BORDER + '30',
                                        borderWidth: colors.isDark ? 1 : 1.5
                                    }]}
                                >
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
                                        onPress={takePhoto}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.optionIconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
                                            <HugeiconsIcon icon={Camera01Icon} size={28} color={colors.PRIMARY} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={[styles.optionTitle, { color: colors.TEXT }]}>Take Photo</Text>
                                            <Text style={[styles.optionSubtitle, { color: colors.TEXT_SECONDARY }]}>Use your camera to capture a label</Text>
                                        </View>
                                        <View style={styles.optionArrow}>
                                            <Text style={[styles.optionArrowText, { color: colors.PRIMARY }]}>›</Text>
                                        </View>
                                    </TouchableOpacity>
                                </LinearGradient>

                                <LinearGradient
                                    colors={colors.isDark 
                                        ? [colors.CARD, colors.SURFACE] 
                                        : ['#FFFFFF', '#F8F9FA']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.optionCard, {
                                        borderColor: colors.BORDER + '30',
                                        borderWidth: colors.isDark ? 1 : 1.5
                                    }]}
                                >
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
                                        onPress={pickImage}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.optionIconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
                                            <HugeiconsIcon icon={ImageAddIcon} size={28} color={colors.PRIMARY} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={[styles.optionTitle, { color: colors.TEXT }]}>Choose Photo</Text>
                                            <Text style={[styles.optionSubtitle, { color: colors.TEXT_SECONDARY }]}>Select from your gallery</Text>
                                        </View>
                                        <View style={styles.optionArrow}>
                                            <Text style={[styles.optionArrowText, { color: colors.PRIMARY }]}>›</Text>
                                        </View>
                                    </TouchableOpacity>
                                </LinearGradient>

                                <LinearGradient
                                    colors={colors.isDark 
                                        ? [colors.CARD, colors.SURFACE] 
                                        : ['#FFFFFF', '#F8F9FA']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.optionCard, {
                                        borderColor: colors.BORDER + '30',
                                        borderWidth: colors.isDark ? 1 : 1.5
                                    }]}
                                >
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
                                        onPress={() => setShowUrlInput(true)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.optionIconContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
                                            <HugeiconsIcon icon={Link01Icon} size={28} color={colors.PRIMARY} />
                                        </View>
                                        <View style={styles.optionContent}>
                                            <Text style={[styles.optionTitle, { color: colors.TEXT }]}>Paste Image URL</Text>
                                            <Text style={[styles.optionSubtitle, { color: colors.TEXT_SECONDARY }]}>Load image from web link</Text>
                                        </View>
                                        <View style={styles.optionArrow}>
                                            <Text style={[styles.optionArrowText, { color: colors.PRIMARY }]}>›</Text>
                                        </View>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.imageSection}>
                        <LinearGradient
                            colors={colors.isDark 
                                ? [colors.CARD, colors.SURFACE] 
                                : ['#FFFFFF', '#F8F9FA']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.imageCard, {
                                borderWidth: colors.isDark ? 1 : 1.5,
                                borderColor: colors.BORDER + '30'
                            }]}
                        >
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: image }} style={styles.image} />
                                {loading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color={colors.WHITE} />
                                        <Text style={styles.loadingText}>Scanning Label...</Text>
                                        <Text style={styles.loadingSubtext}>Extracting nutrition data</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.imageActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.PRIMARY }]}
                                    onPress={scanLabel}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={colors.WHITE} />
                                    ) : (
                                        <>
                                            <HugeiconsIcon icon={Camera01Icon} size={20} color={colors.WHITE} />
                                            <Text style={styles.actionButtonText}>Scan Label</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, {
                                        backgroundColor: colors.CARD,
                                        borderWidth: 1.5,
                                        borderColor: colors.BORDER
                                    }]}
                                    onPress={() => {
                                        setImage(null)
                                        setNutritionData(null)
                                    }}
                                    disabled={loading}
                                >
                                    <Text style={[styles.changeButtonText, { color: colors.TEXT_SECONDARY }]}>Change Image</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Extracted Nutrition Data */}
                {nutritionData && (
                    <LinearGradient
                        colors={colors.isDark 
                            ? [colors.CARD, colors.SURFACE] 
                            : ['#FFFFFF', '#F8F9FA']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.nutritionCard, {
                            borderWidth: colors.isDark ? 1 : 0,
                            borderColor: colors.BORDER
                        }]}
                    >
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={[styles.cardTitle, { color: colors.TEXT }]}>
                                    {editing ? '✏️ Enter Nutrition Facts' : '✅ Nutrition Facts'}
                                </Text>
                                {!editing && (
                                    <TouchableOpacity 
                                        onPress={() => setEditing(true)}
                                        style={styles.editButton}
                                    >
                                        <Text style={[styles.editButtonText, { color: colors.TEXT_SECONDARY }]}>Tap to edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {editing && (
                                <TouchableOpacity
                                    onPress={() => setEditing(false)}
                                    style={[styles.doneButton, { backgroundColor: colors.PRIMARY }]}
                                >
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {editing ? (
                            <ScrollView 
                                style={styles.editForm}
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={styles.editFormContent}
                                nestedScrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={styles.inputSection}>
                                    <Text style={[styles.sectionLabel, { color: colors.PRIMARY }]}>Macronutrients</Text>
                                    <View style={styles.inputRow}>
                                        <View style={styles.inputHalf}>
                                            <Input
                                                label="Calories"
                                                placeholder="0"
                                                value={nutritionData.calories?.toString() || '0'}
                                                onChangeText={(text) => setNutritionData({...nutritionData, calories: parseFloat(text) || 0})}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.inputHalf}>
                                            <Input
                                                label="Protein (g)"
                                                placeholder="0"
                                                value={nutritionData.protein?.toString() || '0'}
                                                onChangeText={(text) => setNutritionData({...nutritionData, protein: parseFloat(text) || 0})}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <View style={styles.inputHalf}>
                                            <Input
                                                label="Carbs (g)"
                                                placeholder="0"
                                                value={nutritionData.carbohydrates?.toString() || '0'}
                                                onChangeText={(text) => setNutritionData({...nutritionData, carbohydrates: parseFloat(text) || 0})}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.inputHalf}>
                                            <Input
                                                label="Fat (g)"
                                                placeholder="0"
                                                value={nutritionData.fat?.toString() || '0'}
                                                onChangeText={(text) => setNutritionData({...nutritionData, fat: parseFloat(text) || 0})}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.inputSection}>
                                    <Text style={[styles.sectionLabel, { color: colors.PRIMARY }]}>Other Nutrients</Text>
                                    <View style={styles.inputRow}>
                                        <View style={styles.inputHalf}>
                                            <Input
                                                label="Sodium (mg)"
                                                placeholder="0"
                                                value={nutritionData.sodium?.toString() || '0'}
                                                onChangeText={(text) => setNutritionData({...nutritionData, sodium: parseFloat(text) || 0})}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.inputHalf}>
                                            <Input
                                                label="Sugar (g)"
                                                placeholder="0"
                                                value={nutritionData.sugar?.toString() || '0'}
                                                onChangeText={(text) => setNutritionData({...nutritionData, sugar: parseFloat(text) || 0})}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        ) : (
                            <View style={styles.nutritionGrid}>
                                <View style={[styles.nutritionItem, { backgroundColor: colors.PRIMARY + '15' }]}>
                                    <Text style={[styles.nutritionValue, { color: colors.PRIMARY }]}>{nutritionData.calories || 0}</Text>
                                    <Text style={[styles.nutritionLabel, { color: colors.TEXT_SECONDARY }]}>Calories</Text>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: colors.PRIMARY + '15' }]}>
                                    <Text style={[styles.nutritionValue, { color: colors.PRIMARY }]}>{nutritionData.protein || 0}g</Text>
                                    <Text style={[styles.nutritionLabel, { color: colors.TEXT_SECONDARY }]}>Protein</Text>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: colors.PRIMARY + '15' }]}>
                                    <Text style={[styles.nutritionValue, { color: colors.PRIMARY }]}>{nutritionData.carbohydrates || 0}g</Text>
                                    <Text style={[styles.nutritionLabel, { color: colors.TEXT_SECONDARY }]}>Carbs</Text>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: colors.PRIMARY + '15' }]}>
                                    <Text style={[styles.nutritionValue, { color: colors.PRIMARY }]}>{nutritionData.fat || 0}g</Text>
                                    <Text style={[styles.nutritionLabel, { color: colors.TEXT_SECONDARY }]}>Fat</Text>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: colors.PRIMARY + '15' }]}>
                                    <Text style={[styles.nutritionValue, { color: colors.PRIMARY }]}>{nutritionData.sodium || 0}mg</Text>
                                    <Text style={[styles.nutritionLabel, { color: colors.TEXT_SECONDARY }]}>Sodium</Text>
                                </View>
                                <View style={[styles.nutritionItem, { backgroundColor: colors.PRIMARY + '15' }]}>
                                    <Text style={[styles.nutritionValue, { color: colors.PRIMARY }]}>{nutritionData.sugar || 0}g</Text>
                                    <Text style={[styles.nutritionLabel, { color: colors.TEXT_SECONDARY }]}>Sugar</Text>
                                </View>
                            </View>
                        )}

                        {/* Meal Type Selector - Always visible */}
                        <View style={styles.mealTypeSelector}>
                            <Text style={[styles.mealTypeLabel, { color: colors.TEXT_SECONDARY }]}>Meal Type</Text>
                            <View style={styles.mealTypeButtons}>
                                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setMealType(type)}
                                        style={[
                                            styles.mealTypeButton,
                                            {
                                                backgroundColor: mealType === type ? colors.PRIMARY : colors.CARD,
                                                borderColor: mealType === type ? colors.PRIMARY : colors.BORDER
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.mealTypeButtonText,
                                            {
                                                color: mealType === type ? colors.WHITE : colors.TEXT_SECONDARY
                                            }
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        {/* XAI Explanation Card - Only show when not editing */}
                        {!editing && nutritionData && user && (
                            <View style={[styles.xaiCard, {
                                backgroundColor: colors.PRIMARY + '15',
                                borderLeftColor: colors.PRIMARY
                            }]}>
                                <Text style={[styles.xaiTitle, { color: colors.PRIMARY }]}>💡 Impact Analysis</Text>
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
                                                <Text style={[styles.xaiMessage, { color: colors.TEXT }]}>{explanation.mainMessage}</Text>
                                            )}
                                            {explanation?.details && Array.isArray(explanation.details) && explanation.details.length > 0 && (
                                                <View style={styles.xaiDetails}>
                                                    {explanation.details.map((detail, idx) => (
                                                        <Text key={idx} style={[styles.xaiDetail, { color: colors.TEXT_SECONDARY }]}>{detail}</Text>
                                                    ))}
                                                </View>
                                            )}
                                            {explanation.warning && (
                                                <Text style={[styles.xaiWarning, { color: colors.RED }]}>{explanation.warning}</Text>
                                            )}
                                        </>
                                    )
                                })()}
                            </View>
                        )}
                        
                        {/* Save Button */}
                        <View style={{ marginTop: 20 }}>
                            <Button
                                title={saving ? "Saving..." : "✅ Save to Meal Plan"}
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
                                        
                                        // Reset form
                                        setImage(null)
                                        setNutritionData(null)
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
                    </LinearGradient>
                )}
            </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    headerIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.PRIMARY + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    imageSection: {
        marginVertical: 10,
    },
    optionsContainer: {
        marginTop: 10,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    optionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 14,
    },
    optionArrow: {
        marginLeft: 10,
    },
    optionArrowText: {
        fontSize: 24,
        fontWeight: '300',
    },
    urlInputCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    urlInputTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    urlButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
    },
    urlLoadButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    urlLoadButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    urlCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    urlCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    imageCard: {
        borderRadius: 16,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 15,
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 12,
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
    imageActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    scanButton: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    actionButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    changeButton: {
        borderWidth: 1.5,
    },
    changeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    nutritionCard: {
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        marginBottom: 40,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    nutritionItem: {
        width: '30%',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    nutritionValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    nutritionLabel: {
        fontSize: 12,
        marginTop: 5,
    },
    editForm: {
        marginTop: 10,
        maxHeight: 400,
    },
    editFormContent: {
        paddingBottom: 30,
    },
    inputSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    inputHalf: {
        flex: 1,
    },
    editButton: {
        marginTop: 4,
    },
    editButtonText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    doneButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    doneButtonText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: '600',
    },
    mealTypeSelector: {
        marginTop: 20,
        marginBottom: 15,
    },
    mealTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    mealTypeButtons: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    mealTypeButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    mealTypeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    xaiCard: {
        marginTop: 15,
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    xaiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    xaiMessage: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    xaiDetails: {
        marginTop: 8,
        marginBottom: 8,
    },
    xaiDetail: {
        fontSize: 12,
        marginBottom: 4,
    },
    xaiWarning: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
})


import { View, Text, Image, Alert, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { useState, useContext } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { ExtractNutritionFromLabel } from '../../services/ocr/OCRService'
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

export default function ScanLabel() {
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

        // Validate URL
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
            const data = await ExtractNutritionFromLabel(image)
            setNutritionData(data)
            setEditing(false)
            Alert.alert('Success!', 'Nutrition data extracted successfully')
        } catch (error) {
            console.error(error)
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
                <Text style={styles.title}>📷 Scan Food Label</Text>
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
                                        title="📷 Take Photo"
                                        onPress={takePhoto}
                                        icon={<HugeiconsIcon icon={Camera01Icon} size={20} color={Colors.WHITE} />}
                                    />
                                </View>
                                <View style={{ height: 10 }} />
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="🖼️ Choose Photo"
                                        onPress={pickImage}
                                        icon={<HugeiconsIcon icon={ImageAddIcon} size={20} color={Colors.WHITE} />}
                                    />
                                </View>
                                <View style={{ height: 10 }} />
                                <View style={styles.buttonContainer}>
                                    <Button
                                        title="🌐 Paste Image URL"
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
                        <Text style={styles.cardTitle}>✅ Extracted Nutrition Facts</Text>
                        <Button
                            title={editing ? "Done" : "✏️ Edit"}
                            onPress={() => setEditing(!editing)}
                        />
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
                                <Text style={styles.nutritionValue}>{nutritionData.calories || 0}</Text>
                                <Text style={styles.nutritionLabel}>Calories</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutritionData.protein || 0}g</Text>
                                <Text style={styles.nutritionLabel}>Protein</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutritionData.carbohydrates || 0}g</Text>
                                <Text style={styles.nutritionLabel}>Carbs</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutritionData.fat || 0}g</Text>
                                <Text style={styles.nutritionLabel}>Fat</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutritionData.sodium || 0}mg</Text>
                                <Text style={styles.nutritionLabel}>Sodium</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutritionData.sugar || 0}g</Text>
                                <Text style={styles.nutritionLabel}>Sugar</Text>
                            </View>
                        </View>
                    )}

                    <View style={{ marginTop: 20 }}>
                        <View style={styles.mealTypeSelector}>
                            <Text style={styles.mealTypeLabel}>Meal Type:</Text>
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
                                <Text style={styles.xaiTitle}>💡 Impact Analysis</Text>
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
                                                        <Text key={idx} style={styles.xaiDetail}>{detail}</Text>
                                                    ))}
                                                </View>
                                            )}
                                            {explanation?.warning && (
                                                <Text style={styles.xaiWarning}>{explanation.warning}</Text>
                                            )}
                                        </>
                                    )
                                })()}
                            </View>
                        )}
                        
                        <View style={{ height: 15 }} />
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
        borderRadius: 12,
        padding: 20,
        marginTop: 20,
        marginBottom: 40,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
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
        backgroundColor: Colors.PRIMARY + '10',
        borderRadius: 8,
        marginBottom: 10,
    },
    nutritionValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    nutritionLabel: {
        fontSize: 12,
        color: Colors.GRAY,
        marginTop: 5,
    },
    editForm: {
        marginTop: 10,
    },
    mealTypeSelector: {
        marginBottom: 10,
    },
    mealTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: Colors.GRAY,
    },
    mealTypeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    mealTypeButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.GRAY + '20',
        alignItems: 'center',
        minWidth: '22%',
    },
    mealTypeButtonActive: {
        backgroundColor: Colors.PRIMARY,
    },
    mealTypeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.GRAY,
    },
    mealTypeButtonTextActive: {
        color: Colors.WHITE,
    },
    xaiCard: {
        marginTop: 15,
        padding: 15,
        backgroundColor: Colors.PRIMARY + '10',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: Colors.PRIMARY,
    },
    xaiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: Colors.PRIMARY,
    },
    xaiMessage: {
        fontSize: 14,
        color: Colors.GRAY,
        marginBottom: 8,
        lineHeight: 20,
    },
    xaiDetails: {
        marginTop: 8,
        marginBottom: 8,
    },
    xaiDetail: {
        fontSize: 12,
        color: Colors.GRAY,
        marginBottom: 4,
    },
    xaiWarning: {
        fontSize: 13,
        color: Colors.RED,
        fontWeight: '600',
        marginTop: 8,
    },
})


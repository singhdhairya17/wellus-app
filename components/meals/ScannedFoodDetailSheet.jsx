import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import { Image } from 'expo-image'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { CheckmarkCircleIcon, ImageAddIcon, Edit01Icon, Clock01Icon, Calendar01Icon, Cancel01Icon, CheckmarkSquare02Icon } from '@hugeicons/core-free-icons'
import * as FileSystem from 'expo-file-system/legacy'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import moment from 'moment'
import Input from '../common/shared/Input'
import { LinearGradient } from 'expo-linear-gradient'

export default function ScannedFoodDetailSheet({ scannedFood, hideActionSheet }) {
    const { colors } = useTheme()
    const { setRefreshData } = useContext(RefreshDataContext)
    const updateScannedFood = useMutation(api.MealPlan.UpdateScannedFood)
    const [imageLoadError, setImageLoadError] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Editable fields
    const [foodName, setFoodName] = useState('')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')
    const [carbohydrates, setCarbohydrates] = useState('')
    const [fat, setFat] = useState('')
    const [sodium, setSodium] = useState('')
    const [sugar, setSugar] = useState('')

    console.log('[ScannedFoodDetailSheet] Rendering with scannedFood:', scannedFood)

    useEffect(() => {
        if (!scannedFood) return
        
        const url = scannedFood?.mealPlan?.imageUri || scannedFood?.recipe?.imageUrl || ''
        setImageUrl(url)
        
        if (url && url.startsWith('file://') && url.includes('/cache/')) {
            setImageLoadError(true)
            return
        }
        
        if (url && url.startsWith('file://')) {
            FileSystem.getInfoAsync(url)
                .then((info) => {
                    if (!info.exists) {
                        setImageLoadError(true)
                    } else {
                        setImageLoadError(false)
                    }
                })
                .catch(() => {
                    setImageLoadError(true)
                })
        } else {
            setImageLoadError(false)
        }
    }, [scannedFood])

    // Early return if scannedFood is invalid
    if (!scannedFood || typeof scannedFood !== 'object') {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>No food data available</Text>
            </View>
        )
    }

    // Safely extract nutrition data
    const nutritionData = scannedFood?.recipe?.jsonData || {
        calories: scannedFood?.mealPlan?.calories || scannedFood?.recipe?.jsonData?.calories || 0,
        proteins: scannedFood?.recipe?.jsonData?.proteins || scannedFood?.mealPlan?.protein || 0,
        carbohydrates: scannedFood?.recipe?.jsonData?.carbohydrates || scannedFood?.mealPlan?.carbohydrates || 0,
        fat: scannedFood?.recipe?.jsonData?.fat || scannedFood?.mealPlan?.fat || 0,
        sodium: scannedFood?.recipe?.jsonData?.sodium || scannedFood?.mealPlan?.sodium || 0,
        sugar: scannedFood?.recipe?.jsonData?.sugar || scannedFood?.mealPlan?.sugar || 0
    }
    
    // Ensure nutritionData is always an object
    const safeNutritionData = nutritionData && typeof nutritionData === 'object' ? nutritionData : {
        calories: 0,
        proteins: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
        sugar: 0
    }
    
    // Initialize form fields when scannedFood changes
    useEffect(() => {
        if (scannedFood) {
            const currentNutritionData = scannedFood?.recipe?.jsonData || {
                calories: scannedFood?.mealPlan?.calories || scannedFood?.recipe?.jsonData?.calories || 0,
                proteins: scannedFood?.recipe?.jsonData?.proteins || scannedFood?.mealPlan?.protein || 0,
                carbohydrates: scannedFood?.recipe?.jsonData?.carbohydrates || scannedFood?.mealPlan?.carbohydrates || 0,
                fat: scannedFood?.recipe?.jsonData?.fat || scannedFood?.mealPlan?.fat || 0,
                sodium: scannedFood?.recipe?.jsonData?.sodium || scannedFood?.mealPlan?.sodium || 0,
                sugar: scannedFood?.recipe?.jsonData?.sugar || scannedFood?.mealPlan?.sugar || 0
            }
            
            setFoodName(scannedFood.recipe?.recipeName || scannedFood.mealPlan?.foodName || '')
            setCalories(String(currentNutritionData?.calories || 0))
            setProtein(String(currentNutritionData?.proteins || currentNutritionData?.protein || 0))
            setCarbohydrates(String(currentNutritionData?.carbohydrates || 0))
            setFat(String(currentNutritionData?.fat || 0))
            setSodium(String(currentNutritionData?.sodium || 0))
            setSugar(String(currentNutritionData?.sugar || 0))
        }
    }, [scannedFood])

    // Format timestamps
    const loggedTime = scannedFood?.mealPlan?._creationTime 
        ? moment(scannedFood.mealPlan._creationTime).format('MMM DD, h:mm A')
        : null
    
    const finishedEatingTime = scannedFood?.mealPlan?.finishedEatingTime
        ? moment(scannedFood.mealPlan.finishedEatingTime).format('MMM DD, h:mm A')
        : null

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        // Reset to original values
        setFoodName(scannedFood.recipe?.recipeName || scannedFood.mealPlan?.foodName || '')
        setCalories(String(nutritionData?.calories || 0))
        setProtein(String(nutritionData?.proteins || nutritionData?.protein || 0))
        setCarbohydrates(String(nutritionData?.carbohydrates || 0))
        setFat(String(nutritionData?.fat || 0))
        setSodium(String(nutritionData?.sodium || 0))
        setSugar(String(nutritionData?.sugar || 0))
    }

    const handleSave = async () => {
        // Validate inputs
        const caloriesNum = parseFloat(calories) || 0
        const proteinNum = parseFloat(protein) || 0
        const carbsNum = parseFloat(carbohydrates) || 0
        const fatNum = parseFloat(fat) || 0
        const sodiumNum = parseFloat(sodium) || 0
        const sugarNum = parseFloat(sugar) || 0

        if (!foodName.trim()) {
            Alert.alert('Error', 'Please enter a food name')
            return
        }

        if (caloriesNum < 0 || proteinNum < 0 || carbsNum < 0 || fatNum < 0 || sodiumNum < 0 || sugarNum < 0) {
            Alert.alert('Error', 'All values must be positive numbers')
            return
        }

        setLoading(true)
        try {
            await updateScannedFood({
                id: scannedFood?.mealPlan?._id,
                foodName: foodName.trim(),
                calories: caloriesNum,
                protein: proteinNum,
                carbohydrates: carbsNum,
                fat: fatNum,
                sodium: sodiumNum,
                sugar: sugarNum
            })

            setRefreshData(Date.now())
            setIsEditing(false)
            Alert.alert('Success!', 'Food details updated successfully')
        } catch (error) {
            console.error('Update error:', error)
            Alert.alert('Error', 'Failed to update food details. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView 
                style={{ flex: 1, backgroundColor: colors.BACKGROUND }}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >
            {/* Close Button */}
            <TouchableOpacity
                onPress={hideActionSheet}
                style={[styles.closeButton, { backgroundColor: colors.BORDER + '20' }]}
            >
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.TEXT} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    {isEditing ? (
                        <Input
                            value={foodName}
                            onChangeText={setFoodName}
                            placeholder="Food name"
                            style={{ marginBottom: 4 }}
                        />
                    ) : (
                        <>
                            <Text style={[styles.title, { color: colors.TEXT }]} numberOfLines={1}>
                                {scannedFood.recipe?.recipeName || scannedFood.mealPlan?.foodName || 'Scanned Food'}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                {scannedFood.mealPlan?.mealType || 'Meal'} • {scannedFood.mealPlan?.date || 'Today'}
                            </Text>
                        </>
                    )}
                </View>
                {!isEditing && (
                    <TouchableOpacity
                        onPress={handleEdit}
                        style={[styles.editButton, { backgroundColor: colors.PRIMARY + '15' }]}
                    >
                        <HugeiconsIcon icon={Edit01Icon} size={18} color={colors.PRIMARY} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Compact Image */}
            {!imageLoadError && imageUrl && !(imageUrl.startsWith('file://') && imageUrl.includes('/cache/')) ? (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                        onError={() => setImageLoadError(true)}
                    />
                </View>
            ) : null}

            {/* Macronutrients Grid - Editable when in edit mode */}
            <View style={styles.macrosGrid}>
                <View style={[styles.macroItem, { backgroundColor: colors.PRIMARY + '10' }]}>
                    {isEditing ? (
                        <Input
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.PRIMARY }}
                        />
                    ) : (
                        <Text style={[styles.macroValue, { color: colors.PRIMARY }]}>
                            {safeNutritionData?.calories || 0}
                        </Text>
                    )}
                    <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Cal</Text>
                </View>

                <View style={[styles.macroItem, { backgroundColor: colors.BLUE + '10' }]}>
                    {isEditing ? (
                        <Input
                            value={protein}
                            onChangeText={setProtein}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.BLUE }}
                        />
                    ) : (
                        <Text style={[styles.macroValue, { color: colors.BLUE }]}>
                            {safeNutritionData?.proteins || safeNutritionData?.protein || 0}g
                        </Text>
                    )}
                    <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Protein</Text>
                </View>

                <View style={[styles.macroItem, { backgroundColor: colors.PINK + '10' }]}>
                    {isEditing ? (
                        <Input
                            value={carbohydrates}
                            onChangeText={setCarbohydrates}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.PINK }}
                        />
                    ) : (
                        <Text style={[styles.macroValue, { color: colors.PINK }]}>
                            {safeNutritionData?.carbohydrates || 0}g
                        </Text>
                    )}
                    <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Carbs</Text>
                </View>

                <View style={[styles.macroItem, { backgroundColor: colors.GREEN + '10' }]}>
                    {isEditing ? (
                        <Input
                            value={fat}
                            onChangeText={setFat}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.GREEN }}
                        />
                    ) : (
                        <Text style={[styles.macroValue, { color: colors.GREEN }]}>
                            {safeNutritionData?.fat || 0}g
                        </Text>
                    )}
                    <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Fat</Text>
                </View>
            </View>

            {/* Additional Macros - Editable when in edit mode */}
            <View style={styles.additionalMacros}>
                <View style={[styles.additionalItem, { backgroundColor: colors.BORDER + '15' }]}>
                    <Text style={[styles.additionalLabel, { color: colors.TEXT_SECONDARY, marginBottom: isEditing ? 4 : 0 }]}>Sodium</Text>
                    {isEditing ? (
                        <Input
                            value={sodium}
                            onChangeText={setSodium}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ width: '100%', fontSize: 13, fontWeight: '700', color: colors.TEXT }}
                        />
                    ) : (
                        <Text style={[styles.additionalValue, { color: colors.TEXT }]}>{safeNutritionData?.sodium || 0}mg</Text>
                    )}
                </View>
                <View style={[styles.additionalItem, { backgroundColor: colors.BORDER + '15' }]}>
                    <Text style={[styles.additionalLabel, { color: colors.TEXT_SECONDARY, marginBottom: isEditing ? 4 : 0 }]}>Sugar</Text>
                    {isEditing ? (
                        <Input
                            value={sugar}
                            onChangeText={setSugar}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ width: '100%', fontSize: 13, fontWeight: '700', color: colors.TEXT }}
                        />
                    ) : (
                        <Text style={[styles.additionalValue, { color: colors.TEXT }]}>{safeNutritionData?.sugar || 0}g</Text>
                    )}
                </View>
            </View>

            {/* Timestamps - Compact */}
            {(finishedEatingTime || loggedTime) && (
                <View style={[styles.timestamps, { backgroundColor: colors.BORDER + '10' }]}>
                    {finishedEatingTime && (
                        <View style={styles.timestampRow}>
                            <HugeiconsIcon icon={Clock01Icon} size={14} color={colors.GREEN} />
                            <Text style={[styles.timestampText, { color: colors.TEXT_SECONDARY }]}>
                                Finished: {finishedEatingTime}
                            </Text>
                        </View>
                    )}
                    {loggedTime && (
                        <View style={styles.timestampRow}>
                            <HugeiconsIcon icon={Calendar01Icon} size={14} color={colors.BLUE} />
                            <Text style={[styles.timestampText, { color: colors.TEXT_SECONDARY }]}>
                                Logged: {loggedTime}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Save/Cancel Buttons - Only show when editing */}
            {isEditing && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={handleCancel}
                        style={[styles.cancelButton, { 
                            backgroundColor: colors.BORDER + '30',
                            borderColor: colors.BORDER
                        }]}
                        disabled={loading}
                    >
                        <Text style={[styles.cancelButtonText, { color: colors.TEXT }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[colors.PRIMARY, colors.BLUE]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.saveButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.WHITE} />
                            ) : (
                                <>
                                    <HugeiconsIcon icon={CheckmarkSquare02Icon} size={20} color={colors.WHITE} />
                                    <Text style={[styles.saveButtonText, { color: colors.WHITE }]}>Save</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 16,
        paddingBottom: 40,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingRight: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    macrosGrid: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    macroItem: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        minHeight: 80,
        justifyContent: 'center',
    },
    macroValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    macroLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    additionalMacros: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    additionalItem: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        minHeight: 60,
    },
    additionalLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    additionalValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    timestamps: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginBottom: 16,
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timestampText: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    saveButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
})

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useContext } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { CheckmarkCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import Input from '../common/shared/Input'
import Button from '../common/shared/Button'
import { LinearGradient } from 'expo-linear-gradient'

export default function EditScannedFoodSheet({ scannedFood, hideActionSheet }) {
    const { colors } = useTheme()
    const { setRefreshData } = useContext(RefreshDataContext)
    const updateScannedFood = useMutation(api.MealPlan.UpdateScannedFood)
    
    const [loading, setLoading] = useState(false)
    const [foodName, setFoodName] = useState(
        scannedFood?.recipe?.recipeName || scannedFood?.mealPlan?.foodName || ''
    )
    const [calories, setCalories] = useState(
        String(scannedFood?.mealPlan?.calories || scannedFood?.recipe?.jsonData?.calories || 0)
    )
    const [protein, setProtein] = useState(
        String(scannedFood?.recipe?.jsonData?.proteins || scannedFood?.mealPlan?.protein || 0)
    )
    const [carbohydrates, setCarbohydrates] = useState(
        String(scannedFood?.recipe?.jsonData?.carbohydrates || scannedFood?.mealPlan?.carbohydrates || 0)
    )
    const [fat, setFat] = useState(
        String(scannedFood?.recipe?.jsonData?.fat || scannedFood?.mealPlan?.fat || 0)
    )
    const [sodium, setSodium] = useState(
        String(scannedFood?.recipe?.jsonData?.sodium || scannedFood?.mealPlan?.sodium || 0)
    )
    const [sugar, setSugar] = useState(
        String(scannedFood?.recipe?.jsonData?.sugar || scannedFood?.mealPlan?.sugar || 0)
    )

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
            Alert.alert('Success!', 'Food details updated successfully')
            hideActionSheet()
        } catch (error) {
            console.error('Update error:', error)
            Alert.alert('Error', 'Failed to update food details. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            {/* Close Button */}
            <TouchableOpacity
                onPress={hideActionSheet}
                style={[styles.closeButton, { backgroundColor: colors.BORDER + '20' }]}
            >
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.TEXT} />
            </TouchableOpacity>

            <ScrollView 
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.TEXT }]}>Edit Food Details</Text>
                    <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                        Update name and macronutrients
                    </Text>
                </View>

            {/* Food Name */}
            <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.TEXT }]}>Food Name</Text>
                <Input
                    value={foodName}
                    onChangeText={setFoodName}
                    placeholder="Enter food name"
                    style={{ marginTop: 8 }}
                />
            </View>

            {/* Macronutrients */}
            <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.TEXT }]}>Macronutrients</Text>
                
                <View style={styles.macroGrid}>
                    <View style={styles.macroInput}>
                        <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Calories (kcal)</Text>
                        <Input
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ marginTop: 4 }}
                        />
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Protein (g)</Text>
                        <Input
                            value={protein}
                            onChangeText={setProtein}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ marginTop: 4 }}
                        />
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Carbs (g)</Text>
                        <Input
                            value={carbohydrates}
                            onChangeText={setCarbohydrates}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ marginTop: 4 }}
                        />
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Fat (g)</Text>
                        <Input
                            value={fat}
                            onChangeText={setFat}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ marginTop: 4 }}
                        />
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Sodium (mg)</Text>
                        <Input
                            value={sodium}
                            onChangeText={setSodium}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ marginTop: 4 }}
                        />
                    </View>

                    <View style={styles.macroInput}>
                        <Text style={[styles.macroLabel, { color: colors.TEXT_SECONDARY }]}>Sugar (g)</Text>
                        <Input
                            value={sugar}
                            onChangeText={setSugar}
                            placeholder="0"
                            keyboardType="numeric"
                            style={{ marginTop: 4 }}
                        />
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={hideActionSheet}
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
                                <HugeiconsIcon icon={CheckmarkCircleIcon} size={20} color={colors.WHITE} />
                                <Text style={[styles.saveButtonText, { color: colors.WHITE }]}>Save Changes</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    contentContainer: {
        padding: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    inputSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    macroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    macroInput: {
        flex: 1,
        minWidth: '45%',
    },
    macroLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
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
        paddingVertical: 16,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
})


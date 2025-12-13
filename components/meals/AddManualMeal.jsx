import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native'
import React, { useState, useContext } from 'react'
import Colors from '../../constants/colors'
import Input from '../common/shared/Input'
import Button from '../common/shared/Button'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Coffee02Icon, Sun03Icon, Moon02Icon, SpoonAndForkIcon, Close01Icon } from '@hugeicons/core-free-icons'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import moment from 'moment'
import DateSelectionCard from '../ui/DateSelectionCard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { triggerHaptic } from '../../utils/haptics'

const MEAL_TYPES = [
    { key: 'Breakfast', label: 'Breakfast', icon: Coffee02Icon, color: '#FF9500' },
    { key: 'Lunch', label: 'Lunch', icon: Sun03Icon, color: '#007AFF' },
    { key: 'Dinner', label: 'Dinner', icon: Moon02Icon, color: '#5856D6' },
    { key: 'Snack', label: 'Snack', icon: SpoonAndForkIcon, color: '#34C759' }
]

export default function AddManualMeal() {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()
    const [showModal, setShowModal] = useState(false)
    const [mealName, setMealName] = useState('')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')
    const [carbohydrates, setCarbohydrates] = useState('')
    const [fat, setFat] = useState('')
    const [sodium, setSodium] = useState('')
    const [sugar, setSugar] = useState('')
    const [selectedMealType, setSelectedMealType] = useState('Breakfast')
    const [selectedDate, setSelectedDate] = useState(moment().format('DD/MM/YYYY'))
    const [saving, setSaving] = useState(false)
    
    const { user } = useContext(UserContext)
    const { setRefreshData } = useContext(RefreshDataContext)
    const SaveScannedFood = useMutation(api.MealPlan.SaveScannedFood)

    const handleSave = async () => {
        // Validation
        if (!mealName.trim()) {
            triggerHaptic.error()
            Alert.alert('Error', 'Please enter a meal name')
            return
        }

        if (!calories || parseFloat(calories) <= 0) {
            triggerHaptic.error()
            Alert.alert('Error', 'Please enter valid calories')
            return
        }
        
        triggerHaptic.medium()

        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }

        setSaving(true)
        try {
            await SaveScannedFood({
                uid: user._id,
                date: selectedDate,
                mealType: selectedMealType,
                foodName: mealName.trim(),
                calories: parseFloat(calories) || 0,
                protein: parseFloat(protein) || 0,
                carbohydrates: parseFloat(carbohydrates) || 0,
                fat: parseFloat(fat) || 0,
                sodium: parseFloat(sodium) || 0,
                sugar: parseFloat(sugar) || 0,
                servingSize: '1 serving',
                servingsPerContainer: 1
            })

            setRefreshData(Date.now())
            triggerHaptic.success()
            Alert.alert('Success!', 'Meal added to your meal plan!')
            
            // Reset form
            setMealName('')
            setCalories('')
            setProtein('')
            setCarbohydrates('')
            setFat('')
            setSodium('')
            setSugar('')
            setSelectedMealType('Breakfast')
            setSelectedDate(moment().format('DD/MM/YYYY'))
            setShowModal(false)
        } catch (error) {
            console.error('Save error:', error)
            Alert.alert('Error', 'Failed to save meal. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        setShowModal(false)
        // Reset form when closing
        setMealName('')
        setCalories('')
        setProtein('')
        setCarbohydrates('')
        setFat('')
        setSodium('')
        setSugar('')
        setSelectedMealType('Breakfast')
        setSelectedDate(moment().format('DD/MM/YYYY'))
    }

    return (
        <>
            <Button
                title="Add Meal Manually"
                onPress={() => {
                    triggerHaptic.medium()
                    setShowModal(true)
                }}
                icon={<HugeiconsIcon icon={SpoonAndForkIcon} size={20} color={colors.WHITE} />}
            />

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={colors.isDark 
                            ? [colors.CARD, colors.SURFACE] 
                            : ['#FFFFFF', '#F8F9FA']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.modalContent, { 
                            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) + 20 : 20,
                            borderWidth: colors.isDark ? 1 : 0,
                            borderColor: colors.BORDER
                        }]}
                    >
                        <View style={[styles.modalHeader, { borderBottomColor: colors.BORDER }]}>
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Add Meal Manually</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <Text style={[styles.closeButton, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Date Selection */}
                            <View style={styles.section}>
                                <DateSelectionCard
                                    onDateSelect={(date) => setSelectedDate(date)}
                                    selectedDate={selectedDate}
                                    insideScrollView={true}
                                />
                            </View>

                            {/* Meal Type Selection */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Meal Type</Text>
                                <View style={styles.mealTypeContainer}>
                                    {MEAL_TYPES.map((type) => {
                                        const IconComponent = type.icon
                                        const isSelected = selectedMealType === type.key
                                        return (
                                            <TouchableOpacity
                                                key={type.key}
                                                onPress={() => setSelectedMealType(type.key)}
                                                style={[
                                                    styles.mealTypeButton,
                                                    { 
                                                        backgroundColor: colors.CARD,
                                                        borderColor: colors.BORDER
                                                    },
                                                    isSelected && { 
                                                        backgroundColor: type.color + '20',
                                                        borderColor: type.color,
                                                        borderWidth: 2
                                                    }
                                                ]}
                                            >
                                                {IconComponent && (
                                                    <HugeiconsIcon 
                                                        icon={IconComponent} 
                                                        size={24} 
                                                        color={isSelected ? type.color : colors.TEXT_SECONDARY} 
                                                    />
                                                )}
                                                <Text style={[
                                                    styles.mealTypeText,
                                                    { color: isSelected ? type.color : colors.TEXT },
                                                    isSelected && { fontWeight: 'bold' }
                                                ]}>
                                                    {type.label}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>

                            {/* Meal Name */}
                            <View style={styles.section}>
                                <Input
                                    label="Meal Name *"
                                    placeholder="e.g., Grilled Chicken Breast"
                                    value={mealName}
                                    onChangeText={setMealName}
                                />
                            </View>

                            {/* Macronutrients */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Macronutrients</Text>
                                
                                <Input
                                    label="Calories *"
                                    placeholder="e.g., 250"
                                    value={calories}
                                    onChangeText={setCalories}
                                    keyboardType="numeric"
                                />

                                <Input
                                    label="Protein (g)"
                                    placeholder="e.g., 30"
                                    value={protein}
                                    onChangeText={setProtein}
                                    keyboardType="numeric"
                                />

                                <Input
                                    label="Carbohydrates (g)"
                                    placeholder="e.g., 20"
                                    value={carbohydrates}
                                    onChangeText={setCarbohydrates}
                                    keyboardType="numeric"
                                />

                                <Input
                                    label="Fat (g)"
                                    placeholder="e.g., 10"
                                    value={fat}
                                    onChangeText={setFat}
                                    keyboardType="numeric"
                                />

                                <Input
                                    label="Sodium (mg)"
                                    placeholder="e.g., 500"
                                    value={sodium}
                                    onChangeText={setSodium}
                                    keyboardType="numeric"
                                />

                                <Input
                                    label="Sugar (g)"
                                    placeholder="e.g., 5"
                                    value={sugar}
                                    onChangeText={setSugar}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.buttonContainer}>
                                <Button
                                    title={saving ? "Saving..." : "Save Meal"}
                                    onPress={handleSave}
                                    loading={saving}
                                />
                                <View style={{ height: 10 }} />
                                <Button
                                    title="Cancel"
                                    onPress={handleClose}
                                    type="secondary"
                                />
                            </View>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        marginTop: 15,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    mealTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    mealTypeButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    mealTypeText: {
        fontSize: 14,
    },
    buttonContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
})


import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Platform } from 'react-native'
import React, { useContext, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Dumbbell01Icon, PlusSignSquareIcon } from '@hugeicons/core-free-icons'
import Input from '../common/shared/Input'
import Button from '../common/shared/Button'
import moment from 'moment'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const EXERCISE_TYPES = [
    { name: 'Walking', caloriesPerMin: 4 },
    { name: 'Running', caloriesPerMin: 10 },
    { name: 'Cycling', caloriesPerMin: 8 },
    { name: 'Swimming', caloriesPerMin: 12 },
    { name: 'Yoga', caloriesPerMin: 3 },
    { name: 'Weight Training', caloriesPerMin: 6 },
    { name: 'HIIT', caloriesPerMin: 15 },
    { name: 'Dancing', caloriesPerMin: 7 }
]

export default function ExerciseTracker() {
    const { colors } = useTheme()
    const { user } = useContext(UserContext)
    const { refreshData } = useContext(RefreshDataContext)
    const insets = useSafeAreaInsets()
    const [showModal, setShowModal] = useState(false)
    const [exerciseType, setExerciseType] = useState('Walking')
    const [duration, setDuration] = useState('')
    const [saving, setSaving] = useState(false)
    
    const todayExercises = (useQuery(
        api.Tracking.GetExerciseLogs,
        user?._id ? { uid: user._id, date: moment().format('DD/MM/YYYY') } : 'skip'
    ) || [])
    
    const addExercise = useMutation(api.Tracking.AddExerciseLog)
    
    const totalCaloriesBurned = todayExercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0)
    
    const handleSaveExercise = async () => {
        if (!duration || parseFloat(duration) <= 0) {
            Alert.alert('Error', 'Please enter a valid duration')
            return
        }
        
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }
        
        const selectedExercise = EXERCISE_TYPES.find(e => e.name === exerciseType)
        const caloriesBurned = Math.round(selectedExercise.caloriesPerMin * parseFloat(duration))
        
        setSaving(true)
        try {
            await addExercise({
                uid: user._id,
                date: moment().format('DD/MM/YYYY'),
                exerciseType: exerciseType,
                duration: parseFloat(duration),
                caloriesBurned: caloriesBurned
            })
            Alert.alert('Success!', `Exercise logged! ${caloriesBurned} calories burned.`)
            setShowModal(false)
            setDuration('')
            setExerciseType('Walking')
        } catch (error) {
            console.error('Error saving exercise:', error)
            Alert.alert('Error', 'Failed to save exercise. Please try again.')
        } finally {
            setSaving(false)
        }
    }
    
    return (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.container}>
            <LinearGradient
                colors={colors.isDark 
                    ? [colors.CARD, colors.SURFACE] 
                    : ['#FFFFFF', '#F8F9FA']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, {
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.BORDER,
                    shadowColor: colors.PRIMARY,
                    shadowOpacity: colors.isDark ? 0.2 : 0.08,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    elevation: 4
                }]}
            >
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.GREEN + '15' }]}>
                        <HugeiconsIcon icon={Dumbbell01Icon} size={24} color={colors.GREEN} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.TEXT }]}>Exercise</Text>
                        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                            {totalCaloriesBurned} kcal burned today
                        </Text>
                    </View>
                </View>
                
                {todayExercises.length > 0 && (
                    <View style={styles.exercisesList}>
                        {todayExercises.map((exercise, index) => (
                            <View key={index} style={[styles.exerciseItem, { 
                                backgroundColor: colors.BACKGROUND,
                                borderColor: colors.BORDER
                            }]}>
                                <Text style={[styles.exerciseName, { color: colors.TEXT }]}>
                                    {exercise.exerciseType}
                                </Text>
                                <Text style={[styles.exerciseDetails, { color: colors.TEXT_SECONDARY }]}>
                                    {exercise.duration} min • {exercise.caloriesBurned} kcal
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
                
                <TouchableOpacity
                    onPress={() => setShowModal(true)}
                    style={[styles.addButton, { backgroundColor: colors.GREEN }]}
                >
                    <HugeiconsIcon icon={PlusSignSquareIcon} size={20} color={colors.WHITE} />
                    <Text style={styles.addButtonText}>Log Exercise</Text>
                </TouchableOpacity>
            </LinearGradient>
            
            {/* Add Exercise Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
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
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Log Exercise</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Exercise Type</Text>
                                <View style={styles.exerciseTypesContainer}>
                                    {EXERCISE_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.name}
                                            onPress={() => setExerciseType(type.name)}
                                            style={[styles.exerciseTypeButton, {
                                                backgroundColor: exerciseType === type.name 
                                                    ? colors.GREEN + '20' 
                                                    : colors.CARD,
                                                borderColor: exerciseType === type.name 
                                                    ? colors.GREEN 
                                                    : colors.BORDER
                                            }]}
                                        >
                                            <Text style={[styles.exerciseTypeText, {
                                                color: exerciseType === type.name 
                                                    ? colors.GREEN 
                                                    : colors.TEXT,
                                                fontWeight: exerciseType === type.name ? '700' : '500'
                                            }]}>
                                                {type.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            
                            <Input
                                label="Duration (minutes)"
                                placeholder="e.g., 30"
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                            />
                            
                            {duration && exerciseType && (
                                <View style={[styles.caloriePreview, { backgroundColor: colors.GREEN + '15' }]}>
                                    <Text style={[styles.caloriePreviewText, { color: colors.GREEN }]}>
                                        Estimated calories: {Math.round(
                                            EXERCISE_TYPES.find(e => e.name === exerciseType).caloriesPerMin * parseFloat(duration)
                                        )} kcal
                                    </Text>
                                </View>
                            )}
                            
                            <View style={styles.buttonContainer}>
                                <Button
                                    title={saving ? "Saving..." : "Log Exercise"}
                                    onPress={handleSaveExercise}
                                    loading={saving}
                                />
                                <View style={{ height: 10 }} />
                                <Button
                                    title="Cancel"
                                    onPress={() => setShowModal(false)}
                                    type="secondary"
                                />
                            </View>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginTop: 0
    },
    card: {
        borderRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    headerText: {
        flex: 1
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500'
    },
    exercisesList: {
        marginBottom: 15,
        gap: 10
    },
    exerciseItem: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600'
    },
    exerciseDetails: {
        fontSize: 14,
        fontWeight: '500'
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    closeButton: {
        fontSize: 28,
        fontWeight: 'bold'
    },
    modalBody: {
        padding: 20
    },
    section: {
        marginBottom: 20
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12
    },
    exerciseTypesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    exerciseTypeButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1
    },
    exerciseTypeText: {
        fontSize: 14
    },
    caloriePreview: {
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 10
    },
    caloriePreviewText: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center'
    },
    buttonContainer: {
        marginTop: 20
    }
})


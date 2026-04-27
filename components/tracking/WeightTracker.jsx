import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Platform } from 'react-native'
import React, { useContext, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { WeightScaleIcon, PlusSignSquareIcon, AnalyticsUpIcon } from '@hugeicons/core-free-icons'
import Input from '../common/shared/Input'
import Button from '../common/shared/Button'
import moment from 'moment'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function WeightTracker() {
    const { colors } = useTheme()
    const { user, setUser } = useContext(UserContext)
    const { refreshData } = useContext(RefreshDataContext)
    const insets = useSafeAreaInsets()
    const [showModal, setShowModal] = useState(false)
    const [showGoalModal, setShowGoalModal] = useState(false)
    const [weight, setWeight] = useState('')
    const [goalWeight, setGoalWeight] = useState('')
    const [saving, setSaving] = useState(false)
    
    const weightLogs = useQuery(
        api.Tracking.GetWeightLogs,
        user?._id ? { uid: user._id, days: 30 } : 'skip'
    ) || []
    
    const weightStats = useQuery(
        api.Tracking.GetWeightStatistics,
        user?._id ? { uid: user._id, days: 30 } : 'skip'
    )
    
    const correlationData = useQuery(
        api.Tracking.GetCalorieWeightCorrelation,
        user?._id ? { uid: user._id, days: 30 } : 'skip'
    )
    
    const addWeightLog = useMutation(api.Tracking.AddWeightLog)
    const updateUserPref = useMutation(api.Users.UpdateUserPref)
    
    const latestWeight = weightLogs && weightLogs.length > 0 
        ? weightLogs[weightLogs.length - 1].weight 
        : null
    
    // Calculate BMI
    const calculateBMI = (weight, height) => {
        if (!weight || !height) return null
        const heightInMeters = parseFloat(height) * 0.3048 // Convert feet to meters
        const weightInKg = parseFloat(weight)
        if (heightInMeters <= 0 || weightInKg <= 0) return null
        return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
    }
    
    const bmi = user?.weight && user?.height 
        ? calculateBMI(user.weight, user.height) 
        : null
    
    const getBMICategory = (bmi) => {
        if (!bmi) return { label: 'N/A', color: colors.TEXT_SECONDARY }
        const bmiNum = parseFloat(bmi)
        if (bmiNum < 18.5) return { label: 'Underweight', color: colors.BLUE }
        if (bmiNum < 25) return { label: 'Normal', color: colors.GREEN }
        if (bmiNum < 30) return { label: 'Overweight', color: colors.YELLOW }
        return { label: 'Obese', color: colors.RED }
    }
    
    const bmiCategory = getBMICategory(bmi)
    
    // Get trend icon and color
    const getTrendInfo = (trend) => {
        switch(trend) {
            case 'increasing':
                return { icon: AnalyticsUpIcon, color: colors.RED, label: '↑ Increasing' }
            case 'decreasing':
                return { icon: AnalyticsUpIcon, color: colors.GREEN, label: '↓ Decreasing' }
            default:
                return { icon: AnalyticsUpIcon, color: colors.YELLOW, label: '→ Stable' }
        }
    }
    
    const trendInfo = weightStats?.trend ? getTrendInfo(weightStats.trend) : null
    
    // Calculate progress to goal
    const progressToGoal = user?.goalWeight && latestWeight
        ? Math.max(0, Math.min(100, ((latestWeight - user.goalWeight) / Math.abs(user.weight - user.goalWeight)) * 100))
        : null
    
    const handleSaveWeight = async () => {
        if (!weight || parseFloat(weight) <= 0) {
            Alert.alert('Error', 'Please enter a valid weight')
            return
        }
        
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }
        
        setSaving(true)
        try {
            await addWeightLog({
                uid: user._id,
                date: moment().format('DD/MM/YYYY'),
                weight: parseFloat(weight)
            })
            Alert.alert('Success!', 'Weight logged successfully')
            setShowModal(false)
            setWeight('')
        } catch (error) {
            console.error('Error saving weight:', error)
            Alert.alert('Error', 'Failed to save weight. Please try again.')
        } finally {
            setSaving(false)
        }
    }
    
    const handleSaveGoalWeight = async () => {
        if (!goalWeight || parseFloat(goalWeight) <= 0) {
            Alert.alert('Error', 'Please enter a valid goal weight')
            return
        }
        
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }
        
        setSaving(true)
        try {
            await updateUserPref({
                uid: user._id,
                height: user.height || '',
                weight: user.weight || '',
                gender: user.gender || '',
                goal: user.goal || 'Weight Loss',
                goalWeight: parseFloat(goalWeight)
            })
            // Update local user state
            setUser({ ...user, goalWeight: parseFloat(goalWeight) })
            Alert.alert('Success!', 'Goal weight updated successfully')
            setShowGoalModal(false)
            setGoalWeight('')
        } catch (error) {
            console.error('Error saving goal weight:', error)
            Alert.alert('Error', 'Failed to save goal weight. Please try again.')
        } finally {
            setSaving(false)
        }
    }
    
    // Calculate weight change
    const weightChange = weightLogs && weightLogs.length >= 2
        ? (weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight).toFixed(1)
        : weightStats?.weightChange?.toFixed(1) || null
    
    // Calculate remaining to goal
    const remainingToGoal = user?.goalWeight && latestWeight
        ? (user.goalWeight - latestWeight).toFixed(1)
        : null
    
    return (
        <Animated.View entering={FadeInDown.delay(300)} style={styles.container}>
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
                <View style={[styles.headerDividerWrap, { borderBottomColor: colors.BORDER + '55' }]}>
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '18' }]}>
                            <HugeiconsIcon icon={WeightScaleIcon} size={26} color={colors.PRIMARY} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.TEXT }]}>Weight</Text>
                            {latestWeight ? (
                                <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                    Last log {latestWeight} kg
                                    {user?.goalWeight ? ` · Goal ${user.goalWeight} kg` : ''}
                                </Text>
                            ) : (
                                <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                    Log weight to see trends and BMI
                                </Text>
                            )}
                        </View>
                        {user?.goalWeight && (
                            <TouchableOpacity
                                onPress={() => {
                                    setGoalWeight(user.goalWeight.toString())
                                    setShowGoalModal(true)
                                }}
                                style={[styles.goalButton, { backgroundColor: colors.GREEN + '18' }]}
                                accessibilityLabel="Edit goal weight"
                            >
                                <HugeiconsIcon icon={AnalyticsUpIcon} size={18} color={colors.GREEN} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {latestWeight && (
                    <View style={[styles.heroRow, { backgroundColor: colors.PRIMARY + '0D' }]}>
                        <View>
                            <Text style={[styles.heroLabel, { color: colors.TEXT_SECONDARY }]}>Current</Text>
                            <Text style={[styles.heroValue, { color: colors.TEXT }]}>
                                {latestWeight}
                                <Text style={[styles.heroUnit, { color: colors.TEXT_SECONDARY }]}> kg</Text>
                            </Text>
                        </View>
                        {user?.goalWeight != null && (
                            <View style={styles.heroGoal}>
                                <Text style={[styles.heroLabel, { color: colors.TEXT_SECONDARY }]}>Goal</Text>
                                <Text style={[styles.heroGoalValue, { color: colors.PRIMARY }]}>
                                    {user.goalWeight} kg
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                
                {/* Primary Stats (hero shows current weight; tiles = BMI + trend) */}
                <View style={styles.statsContainer}>
                    {bmi && (
                        <View style={[styles.statCard, { 
                            backgroundColor: colors.isDark ? colors.SURFACE : '#FFFFFF',
                            borderColor: colors.BORDER + '40'
                        }]}>
                            <Text style={[styles.statValue, { color: bmiCategory.color }]}>
                                {bmi}
                            </Text>
                            <Text style={[styles.statBmiTag, { color: bmiCategory.color }]}>
                                {bmiCategory.label}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                                BMI
                            </Text>
                        </View>
                    )}
                    
                    {weightChange && (
                        <View style={[styles.statCard, { 
                            backgroundColor: colors.isDark ? colors.SURFACE : '#FFFFFF',
                            borderColor: colors.BORDER + '40'
                        }]}>
                            <Text style={[styles.statValue, { 
                                color: parseFloat(weightChange) >= 0 ? colors.RED : colors.GREEN 
                            }]}>
                                {parseFloat(weightChange) >= 0 ? '+' : ''}{weightChange}
                            </Text>
                            <Text style={[styles.statUnit, { color: colors.TEXT_SECONDARY }]}>kg</Text>
                            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                                30-day Δ
                            </Text>
                        </View>
                    )}
                </View>
                
                {/* Advanced Stats */}
                {(weightStats || correlationData) && (
                    <Text style={[styles.sectionTitle, { color: colors.TEXT_SECONDARY }]}>Insights</Text>
                )}
                {(weightStats || correlationData) && (
                    <View style={styles.advancedStatsContainer}>
                        {weightStats?.weeklyAverage && (
                            <View style={[styles.advancedStatCard, {
                                backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.BLUE
                            }]}>
                                <Text style={[styles.advancedStatValue, { color: colors.TEXT }]}>
                                    {weightStats.weeklyAverage} kg
                                </Text>
                                <Text style={[styles.advancedStatLabel, { color: colors.TEXT_SECONDARY }]}>
                                    Weekly Avg
                                </Text>
                            </View>
                        )}
                        
                        {weightStats?.monthlyAverage && (
                            <View style={[styles.advancedStatCard, {
                                backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.PRIMARY
                            }]}>
                                <Text style={[styles.advancedStatValue, { color: colors.TEXT }]}>
                                    {weightStats.monthlyAverage} kg
                                </Text>
                                <Text style={[styles.advancedStatLabel, { color: colors.TEXT_SECONDARY }]}>
                                    Monthly Avg
                                </Text>
                            </View>
                        )}
                        
                        {trendInfo && (
                            <View style={[styles.advancedStatCard, {
                                backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                borderLeftWidth: 3,
                                borderLeftColor: trendInfo.color
                            }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <HugeiconsIcon icon={trendInfo.icon} size={16} color={trendInfo.color} />
                                    <Text style={[styles.advancedStatValue, { color: trendInfo.color, fontSize: 14 }]}>
                                        {trendInfo.label}
                                    </Text>
                                </View>
                                {weightStats?.predictedWeight && (
                                    <Text style={[styles.advancedStatLabel, { color: colors.TEXT_SECONDARY, marginTop: 4 }]}>
                                        Predicted: {weightStats.predictedWeight} kg
                                    </Text>
                                )}
                            </View>
                        )}
                        
                        {remainingToGoal && (
                            <View style={[styles.advancedStatCard, {
                                backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                borderLeftWidth: 3,
                                borderLeftColor: colors.GREEN
                            }]}>
                                <Text style={[styles.advancedStatValue, { 
                                    color: Math.abs(parseFloat(remainingToGoal)) < 1 ? colors.GREEN : colors.TEXT 
                                }]}>
                                    {Math.abs(parseFloat(remainingToGoal)) < 1
                                        ? 'At goal'
                                        : `${remainingToGoal >= 0 ? '+' : ''}${remainingToGoal} kg`}
                                </Text>
                                <Text style={[styles.advancedStatLabel, { color: colors.TEXT_SECONDARY }]}>
                                    To Goal
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                
                {/* Correlation Analysis */}
                {correlationData && correlationData.correlation !== null && (
                    <View style={[styles.correlationCard, {
                        backgroundColor: colors.isDark ? colors.SURFACE + '80' : colors.BACKGROUND + '80',
                        borderWidth: 1,
                        borderColor: colors.BORDER + '40'
                    }]}>
                        <Text style={[styles.correlationTitle, { color: colors.TEXT }]}>
                            Calorie-Weight Correlation
                        </Text>
                        <Text style={[styles.correlationValue, { 
                            color: Math.abs(correlationData.correlation) > 0.5 ? colors.PRIMARY : colors.TEXT_SECONDARY 
                        }]}>
                            {correlationData.correlation > 0 ? '+' : ''}{correlationData.correlation.toFixed(2)}
                        </Text>
                        <Text style={[styles.correlationMessage, { color: colors.TEXT_SECONDARY }]}>
                            {correlationData.message}
                        </Text>
                    </View>
                )}
                
                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    {!user?.goalWeight && (
                        <TouchableOpacity
                            onPress={() => setShowGoalModal(true)}
                            style={[styles.secondaryButton, { 
                                backgroundColor: colors.GREEN + '15',
                                borderWidth: 1,
                                borderColor: colors.GREEN + '30'
                            }]}
                        >
                            <HugeiconsIcon icon={AnalyticsUpIcon} size={18} color={colors.GREEN} />
                            <Text style={[styles.secondaryButtonText, { color: colors.GREEN }]}>Set Goal</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => setShowModal(true)}
                        style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
                    >
                        <HugeiconsIcon icon={PlusSignSquareIcon} size={20} color={colors.WHITE} />
                        <Text style={styles.addButtonText}>Log Weight</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
            
            {/* Add Weight Modal */}
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
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Log Weight</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Input
                                label="Weight (kg)"
                                placeholder="e.g., 70"
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                            />
                            
                            <View style={styles.buttonContainer}>
                                <Button
                                    title={saving ? "Saving..." : "Save Weight"}
                                    onPress={handleSaveWeight}
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
            
            {/* Set Goal Weight Modal */}
            <Modal
                visible={showGoalModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowGoalModal(false)}
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
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Set Goal Weight</Text>
                            <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Input
                                label="Goal Weight (kg)"
                                placeholder="e.g., 65"
                                value={goalWeight}
                                onChangeText={setGoalWeight}
                                keyboardType="numeric"
                            />
                            
                            <View style={styles.buttonContainer}>
                                <Button
                                    title={saving ? "Saving..." : "Set Goal"}
                                    onPress={handleSaveGoalWeight}
                                    loading={saving}
                                />
                                <View style={{ height: 10 }} />
                                <Button
                                    title="Cancel"
                                    onPress={() => setShowGoalModal(false)}
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
        marginTop: 0,
        marginBottom: 20
    },
    card: {
        borderRadius: 20,
        padding: 20,
    },
    headerDividerWrap: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginHorizontal: -4,
        paddingHorizontal: 4,
        paddingBottom: 16,
        marginBottom: 16
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    headerText: {
        flex: 1
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 14
    },
    heroLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4
    },
    heroValue: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1
    },
    heroUnit: {
        fontSize: 18,
        fontWeight: '600'
    },
    heroGoal: {
        alignItems: 'flex-end'
    },
    heroGoalValue: {
        fontSize: 20,
        fontWeight: '800'
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8
    },
    goalButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14
    },
    statCard: {
        flex: 1,
        minHeight: 100,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1
    },
    statValue: {
        fontSize: 21,
        fontWeight: '800',
        marginBottom: 2
    },
    statUnit: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6
    },
    statBmiTag: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    advancedStatsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12
    },
    advancedStatCard: {
        flex: 1,
        minWidth: '48%',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    advancedStatValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2
    },
    advancedStatLabel: {
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    correlationCard: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 12
    },
    correlationTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    correlationValue: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4
    },
    correlationMessage: {
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 16
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10
    },
    addButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 6
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700'
    },
    secondaryButtonText: {
        fontSize: 14,
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
    buttonContainer: {
        marginTop: 20
    }
})

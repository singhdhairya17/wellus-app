import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Platform, Modal } from 'react-native'
import React, { useContext, useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { UserContext } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { ServingFoodIcon, Clock01FreeIcons, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LinearGradient } from 'expo-linear-gradient'
import { requestPermissionsAsyncSafe } from '../../utils/expoNotificationsGate'
import { scheduleMealReminder, cancelMealReminder } from '../../services/reminders/MealReminderScheduler'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'

const MEAL_TYPES = [
    { key: 'Breakfast', defaultHour: 8, defaultMinute: 0 },
    { key: 'Lunch', defaultHour: 13, defaultMinute: 0 },
    { key: 'Dinner', defaultHour: 19, defaultMinute: 0 },
    { key: 'Snack', defaultHour: 15, defaultMinute: 30 },
    { key: 'Water', defaultHour: 10, defaultMinute: 0 }
]

export default function MealRemindersPage() {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [reminders, setReminders] = useState({})
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [selectedMealType, setSelectedMealType] = useState(null)
    const [selectedHour, setSelectedHour] = useState(12)
    const [selectedMinute, setSelectedMinute] = useState(0)
    const hourScrollRef = React.useRef(null)
    const minuteScrollRef = React.useRef(null)
    
    const userReminders = (useQuery(
        api.Reminders.GetMealReminders,
        user?._id ? { uid: user._id } : 'skip'
    ) || [])
    
    const toggleReminder = useMutation(api.Reminders.ToggleMealReminder)
    
    useEffect(() => {
        if (!user?._id) {
            router.replace('/')
            return
        }
    }, [user])
    
    useEffect(() => {
        if (userReminders) {
            const remindersMap = {}
            userReminders.forEach(reminder => {
                remindersMap[reminder.mealType] = reminder
            })
            setReminders(remindersMap)
        }
    }, [userReminders])
    
    const handleToggleReminder = async (mealType) => {
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }
        
        const currentReminder = reminders[mealType]
        const isEnabled = currentReminder?.enabled || false
        
        try {
            const defaultMeal = MEAL_TYPES.find(m => m.key === mealType)
            const nextEnabled = !isEnabled
            const reminderHour =
                mealType === 'Water'
                    ? (defaultMeal?.defaultHour ?? 10)
                    : (currentReminder?.hour ?? defaultMeal?.defaultHour ?? 12)
            const reminderMinute =
                mealType === 'Water'
                    ? (defaultMeal?.defaultMinute ?? 0)
                    : (currentReminder?.minute ?? defaultMeal?.defaultMinute ?? 0)

            if (nextEnabled) {
                const { status } = await requestPermissionsAsyncSafe()
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please enable notifications in settings to receive reminders.')
                    return
                }
            }
            
            // For Water, use smart reminder logic (no specific time needed)
            // For other meals, use the configured time
            if (mealType === 'Water') {
                await toggleReminder({
                    uid: user._id,
                    mealType: mealType,
                    enabled: nextEnabled,
                    hour: reminderHour,
                    minute: reminderMinute,
                    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // All days
                })
            } else {
                await toggleReminder({
                    uid: user._id,
                    mealType: mealType,
                    enabled: nextEnabled,
                    hour: reminderHour,
                    minute: reminderMinute,
                    daysOfWeek: currentReminder?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6] // All days
                })
            }
            
            // Schedule or cancel the actual push notification
            if (nextEnabled) {
                await scheduleMealReminder(mealType, reminderHour, reminderMinute)

                if (mealType === 'Water') {
                    Alert.alert(
                        'Water Reminders Enabled',
                        "You'll get a daily reminder around 10:00 AM to log water in Wellus (sound + banner)."
                    )
                }
            } else {
                await cancelMealReminder(mealType)
            }
        } catch (error) {
            console.error('Error toggling reminder:', error)
            Alert.alert('Error', 'Failed to update reminder')
        }
    }
    
    const formatTime = (hour, minute) => {
        const h = hour % 12 || 12
        const m = minute.toString().padStart(2, '0')
        const ampm = hour >= 12 ? 'PM' : 'AM'
        return `${h}:${m} ${ampm}`
    }

    const handleTimePress = (mealType) => {
        // Don't allow time editing for Water
        if (mealType === 'Water') return
        
        const reminder = reminders[mealType]
        const defaultMeal = MEAL_TYPES.find(m => m.key === mealType)
        const currentHour = reminder?.hour || defaultMeal?.defaultHour || 12
        const currentMinute = reminder?.minute || defaultMeal?.defaultMinute || 0
        
        setSelectedMealType(mealType)
        setSelectedHour(currentHour)
        setSelectedMinute(currentMinute)
        setShowTimePicker(true)
        triggerHaptic.light()
        
        // Scroll to selected time after modal opens
        setTimeout(() => {
            if (hourScrollRef.current) {
                hourScrollRef.current.scrollTo({ y: currentHour * 50 - 100, animated: true })
            }
            if (minuteScrollRef.current) {
                minuteScrollRef.current.scrollTo({ y: currentMinute * 50 - 100, animated: true })
            }
        }, 100)
    }

    const handleTimeSave = async () => {
        if (!selectedMealType || !user?._id) return
        
        const currentReminder = reminders[selectedMealType]
        const isEnabled = currentReminder?.enabled || false
        
        try {
            await toggleReminder({
                uid: user._id,
                mealType: selectedMealType,
                enabled: isEnabled,
                hour: selectedHour,
                minute: selectedMinute,
                daysOfWeek: currentReminder?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]
            })
            
            // Reschedule notification with the new time if reminder is active
            if (isEnabled) {
                await scheduleMealReminder(selectedMealType, selectedHour, selectedMinute)
            }

            setShowTimePicker(false)
            triggerHaptic.success()
        } catch (error) {
            console.error('Error updating time:', error)
            Alert.alert('Error', 'Failed to update reminder time')
        }
    }

    // Generate hours (0-23) and minutes (0-59) arrays
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: 60 }, (_, i) => i)
    
    return (
        <ScrollView 
            style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: colors.BACKGROUND }]}
            contentContainerStyle={{ 
                paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) + 100 : 120 
            }}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={[styles.backButton, {
                        backgroundColor: colors.PRIMARY + '15',
                        borderWidth: 1,
                        borderColor: colors.PRIMARY + '30',
                        shadowColor: colors.PRIMARY,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3
                    }]}
                    activeOpacity={0.7}
                >
                    <HugeiconsIcon 
                        icon={ArrowLeft01Icon} 
                        size={20} 
                        color={colors.PRIMARY}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>
            </View>

            <LinearGradient
                colors={colors.isDark 
                    ? [colors.CARD, colors.SURFACE, colors.CARD] 
                    : ['#FFFFFF', '#FAFBFC', '#FFFFFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, {
                    borderWidth: colors.isDark ? 1.5 : 1,
                    borderColor: colors.isDark ? colors.BORDER + '80' : colors.BORDER + '60',
                    shadowColor: colors.PRIMARY,
                    shadowOpacity: colors.isDark ? 0.4 : 0.15,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 20,
                    elevation: 8
                }]}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, {
                        backgroundColor: colors.isDark ? colors.PRIMARY + '15' : colors.PRIMARY + '10',
                        borderWidth: 1.5,
                        borderColor: colors.PRIMARY + '25'
                    }]}>
                        <HugeiconsIcon icon={ServingFoodIcon} size={22} color={colors.PRIMARY} strokeWidth={2} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.cardTitle, { color: colors.TEXT }]}>Meal & Water Reminders</Text>
                    </View>
                </View>
                
                <View style={styles.remindersList}>
                    {MEAL_TYPES.map((meal, index) => {
                        const reminder = reminders[meal.key]
                        const isEnabled = reminder?.enabled || false
                        const time = reminder 
                            ? formatTime(reminder.hour, reminder.minute)
                            : formatTime(meal.defaultHour, meal.defaultMinute)
                        
                        return (
                            <Animated.View 
                                key={meal.key} 
                                entering={FadeInDown.delay(index * 100).springify()}
                            >
                                <View
                                    style={[styles.reminderItem, {
                                        backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                        borderColor: isEnabled ? colors.PRIMARY + '40' : colors.BORDER + '60',
                                        borderWidth: 1.5,
                                        borderLeftWidth: isEnabled ? 4 : 1.5,
                                        borderLeftColor: isEnabled ? colors.PRIMARY : colors.BORDER + '60'
                                    }]}
                                >
                                    <View style={styles.reminderInfo}>
                                        <View style={styles.reminderHeaderRow}>
                                            <View style={styles.reminderTitleRow}>
                                                <Text style={[styles.reminderMeal, { color: colors.TEXT }]}>
                                                    {meal.key}
                                                </Text>
                                            </View>
                                            {isEnabled && (
                                                <View style={[styles.activeBadge, { backgroundColor: colors.PRIMARY + '20' }]}>
                                                    <Text style={[styles.activeBadgeText, { color: colors.PRIMARY }]}>Active</Text>
                                                </View>
                                            )}
                                        </View>
                                        {meal.key === 'Water' ? (
                                            <View style={styles.timeRow}>
                                                <HugeiconsIcon icon={Clock01FreeIcons} size={16} color={colors.TEXT_SECONDARY} />
                                                <Text style={[styles.reminderTime, { color: colors.TEXT_SECONDARY, marginLeft: 6, fontWeight: '600' }]}>
                                                    Smart reminders based on your water intake
                                                </Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity 
                                                style={[styles.timeRow, styles.timeRowButton, {
                                                    backgroundColor: colors.PRIMARY + '08',
                                                    borderColor: colors.PRIMARY + '20'
                                                }]}
                                                onPress={() => handleTimePress(meal.key)}
                                                activeOpacity={0.6}
                                            >
                                                <HugeiconsIcon icon={Clock01FreeIcons} size={18} color={colors.PRIMARY} />
                                                <Text style={[styles.reminderTime, { color: colors.PRIMARY, marginLeft: 8, fontWeight: '700' }]}>
                                                    {time}
                                                </Text>
                                                <Text style={[styles.editHint, { color: colors.PRIMARY + '80' }]}>Tap to edit</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Switch
                                        value={isEnabled}
                                        onValueChange={() => handleToggleReminder(meal.key)}
                                        trackColor={{ false: colors.BORDER + '60', true: colors.PRIMARY + '70' }}
                                        thumbColor={isEnabled ? colors.PRIMARY : colors.TEXT_SECONDARY + '80'}
                                        ios_backgroundColor={colors.BORDER + '60'}
                                    />
                                </View>
                            </Animated.View>
                        )
                    })}
                </View>
            </LinearGradient>

            {/* Time Picker Modal */}
            <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.BACKGROUND + 'E6' }]}>
                    <View style={[styles.modalContent, { 
                        backgroundColor: colors.isDark ? colors.CARD : '#FFFFFF',
                        borderColor: colors.BORDER
                    }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>
                                Set Time for {selectedMealType}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(false)}
                                style={[styles.closeButton, { backgroundColor: colors.BORDER + '30' }]}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.closeButtonText, { color: colors.TEXT }]}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContainer}>
                            {/* Hour Picker */}
                            <View style={styles.pickerColumn}>
                                <Text style={[styles.pickerLabel, { color: colors.TEXT_SECONDARY }]}>Hour</Text>
                                <View style={[styles.pickerWrapper, { 
                                    backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                    borderColor: colors.BORDER
                                }]}>
                                    <ScrollView
                                        ref={hourScrollRef}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingVertical: 100 }}
                                    >
                                        {hours.map((item) => {
                                            const isSelected = item === selectedHour
                                            const displayHour = item % 12 || 12
                                            const ampm = item >= 12 ? 'PM' : 'AM'
                                            return (
                                                <TouchableOpacity
                                                    key={item}
                                                    onPress={() => {
                                                        setSelectedHour(item)
                                                        triggerHaptic.selection()
                                                    }}
                                                    style={[
                                                        styles.pickerItem,
                                                        isSelected && {
                                                            backgroundColor: colors.PRIMARY + '20',
                                                            borderColor: colors.PRIMARY,
                                                            borderWidth: 2
                                                        }
                                                    ]}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[
                                                        styles.pickerItemText,
                                                        { color: isSelected ? colors.PRIMARY : colors.TEXT },
                                                        isSelected && { fontWeight: '700' }
                                                    ]}>
                                                        {displayHour} {ampm}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </ScrollView>
                                </View>
                            </View>

                            {/* Minute Picker */}
                            <View style={styles.pickerColumn}>
                                <Text style={[styles.pickerLabel, { color: colors.TEXT_SECONDARY }]}>Minute</Text>
                                <View style={[styles.pickerWrapper, { 
                                    backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                    borderColor: colors.BORDER
                                }]}>
                                    <ScrollView
                                        ref={minuteScrollRef}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={{ paddingVertical: 100 }}
                                    >
                                        {minutes.map((item) => {
                                            const isSelected = item === selectedMinute
                                            return (
                                                <TouchableOpacity
                                                    key={item}
                                                    onPress={() => {
                                                        setSelectedMinute(item)
                                                        triggerHaptic.selection()
                                                    }}
                                                    style={[
                                                        styles.pickerItem,
                                                        isSelected && {
                                                            backgroundColor: colors.PRIMARY + '20',
                                                            borderColor: colors.PRIMARY,
                                                            borderWidth: 2
                                                        }
                                                    ]}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[
                                                        styles.pickerItemText,
                                                        { color: isSelected ? colors.PRIMARY : colors.TEXT },
                                                        isSelected && { fontWeight: '700' }
                                                    ]}>
                                                        {item.toString().padStart(2, '0')}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </ScrollView>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(false)}
                                style={[styles.cancelButton, { 
                                    backgroundColor: colors.BORDER + '30',
                                    borderColor: colors.BORDER
                                }]}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.TEXT }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleTimeSave}
                                style={[styles.saveButton, { backgroundColor: colors.PRIMARY }]}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[colors.PRIMARY, colors.SECONDARY]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.saveButtonGradient}
                                >
                                    <Text style={[styles.saveButtonText, { color: colors.WHITE }]}>Save</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        marginBottom: 24,
        paddingHorizontal: 20
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        alignSelf: 'flex-start'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    titleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        flex: 1
    },
    card: {
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 20
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    headerText: {
        flex: 1
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.4
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.2
    },
    remindersList: {
        gap: 14
    },
    reminderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderRadius: 14
    },
    reminderInfo: {
        flex: 1
    },
    reminderHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    reminderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    reminderMeal: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    timeRowButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 4,
        alignSelf: 'flex-start'
    },
    reminderTime: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2
    },
    editHint: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 6,
        fontStyle: 'italic'
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    modalContent: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '80%',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
        flex: 1
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButtonText: {
        fontSize: 28,
        fontWeight: '300',
        lineHeight: 28
    },
    pickerContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
        height: 300
    },
    pickerColumn: {
        flex: 1
    },
    pickerLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    pickerWrapper: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden'
    },
    pickerItem: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
        paddingHorizontal: 12
    },
    pickerItemText: {
        fontSize: 16,
        fontWeight: '600'
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700'
    },
    saveButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden'
    },
    saveButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3
    }
})


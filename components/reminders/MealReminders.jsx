import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native'
import React, { useContext, useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { BellIcon } from '@hugeicons/core-free-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Notifications from 'expo-notifications'

const MEAL_TYPES = [
    { key: 'Breakfast', defaultHour: 8, defaultMinute: 0 },
    { key: 'Lunch', defaultHour: 13, defaultMinute: 0 },
    { key: 'Dinner', defaultHour: 19, defaultMinute: 0 },
    { key: 'Snack', defaultHour: 15, defaultMinute: 30 }
]

export default function MealReminders() {
    const { colors } = useTheme()
    const { user } = useContext(UserContext)
    const [reminders, setReminders] = useState({})
    
    const userReminders = (useQuery(
        api.Reminders.GetMealReminders,
        user?._id ? { uid: user._id } : 'skip'
    ) || [])
    
    const toggleReminder = useMutation(api.Reminders.ToggleMealReminder)
    
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
            await toggleReminder({
                uid: user._id,
                mealType: mealType,
                enabled: !isEnabled,
                hour: currentReminder?.hour || defaultMeal?.defaultHour || 12,
                minute: currentReminder?.minute || defaultMeal?.defaultMinute || 0,
                daysOfWeek: currentReminder?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6] // All days
            })
            
            // Request notification permissions if enabling
            if (!isEnabled) {
                const { status } = await Notifications.requestPermissionsAsync()
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please enable notifications in settings to receive meal reminders.')
                }
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
    
    return (
        <Animated.View entering={FadeInDown.delay(700)} style={styles.container}>
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
                    <View style={[styles.iconContainer, {
                        backgroundColor: colors.isDark ? colors.PRIMARY + '15' : colors.PRIMARY + '10',
                        borderWidth: 1.5,
                        borderColor: colors.PRIMARY + '25'
                    }]}>
                        <HugeiconsIcon icon={BellIcon} size={20} color={colors.PRIMARY} strokeWidth={2} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.TEXT }]}>Meal Reminders</Text>
                    </View>
                </View>
                
                <View style={styles.remindersList}>
                    {MEAL_TYPES.map((meal) => {
                        const reminder = reminders[meal.key]
                        const isEnabled = reminder?.enabled || false
                        const time = reminder 
                            ? formatTime(reminder.hour, reminder.minute)
                            : formatTime(meal.defaultHour, meal.defaultMinute)
                        
                        return (
                            <View key={meal.key} style={[styles.reminderItem, {
                                backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                borderColor: isEnabled ? colors.PRIMARY + '40' : colors.BORDER + '60',
                                borderLeftWidth: isEnabled ? 4 : 1.5,
                                borderLeftColor: isEnabled ? colors.PRIMARY : colors.BORDER + '60'
                            }]}>
                                <View style={styles.reminderInfo}>
                                    <View style={styles.reminderHeaderRow}>
                                        <Text style={[styles.reminderMeal, { color: colors.TEXT }]}>
                                            {meal.key}
                                        </Text>
                                        {isEnabled && (
                                            <View style={[styles.activeBadge, {
                                                backgroundColor: colors.PRIMARY + '15',
                                                borderColor: colors.PRIMARY + '30'
                                            }]}>
                                                <Text style={[styles.activeBadgeText, { color: colors.PRIMARY }]}>
                                                    Active
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.reminderTime, { color: colors.TEXT_SECONDARY }]}>
                                        {time}
                                    </Text>
                                </View>
                                <Switch
                                    value={isEnabled}
                                    onValueChange={() => handleToggleReminder(meal.key)}
                                    trackColor={{ false: colors.BORDER + '60', true: colors.PRIMARY + '70' }}
                                    thumbColor={isEnabled ? colors.PRIMARY : colors.TEXT_SECONDARY + '80'}
                                    ios_backgroundColor={colors.BORDER + '60'}
                                />
                            </View>
                        )
                    })}
                </View>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20
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
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.4
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.2
    },
    remindersList: {
        gap: 12
    },
    reminderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5
    },
    reminderInfo: {
        flex: 1
    },
    reminderHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    reminderMeal: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2
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
    reminderTime: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2
    }
})


import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import moment from 'moment'
import Colors from '../../constants/colors'
import { UserContext } from '../../context/UserContext'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { ArrowLeft01Icon, ArrowRight01Icon, PlusSignSquareIcon } from '@hugeicons/core-free-icons'
import TodaysMealPlan from './TodaysMealPlan'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'

export default function MealPlanCalendar() {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const convex = useConvex()
    const { refreshData } = useContext(RefreshDataContext)
    const router = useRouter()
    const insets = useSafeAreaInsets()
    
    const [currentMonth, setCurrentMonth] = useState(moment())
    const [selectedDate, setSelectedDate] = useState(moment().format('DD/MM/YYYY'))
    const [mealSummary, setMealSummary] = useState({})
    const [showMealList, setShowMealList] = useState(false)

    useEffect(() => {
        if (user?._id) {
            fetchMealSummary()
        }
    }, [user, currentMonth, refreshData])

    const fetchMealSummary = async () => {
        try {
            const startDate = currentMonth.clone().startOf('month').format('DD/MM/YYYY')
            const endDate = currentMonth.clone().endOf('month').format('DD/MM/YYYY')
            
            const summary = await convex.query(api.MealPlan.GetMealPlanSummary, {
                uid: user._id,
                startDate: startDate,
                endDate: endDate
            })

            // Convert array to object for easy lookup
            const summaryObj = {}
            summary.forEach(item => {
                summaryObj[item.date] = item
            })
            setMealSummary(summaryObj)
        } catch (error) {
            console.error('Error fetching meal summary:', error)
        }
    }

    const getDaysInMonth = () => {
        const start = currentMonth.clone().startOf('month').startOf('week')
        const end = currentMonth.clone().endOf('month').endOf('week')
        const days = []
        let day = start.clone()

        while (day.isSameOrBefore(end, 'day')) {
            days.push(day.clone())
            day.add(1, 'day')
        }
        return days
    }

    const getDayStatus = (date) => {
        const dateStr = date.format('DD/MM/YYYY')
        const summary = mealSummary[dateStr]
        
        if (!summary || summary.totalMeals === 0) {
            return 'none' // No meals planned
        }
        
        if (summary.eatenMeals === summary.totalMeals) {
            return 'all-eaten' // All meals eaten
        }
        
        if (summary.skippedMeals === summary.totalMeals) {
            return 'all-skipped' // All meals skipped
        }
        
        return 'partial' // Some eaten, some skipped
    }

    const getDayColor = (date) => {
        const status = getDayStatus(date)
        const isToday = date.isSame(moment(), 'day')
        const isSelected = date.format('DD/MM/YYYY') === selectedDate
        const isCurrentMonth = date.isSame(currentMonth, 'month')

        if (!isCurrentMonth) {
            return colors.isDark ? colors.SURFACE + '30' : Colors.GRAY + '30' // Gray for other months
        }

        if (isSelected) {
            return colors.PRIMARY // Selected date
        }

        if (isToday) {
            return colors.PRIMARY + '40' // Today
        }

        switch (status) {
            case 'all-eaten':
                return colors.GREEN + '40'
            case 'all-skipped':
                return colors.RED + '40'
            case 'partial':
                return colors.YELLOW + '40'
            default:
                return colors.isDark ? colors.SURFACE : Colors.WHITE
        }
    }

    const handleDateSelect = (date) => {
        if (date.isSame(currentMonth, 'month')) {
            setSelectedDate(date.format('DD/MM/YYYY'))
            setShowMealList(true)
        }
    }

    const days = getDaysInMonth()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <LinearGradient
            colors={colors.isDark 
                ? [colors.CARD, colors.SURFACE] 
                : ['#FFFFFF', '#F8F9FA']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, {
                borderWidth: colors.isDark ? 1 : 0,
                borderColor: colors.BORDER
            }]}
        >
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
                <TouchableOpacity
                    onPress={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
                    style={styles.navButton}
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.PRIMARY} />
                </TouchableOpacity>
                
                <Text style={[styles.monthYear, { color: colors.TEXT }]}>
                    {currentMonth.format('MMMM YYYY')}
                </Text>
                
                <TouchableOpacity
                    onPress={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
                    style={styles.navButton}
                >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={24} color={colors.PRIMARY} />
                </TouchableOpacity>
            </View>

            {/* Week Day Headers */}
            <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                    <View key={index} style={styles.weekDay}>
                        <Text style={[styles.weekDayText, { color: colors.TEXT_SECONDARY }]}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
                {days.map((day, index) => {
                    const dateStr = day.format('DD/MM/YYYY')
                    const summary = mealSummary[dateStr]
                    const isToday = day.isSame(moment(), 'day')
                    const isSelected = dateStr === selectedDate
                    const isCurrentMonth = day.isSame(currentMonth, 'month')
                    const status = getDayStatus(day)

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCell,
                                { 
                                    backgroundColor: getDayColor(day),
                                    borderColor: colors.BORDER,
                                },
                                isSelected && { borderColor: colors.PRIMARY, borderWidth: 2 },
                                isToday && !isSelected && { borderColor: colors.PRIMARY, borderWidth: 2 }
                            ]}
                            onPress={() => handleDateSelect(day)}
                        >
                            <Text style={[
                                styles.dayText,
                                { color: !isCurrentMonth ? colors.TEXT_SECONDARY + '50' : colors.TEXT },
                                isSelected && { color: colors.WHITE, fontWeight: 'bold' },
                                isToday && !isSelected && { color: colors.PRIMARY, fontWeight: 'bold' }
                            ]}>
                                {day.format('D')}
                            </Text>
                            
                            {/* Status Indicators */}
                            {summary && summary.totalMeals > 0 && (
                                <View style={styles.statusIndicators}>
                                    {summary.eatenMeals > 0 && (
                                        <View style={[styles.statusDot, { backgroundColor: colors.GREEN }]} />
                                    )}
                                    {summary.skippedMeals > 0 && (
                                        <View style={[styles.statusDot, { backgroundColor: colors.RED }]} />
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                })}
            </View>

            {/* Legend */}
            <View style={[styles.legend, { borderTopColor: colors.BORDER }]}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.GREEN, borderColor: colors.BORDER }]} />
                    <Text style={[styles.legendText, { color: colors.TEXT_SECONDARY }]}>All Eaten</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.RED, borderColor: colors.BORDER }]} />
                    <Text style={[styles.legendText, { color: colors.TEXT_SECONDARY }]}>All Skipped</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: colors.YELLOW, borderColor: colors.BORDER }]} />
                    <Text style={[styles.legendText, { color: colors.TEXT_SECONDARY }]}>Partial</Text>
                </View>
            </View>

            {/* Add Meal Button */}
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
                onPress={() => {
                    setSelectedDate(moment().format('DD/MM/YYYY'))
                    setShowMealList(true)
                }}
            >
                <HugeiconsIcon icon={PlusSignSquareIcon} size={24} color={colors.WHITE} />
                <Text style={[styles.addButtonText, { color: colors.WHITE }]}>Add Meal to Today</Text>
            </TouchableOpacity>

            {/* Meal List Modal */}
            <Modal
                visible={showMealList}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMealList(false)}
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
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>
                                Meals for {moment(selectedDate, 'DD/MM/YYYY').format('MMMM DD, YYYY')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowMealList(false)}>
                                <Text style={[styles.closeButton, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView 
                            style={styles.modalBody}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <TodaysMealPlan selectedDate={selectedDate} insideScrollView={true} />
                            
                            <TouchableOpacity
                                style={[styles.addMealButton, { backgroundColor: colors.PRIMARY + '20' }]}
                                onPress={() => {
                                    setShowMealList(false)
                                    router.push('/(tabs)/Meals')
                                }}
                            >
                                <HugeiconsIcon icon={PlusSignSquareIcon} size={20} color={colors.PRIMARY} />
                                <Text style={[styles.addMealButtonText, { color: colors.PRIMARY }]}>Add Meal</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginTop: 0,
        borderRadius: 24,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    navButton: {
        padding: 8,
    },
    monthYear: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    weekDaysContainer: {
        flexDirection: 'row',
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    weekDay: {
        width: '14%', // Slightly less than 1/7 for spacing
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekDayText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    dayCell: {
        width: '14%', // Matches weekDay width
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
    },
    selectedDay: {
        borderWidth: 2,
    },
    todayDay: {
        borderWidth: 2,
    },
    dayText: {
        fontSize: 13,
        fontWeight: '500',
    },
    statusIndicators: {
        position: 'absolute',
        bottom: 4,
        flexDirection: 'row',
        gap: 3,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingTop: 15,
        paddingHorizontal: 5,
        borderTopWidth: 1,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    legendColor: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    addMealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        gap: 8,
    },
    addMealButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
})


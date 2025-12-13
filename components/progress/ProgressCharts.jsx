import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import React, { useContext, useMemo, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { AnalyticsUpIcon } from '@hugeicons/core-free-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import moment from 'moment'
import Svg, { Line, Rect, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - 80
const CHART_HEIGHT = 200
const BASELINE_OFFSET = 40 // Space for labels below baseline
const CHART_TOP_PADDING = 20 // Space at top of chart

export default function ProgressCharts({ selectedDate }) {
    const { colors } = useTheme()
    const { user } = useContext(UserContext)
    const [selectedMetric, setSelectedMetric] = useState('calories')
    
    // Get last 7 days of data
    const startDate = moment().subtract(6, 'days').format('DD/MM/YYYY')
    const endDate = moment().format('DD/MM/YYYY')
    
    // Get last 7 days dates
    const dailyData = useMemo(() => {
        if (!user?._id) return []
        
        const dates = []
        for (let i = 6; i >= 0; i--) {
            dates.push(moment().subtract(i, 'days').format('DD/MM/YYYY'))
        }
        return dates
    }, [user])
    
    // Fetch actual data for each date (using individual queries)
    const day1Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[0] ? { uid: user._id, date: dailyData[0] } : 'skip'
    )
    const day2Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[1] ? { uid: user._id, date: dailyData[1] } : 'skip'
    )
    const day3Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[2] ? { uid: user._id, date: dailyData[2] } : 'skip'
    )
    const day4Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[3] ? { uid: user._id, date: dailyData[3] } : 'skip'
    )
    const day5Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[4] ? { uid: user._id, date: dailyData[4] } : 'skip'
    )
    const day6Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[5] ? { uid: user._id, date: dailyData[5] } : 'skip'
    )
    const day7Macros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id && dailyData[6] ? { uid: user._id, date: dailyData[6] } : 'skip'
    )
    
    const allMacros = [day1Macros, day2Macros, day3Macros, day4Macros, day5Macros, day6Macros, day7Macros]
    
    // Build chart data from actual data
    const chartData = useMemo(() => {
        if (!dailyData || dailyData.length === 0) return []
        
        return dailyData.map((date, index) => {
            const macros = allMacros[index]
            return {
                date,
                calories: macros?.calories || 0,
                protein: macros?.proteins || 0,
                carbs: macros?.carbohydrates || 0,
                fat: macros?.fat || 0
            }
        })
    }, [dailyData, day1Macros, day2Macros, day3Macros, day4Macros, day5Macros, day6Macros, day7Macros])
    
    // Check if there's any data
    const hasData = chartData.some(d => d.calories > 0 || d.protein > 0 || d.carbs > 0 || d.fat > 0)
    
    const metrics = {
        calories: { label: 'Calories', color: colors.PRIMARY, unit: 'kcal', max: 2500 },
        protein: { label: 'Protein', color: colors.BLUE, unit: 'g', max: 150 },
        carbs: { label: 'Carbs', color: colors.GREEN, unit: 'g', max: 300 },
        fat: { label: 'Fat', color: colors.YELLOW, unit: 'g', max: 100 }
    }
    
    const currentMetric = metrics[selectedMetric]
    const maxValue = chartData.length > 0 
        ? Math.max(...chartData.map(d => d[selectedMetric]), currentMetric.max)
        : currentMetric.max
    const averageValue = chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d[selectedMetric], 0) / chartData.length
        : 0
    
    // Show empty state if no data
    if (!hasData) {
        return (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.container}>
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
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, {
                            backgroundColor: colors.isDark ? colors.PRIMARY + '15' : colors.PRIMARY + '10',
                            borderWidth: 1.5,
                            borderColor: colors.PRIMARY + '25'
                        }]}>
                            <HugeiconsIcon icon={AnalyticsUpIcon} size={22} color={colors.PRIMARY} strokeWidth={2} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.TEXT }]}>Weekly Trends</Text>
                            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                Last 7 days
                            </Text>
                        </View>
                    </View>
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: colors.TEXT_SECONDARY }]}>
                            No data available yet
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.TEXT_SECONDARY }]}>
                            Start tracking your meals to see weekly trends
                        </Text>
                    </View>
                </LinearGradient>
            </Animated.View>
        )
    }
    
    return (
        <Animated.View entering={FadeInDown.delay(400)} style={styles.container}>
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
                <View style={styles.header}>
                    <View style={[styles.iconContainer, {
                        backgroundColor: colors.isDark ? colors.PRIMARY + '15' : colors.PRIMARY + '10',
                        borderWidth: 1.5,
                        borderColor: colors.PRIMARY + '25'
                    }]}>
                        <HugeiconsIcon icon={AnalyticsUpIcon} size={22} color={colors.PRIMARY} strokeWidth={2} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.TEXT }]}>Weekly Trends</Text>
                        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                            Last 7 days
                        </Text>
                    </View>
                </View>
                
                {/* Metric Selector - Professional Tabs */}
                <View style={styles.metricSelector}>
                    {Object.entries(metrics).map(([key, metric]) => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => setSelectedMetric(key)}
                            activeOpacity={0.6}
                        >
                            {selectedMetric === key ? (
                                <View style={[styles.metricButton, {
                                    backgroundColor: metric.color + '15',
                                    borderBottomWidth: 3,
                                    borderBottomColor: metric.color,
                                    borderTopWidth: 0,
                                    borderLeftWidth: 0,
                                    borderRightWidth: 0
                                }]}>
                                    <Text style={[styles.metricButtonText, {
                                        color: metric.color,
                                        fontWeight: '700'
                                    }]}>
                                        {metric.label}
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.metricButton, {
                                    backgroundColor: 'transparent',
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.BORDER + '40'
                                }]}>
                                    <Text style={[styles.metricButtonText, {
                                        color: colors.TEXT_SECONDARY,
                                        fontWeight: '500'
                                    }]}>
                                        {metric.label}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                
                {/* Enhanced Bar Chart */}
                <View style={[styles.chartContainer, { backgroundColor: 'transparent' }]}>
                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
                        <Defs>
                            <SvgLinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={currentMetric.color} stopOpacity="0.95" />
                                <Stop offset="100%" stopColor={currentMetric.color} stopOpacity="0.75" />
                            </SvgLinearGradient>
                        </Defs>
                        <G>
                            {/* Baseline (x-axis) - visible line where bars sit */}
                            <Line
                                x1={20}
                                y1={CHART_HEIGHT - BASELINE_OFFSET}
                                x2={CHART_WIDTH - 20}
                                y2={CHART_HEIGHT - BASELINE_OFFSET}
                                stroke={colors.BORDER + '50'}
                                strokeWidth="1.5"
                            />
                            {/* Average line with label */}
                            <Line
                                x1={20}
                                y1={CHART_HEIGHT - BASELINE_OFFSET - (averageValue / maxValue) * (CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING)}
                                x2={CHART_WIDTH - 20}
                                y2={CHART_HEIGHT - BASELINE_OFFSET - (averageValue / maxValue) * (CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING)}
                                stroke={colors.PRIMARY + '60'}
                                strokeWidth="2"
                                strokeDasharray="6,4"
                            />
                            <SvgText
                                x={CHART_WIDTH - 25}
                                y={CHART_HEIGHT - BASELINE_OFFSET - (averageValue / maxValue) * (CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING) - 5}
                                fontSize="10"
                                fill={colors.PRIMARY}
                                fontWeight="700"
                                textAnchor="end"
                            >
                                Avg
                            </SvgText>
                            {chartData.map((data, index) => {
                                const value = data[selectedMetric] || 0
                                
                                // Calculate proper spacing - ensure all 7 bars fit with proper gaps
                                const totalBars = chartData.length
                                const totalGap = 12 * (totalBars - 1) // Gap between bars
                                const availableWidth = CHART_WIDTH - 40 // Total available width (20px padding each side)
                                const barWidth = (availableWidth - totalGap) / totalBars
                                
                                // Calculate x position - center each bar in its slot
                                const slotWidth = availableWidth / totalBars
                                const x = 20 + (index * slotWidth) + (slotWidth - barWidth) / 2
                                
                                // Baseline is where bars sit - at CHART_HEIGHT - BASELINE_OFFSET
                                // Chart area for bars: from CHART_TOP_PADDING to BASELINE_OFFSET
                                const baselineY = CHART_HEIGHT - BASELINE_OFFSET
                                const chartAreaHeight = CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING
                                const barHeight = (value / maxValue) * chartAreaHeight
                                
                                // y position is top of bar (bar extends downward from here)
                                // Bottom of bar should be exactly at baselineY
                                const y = baselineY - barHeight
                                
                                return (
                                    <G key={index}>
                                        {/* Bar with gradient - always show, even if 0 (will be invisible) */}
                                        {barHeight > 0 && (
                                            <Rect
                                                x={x}
                                                y={y}
                                                width={barWidth}
                                                height={barHeight}
                                                fill="url(#barGradient)"
                                                rx={6}
                                            />
                                        )}
                                        {/* Value label on top */}
                                        {barHeight > 30 && (
                                            <SvgText
                                                x={x + barWidth / 2}
                                                y={y - 10}
                                                fontSize="11"
                                                fill={colors.TEXT}
                                                fontWeight="700"
                                                textAnchor="middle"
                                            >
                                                {Math.round(value)}
                                            </SvgText>
                                        )}
                                        {/* Date label */}
                                        <SvgText
                                            x={x + barWidth / 2}
                                            y={CHART_HEIGHT - 20}
                                            fontSize="11"
                                            fill={colors.TEXT}
                                            fontWeight="600"
                                            textAnchor="middle"
                                        >
                                            {moment(data.date, 'DD/MM/YYYY').format('DD')}
                                        </SvgText>
                                        {/* Day label */}
                                        <SvgText
                                            x={x + barWidth / 2}
                                            y={CHART_HEIGHT - 6}
                                            fontSize="9"
                                            fill={colors.TEXT_SECONDARY}
                                            fontWeight="500"
                                            textAnchor="middle"
                                        >
                                            {moment(data.date, 'DD/MM/YYYY').format('ddd')}
                                        </SvgText>
                                    </G>
                                )
                            })}
                        </G>
                    </Svg>
                </View>
                
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, {
                        backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                        borderWidth: 1.5,
                        borderColor: colors.BORDER + '60',
                        borderLeftWidth: 4,
                        borderLeftColor: currentMetric.color
                    }]}>
                        <Text style={[styles.statValue, { color: colors.TEXT }]}>
                            {Math.round(averageValue)}{currentMetric.unit}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                            Average
                        </Text>
                    </View>
                    <View style={[styles.statCard, { 
                        backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                        borderWidth: 1.5, 
                        borderColor: colors.BORDER + '60',
                        borderLeftWidth: 4,
                        borderLeftColor: colors.TEXT_SECONDARY + '60'
                    }]}>
                        <Text style={[styles.statValue, { color: colors.TEXT }]}>
                            {Math.round(Math.max(...chartData.map(d => d[selectedMetric])))}{currentMetric.unit}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                            Peak
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginTop: 0
    },
    card: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden'
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
    metricSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        borderBottomWidth: 1,
        paddingBottom: 0
    },
    metricButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -1
    },
    metricButtonText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3
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
    chartContainer: {
        alignItems: 'center',
        marginVertical: 12,
        paddingVertical: 8,
        borderRadius: 16,
        paddingHorizontal: 10
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 8
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: 80
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.3
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        opacity: 0.7
    },
    emptyState: {
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center'
    },
    emptyStateSubtext: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center'
    }
})


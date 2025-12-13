import { View, Text, StyleSheet, Dimensions } from 'react-native'
import React, { useContext, useMemo } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Dumbbell01Icon } from '@hugeicons/core-free-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import moment from 'moment'
import Svg, { Line, Circle, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop, Polyline } from 'react-native-svg'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - 80
const CHART_HEIGHT = 200
const BASELINE_OFFSET = 40
const CHART_TOP_PADDING = 20

export default function WeightProgressChart() {
    const { colors } = useTheme()
    const { user } = useContext(UserContext)
    
    const weightLogs = useQuery(
        api.Tracking.GetWeightLogs,
        user?._id ? { uid: user._id, days: 30 } : 'skip'
    ) || []
    
    const goalWeight = user?.goalWeight || null
    
    // Check if there's any data
    const hasData = weightLogs && weightLogs.length > 0
    
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!hasData) return []
        
        return weightLogs.map(log => ({
            date: log.date,
            weight: log.weight,
            timestamp: log.timestamp
        }))
    }, [weightLogs, hasData])
    
    // Calculate min/max for scaling
    const { minWeight, maxWeight, range } = useMemo(() => {
        if (!hasData || chartData.length === 0) {
            return { minWeight: 0, maxWeight: 100, range: 100 }
        }
        
        const weights = chartData.map(d => d.weight)
        const min = Math.min(...weights)
        const max = Math.max(...weights)
        const padding = (max - min) * 0.2 || 5 // 20% padding
        const minWeight = Math.max(0, min - padding)
        const maxWeight = max + padding
        const range = maxWeight - minWeight
        
        return { minWeight, maxWeight, range }
    }, [chartData, hasData])
    
    // Calculate goal weight position
    const goalWeightY = goalWeight && goalWeight >= minWeight && goalWeight <= maxWeight
        ? CHART_HEIGHT - BASELINE_OFFSET - ((goalWeight - minWeight) / range) * (CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING)
        : null
    
    // Build line path
    const linePath = useMemo(() => {
        if (!hasData || chartData.length === 0) return ''
        
        const points = chartData.map((data, index) => {
            const x = 20 + (index * ((CHART_WIDTH - 40) / (chartData.length - 1 || 1)))
            const y = CHART_HEIGHT - BASELINE_OFFSET - ((data.weight - minWeight) / range) * (CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING)
            return `${x},${y}`
        })
        
        return points.join(' ')
    }, [chartData, minWeight, range, hasData])
    
    // Show empty state if no data
    if (!hasData) {
        return (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.container}>
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
                            <HugeiconsIcon icon={Dumbbell01Icon} size={22} color={colors.PRIMARY} strokeWidth={2} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.TEXT }]}>Weight Progress</Text>
                            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                Last 30 days
                            </Text>
                        </View>
                    </View>
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: colors.TEXT_SECONDARY }]}>
                            No weight data available yet
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.TEXT_SECONDARY }]}>
                            Start logging your weight to see progress over time
                        </Text>
                    </View>
                </LinearGradient>
            </Animated.View>
        )
    }
    
    return (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.container}>
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
                        <HugeiconsIcon icon={Dumbbell01Icon} size={22} color={colors.PRIMARY} strokeWidth={2} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.TEXT }]}>Weight Progress</Text>
                        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                            Last 30 days
                        </Text>
                    </View>
                </View>
                
                {/* Line Chart */}
                <View style={[styles.chartContainer, { backgroundColor: 'transparent' }]}>
                    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
                        <Defs>
                            <SvgLinearGradient id="weightLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor={colors.PRIMARY} stopOpacity="0.3" />
                                <Stop offset="100%" stopColor={colors.PRIMARY} stopOpacity="0.05" />
                            </SvgLinearGradient>
                        </Defs>
                        <G>
                            {/* Baseline */}
                            <Line
                                x1={20}
                                y1={CHART_HEIGHT - BASELINE_OFFSET}
                                x2={CHART_WIDTH - 20}
                                y2={CHART_HEIGHT - BASELINE_OFFSET}
                                stroke={colors.BORDER + '50'}
                                strokeWidth="1.5"
                            />
                            
                            {/* Goal weight line */}
                            {goalWeightY && (
                                <>
                                    <Line
                                        x1={20}
                                        y1={goalWeightY}
                                        x2={CHART_WIDTH - 20}
                                        y2={goalWeightY}
                                        stroke={colors.GREEN + '80'}
                                        strokeWidth="2"
                                        strokeDasharray="8,4"
                                    />
                                    <SvgText
                                        x={CHART_WIDTH - 25}
                                        y={goalWeightY - 5}
                                        fontSize="10"
                                        fill={colors.GREEN}
                                        fontWeight="700"
                                        textAnchor="end"
                                    >
                                        Goal: {goalWeight}kg
                                    </SvgText>
                                </>
                            )}
                            
                            {/* Area under line (gradient fill) */}
                            {linePath && chartData.length > 0 && (
                                <Polyline
                                    points={`20,${CHART_HEIGHT - BASELINE_OFFSET} ${linePath} ${CHART_WIDTH - 20},${CHART_HEIGHT - BASELINE_OFFSET}`}
                                    fill="url(#weightLineGradient)"
                                    stroke="none"
                                />
                            )}
                            
                            {/* Weight line */}
                            {linePath && chartData.length > 1 && (
                                <Polyline
                                    points={linePath}
                                    fill="none"
                                    stroke={colors.PRIMARY}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                            
                            {/* Data points */}
                            {chartData.map((data, index) => {
                                const x = 20 + (index * ((CHART_WIDTH - 40) / (chartData.length - 1 || 1)))
                                const y = CHART_HEIGHT - BASELINE_OFFSET - ((data.weight - minWeight) / range) * (CHART_HEIGHT - BASELINE_OFFSET - CHART_TOP_PADDING)
                                
                                return (
                                    <G key={`point-${index}`}>
                                        <Circle
                                            cx={x}
                                            cy={y}
                                            r="4"
                                            fill={colors.PRIMARY}
                                            stroke={colors.WHITE}
                                            strokeWidth="2"
                                        />
                                        {/* Show weight value on hover points (every 5th point or first/last) */}
                                        {(index === 0 || index === chartData.length - 1 || index % 5 === 0) && (
                                            <SvgText
                                                x={x}
                                                y={y - 12}
                                                fontSize="10"
                                                fill={colors.TEXT}
                                                fontWeight="700"
                                                textAnchor="middle"
                                            >
                                                {Math.round(data.weight * 10) / 10}
                                            </SvgText>
                                        )}
                                    </G>
                                )
                            })}
                            
                            {/* Date labels */}
                            {chartData.length > 0 && (
                                <>
                                    {/* First date */}
                                    <SvgText
                                        x={20}
                                        y={CHART_HEIGHT - 20}
                                        fontSize="10"
                                        fill={colors.TEXT_SECONDARY}
                                        fontWeight="500"
                                    >
                                        {moment(chartData[0].date, 'DD/MM/YYYY').format('MMM DD')}
                                    </SvgText>
                                    {/* Last date */}
                                    <SvgText
                                        x={CHART_WIDTH - 20}
                                        y={CHART_HEIGHT - 20}
                                        fontSize="10"
                                        fill={colors.TEXT_SECONDARY}
                                        fontWeight="500"
                                        textAnchor="end"
                                    >
                                        {moment(chartData[chartData.length - 1].date, 'DD/MM/YYYY').format('MMM DD')}
                                    </SvgText>
                                </>
                            )}
                        </G>
                    </Svg>
                </View>
                
                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, {
                        backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                        borderWidth: 1.5,
                        borderColor: colors.BORDER + '60',
                        borderLeftWidth: 4,
                        borderLeftColor: colors.PRIMARY
                    }]}>
                        <Text style={[styles.statValue, { color: colors.TEXT }]}>
                            {Math.round(chartData[0].weight * 10) / 10} kg
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                            Starting
                        </Text>
                    </View>
                    <View style={[styles.statCard, {
                        backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                        borderWidth: 1.5,
                        borderColor: colors.BORDER + '60',
                        borderLeftWidth: 4,
                        borderLeftColor: colors.GREEN
                    }]}>
                        <Text style={[styles.statValue, { color: colors.TEXT }]}>
                            {Math.round(chartData[chartData.length - 1].weight * 10) / 10} kg
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                            Current
                        </Text>
                    </View>
                    {goalWeight && (
                        <View style={[styles.statCard, {
                            backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                            borderWidth: 1.5,
                            borderColor: colors.BORDER + '60',
                            borderLeftWidth: 4,
                            borderLeftColor: colors.BLUE
                        }]}>
                            <Text style={[styles.statValue, { color: colors.TEXT }]}>
                                {goalWeight} kg
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.TEXT_SECONDARY }]}>
                                Goal
                            </Text>
                        </View>
                    )}
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
        borderRadius: 20,
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
        justifyContent: 'center',
        marginVertical: 16,
        paddingVertical: 12,
        borderRadius: 16,
        paddingHorizontal: 10,
        minHeight: CHART_HEIGHT + 20
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.3
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        opacity: 0.7,
        marginTop: 2
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


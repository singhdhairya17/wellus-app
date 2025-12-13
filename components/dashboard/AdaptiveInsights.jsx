import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { DetectEatingPatterns, GenerateAdaptiveRecommendation } from '../../services/monitoring/AdaptiveMonitoringService'
import moment from 'moment'
import { LinearGradient } from 'expo-linear-gradient'

export default function AdaptiveInsights() {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const convex = useConvex();
    const { refreshData } = useContext(RefreshDataContext)
    const [insights, setInsights] = useState({
        patterns: [],
        recommendations: [],
        adaptiveMessage: null
    });
    const [currentIntake, setCurrentIntake] = useState({
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        sodium: 0,
        sugar: 0
    });
    
    // Use refs to prevent multiple simultaneous requests
    const isLoadingRef = useRef(false);
    const lastRefreshRef = useRef(null);
    const lastUserIdRef = useRef(null);
    const lastFetchTimeRef = useRef(0);
    
    // Memoize user ID to prevent unnecessary re-renders
    const userId = useMemo(() => user?._id, [user?._id]);

    const fetchInsights = useCallback(async () => {
        if (!userId) return;
        
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        
        // Prevent multiple simultaneous requests
        if (isLoadingRef.current) {
            if (__DEV__) {
                console.log('[AdaptiveInsights] Request already in progress, skipping...');
            }
            return;
        }
        
        // If userId hasn't changed and refreshData hasn't changed, skip
        if (lastUserIdRef.current === userId && lastRefreshRef.current === refreshData) {
            // Only skip if we fetched recently (within 2 seconds) to prevent rapid re-renders
            if (timeSinceLastFetch < 2000) {
                if (__DEV__) {
                    console.log('[AdaptiveInsights] Already fetched for this userId and refreshData, skipping...');
                }
                return;
            }
        }
        
        // Set loading flag IMMEDIATELY to prevent duplicate calls
        isLoadingRef.current = true;
        lastRefreshRef.current = refreshData;
        lastUserIdRef.current = userId;
        lastFetchTimeRef.current = now;
        
        try {
            if (__DEV__) {
                console.log('[AdaptiveInsights] Fetching insights...');
            }
            const result = await convex.query(api.AdaptiveMonitoring.GetAdaptiveInsights, {
                uid: userId,
                days: 7
            });

            if (result && result.events && result.userGoals) {
                const detection = DetectEatingPatterns(result.events, result.userGoals);
                
                const currentIntakeResult = await convex.query(api.MealPlan.GetDailyMacronutrients, {
                    date: moment().format('DD/MM/YYYY'),
                    uid: userId
                });
                
                setCurrentIntake(currentIntakeResult || {
                    calories: 0,
                    protein: 0,
                    carbohydrates: 0,
                    fat: 0,
                    sodium: 0,
                    sugar: 0
                });

                if (currentIntakeResult && user) {
                    const userGoals = {
                        calories: user.calories || 2000,
                        proteins: user.proteins || 100,
                        carbohydrates: user.carbohydrates || 225,
                        fat: user.fat || 56,
                        sodium: user.sodium || 2300,
                        sugar: user.sugar || 50
                    };
                    const adaptiveMsg = GenerateAdaptiveRecommendation(currentIntakeResult, userGoals, detection.patterns);
                    setInsights({
                        patterns: detection.patterns,
                        recommendations: detection.recommendations,
                        adaptiveMessage: adaptiveMsg
                    });
                } else {
                    setInsights({
                        patterns: detection.patterns,
                        recommendations: detection.recommendations,
                        adaptiveMessage: null
                    });
                }
            }
            if (__DEV__) {
                console.log('[AdaptiveInsights] Insights fetched successfully');
            }
        } catch (error) {
            if (__DEV__) {
                console.error('[AdaptiveInsights] Error fetching insights:', error);
            }
        } finally {
            // Reset loading flag immediately
            isLoadingRef.current = false;
        }
    }, [userId, convex, refreshData, user]);

    useEffect(() => {
        if (userId) {
            // Immediate fetch for faster rendering
            fetchInsights();
        }
    }, [userId, refreshData, fetchInsights])

    if (!insights.recommendations || insights.recommendations.length === 0) {
        if (insights.adaptiveMessage) {
            return (
                <LinearGradient
                    colors={colors.isDark ? [colors.CARD, colors.SURFACE] : [colors.WHITE, colors.WHITE]}
                    style={[styles(colors).container, {
                        borderWidth: colors.isDark ? 1 : 0,
                        borderColor: colors.BORDER
                    }]}
                >
                    <Text style={[styles(colors).title, { color: colors.TEXT }]}>Adaptive Insights</Text>
                    <View style={[
                        styles(colors).messageCard,
                        { backgroundColor: colors.PRIMARY + '15', borderLeftColor: colors.PRIMARY },
                        insights.adaptiveMessage.type === 'warning' && { backgroundColor: colors.YELLOW + '15', borderLeftColor: colors.YELLOW },
                        insights.adaptiveMessage.type === 'success' && { backgroundColor: colors.GREEN + '15', borderLeftColor: colors.GREEN }
                    ]}>
                        <Text style={[styles(colors).messageText, { color: colors.TEXT }]}>{insights.adaptiveMessage.message}</Text>
                    </View>
                </LinearGradient>
            );
        }
        return null;
    }

    return (
        <View>
            <LinearGradient
                colors={colors.isDark ? [colors.CARD, colors.SURFACE] : [colors.WHITE, colors.WHITE]}
                style={[styles(colors).container, {
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.BORDER
                }]}
            >
                <Text style={[styles(colors).title, { color: colors.TEXT }]}>Adaptive Insights</Text>
                <Text style={[styles(colors).subtitle, { color: colors.TEXT_SECONDARY }]}>Based on your eating patterns</Text>

            {insights.adaptiveMessage && (
                <View style={[
                    styles(colors).messageCard,
                    { backgroundColor: colors.PRIMARY + '15', borderLeftColor: colors.PRIMARY },
                    insights.adaptiveMessage.type === 'warning' && { backgroundColor: colors.YELLOW + '15', borderLeftColor: colors.YELLOW },
                    insights.adaptiveMessage.type === 'success' && { backgroundColor: colors.GREEN + '15', borderLeftColor: colors.GREEN }
                ]}>
                    <Text style={[styles(colors).messageText, { color: colors.TEXT }]}>{insights.adaptiveMessage.message}</Text>
                </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles(colors).recommendationsScroll}>
                {insights.recommendations.map((rec, index) => (
                    <View key={index} style={[
                        styles(colors).recommendationCard,
                        { 
                            backgroundColor: colors.PRIMARY + '10',
                            borderColor: colors.PRIMARY + '30'
                        },
                        rec.priority === 'high' && {
                            backgroundColor: colors.RED + '10',
                            borderColor: colors.RED + '30'
                        }
                    ]}>
                        <Text style={[styles(colors).recommendationTitle, { color: colors.PRIMARY }]}>{rec.title}</Text>
                        <Text style={[styles(colors).recommendationMessage, { color: colors.TEXT_SECONDARY }]}>{rec.message}</Text>
                        <View style={[styles(colors).suggestionBox, { 
                            backgroundColor: colors.isDark ? colors.BACKGROUND : colors.WHITE,
                            borderLeftColor: colors.PRIMARY
                        }]}>
                            <Text style={[styles(colors).suggestionLabel, { color: colors.PRIMARY }]}>Suggestion:</Text>
                            <Text style={[styles(colors).suggestionText, { color: colors.TEXT_SECONDARY }]}>{rec.suggestion}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {insights.patterns.length > 0 && (
                <View style={[styles(colors).patternsContainer, { borderTopColor: colors.BORDER }]}>
                    <Text style={[styles(colors).patternsTitle, { color: colors.TEXT }]}>Detected Patterns:</Text>
                    {insights.patterns.map((pattern, index) => (
                        <View key={index} style={styles(colors).patternItem}>
                            <Text style={[styles(colors).patternText, { color: colors.TEXT_SECONDARY }]}>
                                {pattern.severity === 'high' ? '🔴' : '🟡'} {pattern.description}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
            </LinearGradient>
        </View>
    );
}

const styles = (colors) => StyleSheet.create({
    container: {
        marginTop: 0,
        marginBottom: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: colors.isDark ? 0.3 : 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 18,
        fontWeight: '500',
    },
    messageCard: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    recommendationsScroll: {
        marginBottom: 16,
    },
    recommendationCard: {
        width: 280,
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    recommendationMessage: {
        fontSize: 13,
        marginBottom: 12,
        lineHeight: 18,
    },
    suggestionBox: {
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
    },
    suggestionLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    suggestionText: {
        fontSize: 12,
        lineHeight: 16,
    },
    patternsContainer: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    patternsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    patternItem: {
        marginBottom: 8,
    },
    patternText: {
        fontSize: 13,
        lineHeight: 18,
    },
});

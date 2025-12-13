import { View, Text, FlatList, ScrollView, StyleSheet } from 'react-native'
import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CalendarAdd01Icon, Coffee02Icon, Sun03Icon, Moon02Icon, ServingFoodIcon } from '@hugeicons/core-free-icons';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import moment from 'moment';
import { UserContext } from '../../context/UserContext';
import MealPlanCard from './MealPlanCard';
import { RefreshDataContext } from '../../context/RefreshDataContext';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const MEAL_TYPES = [
    { key: 'Breakfast', label: 'Breakfast', icon: Coffee02Icon, emoji: '🌅', color: '#FF9500' },
    { key: 'Lunch', label: 'Lunch', icon: Sun03Icon, emoji: '☀️', color: '#007AFF' },
    { key: 'Dinner', label: 'Dinner', icon: Moon02Icon, emoji: '🌙', color: '#5856D6' },
    { key: 'Snack', label: 'Snacks', icon: ServingFoodIcon, emoji: '🍎', color: '#34C759' }
];

export default function TodaysMealPlan({ selectedDate, insideScrollView = false }) {
    const { colors } = useTheme();
    const { user } = useContext(UserContext);
    const { refreshData } = useContext(RefreshDataContext)
    
    // Use useQuery for better loading state handling
    const mealPlanQuery = useQuery(
        api.MealPlan.GetTodaysMealPlan,
        user?._id ? {
            uid: user._id,
            date: selectedDate ?? moment().format('DD/MM/YYYY')
        } : 'skip'
    );
    
    // mealPlanQuery will be undefined while loading, null on error, or the data when loaded
    // Use empty array during loading so empty state shows immediately if no meals exist
    // Ensure mealPlan is always an array to prevent .map() errors
    const mealPlan = useMemo(() => {
        if (mealPlanQuery === undefined) return [];
        if (!mealPlanQuery) return [];
        if (!Array.isArray(mealPlanQuery)) return [];
        return mealPlanQuery;
    }, [mealPlanQuery]);
    const isLoading = mealPlanQuery === undefined;

    // Group meals by meal type
    const groupedMeals = useMemo(() => {
        const grouped = {};
        
        // Initialize all meal types
        MEAL_TYPES.forEach(type => {
            grouped[type.key] = [];
        });
        
        // Group meals by type - ensure mealPlan is an array before forEach
        if (Array.isArray(mealPlan)) {
            mealPlan.forEach(item => {
                if (item && item.mealPlan) {
                    const mealType = item.mealPlan?.mealType || 'Snack';
                    if (!grouped[mealType]) {
                        grouped[mealType] = [];
                    }
                    grouped[mealType].push(item);
                }
            });
        }
        
        return grouped;
    }, [mealPlan]);

    // Check if we have meals
    const hasAnyMeals = mealPlan?.length > 0;
    
    // Pre-compute empty state JSX so it's ready immediately
    const emptyStateJSX = useMemo(() => (
        <View>
            <LinearGradient
                colors={colors.isDark 
                    ? [colors.CARD, colors.SURFACE] 
                    : ['#FFFFFF', '#F8F9FA']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.emptyState, {
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.BORDER
                }]}
            >
                <View 
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.PRIMARY + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20
                    }}
                >
                    <HugeiconsIcon icon={CalendarAdd01Icon} size={40} color={colors.PRIMARY} />
                </View>
                <Text 
                    style={[styles.emptyStateTitle, { color: colors.TEXT }]}
                >
                    No Meals Planned
                </Text>
                <Text 
                    style={[styles.emptyStateText, { color: colors.TEXT_SECONDARY }]}
                >
                    Start your nutrition journey by adding meals to your plan. Scroll down to browse recipes or generate AI-powered meal ideas.
                </Text>
            </LinearGradient>
        </View>
    ), [colors]);

    const renderMealSection = useCallback((mealType, sectionIndex) => {
        const meals = groupedMeals[mealType.key] || [];
        const mealTypeInfo = MEAL_TYPES.find(t => t.key === mealType.key) || MEAL_TYPES[3];
        
        // Don't render empty sections while loading
        // Also don't render empty sections if we have meals in other sections (only show sections with meals)
        if (isLoading || (!isLoading && hasAnyMeals && meals.length === 0)) {
            return null;
        }
        
        // If we're done loading and have no meals at all, don't render individual sections
        // (the main empty state will handle this)
        if (!isLoading && !hasAnyMeals) {
            return null;
        }
        
        return (
            <Animated.View 
                key={mealType.key}
                entering={FadeInDown.delay(sectionIndex * 50).springify()}
            >
                <LinearGradient
                    colors={colors.isDark 
                        ? [colors.CARD, colors.SURFACE, colors.CARD] 
                        : ['#FFFFFF', '#FAFBFC', '#FFFFFF']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.mealSection, {
                        borderWidth: colors.isDark ? 1.5 : 1,
                        borderColor: colors.isDark ? colors.BORDER + '60' : colors.BORDER + '40',
                        shadowColor: mealTypeInfo.color,
                        shadowOpacity: colors.isDark ? 0.25 : 0.12,
                        shadowOffset: { width: 0, height: 6 },
                        shadowRadius: 16,
                        elevation: 6
                    }]}
                >
                    <View style={styles.sectionHeader}>
                        <LinearGradient
                            colors={[mealTypeInfo.color + '25', mealTypeInfo.color + '15', mealTypeInfo.color + '20']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.iconContainer, {
                                shadowColor: mealTypeInfo.color,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 5,
                                borderWidth: 1,
                                borderColor: mealTypeInfo.color + '20'
                            }]}
                        >
                            <HugeiconsIcon icon={mealTypeInfo.icon} size={30} color={mealTypeInfo.color} strokeWidth={2} />
                        </LinearGradient>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>{mealTypeInfo.label}</Text>
                                {meals.length > 0 && (
                                    <View style={[styles.mealCountBadge, { 
                                        backgroundColor: mealTypeInfo.color + '15',
                                        borderWidth: 1,
                                        borderColor: mealTypeInfo.color + '25'
                                    }]}>
                                        <Text style={[styles.mealCountText, { color: mealTypeInfo.color }]}>{meals.length}</Text>
                                    </View>
                                )}
                            </View>
                            {meals.length > 0 && (
                                <Text style={[styles.sectionSubtitle, { color: colors.TEXT_SECONDARY }]}>
                                    {meals.length} {meals.length === 1 ? 'meal' : 'meals'} planned
                                </Text>
                            )}
                        </View>
                    </View>
                    
                    {meals.length > 0 ? (
                        <View style={styles.mealsContainer}>
                            {meals.map((item, index) => (
                                <MealPlanCard 
                                    key={`${mealType.key}-${item.mealPlan?._id || index}`} 
                                    mealPlanInfo={item} 
                                    index={index}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyMealSection}>
                            <LinearGradient
                                colors={[colors.BORDER + '20', colors.BORDER + '10']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 28,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: colors.BORDER + '30'
                                }}
                            >
                                <HugeiconsIcon icon={mealTypeInfo.icon} size={26} color={colors.TEXT_SECONDARY} />
                            </LinearGradient>
                            <Text style={[styles.emptyMealText, { color: colors.TEXT_SECONDARY }]}>
                                No {mealTypeInfo.label.toLowerCase()} planned
                            </Text>
                        </View>
                    )}
                </LinearGradient>
            </Animated.View>
        );
    }, [groupedMeals, colors, isLoading, hasAnyMeals]);

    return (
        <View style={styles.container}>
            {!selectedDate && (
                <LinearGradient
                    colors={[colors.PRIMARY + '10', colors.SECONDARY + '05']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 24,
                        padding: 20,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.BORDER + '50'
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: colors.TEXT }]}>Today's Meal Plan</Text>
                        <Text style={{
                            fontSize: 13,
                            color: colors.TEXT_SECONDARY,
                            marginTop: 4,
                            fontWeight: '500'
                        }}>{moment().format('dddd, MMMM DD')}</Text>
                    </View>
                    <View style={{
                        backgroundColor: colors.PRIMARY + '20',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.PRIMARY + '30'
                    }}>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '800',
                            color: colors.PRIMARY,
                            letterSpacing: 0.5
                        }}>{mealPlan.length} MEALS</Text>
                    </View>
                </LinearGradient>
            )}

            {!hasAnyMeals ? emptyStateJSX : (
                <View style={styles.mealsList}>
                    {MEAL_TYPES.map((mealType, index) => renderMealSection(mealType, index)).filter(Boolean)}
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 0,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    emptyState: {
        display: 'flex',
        alignItems: 'center',
        padding: 40,
        marginTop: 20,
        borderRadius: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    emptyStateText: {
        fontSize: 15,
        marginBottom: 28,
        marginTop: 4,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 22,
    },
    mealsList: {
        marginTop: 12,
        gap: 20,
    },
    mealSection: {
        marginBottom: 20,
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3,
        letterSpacing: 0.2,
    },
    mealCountBadge: {
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealCountText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    mealsContainer: {
        gap: 14,
    },
    emptyMealSection: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyMealText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
import { View, Text, Platform, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateSelectionCard from '../../components/ui/DateSelectionCard'
import React, { useState } from 'react'
import MealPlanCalendar from '../../components/meals/MealPlanCalendar'
import WeightTracker from '../../components/tracking/WeightTracker'
import WeightProgressChart from '../../components/progress/WeightProgressChart'
import ProgressCharts from '../../components/progress/ProgressCharts'
import ExerciseTracker from '../../components/tracking/ExerciseTracker'
import ExerciseCaloriesChart from '../../components/progress/ExerciseCaloriesChart'
import NutritionInsights from '../../components/insights/NutritionInsights'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'

export default function Progress() {
    const insets = useSafeAreaInsets()
    const { colors } = useTheme()
    const [selectedDate, setSelectedDate] = useState()
    
    // Calculate tab bar height for proper spacing
    const tabBarHeight = Platform.OS === 'ios' 
        ? 60 + Math.max(insets.bottom - 10, 0) 
        : 60;
    const bottomPadding = tabBarHeight + 120;
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            <FlatList
                data={[]}
                renderItem={() => null}
                contentContainerStyle={{
                    paddingBottom: Platform.OS === 'ios' 
                        ? bottomPadding + Math.max(insets.bottom, 20) + 20
                        : bottomPadding + 20
                }}
                ListHeaderComponent={
                    <View style={{
                        padding: 20,
                        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : Math.max(insets.top + 10, 20)
                    }}>
                        {/* Premium Header */}
                        <LinearGradient
                            colors={[colors.PRIMARY + '15', colors.SECONDARY + '08']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                padding: 20,
                                borderRadius: 20,
                                marginBottom: 20,
                                borderWidth: 1,
                                borderColor: colors.BORDER
                            }}
                        >
                            <Text style={{
                                fontSize: 32,
                                fontWeight: '800',
                                color: colors.TEXT,
                                letterSpacing: -0.5,
                                marginBottom: 4
                            }}>Progress</Text>
                            <Text style={{
                                fontSize: 15,
                                color: colors.TEXT_SECONDARY,
                                fontWeight: '500'
                            }}>Track your nutrition journey</Text>
                        </LinearGradient>

                        <DateSelectionCard setSelctedDate={setSelectedDate} />
                        <MealPlanCalendar />
                        <WeightTracker />
                        <WeightProgressChart />
                        <ExerciseTracker />
                        <ExerciseCaloriesChart />
                        <ProgressCharts selectedDate={selectedDate} />
                        <NutritionInsights />
                    </View>} 
            />
        </View>
    )
}
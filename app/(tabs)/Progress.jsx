import { View, Text, Platform, FlatList } from 'react-native'
import DateSelectionCard from './../../components/DateSelectionCard'
import React, { useState } from 'react'
import TodaysMealPlan from '../../components/TodaysMealPlan'
import TodayProgress from '../../components/TodayProgress'
import GenerateRecipeCard from '../../components/GenerateRecipeCard'

export default function Progress() {
    const [selectedDate, setSelectedDate] = useState()
    return (
        <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
                <View style={{
                    padding: 20,
                    paddingTop: Platform?.OS == 'ios' ? 40 : 25
                }}>
                    <Text style={{
                        fontSize: 25,
                        fontWeight: 'bold'
                    }}>Progress</Text>

                    <DateSelectionCard setSelctedDate={setSelectedDate} />
                    <TodaysMealPlan selectedDate={selectedDate} />

                    <TodayProgress />
                    <GenerateRecipeCard />
                </View>} />
    )
}
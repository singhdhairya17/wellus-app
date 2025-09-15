import { View, Text, Platform, FlatList } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from './../../context/UserContext'
import { useRouter } from 'expo-router'
import HomeHeader from '../../components/HomeHeader'
import TodayProgress from '../../components/TodayProgress'
import GenerateRecipeCard from '../../components/GenerateRecipeCard'
import TodaysMealPlan from '../../components/TodaysMealPlan'
import { RefreshDataContext } from '../../context/RefreshDataContext'
export default function Home() {
    const { user } = useContext(UserContext)
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { refreshData, setRefreshData } = useContext(RefreshDataContext)

    useEffect(() => {
        if (!user?.weight) {
            router.replace('/preferance')
        }
        if (!user?._id) {
            router.replace('/')
        }
    }, [user])
    return (
        <FlatList
            data={[]}
            renderItem={() => null}
            onRefresh={() => setRefreshData(Date.now())}
            refreshing={loading}
            ListHeaderComponent={
                <View style={{
                    paddingTop: Platform.OS == 'ios' && 40,
                    padding: 20
                }}>
                    <HomeHeader />
                    <TodayProgress />
                    <GenerateRecipeCard />
                    <TodaysMealPlan />
                </View>}
        ></FlatList>
    )
}
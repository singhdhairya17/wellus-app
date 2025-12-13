import { View, Text, Platform, FlatList } from 'react-native'
import React, { useContext, useMemo, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GenerateRecipeCard from '../../components/meals/GenerateRecipeCard'
import TodaysMealPlan from '../../components/meals/TodaysMealPlan'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import RecipeCard from '../../components/recipes/RecipeCard'
import { UserContext } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'

function Meals() {
    const insets = useSafeAreaInsets()
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const recipeList = useQuery(api.Recipes.GetAllRecipes, user?._id ? { uid: user._id } : 'skip')

    const tabBarHeight = Platform.OS === 'ios' 
        ? 60 + Math.max(insets.bottom - 10, 0) 
        : 60;
    const bottomPadding = tabBarHeight + 120;

    return (
        <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            <FlatList
                data={recipeList || []}
                numColumns={2}
                keyExtractor={(item, index) => item?._id || index.toString()}
                contentContainerStyle={{
                    paddingBottom: Platform.OS === 'ios' 
                        ? bottomPadding + Math.max(insets.bottom, 20) + 20
                        : bottomPadding + 20,
                    paddingHorizontal: 20,
                    paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : Math.max(insets.top + 10, 20)
                }}
                ListHeaderComponent={useMemo(() => (
                    <View>
                        <TodaysMealPlan />
                        <GenerateRecipeCard />
                    </View>
                ), [])}
                renderItem={useCallback(({ item }) => (
                    <View style={{ flex: 1, margin: 6 }}>
                        <RecipeCard recipe={item} />
                    </View>
                ), [])}
                ListEmptyComponent={
                    <View style={{
                        padding: 40,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Text style={{
                            fontSize: 16,
                            color: colors.TEXT_SECONDARY,
                            textAlign: 'center',
                            marginTop: 20
                        }}>No recipes yet. Generate your first AI recipe!</Text>
                    </View>
                }
                // Performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={8}
                updateCellsBatchingPeriod={50}
                initialNumToRender={6}
                windowSize={8}
                getItemLayout={(data, index) => ({
                    length: 200, // Approximate item height
                    offset: 200 * Math.floor(index / 2),
                    index,
                })}
            />
        </View>
    )
}

export default React.memo(Meals)
import { View, Text, Platform, FlatList } from 'react-native'
import React, { useRef } from 'react'
import RecipeIntro from '../../components/RecipeIntro'
import { useLocalSearchParams, useSearchParams } from 'expo-router/build/hooks';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Colors from '../../shared/Colors';
import RecipeIngredients from '../../components/RecipeIngredients';
import RecipeSteps from '../../components/RecipeSteps';
import Button from './../../components/shared/Button'
import ActionSheet from 'react-native-actions-sheet';
import AddToMealActionSheet from '../../components/AddToMealActionSheet';
export default function RecipeDetail() {
    const { recipeId } = useLocalSearchParams();
    console.log("recipeId", recipeId);//j977j3n3dswm1e7rzyw50mve9x7e4a2a
    const actionSheetRef = useRef(null);
    const recipeDetail = useQuery(api.Recipes.GetRecipeById, {
        id: recipeId == undefined ? 'j977j3n3dswm1e7rzyw50mve9x7e4a2a' : recipeId
    });
    console.log("recipeDetail-", recipeDetail)
    // const GetRecipeDetail=()=>{

    // }

    return (
        <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
                <View style={{
                    padding: 20,
                    paddingTop: Platform.OS == 'ios' ? 40 : 30,
                    backgroundColor: Colors.WHITE,
                    height: '100%'
                }}>
                    {/* Recipe Intro  */}
                    <RecipeIntro recipeDetail={recipeDetail} showActionSheet={() => actionSheetRef.current.show()} />
                    {/* Recipe Ingrdient  */}
                    <RecipeIngredients recipeDetail={recipeDetail} />
                    {/* Cooking Steps  */}
                    <RecipeSteps recipeDetail={recipeDetail} />

                    <View style={{
                        marginTop: 15
                    }}>
                        <Button title={'Add to Meal Plan'} onPress={() => actionSheetRef.current.show()} />
                    </View>

                    <ActionSheet ref={actionSheetRef}>
                        <AddToMealActionSheet recipeDetail={recipeDetail}
                            hideActionSheet={() => actionSheetRef.current.hide()} />
                    </ActionSheet>

                </View>
            }
        ></FlatList>
    )
}
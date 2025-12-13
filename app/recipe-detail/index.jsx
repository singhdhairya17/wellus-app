import { View, Text, Platform, FlatList, ActivityIndicator, Alert } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import RecipeIntro from '../../components/recipes/RecipeIntro'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Colors from '../../constants/colors';
import RecipeIngredients from '../../components/recipes/RecipeIngredients';
import RecipeSteps from '../../components/recipes/RecipeSteps';
import Button from '../../components/common/shared/Button'
import ActionSheet from 'react-native-actions-sheet';
import AddToMealActionSheet from '../../components/meals/AddToMealActionSheet';

export default function RecipeDetail() {
    const { recipeId } = useLocalSearchParams();
    const router = useRouter();
    const actionSheetRef = useRef(null);
    const [hasError, setHasError] = useState(false);
    
    // Check if recipeId looks like a scannedFood ID (starts with 'j' typically)
    // ScannedFood IDs from Convex typically start with 'j', recipe IDs start with different prefixes
    useEffect(() => {
        if (recipeId && typeof recipeId === 'string' && recipeId.startsWith('j') && recipeId.length > 20) {
            // Likely a scannedFood ID, redirect back
            Alert.alert(
                'Invalid Recipe', 
                'This item cannot be viewed as a recipe. It is a scanned food item.',
                [
                    { text: 'OK', onPress: () => router.back() }
                ]
            );
            setHasError(true);
            return;
        }
    }, [recipeId, router]);
    
    const recipeDetail = useQuery(
        api.Recipes.GetRecipeById, 
        (recipeId && !hasError) ? { id: recipeId } : 'skip'
    );

    // Handle error case - if recipeId is from wrong table (e.g., scannedFood)
    useEffect(() => {
        if (recipeDetail === null && recipeId && !hasError) {
            Alert.alert(
                'Recipe Not Found', 
                'The recipe you\'re looking for doesn\'t exist.',
                [
                    { text: 'OK', onPress: () => router.back() }
                ]
            );
        }
    }, [recipeDetail, recipeId, router, hasError]);

    useEffect(() => {
        if (recipeId === undefined) {
            Alert.alert('Error', 'Recipe ID not found', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    }, [recipeId]);

    // Show loading state
    if (recipeDetail === undefined) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: Colors.WHITE
            }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={{
                    marginTop: 10,
                    color: Colors.GRAY
                }}>Loading recipe...</Text>
            </View>
        );
    }

    // Show error state if recipe not found
    if (recipeDetail === null) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: Colors.WHITE,
                padding: 20
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: Colors.RED,
                    marginBottom: 10
                }}>Recipe Not Found</Text>
                <Text style={{
                    color: Colors.GRAY,
                    textAlign: 'center',
                    marginBottom: 20
                }}>The recipe you're looking for doesn't exist or has been deleted.</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    return (
        <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
                <View style={{
                    padding: 20,
                    paddingTop: Platform.OS == 'ios' ? 40 : 30,
                    backgroundColor: Colors.WHITE,
                    minHeight: '100%'
                }}>
                    {/* Recipe Intro  */}
                    <RecipeIntro recipeDetail={recipeDetail} showActionSheet={() => actionSheetRef.current?.show()} />
                    {/* Recipe Ingrdient  */}
                    <RecipeIngredients recipeDetail={recipeDetail} />
                    {/* Cooking Steps  */}
                    <RecipeSteps recipeDetail={recipeDetail} />

                    <View style={{
                        marginTop: 15
                    }}>
                        <Button title={'Add to Meal Plan'} onPress={() => actionSheetRef.current?.show()} />
                    </View>

                    <ActionSheet ref={actionSheetRef}>
                        <AddToMealActionSheet recipeDetail={recipeDetail}
                            hideActionSheet={() => actionSheetRef.current?.hide()} />
                    </ActionSheet>

                </View>
            }
        ></FlatList>
    )
}
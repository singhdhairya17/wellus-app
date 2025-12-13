import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import Colors from '../../constants/colors'
import Prompt from '../../constants/prompts'
import { GenerateAIRecipe, GenerateRecipeImage } from '../../services/ai/AiModel'
import LoadingDialog from '../common/LoadingDialog'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import { useRouter } from 'expo-router'
export default function RecipeOptionList({ recipeOption }) {

    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Generating recipe...');
    const CreateRecipe = useMutation(api.Recipes.CreateRecipe);
    const { user } = useContext(UserContext);
    const router = useRouter();
    
    const onRecipeOptionSelect = async (recipe) => {
        if (!user?._id) {
            Alert.alert('Error', 'Please login first');
            return;
        }

        setLoading(true);
        setLoadingMessage('Generating recipe details...');
        const PROMPT = "RecipeName: " + recipe?.recipeName +
            " Description:" + recipe?.description + Prompt.GENERATE_COMPLETE_RECIPE_PROMPT

        try {
            // Step 1: Generate complete recipe (with automatic retry on rate limits)
            setLoadingMessage('Generating recipe details...');
            let result;
            try {
                result = await GenerateAIRecipe(PROMPT);
            } catch (recipeError) {
                // If retries exhausted, show helpful message
                if (recipeError.message?.includes('RATE_LIMIT_FALLBACK')) {
                    throw new Error('RATE_LIMIT_FALLBACK: AI service is temporarily rate-limited. Please wait 30-60 seconds and try again.');
                }
                throw recipeError;
            }
            const extractJson = (result.choices[0].message.content).replace('```json', '').replace('```', '')
            const parsedJSONResp = JSON.parse(extractJson);
            console.log('✅ Recipe generated:', parsedJSONResp);
            
            // Step 2: Generate recipe image
            setLoadingMessage('Generating recipe image...');
            const aiImageResp = await GenerateRecipeImage(parsedJSONResp?.imagePrompt)
            console.log('✅ Image generated:', aiImageResp?.data?.image);
            
            if (!aiImageResp?.data?.image) {
                throw new Error('Failed to generate recipe image');
            }
            
            // Step 3: Save to Database
            setLoadingMessage('Saving recipe...');
            const saveRecipeResult = await CreateRecipe({
                jsonData: parsedJSONResp,
                imageUrl: aiImageResp?.data?.image,
                recipeName: parsedJSONResp?.recipeName,
                uid: user?._id
            })
            console.log('✅ Recipe saved:', saveRecipeResult);
            
            if (!saveRecipeResult) {
                throw new Error('Failed to save recipe');
            }
            
            setLoading(false);
            
            // Step 4: Redirect to Recipe Details Screen
            // Ensure recipeId is a string
            const recipeIdString = String(saveRecipeResult);
            console.log('📱 Navigating to recipe detail with ID:', recipeIdString);
            
            router.push({
                pathname: '/recipe-detail',
                params: {
                    recipeId: recipeIdString
                }
            })
        }
        catch (e) {
            console.error('❌ Recipe generation error:', e);
            setLoading(false);
            
            // Show user-friendly error message
            let errorMessage = 'Failed to generate recipe. ';
            let showRetry = false;
            
            if (e.message?.includes('429') || e.message?.includes('Rate limit') || e.message?.includes('RATE_LIMIT')) {
                errorMessage = '⚠️ AI Service Rate Limited\n\n';
                errorMessage += 'The AI service is currently experiencing high demand. ';
                errorMessage += 'We\'ve automatically retried 3 times, but the service is still unavailable.\n\n';
                errorMessage += 'Please wait 30-60 seconds and try again.';
                showRetry = true;
            } else if (e.message?.includes('image')) {
                errorMessage += 'Failed to generate recipe image. Please try again.';
            } else {
                errorMessage += e.message || 'Please try again.';
            }
            
            Alert.alert(
                'Recipe Generation Failed', 
                errorMessage, 
                showRetry ? [
                    { text: 'Try Again', onPress: () => onRecipeOptionSelect(recipe) },
                    { text: 'Cancel', style: 'cancel' }
                ] : [{ text: 'OK' }]
            );
        }
    }

    return (
        <View style={{
            marginTop: 20
        }}>
            <Text style={{
                fontSize: 20,
                fontWeight: 'bold'
            }}>Select Recipe</Text>

            <View>
                {recipeOption?.map((item, index) => (
                    <TouchableOpacity
                        onPress={() => onRecipeOptionSelect(item)}
                        key={index} style={{
                            padding: 15,
                            borderWidth: 0.2,
                            borderRadius: 15,
                            marginTop: 15
                        }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: 'bold'
                        }}>{item?.recipeName}</Text>
                        <Text style={{
                            color: Colors.GRAY
                        }}>{item?.description}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <LoadingDialog loading={loading} message={loadingMessage} />
        </View>
    )
}
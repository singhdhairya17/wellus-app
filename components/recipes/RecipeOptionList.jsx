import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import Colors from '../../constants/colors'
import { GenerateAIRecipe, GenerateRecipeImage, FALLBACK_RECIPE_CARD_IMAGE_URL } from '../../services/ai/AiModel'
import LoadingDialog from '../common/LoadingDialog'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import { useRouter } from 'expo-router'
import { buildCompleteRecipePrompt } from '../../constants/prompts'

const numNut = (x) => {
    const v = Number(x)
    return Number.isFinite(v) ? Math.max(0, Math.round(v * 100) / 100) : 0
}

/** Convex + dashboard expect these keys on jsonData when meal is logged. */
const normalizeAiRecipePayload = (raw) => {
    if (!raw || typeof raw !== 'object') return raw
    const serve = Math.max(1, Math.round(Number(raw.serveTo)) || 1)
    const cookTime = Number.isFinite(Number(raw.cookTime)) ? Math.max(0, Math.round(Number(raw.cookTime))) : 25
    return {
        ...raw,
        calories: numNut(raw.calories),
        proteins: numNut(raw.proteins ?? raw.protein),
        carbohydrates: numNut(raw.carbohydrates ?? raw.carbs),
        fat: numNut(raw.fat),
        sodium: numNut(raw.sodium),
        sugar: numNut(raw.sugar),
        cookTime,
        serveTo: serve,
        nutritionLabel: typeof raw.nutritionLabel === 'string' ? raw.nutritionLabel : '',
        ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : [],
        steps: Array.isArray(raw.steps) ? raw.steps : [],
        category: Array.isArray(raw.category) ? raw.category : [],
    }
}

export default function RecipeOptionList({ recipeOption, portionNotes = '', userSummary = '' }) {
    const [loading, setLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('Generating recipe...')
    const CreateRecipe = useMutation(api.Recipes.CreateRecipe)
    const { user } = useContext(UserContext)
    const router = useRouter()

    const onRecipeOptionSelect = async (recipe) => {
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }

        setLoading(true)
        setLoadingMessage('Generating recipe details...')
        const PROMPT = buildCompleteRecipePrompt({
            recipeName: recipe?.recipeName,
            description: recipe?.description,
            portionNotes: typeof portionNotes === 'string' ? portionNotes : '',
            userSummary,
        })

        try {
            setLoadingMessage('Generating recipe details...')
            let result
            try {
                result = await GenerateAIRecipe(PROMPT)
            } catch (recipeError) {
                if (recipeError.message?.includes('RATE_LIMIT_FALLBACK')) {
                    throw new Error(
                        'RATE_LIMIT_FALLBACK: AI service is temporarily rate-limited. Please wait 30-60 seconds and try again.'
                    )
                }
                throw recipeError
            }
            const extractJson = (result.choices[0].message.content || '')
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim()
            let parsedJSONResp = JSON.parse(extractJson)
            parsedJSONResp = normalizeAiRecipePayload(parsedJSONResp)
            console.log('✅ Recipe generated:', parsedJSONResp)

            let imageUrl = FALLBACK_RECIPE_CARD_IMAGE_URL
            try {
                setLoadingMessage('Generating recipe image...')
                const aiImageResp = await GenerateRecipeImage(parsedJSONResp?.imagePrompt)
                const url = aiImageResp?.data?.image
                if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
                    imageUrl = url
                    console.log('✅ Image generated:', imageUrl.slice(0, 80) + '…')
                }
            } catch (imgErr) {
                console.warn(
                    'Recipe image API skipped (using placeholder):',
                    imgErr?.message || imgErr?.response?.status || imgErr
                )
            }

            setLoadingMessage('Saving recipe...')
            const saveRecipeResult = await CreateRecipe({
                jsonData: parsedJSONResp,
                imageUrl,
                recipeName: parsedJSONResp?.recipeName || recipe?.recipeName,
                uid: user?._id,
            })
            console.log('✅ Recipe saved:', saveRecipeResult)

            if (!saveRecipeResult) {
                throw new Error('Failed to save recipe')
            }

            setLoading(false)

            const recipeIdString = String(saveRecipeResult)
            console.log('📱 Navigating to recipe detail with ID:', recipeIdString)

            router.push({
                pathname: '/recipe-detail',
                params: {
                    recipeId: recipeIdString,
                },
            })
        } catch (e) {
            console.error('❌ Recipe generation error:', e)
            setLoading(false)

            let errorMessage = 'Failed to generate recipe. '
            let showRetry = false

            if (
                e.message?.includes('429') ||
                e.message?.includes('Rate limit') ||
                e.message?.includes('RATE_LIMIT')
            ) {
                errorMessage = 'AI service rate limited\n\n'
                errorMessage +=
                    'The AI service is currently experiencing high demand. '
                errorMessage +=
                    "We've automatically retried 3 times, but the service is still unavailable.\n\n"
                errorMessage += 'Please wait 30-60 seconds and try again.'
                showRetry = true
            } else if (e.message?.includes('OpenAI') || e.message?.includes('AI service not configured')) {
                errorMessage = 'Recipe text failed to generate. Check Convex OPENAI_API_KEY and try again.'
            } else if (e.message?.includes('JSON') || e instanceof SyntaxError) {
                errorMessage += 'Could not read AI response. Try again with a simpler dish name.'
            } else {
                errorMessage += e.message || 'Please try again.'
            }

            Alert.alert(
                'Recipe Generation Failed',
                errorMessage,
                showRetry
                    ? [
                          { text: 'Try Again', onPress: () => onRecipeOptionSelect(recipe) },
                          { text: 'Cancel', style: 'cancel' },
                      ]
                    : [{ text: 'OK' }]
            )
        }
    }

    return (
        <View
            style={{
                marginTop: 20,
            }}
        >
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#000',
                }}
            >
                Select a recipe to generate
            </Text>
            {(portionNotes || '').trim() ? (
                <Text style={{ marginTop: 8, fontSize: 14, color: Colors.GRAY, lineHeight: 20 }}>
                    {'Macros will be estimated for your specified portions once you choose a variant.'}
                </Text>
            ) : null}

            <View>
                {recipeOption?.map((item, index) => (
                    <TouchableOpacity
                        onPress={() => onRecipeOptionSelect(item)}
                        key={index}
                        style={{
                            padding: 15,
                            borderWidth: 0.2,
                            borderRadius: 15,
                            marginTop: 15,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: '#000',
                            }}
                        >
                            {item?.recipeName}
                        </Text>
                        <Text
                            style={{
                                color: Colors.GRAY,
                            }}
                        >
                            {item?.description}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <LoadingDialog loading={loading} message={loadingMessage} />
        </View>
    )
}

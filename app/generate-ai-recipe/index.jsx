import { View, Text, Platform, TextInput, StyleSheet, ScrollView, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import Colors from '../../constants/colors'
import Button from '../../components/common/shared/Button'
import { GenerateAIRecipe } from '../../services/ai/AiModel'
import { buildRecipeOptionsPrompt, buildUserRecipePersonalizationSummary } from '../../constants/prompts'
import RecipeOptionList from '../../components/recipes/RecipeOptionList'
import { UserContext } from '../../context/UserContext'

export default function GenerateAiRecipe() {
    const { user } = useContext(UserContext)
    const [input, setInput] = useState('')
    const [portionNotes, setPortionNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [recipeOption, setRecipeOption] = useState([])

    const GenerateRecipeOptions = async () => {
        const dish = input?.trim()
        if (!dish) {
            Alert.alert('Add a dish', 'Type what you\'re in the mood for—any cuisine or leftovers.')
            return
        }
        const userSummary = buildUserRecipePersonalizationSummary(user)
        const PROMPT = buildRecipeOptionsPrompt({
            dishDescription: dish,
            portionNotes: portionNotes?.trim(),
            userSummary,
        })
        setLoading(true)
        try {
            const result = await GenerateAIRecipe(PROMPT)
            console.log(result.choices[0].message)
            const extractJson = (result.choices[0].message.content || '')
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim()
            const parsedJSONResp = JSON.parse(extractJson)
            console.log(parsedJSONResp)
            setRecipeOption(Array.isArray(parsedJSONResp) ? parsedJSONResp : [])
            setLoading(false)
        } catch (e) {
            setLoading(false)
            console.error(e)
            const msg = e?.message || String(e)
            if (msg.includes('RATE_LIMIT') || msg.includes('429')) {
                Alert.alert('Slow down', 'AI is busy. Wait a bit and try again.')
            } else if (msg.includes('OPENAI_API_KEY') || msg.includes('AI service not configured')) {
                Alert.alert('Setup', 'OpenAI is not configured on the server (Convex OPENAI_API_KEY).')
            } else {
                Alert.alert('Could not get ideas', msg.length > 160 ? `${msg.slice(0, 160)}…` : msg)
            }
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: Colors.WHITE }}
            contentContainerStyle={{
                paddingTop: Platform.OS === 'ios' ? 40 : 30,
                padding: 20,
                paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.headline}>AI recipe generator</Text>
            <Text style={styles.sub}>
                Tell us the meal you want—we will suggest a few tailored options using your nutrition profile. Mention
                approximate amounts below if you want calorie and macro estimates closer to your real plate.
            </Text>

            <Text style={styles.label}>What are you craving?</Text>
            <TextInput
                style={styles.textArea}
                onChangeText={setInput}
                value={input}
                placeholder={
                    'Examples: high-protein dinner, comforting dal rice, quick breakfast oats, tangy salad…'
                }
                placeholderTextColor={Colors.GRAY}
            />

            <Text style={styles.label}>How much? (optional, one meal)</Text>
            <Text style={styles.hint}>Weights help the AI size nutrition—say cooked vs raw when it matters.</Text>
            <TextInput
                style={styles.portionArea}
                onChangeText={setPortionNotes}
                value={portionNotes}
                placeholder={
                    'e.g. ~1½ cups cooked rice, 1 bowl dal, 1 roti · or “small plate,” “restaurant portion”'
                }
                placeholderTextColor={Colors.GRAY}
                multiline
            />

            <View style={{ marginTop: 25 }}>
                <Button title={'Get tailored recipe ideas'} onPress={GenerateRecipeOptions} loading={loading} />
            </View>

            {recipeOption?.length > 0 && (
                <RecipeOptionList recipeOption={recipeOption} portionNotes={portionNotes} userSummary={buildUserRecipePersonalizationSummary(user)} />
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    headline: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000',
    },
    sub: {
        marginTop: 8,
        color: Colors.GRAY,
        fontSize: 15,
        lineHeight: 22,
    },
    label: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    hint: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: Colors.GRAY,
    },
    textArea: {
        padding: 15,
        borderWidth: 1,
        borderRadius: 10,
        fontSize: 18,
        marginTop: 8,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: Colors.WHITE,
        color: '#000',
        borderColor: '#ddd',
    },
    portionArea: {
        padding: 15,
        borderWidth: 1,
        borderRadius: 10,
        fontSize: 16,
        marginTop: 6,
        minHeight: 110,
        textAlignVertical: 'top',
        backgroundColor: '#fafafa',
        color: '#000',
        borderColor: '#ddd',
    },
})

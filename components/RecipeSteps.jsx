import { View, Text, FlatList } from 'react-native'
import React from 'react'
import Colors from '../shared/Colors';

export default function RecipeSteps({ recipeDetail }) {
    const steps = (recipeDetail?.jsonData)?.steps;

    return (
        <View style={{
            marginTop: 15
        }}>
            <Text style={{
                fontSize: 20,
                fontWeight: 'bold'
            }}>Directions</Text>

            <FlatList
                data={steps}
                renderItem={({ item, index }) => (
                    <View style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 10,
                        marginTop: 10,
                        padding: 10,
                        flex: 1,
                        alignItems: 'center',
                        borderWidth: 0.3,
                        borderRadius: 15
                    }}>
                        <Text style={{
                            fontSize: 15,
                            backgroundColor: Colors.PRIMARY,
                            padding: 10,
                            borderRadius: 99,
                            paddingHorizontal: 15,
                            color: Colors.WHITE,
                        }}>{index + 1}</Text>
                        <Text style={{
                            fontSize: 16,
                            flex: 1,
                            lineHeight: 25,
                            fontWeight: '300',
                            flexShrink: 1
                        }}>{item}</Text>
                    </View>

                )}
            />
        </View>
    )
}
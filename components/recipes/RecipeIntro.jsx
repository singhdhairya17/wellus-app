import { View, Text, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import React from 'react'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Dumbbell01Icon, Fire03Icon, PlusSignSquareIcon, ServingFoodIcon, TimeQuarter02Icon } from '@hugeicons/core-free-icons'
import Colors from '../../constants/colors'


export default function RecipeIntro({ recipeDetail, showActionSheet }) {

    const RecipeJson = recipeDetail?.jsonData;
    return (
        <View >
            <Image 
                source={{ uri: recipeDetail?.imageUrl }}
                style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 15
                }}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                cachePolicy="memory-disk"
            />

            <View style={{
                marginTop: 15,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between'
            }}>
                <Text style={{
                    fontSize: 25,
                    fontWeight: 'bold'
                }}>{recipeDetail?.recipeName}</Text>
                <TouchableOpacity onPress={() => showActionSheet()}>
                    <HugeiconsIcon icon={PlusSignSquareIcon}
                        size={40}
                        color={Colors.PRIMARY}
                    />
                </TouchableOpacity>

            </View>
            <Text style={{
                fontSize: 16,
                marginTop: 6,
                color: Colors.GRAY,
                lineHeight: 25
            }}>{RecipeJson?.description}</Text>

            {(RecipeJson?.nutritionLabel ||
                (RecipeJson?.proteins !== undefined &&
                    RecipeJson?.carbohydrates !== undefined &&
                    RecipeJson?.fat !== undefined)) ? (
                <Text style={{ fontSize: 13, marginTop: 8, color: Colors.GRAY, fontStyle: 'italic' }}>
                    {RecipeJson?.nutritionLabel ||
                        ('Estimated totals for logging (add to meal plan and mark eaten to update dashboard)')}
                </Text>
            ) : null}

            <Text style={{
                marginTop: 8,
                fontSize: 15,
                color: '#555',
                lineHeight: 22,
            }}>
                {`P ${Number(RecipeJson?.proteins ?? 0).toFixed(0)}g · C ${Number(RecipeJson?.carbohydrates ?? 0).toFixed(0)}g · F ${Number(RecipeJson?.fat ?? 0).toFixed(0)}g · Na ${Math.round(Number(RecipeJson?.sodium ?? 0))} mg · Sugar ${Number(RecipeJson?.sugar ?? 0).toFixed(1)} g`}
            </Text>

            <View style={{
                marginTop: 15,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 10
            }}>
                <View style={styles.propertiesContatiner}>
                    <HugeiconsIcon icon={Fire03Icon} color={Colors.PRIMARY}
                        size={27}
                    />
                    <Text style={styles.subText}>Calories</Text>
                    <Text style={styles.counts}>{RecipeJson?.calories}</Text>
                </View>
                {/* <View style={styles.propertiesContatiner}>
                    <HugeiconsIcon icon={Dumbbell01Icon} color={Colors.PRIMARY}
                        size={27}
                    />
                    <Text style={styles.subText}>Protiens</Text>
                    <Text style={styles.counts}>{RecipeJson?.protiens}</Text>
                </View> */}
                <View style={styles.propertiesContatiner}>
                    <HugeiconsIcon icon={TimeQuarter02Icon} color={Colors.PRIMARY}
                        size={27}
                    />
                    <Text style={styles.subText}>Time</Text>
                    <Text style={styles.counts}>{RecipeJson?.cookTime} min</Text>
                </View>
                <View style={styles.propertiesContatiner}>
                    <HugeiconsIcon icon={ServingFoodIcon} color={Colors.PRIMARY}
                        size={27}
                    />
                    <Text style={styles.subText}>Serve</Text>
                    <Text style={styles.counts}>{RecipeJson?.serveTo}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    iconBg: {
        padding: 6,
    },
    propertiesContatiner: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fbf5ff',
        padding: 6,
        borderRadius: 10,
        flex: 1
    },
    subText: {
        fontSize: 16
    },
    counts: {
        fontSize: 20,
        color: Colors.PRIMARY,
        fontWeight: 'bold'
    }
})
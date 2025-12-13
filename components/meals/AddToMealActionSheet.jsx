import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import moment from 'moment';
import Colors from '../../constants/colors';
import { Coffee02Icon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import Button from '../common/shared/Button';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserContext } from '../../context/UserContext'
import DateSelectionCard from '../ui/DateSelectionCard';
import { useTheme } from '../../context/ThemeContext';
export default function AddToMealActionSheet({ recipeDetail, hideActionSheet }) {
    const { colors } = useTheme();

    const [dateList, setDateList] = useState([]);
    const [selectedDate, setSelctedDate] = useState();
    const [selectedMeal, setSelctedMeal] = useState();
    const { user } = useContext(UserContext)
    const CreateMealPlan = useMutation(api.MealPlan.CreateMealPlan)
    const mealOptions = [
        {
            title: 'Breakfast',
            icon: Coffee02Icon
        },
        {
            title: 'Lunch',
            icon: Sun03Icon
        },
        {
            title: 'Dinner',
            icon: Moon02Icon
        }
    ]


    const AddToMealPlan = async () => {
        if (!selectedDate || !selectedMeal) {
            Alert.alert('Error!', 'Please Select All Details ')
            return;
        }

        const result = await CreateMealPlan({
            date: selectedDate,
            mealType: selectedMeal,
            recipeId: recipeDetail?._id,
            uid: user?._id
        })

        console.log(result)

        Alert.alert('Added!', 'Added to Meal Plan')
        hideActionSheet()

    }

    return (
        <View style={{
            padding: 20
        }}>
            <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
                color: colors.TEXT
            }}>Add to Meal</Text>

            <DateSelectionCard setSelctedDate={setSelctedDate} />

            <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginTop: 15,
                color: colors.TEXT
            }}>Select Meal</Text>
            <FlatList
                data={mealOptions}
                numColumns={4}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        onPress={() => setSelctedMeal(item?.title)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            padding: 7,
                            borderWidth: 1,
                            borderRadius: 10,
                            margin: 5,
                            backgroundColor: selectedMeal == item.title ? colors.SECONDARY + '30' : colors.CARD,
                            borderColor: selectedMeal == item.title ? colors.PRIMARY : colors.BORDER
                        }}>
                        <HugeiconsIcon icon={item.icon} color={selectedMeal == item.title ? colors.PRIMARY : colors.TEXT_SECONDARY} />
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: selectedMeal == item.title ? colors.PRIMARY : colors.TEXT
                        }}> {item.title}</Text>


                    </TouchableOpacity>
                )}
            />

            <View style={{
                marginTop: 15
            }}>
                <Button title={'+ Add to Meal Plan'} onPress={AddToMealPlan} />

                <TouchableOpacity
                    onPress={() => hideActionSheet()}
                    style={{
                        padding: 15
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 20,
                        color: colors.TEXT_SECONDARY
                    }}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
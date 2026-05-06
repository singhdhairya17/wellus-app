import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useContext, useState } from 'react'
import Colors from '../../constants/colors'
import Input from '../../components/common/shared/Input'
import {
    Dumbbell01Icon,
    FemaleSymbolFreeIcons,
    MaleSymbolIcon,
    PlusSignSquareIcon,
    WeightScaleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react-native'
import Button from '../../components/common/shared/Button'
import { useMutation, useQuery } from 'convex/react'
import { api } from './../../convex/_generated/api'
import { UserContext } from './../../context/UserContext'
import { useRouter } from 'expo-router'
import { CalculateNutritionGoalsManually } from '../../services/calculation/ManualCalculationService'
import {
    validateWeight,
    validateFeet,
    validateInches,
    validateGender,
    validateGoal,
    validateAge,
    validateActivityLevel,
} from '../../utils/validation'
import { sanitizeError } from '../../utils/security'
import { showError } from '../../utils/showAlert'
import { feetInchesToCm, ACTIVITY_LEVELS } from '../../utils/measurements'

const ACTIVITY_LABELS = {
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    active: 'Active',
    very_active: 'Athlete',
}
const ACTIVITY_DESCRIPTIONS = {
    sedentary: 'Mostly sitting, little planned exercise',
    light: 'Easy movement or light workouts 1–3×/week',
    moderate: 'Regular workouts or sports ~3–5×/week',
    active: 'Hard training most days',
    very_active: 'Heavy daily training or very physical job',
}

const GOAL_DESCRIPTIONS = {
    'Weight Loss': 'Moderate calorie deficit',
    'Muscle Gain': 'Small surplus + training focus',
    'Weight Gain': 'Steady surplus for gradual gain',
}

export default function Preferance() {
    const [weight, setWeight] = useState('')
    const [feet, setFeet] = useState('')
    const [inches, setInches] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState()
    const [goal, setGoal] = useState()
    const [activityLevel, setActivityLevel] = useState('moderate')
    const [loading, setLoading] = useState(false)

    const { user, setUser } = useContext(UserContext)
    const router = useRouter()
    const UpdateProfile = useMutation(api.Profiles.UpdateProfile)
    const CreateProfile = useMutation(api.Profiles.CreateProfile)
    const activeProfile = useQuery(
        api.Profiles.GetActiveProfile,
        user?._id ? { userId: user._id } : 'skip'
    )

    const OnContinue = async () => {
        if (!weight || !feet || !age || !gender) {
            showError('Missing fields', 'Add weight, height, age, and gender.')
            return
        }

        const weightValidation = validateWeight(weight)
        if (!weightValidation.valid) {
            showError('Invalid Weight', weightValidation.error)
            return
        }

        const feetValidation = validateFeet(feet)
        if (!feetValidation.valid) {
            showError('Invalid Height', feetValidation.error)
            return
        }

        const inchesValidation = validateInches(inches || 0)
        if (!inchesValidation.valid) {
            showError('Invalid Height', inchesValidation.error)
            return
        }

        const ageValidation = validateAge(age)
        if (!ageValidation.valid) {
            showError('Invalid Age', ageValidation.error)
            return
        }

        const genderValidation = validateGender(gender)
        if (!genderValidation.valid) {
            showError('Invalid Gender', genderValidation.error)
            return
        }

        const goalValidation = validateGoal(goal || 'Weight Loss')
        if (!goalValidation.valid) {
            showError('Invalid Goal', goalValidation.error)
            return
        }

        const activityValidation = validateActivityLevel(activityLevel)
        if (!activityValidation.valid) {
            showError('Invalid Activity Level', activityValidation.error)
            return
        }

        setLoading(true)

        const heightCm = Math.round(feetInchesToCm(feetValidation.value, inchesValidation.value) * 10) / 10
        const legacyHeight = `${feetValidation.value}.${String(inchesValidation.value).padStart(2, '0')}`

        const computed = CalculateNutritionGoalsManually(weightValidation.value, {
            heightCm,
            gender: genderValidation.value,
            goal: goalValidation.value,
            age: ageValidation.value,
            activityLevel: activityValidation.value,
        })

        try {
            if (activeProfile?._id) {
                await UpdateProfile({
                    profileId: activeProfile._id,
                    weight: String(weightValidation.value),
                    height: legacyHeight,
                    heightCm,
                    gender: genderValidation.value,
                    goal: goalValidation.value,
                    age: ageValidation.value,
                    activityLevel: activityValidation.value,
                    ...computed,
                })
                console.log('Active profile updated with new preferences')
            } else {
                await CreateProfile({
                    userId: user._id,
                    name: user.name || 'My Profile',
                    weight: String(weightValidation.value),
                    height: legacyHeight,
                    heightCm,
                    gender: genderValidation.value,
                    goal: goalValidation.value,
                    age: ageValidation.value,
                    activityLevel: activityValidation.value,
                    ...computed,
                })
                console.log('First profile created from preferences')
            }

            setUser((prev) => ({
                ...(prev || {}),
                weight: String(weightValidation.value),
                height: legacyHeight,
                heightCm,
                gender: genderValidation.value,
                goal: goalValidation.value,
                age: ageValidation.value,
                activityLevel: activityValidation.value,
                ...computed,
            }))
        } catch (error) {
            const safeError = sanitizeError(error, __DEV__)
            console.error('Error saving preferences:', __DEV__ ? error : safeError)
            showError('Error', safeError)
        }

        router.replace('/(tabs)/Home')
        setLoading(false)
    }

    return (
        <ScrollView
            contentContainerStyle={{
                padding: 20,
                paddingBottom: 60,
                backgroundColor: Colors.WHITE,
            }}
            style={{ backgroundColor: Colors.WHITE }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Your profile</Text>
            <Text style={styles.subtitle}>Sets your calorie and macro targets.</Text>

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Input placeholder="70" label="Weight (kg)" keyboardType="decimal-pad" onChangeText={setWeight} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input placeholder="28" label="Age" keyboardType="number-pad" onChangeText={setAge} />
                </View>
            </View>

            <Text style={styles.fieldLabel}>Height (ft / in)</Text>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Input placeholder="5" label="Ft" keyboardType="number-pad" onChangeText={setFeet} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input placeholder="10" label="In" keyboardType="number-pad" onChangeText={setInches} />
                </View>
            </View>

            <View style={{ marginTop: 20 }}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.row}>
                    <TouchableOpacity
                        onPress={() => setGender('Male')}
                        accessibilityRole="button"
                        accessibilityState={{ selected: gender === 'Male' }}
                        accessibilityLabel="Male"
                        style={[
                            styles.optionPill,
                            { borderColor: gender === 'Male' ? Colors.PRIMARY : Colors.GRAY },
                        ]}
                    >
                        <HugeiconsIcon icon={MaleSymbolIcon} size={36} color={Colors.BLUE} />
                        <Text style={styles.genderLabel}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setGender('Female')}
                        accessibilityRole="button"
                        accessibilityState={{ selected: gender === 'Female' }}
                        accessibilityLabel="Female"
                        style={[
                            styles.optionPill,
                            { borderColor: gender === 'Female' ? Colors.PRIMARY : Colors.GRAY },
                        ]}
                    >
                        <HugeiconsIcon icon={FemaleSymbolFreeIcons} size={36} color={Colors.PINK} />
                        <Text style={styles.genderLabel}>Female</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ marginTop: 18 }}>
                <Text style={styles.fieldLabel}>Activity</Text>
                {ACTIVITY_LEVELS.map((level) => {
                    const selected = activityLevel === level
                    return (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setActivityLevel(level)}
                            style={[
                                styles.activityRow,
                                { borderColor: selected ? Colors.PRIMARY : Colors.GRAY },
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.activityTitle}>{ACTIVITY_LABELS[level]}</Text>
                                <Text style={styles.activitySubtitle}>{ACTIVITY_DESCRIPTIONS[level]}</Text>
                            </View>
                            <View
                                style={[
                                    styles.radio,
                                    {
                                        borderColor: selected ? Colors.PRIMARY : Colors.GRAY,
                                        backgroundColor: selected ? Colors.PRIMARY : 'transparent',
                                    },
                                ]}
                            />
                        </TouchableOpacity>
                    )
                })}
            </View>

            <View style={{ marginTop: 18 }}>
                <Text style={styles.fieldLabel}>Goal</Text>
                <TouchableOpacity
                    onPress={() => setGoal('Weight Loss')}
                    style={[
                        styles.goalContainer,
                        { borderColor: goal === 'Weight Loss' ? Colors.PRIMARY : Colors.GRAY },
                    ]}
                >
                    <HugeiconsIcon icon={WeightScaleIcon} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.goalText}>Weight loss</Text>
                        <Text style={styles.goalSubtitle}>{GOAL_DESCRIPTIONS['Weight Loss']}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setGoal('Muscle Gain')}
                    style={[
                        styles.goalContainer,
                        { borderColor: goal === 'Muscle Gain' ? Colors.PRIMARY : Colors.GRAY },
                    ]}
                >
                    <HugeiconsIcon icon={Dumbbell01Icon} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.goalText}>Muscle gain</Text>
                        <Text style={styles.goalSubtitle}>{GOAL_DESCRIPTIONS['Muscle Gain']}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setGoal('Weight Gain')}
                    style={[
                        styles.goalContainer,
                        { borderColor: goal === 'Weight Gain' ? Colors.PRIMARY : Colors.GRAY },
                    ]}
                >
                    <HugeiconsIcon icon={PlusSignSquareIcon} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.goalText}>Weight gain</Text>
                        <Text style={styles.goalSubtitle}>{GOAL_DESCRIPTIONS['Weight Gain']}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{ marginTop: 25 }}>
                <Button title={loading ? 'Saving…' : 'Continue'} onPress={OnContinue} loading={loading} />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        fontSize: 30,
        fontWeight: 'bold',
        marginTop: 30,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        color: Colors.GRAY,
        marginBottom: 16,
    },
    genderLabel: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    fieldLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 6,
    },
    optionPill: {
        borderWidth: 1,
        padding: 15,
        borderRadius: 10,
        flex: 1,
        alignItems: 'center',
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 8,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    activitySubtitle: {
        fontSize: 12,
        lineHeight: 16,
        color: Colors.GRAY,
        marginTop: 4,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        marginLeft: 12,
    },
    goalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        padding: 15,
        borderWidth: 1,
        borderRadius: 15,
        marginTop: 10,
    },
    goalText: {
        fontSize: 18,
        fontWeight: '700',
    },
    goalSubtitle: {
        fontSize: 12,
        lineHeight: 16,
        color: Colors.GRAY,
        marginTop: 4,
    },
})

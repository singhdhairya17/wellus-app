import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import Colors from '../../constants/colors'
import Input from '../../components/common/shared/Input'
import { Dumbbell01Icon, FemaleSymbolFreeIcons, MaleSymbolIcon, PlusSignSquareIcon, WeightScaleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react-native'
import Button from '../../components/common/shared/Button'
import { useMutation, useQuery } from 'convex/react'
import { api } from './../../convex/_generated/api'
import { UserContext } from './../../context/UserContext'
import { useRouter } from 'expo-router'
import { CalculateCaloriesAI } from '../../services/ai/AiModel'
import { CalculateNutritionGoalsManually } from '../../services/calculation/ManualCalculationService'
import { validateWeight, validateHeight, validateGender, validateGoal } from '../../utils/validation'
import { sanitizeError } from '../../utils/security'
import { showError } from '../../utils/showAlert'
export default function Preferance() {
    const [weight, setWeight] = useState()
    const [height, setHeight] = useState()
    const [gender, setGender] = useState()
    const [goal, setGoal] = useState()
    const [loading, setLoading] = useState(false)
    const { user, setUser } = useContext(UserContext)
    const router = useRouter();
    const UpdateUserPref = useMutation(api.Users.UpdateUserPref)
    const CreateProfile = useMutation(api.Profiles.CreateProfile)
    const activeProfile = useQuery(api.Profiles.GetActiveProfile, user?._id ? { userId: user._id } : 'skip')
    console.log('[Preferance] Loaded user:', {
        _id: user?._id,
        email: user?.email,
        hasPicture: !!user?.picture,
    })
    
    const OnContinue = async () => {
        // SECURITY: Input validation
        if (!weight || !height || !gender) {
            showError('Fill All Details', 'Enter all details to continue');
            return;
        }

        // SECURITY: Validate all inputs
        const weightValidation = validateWeight(weight);
        if (!weightValidation.valid) {
            showError('Invalid Weight', weightValidation.error);
            return;
        }

        const heightValidation = validateHeight(height);
        if (!heightValidation.valid) {
            showError('Invalid Height', heightValidation.error);
            return;
        }

        const genderValidation = validateGender(gender);
        if (!genderValidation.valid) {
            showError('Invalid Gender', genderValidation.error);
            return;
        }

        const goalValidation = validateGoal(goal || 'Weight Loss');
        if (!goalValidation.valid) {
            showError('Invalid Goal', goalValidation.error);
            return;
        }

        setLoading(true);

        const data = {
            uid: user?._id,
            weight: String(weightValidation.value),
            height: heightValidation.value,
            gender: genderValidation.value,
            goal: goalValidation.value
        }
        
        // OPTIMIZATION: Use manual calculation FIRST (instant, no API delay)
        // This provides immediate response while AI can enhance in background
        console.log('⚡ Using instant manual calculation for low latency...');
        const JSONContent = CalculateNutritionGoalsManually(weightValidation.value, heightValidation.value, genderValidation.value, goalValidation.value);
        console.log('✅ Instant calculation complete:', JSONContent);

        // Create or update profile (for new users, create first profile)
        try {
            if (activeProfile) {
                // Update existing active profile
                await UpdateUserPref({
                    ...data,
                    ...JSONContent
                });
                console.log('✅ Profile updated');
            } else {
                // Create first profile for new user
                await CreateProfile({
                    userId: user._id,
                    name: user.name || 'My Profile',
                    weight: weight,
                    height: height,
                    gender: gender,
                    goal: data.goal,
                    ...JSONContent
                });
                console.log('✅ First profile created');
            }

            // Update user state immediately (optimistic update)
            const updatedUser = {
                ...user,
                ...data,
                ...JSONContent
            };
            setUser(updatedUser);
        } catch (error) {
            // SECURITY: Sanitize error messages
            const safeError = sanitizeError(error, __DEV__);
            console.error('❌ Error saving preferences:', __DEV__ ? error : safeError);
            showError('Error', safeError);
            // Don't block navigation - data is in state
        }

        // Navigate immediately (don't wait for anything)
        console.log('⚡ Navigating to Home immediately...');
        router.replace('/(tabs)/Home');
        setLoading(false);

        // OPTIONAL: Enhance with AI in background (non-blocking)
        // This runs after navigation, so user doesn't wait
        setTimeout(async () => {
            try {
                console.log('🔄 Background: Attempting AI enhancement...');
                const PROMPT = JSON.stringify(data);
                const AIResult = await CalculateCaloriesAI(PROMPT);
                const AIResp = AIResult.choices[0].message.content;
                const aiJSONContent = JSON.parse(AIResp.replace('```json', '').replace('```', ''));
                
                // Update with AI results if different (optional enhancement)
                if (aiJSONContent && Math.abs(aiJSONContent.calories - JSONContent.calories) > 50) {
                    console.log('✨ AI enhancement available, updating...');
                    await UpdateUserPref({
                        ...data,
                        ...aiJSONContent
                    });
                    setUser(prev => ({
                        ...prev,
                        ...aiJSONContent
                    }));
                }
            } catch (aiError) {
                // Silently fail - manual calculation is already saved
                console.log('ℹ️ AI enhancement unavailable (using manual calculation)');
            }
        }, 100); // Start after 100ms (navigation already happened)
    }

    return (
        <View style={{
            padding: 20,
            backgroundColor: Colors.WHITE,
            height: '100%'
        }}>
            <Text style={{
                textAlign: 'center',
                fontSize: 30,
                fontWeight: 'bold',
                marginTop: 30
            }}>Tell us about yourself</Text>
            <Text style={{
                fontSize: 16,
                textAlign: 'center',
                color: Colors.GRAY
            }}>This help us create your personalized meal plan</Text>

            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 10
                }}
            >
                <View style={{
                    flex: 1
                }}>
                    <Input placeholder={'e.g 70'} label='Weight (kg)'
                        onChangeText={setWeight}
                    />
                </View>
                <View style={{
                    flex: 1
                }}>
                    <Input placeholder={'e.g 5.10'} label='Height (ft)'
                        onChangeText={setHeight} />
                </View>

            </View>

            <View style={{
                marginTop: 20
            }}>
                <Text style={{
                    fontWeight: 'medium',
                    fontSize: 18
                }}>Gender</Text>

                <View style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 10
                }}>
                    <TouchableOpacity
                        onPress={() => setGender('Male')}
                        style={{
                            borderWidth: 1,
                            padding: 15,
                            borderColor: gender == 'Male' ? Colors.PRIMARY : Colors.GRAY,
                            borderRadius: 10,
                            flex: 1,
                            alignItems: 'center',

                        }}>
                        <HugeiconsIcon icon={MaleSymbolIcon} size={40}
                            color={Colors.BLUE}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setGender('Female')}
                        style={{
                            borderWidth: 1,
                            padding: 15,
                            borderColor: gender == 'Female' ? Colors.PRIMARY : Colors.GRAY,
                            borderRadius: 10,
                            flex: 1,
                            alignItems: 'center'
                        }}>
                        <HugeiconsIcon icon={FemaleSymbolFreeIcons} size={40}
                            color={Colors.PINK} />
                    </TouchableOpacity>
                </View>

            </View>

            <View style={{
                marginTop: 15
            }}>
                <Text style={{
                    fontWeight: 'medium',
                    fontSize: 18
                }}>What's Your Goal?</Text>
                <TouchableOpacity
                    onPress={() => setGoal('Weight Loss')}
                    style={[styles.goalContainer, {
                        borderColor: goal == 'Weight Loss' ? Colors.PRIMARY : Colors.GRAY
                    }]}>
                    <HugeiconsIcon icon={WeightScaleIcon} />
                    <View>
                        <Text style={styles.goalText}>Weight Loss</Text>
                        <Text>Reduce body fat & get leaner</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setGoal('Muscle Gain')}
                    style={[styles.goalContainer, {
                        borderColor: goal == 'Muscle Gain' ? Colors.PRIMARY : Colors.GRAY
                    }]}>
                    <HugeiconsIcon icon={Dumbbell01Icon} />
                    <View>
                        <Text style={styles.goalText}>Muscle Gain</Text>
                        <Text>Build Muscle & get Stronger</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.goalContainer, {
                    borderColor: goal == 'Weight Gain' ? Colors.PRIMARY : Colors.GRAY
                }]}
                    onPress={() => setGoal('Weight Gain')}
                >
                    <HugeiconsIcon icon={PlusSignSquareIcon} />
                    <View>
                        <Text style={styles.goalText}>Weight Gain</Text>
                        <Text>Increase healthy body mass</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={{
                marginTop: 25
            }}>
                <Button title={loading ? 'Setting up...' : 'Continue'} onPress={OnContinue} loading={loading} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    goalContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: Colors.GRAY,
        borderRadius: 15,
        marginTop: 10
    },
    goalText: {
        fontSize: 20,
        fontWeight: 'bold',

    },
    goalSubText: {
        color: Colors.GRAY
    }
})
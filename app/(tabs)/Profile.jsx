import { View, Text, Platform, Image, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, StyleSheet } from 'react-native'
import React, { useContext, useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { AnalyticsUpIcon, CookBookIcon, Login03Icon, ServingFoodIcon, WalletAdd02Icon, Edit01Icon, UserSquareIcon } from '@hugeicons/core-free-icons'
import { UserContext } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth } from './../../services/FirebaseConfig'
import { signOut } from 'firebase/auth'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Input from '../../components/common/shared/Input'
import Button from '../../components/common/shared/Button'
import { Dumbbell01Icon, FemaleSymbolFreeIcons, MaleSymbolIcon, PlusSignSquareIcon, WeightScaleIcon } from '@hugeicons/core-free-icons'
import { CalculateNutritionGoalsManually } from '../../services/calculation/ManualCalculationService'
import { LinearGradient } from 'expo-linear-gradient'
import ProfileManager from '../../components/profile/ProfileManager'
import ProfilePicturePicker from '../../components/common/ProfilePicturePicker'
import {
    validateWeight,
    validateFeet,
    validateInches,
    validateAge,
    validateGender,
    validateGoal,
    validateActivityLevel,
} from '../../utils/validation'
import { showError, showSuccess } from '../../utils/showAlert'
import {
    feetInchesToCm,
    cmToFeetInches,
    legacyHeightToCm,
    ACTIVITY_LEVELS,
} from '../../utils/measurements'

const ACTIVITY_LABELS = {
    sedentary: 'Sedentary',
    light: 'Lightly Active',
    moderate: 'Moderately Active',
    active: 'Very Active',
    very_active: 'Athlete',
}
const ACTIVITY_DESCRIPTIONS = {
    sedentary: 'Little or no exercise',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very_active: 'Very intense daily training',
}
const MenuOptions = [
    {
        title: 'Manage Profiles',
        icon: UserSquareIcon,
        path: 'profiles'
    },
    {
        title: 'Edit Profile',
        icon: Edit01Icon,
        path: 'edit'
    },
    {
        title: 'My Progress',
        icon: AnalyticsUpIcon,
        path: '/(tabs)/Progress'
    },
    {
        title: 'Recipes',
        icon: CookBookIcon,
        path: '/(tabs)/Meals'
    },
    {
        title: 'Billing',
        icon: WalletAdd02Icon,
        path: '/billing'
    },
    {
        title: 'Meal Reminders',
        icon: ServingFoodIcon,
        path: '/meal-reminders'
    },
    {
        title: 'Logout',
        icon: Login03Icon,
        path: 'logout'
    }


]
export default function Profile() {
    const insets = useSafeAreaInsets()
    const { user, setUser } = useContext(UserContext)
    const { colors, isDark, toggleTheme, theme } = useTheme()
    const router = useRouter();
    const [uploading, setUploading] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editing, setEditing] = useState(false)
    const [weight, setWeight] = useState('')
    const [feet, setFeet] = useState('')
    const [inches, setInches] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState('')
    const [goal, setGoal] = useState('')
    const [activityLevel, setActivityLevel] = useState('moderate')
    const [showProfileManager, setShowProfileManager] = useState(false)
    const [showPicturePicker, setShowPicturePicker] = useState(false)
    const UpdateUserPicture = useMutation(api.Users.UpdateUserPicture)
    const UpdateProfile = useMutation(api.Profiles.UpdateProfile)
    const CreateProfile = useMutation(api.Profiles.CreateProfile)
    const activeProfile = useQuery(
        api.Profiles.GetActiveProfile,
        user?._id ? { userId: user._id } : 'skip'
    )

    const pickImage = async () => {
        setShowPicturePicker(true)
    }

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera permission to take a photo')
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri)
        }
    }

    const selectFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need gallery permission to select a photo')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri)
        }
    }

    const uploadImage = async (uri) => {
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }

        setUploading(true)
        try {
            // Convert image to base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            })
            const base64Image = `data:image/jpeg;base64,${base64}`

            // Update user picture in database
            await UpdateUserPicture({
                uid: user._id,
                picture: base64Image
            })

            // Update user context
            setUser(prev => ({
                ...prev,
                picture: base64Image
            }))

            Alert.alert('Success!', 'Profile picture updated successfully')
        } catch (error) {
            console.error('Error uploading image:', error)
            Alert.alert('Error', 'Failed to update profile picture. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const getImageSource = React.useMemo(() => {
        if (user?.picture) {
            return { uri: user.picture }
        }
        return require('./../../assets/images/user.png')
    }, [user?.picture])
    
    // Pre-compute default image source for immediate rendering
    const defaultImageSource = require('./../../assets/images/user.png')

    // Load user data when opening edit modal
    useEffect(() => {
        if (!showEditModal || !user) return
        setWeight(user.weight ? String(user.weight) : '')
        // Prefer numeric heightCm, then legacy "X.YY" string
        let cm = Number.isFinite(user.heightCm) ? user.heightCm : null
        if (!cm && user.height) cm = legacyHeightToCm(user.height)
        if (cm) {
            const { feet: f, inches: i } = cmToFeetInches(cm)
            setFeet(String(f))
            setInches(String(i))
        } else {
            setFeet('')
            setInches('')
        }
        setAge(user.age != null ? String(user.age) : '')
        setGender(user.gender || '')
        setGoal(user.goal || '')
        setActivityLevel(user.activityLevel || 'moderate')
    }, [showEditModal, user])

    const handleSaveProfile = async () => {
        if (!weight || !feet || !age || !gender) {
            showError('Missing Fields', 'Please fill in all required fields')
            return
        }

        const weightValidation = validateWeight(weight)
        if (!weightValidation.valid) return showError('Invalid Weight', weightValidation.error)

        const feetValidation = validateFeet(feet)
        if (!feetValidation.valid) return showError('Invalid Height', feetValidation.error)

        const inchesValidation = validateInches(inches || 0)
        if (!inchesValidation.valid) return showError('Invalid Height', inchesValidation.error)

        const ageValidation = validateAge(age)
        if (!ageValidation.valid) return showError('Invalid Age', ageValidation.error)

        const genderValidation = validateGender(gender)
        if (!genderValidation.valid) return showError('Invalid Gender', genderValidation.error)

        const goalValidation = validateGoal(goal || user.goal || 'Weight Loss')
        if (!goalValidation.valid) return showError('Invalid Goal', goalValidation.error)

        const activityValidation = validateActivityLevel(activityLevel)
        if (!activityValidation.valid) return showError('Invalid Activity Level', activityValidation.error)

        setEditing(true)
        try {
            const heightCm = Math.round(feetInchesToCm(feetValidation.value, inchesValidation.value) * 10) / 10
            const legacyHeight = `${feetValidation.value}.${String(inchesValidation.value).padStart(2, '0')}`

            const computed = CalculateNutritionGoalsManually(weightValidation.value, {
                heightCm,
                gender: genderValidation.value,
                goal: goalValidation.value,
                age: ageValidation.value,
                activityLevel: activityValidation.value,
            })

            const profilePayload = {
                weight: String(weightValidation.value),
                height: legacyHeight,
                heightCm,
                gender: genderValidation.value,
                goal: goalValidation.value,
                age: ageValidation.value,
                activityLevel: activityValidation.value,
                ...computed,
            }

            if (activeProfile?._id) {
                await UpdateProfile({ profileId: activeProfile._id, ...profilePayload })
            } else {
                await CreateProfile({
                    userId: user._id,
                    name: user.name || 'My Profile',
                    ...profilePayload,
                })
            }

            setUser(prev => ({
                ...(prev || {}),
                ...profilePayload,
            }))

            showSuccess('Success!', 'Profile updated. Your nutrition goals have been recalculated.')
            setShowEditModal(false)
        } catch (error) {
            console.error('Update error:', error)
            showError('Error', error.message || 'Failed to update profile. Please try again.')
        } finally {
            setEditing(false)
        }
    }

    const OnMenuOptionClick = (menu) => {
        if (menu.path == 'logout') {
            (async () => {
                try {
                    await AsyncStorage.multiRemove(['rememberMe', 'rememberedEmail'])
                } catch {
                    /* non-fatal */
                }
                try {
                    await signOut(auth)
                } catch (e) {
                    console.error('[Profile] signOut:', e)
                }
                setUser(null)
                router.replace('/')
            })()
            return;
        }
        if (menu.path == 'profiles') {
            setShowProfileManager(true)
            return
        }
        if (menu.path == 'edit') {
            setShowEditModal(true)
            return
        }
        if (menu.path == '/billing') {
            router.push('/billing')
            return
        }
        if (menu.path == '/meal-reminders') {
            router.push('/meal-reminders')
            return
        }
        router.push(menu?.path)
    }
    // Calculate tab bar height for proper spacing
    // Tab bar is typically 60px + safe area bottom (iOS) or 60px (Android)
    const tabBarHeight = Platform.OS === 'ios' 
        ? 60 + Math.max(insets.bottom - 10, 0) 
        : 60;
    // Add extra padding to ensure buttons don't overlap (tab bar + 120px clearance for large buttons)
    const bottomPadding = tabBarHeight + 120;

    return (
        <ScrollView 
            style={{
                flex: 1,
                backgroundColor: colors.BACKGROUND,
            }}
            contentContainerStyle={{
                padding: 20,
                paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : Math.max(insets.top + 10, 20),
                paddingBottom: Platform.OS === 'ios' 
                    ? bottomPadding + Math.max(insets.bottom, 20) + 20
                    : bottomPadding + 20
            }}
            showsVerticalScrollIndicator={true}
        >
            {/* Premium Header */}
            <LinearGradient
                colors={[colors.PRIMARY + '15', colors.SECONDARY + '08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    padding: 20,
                    borderRadius: 20,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: colors.BORDER,
                    position: 'relative'
                }}
            >
                <View>
                    <Text style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: colors.TEXT,
                        letterSpacing: -0.5,
                        marginBottom: 4
                    }}>Profile</Text>
                    <Text style={{
                        fontSize: 15,
                        color: colors.TEXT_SECONDARY,
                        fontWeight: '500'
                    }}>Manage your account and preferences</Text>
                </View>
            </LinearGradient>

            <View style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 15
            }}>
                <TouchableOpacity
                    onPress={pickImage}
                    disabled={uploading}
                    activeOpacity={0.7}
                >
                    <View style={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        borderRadius: 99,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 3,
                        borderColor: colors.PRIMARY + '30',
                        backgroundColor: colors.CARD
                    }}>
                        {uploading ? (
                            <ActivityIndicator size="large" color={colors.PRIMARY} />
                        ) : (
                            <Image
                                source={getImageSource}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 99,
                                }}
                                defaultSource={defaultImageSource}
                                resizeMode="cover"
                            />
                        )}
                    </View>
                </TouchableOpacity>
                <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginTop: 5,
                    color: colors.TEXT
                }}>{user?.name || 'Loading...'}</Text>
                <Text style={{
                    fontSize: 16,
                    color: colors.TEXT_SECONDARY,
                    marginTop: 5
                }}>{user?.email || ''}</Text>

                {/* Display User Info */}
                <View style={styles.userInfoContainer}>
                    {(() => {
                        let displayHeight = 'Not set'
                        const cm = Number.isFinite(user?.heightCm)
                            ? user.heightCm
                            : (user?.height ? legacyHeightToCm(user.height) : null)
                        if (cm) {
                            const { feet: f, inches: i } = cmToFeetInches(cm)
                            displayHeight = `${f}' ${i}"`
                        }
                        return (
                            <>
                                <View style={[styles.infoRow, { backgroundColor: colors.CARD, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 12 }]}>
                                    <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>Weight:</Text>
                                    <Text style={[styles.infoValue, { color: colors.TEXT }]}>{user?.weight || 'Not set'} kg</Text>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.CARD, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 12 }]}>
                                    <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>Height:</Text>
                                    <Text style={[styles.infoValue, { color: colors.TEXT }]}>{displayHeight}</Text>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.CARD, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 12 }]}>
                                    <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>Age:</Text>
                                    <Text style={[styles.infoValue, { color: colors.TEXT }]}>{user?.age != null ? `${user.age} yrs` : 'Not set'}</Text>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.CARD, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 12 }]}>
                                    <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>Activity:</Text>
                                    <Text style={[styles.infoValue, { color: colors.TEXT }]}>{user?.activityLevel ? (ACTIVITY_LABELS[user.activityLevel] || user.activityLevel) : 'Not set'}</Text>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.CARD, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 12 }]}>
                                    <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>Gender:</Text>
                                    <Text style={[styles.infoValue, { color: colors.TEXT }]}>{user?.gender || 'Not set'}</Text>
                                </View>
                                <View style={[styles.infoRow, { backgroundColor: colors.CARD, borderWidth: 1, borderColor: colors.BORDER, borderRadius: 12 }]}>
                                    <Text style={[styles.infoLabel, { color: colors.TEXT_SECONDARY }]}>Goal:</Text>
                                    <Text style={[styles.infoValue, { color: colors.TEXT }]}>{user?.goal || 'Not set'}</Text>
                                </View>
                            </>
                        )
                    })()}
                </View>
            </View>

            {/* Menu Options - Converted from FlatList to map for better scrolling */}
            <View style={{
                marginTop: 20
            }}>
                {MenuOptions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => OnMenuOptionClick(item)}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 12,
                            alignItems: 'center',
                            padding: 16,
                            marginTop: 10,
                            borderRadius: 16,
                            backgroundColor: colors.CARD,
                            borderWidth: 1,
                            borderColor: colors.BORDER,
                            elevation: 1,
                            shadowColor: '#000',
                            shadowOpacity: colors.isDark ? 0.2 : 0.05,
                            shadowOffset: { width: 0, height: 1 },
                            shadowRadius: 2
                        }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: colors.PRIMARY + '15',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <HugeiconsIcon icon={item.icon} size={24} color={colors.PRIMARY} />
                        </View>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '500',
                            color: colors.TEXT,
                            flex: 1
                        }}>{item.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.BACKGROUND }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.BORDER }]}>
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.TEXT }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.formRow}>
                                <View style={{ flex: 1 }}>
                                    <Input
                                        placeholder={'e.g 70'}
                                        label='Weight (kg)'
                                        value={weight}
                                        onChangeText={setWeight}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Input
                                        placeholder={'e.g 28'}
                                        label='Age'
                                        value={age}
                                        onChangeText={setAge}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.sectionLabel, { color: colors.TEXT, marginTop: 16 }]}>Height</Text>
                            <View style={[styles.formRow, { marginTop: 10 }]}>
                                <View style={{ flex: 1 }}>
                                    <Input
                                        placeholder={'e.g 5'}
                                        label='Feet'
                                        value={feet}
                                        onChangeText={setFeet}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Input
                                        placeholder={'e.g 10'}
                                        label='Inches'
                                        value={inches}
                                        onChangeText={setInches}
                                    />
                                </View>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Gender</Text>
                                <View style={styles.genderRow}>
                                    <TouchableOpacity
                                        onPress={() => setGender('Male')}
                                        style={[
                                            styles.genderButton,
                                            { 
                                                borderColor: gender === 'Male' ? colors.PRIMARY : colors.BORDER,
                                                backgroundColor: gender === 'Male' ? colors.PRIMARY + '10' : 'transparent'
                                            }
                                        ]}
                                    >
                                        <HugeiconsIcon icon={MaleSymbolIcon} size={40} color={colors.BLUE} />
                                        <Text style={[styles.genderText, { color: colors.TEXT }]}>Male</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setGender('Female')}
                                        style={[
                                            styles.genderButton,
                                            { 
                                                borderColor: gender === 'Female' ? colors.PRIMARY : colors.BORDER,
                                                backgroundColor: gender === 'Female' ? colors.PRIMARY + '10' : 'transparent'
                                            }
                                        ]}
                                    >
                                        <HugeiconsIcon icon={FemaleSymbolFreeIcons} size={40} color={colors.PINK} />
                                        <Text style={[styles.genderText, { color: colors.TEXT }]}>Female</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Activity Level</Text>
                                {ACTIVITY_LEVELS.map((level) => {
                                    const selected = activityLevel === level
                                    return (
                                        <TouchableOpacity
                                            key={level}
                                            onPress={() => setActivityLevel(level)}
                                            style={[
                                                styles.goalButton,
                                                {
                                                    borderColor: selected ? colors.PRIMARY : colors.BORDER,
                                                    backgroundColor: selected ? colors.PRIMARY + '10' : 'transparent',
                                                },
                                            ]}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>{ACTIVITY_LABELS[level]}</Text>
                                                <Text style={[styles.goalButtonSubtext, { color: colors.TEXT_SECONDARY }]}>{ACTIVITY_DESCRIPTIONS[level]}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>{'What\'s Your Goal?'}</Text>
                                <TouchableOpacity
                                    onPress={() => setGoal('Weight Loss')}
                                    style={[
                                        styles.goalButton,
                                        { 
                                            borderColor: goal === 'Weight Loss' ? colors.PRIMARY : colors.BORDER,
                                            backgroundColor: goal === 'Weight Loss' ? colors.PRIMARY + '10' : 'transparent'
                                        }
                                    ]}
                                >
                                    <HugeiconsIcon icon={WeightScaleIcon} color={colors.PRIMARY} />
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>Weight Loss</Text>
                                        <Text style={[styles.goalButtonSubtext, { color: colors.TEXT_SECONDARY }]}>Reduce body fat & get leaner</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setGoal('Muscle Gain')}
                                    style={[
                                        styles.goalButton,
                                        { 
                                            borderColor: goal === 'Muscle Gain' ? colors.PRIMARY : colors.BORDER,
                                            backgroundColor: goal === 'Muscle Gain' ? colors.PRIMARY + '10' : 'transparent'
                                        }
                                    ]}
                                >
                                    <HugeiconsIcon icon={Dumbbell01Icon} color={colors.PRIMARY} />
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>Muscle Gain</Text>
                                        <Text style={[styles.goalButtonSubtext, { color: colors.TEXT_SECONDARY }]}>Build Muscle & get Stronger</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setGoal('Weight Gain')}
                                    style={[
                                        styles.goalButton,
                                        { 
                                            borderColor: goal === 'Weight Gain' ? colors.PRIMARY : colors.BORDER,
                                            backgroundColor: goal === 'Weight Gain' ? colors.PRIMARY + '10' : 'transparent'
                                        }
                                    ]}
                                >
                                    <HugeiconsIcon icon={PlusSignSquareIcon} color={colors.PRIMARY} />
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>Weight Gain</Text>
                                        <Text style={[styles.goalButtonSubtext, { color: colors.TEXT_SECONDARY }]}>Increase healthy body mass</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginTop: 25, marginBottom: 20 }}>
                                <Button
                                    title={editing ? 'Saving...' : 'Save Changes'}
                                    onPress={handleSaveProfile}
                                    loading={editing}
                                />
                                <View style={{ height: 10 }} />
                                <Button
                                    title="Cancel"
                                    onPress={() => setShowEditModal(false)}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Profile Manager Modal */}
            <ProfileManager 
                visible={showProfileManager} 
                onClose={() => setShowProfileManager(false)} 
            />
            
            {/* Profile Picture Picker Modal */}
            <ProfilePicturePicker
                visible={showPicturePicker}
                onClose={() => setShowPicturePicker(false)}
                onCameraPress={takePhoto}
                onGalleryPress={selectFromGallery}
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    userInfoContainer: {
        marginTop: 20,
        width: '100%',
        padding: 0,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    formRow: {
        flexDirection: 'row',
        gap: 10,
    },
    sectionLabel: {
        fontWeight: '600',
        fontSize: 18,
        marginBottom: 10,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    genderButton: {
        flex: 1,
        borderWidth: 2,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    genderText: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: '600',
    },
    goalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 2,
        borderRadius: 16,
        marginTop: 12,
    },
    goalButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    goalButtonSubtext: {
        fontSize: 14,
        marginTop: 2,
    },
})
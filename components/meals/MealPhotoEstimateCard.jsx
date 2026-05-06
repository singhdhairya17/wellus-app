import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    TextInput,
} from 'react-native'
import React, { useState, useContext } from 'react'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import Button from '../common/shared/Button'
import Input from '../common/shared/Input'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Camera01Icon, ImageAddIcon, ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import moment from 'moment'
import DateSelectionCard from '../ui/DateSelectionCard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { triggerHaptic } from '../../utils/haptics'
import { estimateMealFromPhoto } from '../../services/ai/AiModel'

const MEAL_TYPES = [
    { key: 'Breakfast', label: 'Breakfast' },
    { key: 'Lunch', label: 'Lunch' },
    { key: 'Dinner', label: 'Dinner' },
    { key: 'Snack', label: 'Snack' },
]

export default function MealPhotoEstimateCard() {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()
    const [showModal, setShowModal] = useState(false)
    const [imageUri, setImageUri] = useState(null)
    const [userHint, setUserHint] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [mealName, setMealName] = useState('')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')
    const [carbohydrates, setCarbohydrates] = useState('')
    const [fat, setFat] = useState('')
    const [sodium, setSodium] = useState('')
    const [sugar, setSugar] = useState('')
    const [assumptions, setAssumptions] = useState('')
    const [selectedMealType, setSelectedMealType] = useState('Lunch')
    const [selectedDate, setSelectedDate] = useState(moment().format('DD/MM/YYYY'))
    const [saving, setSaving] = useState(false)

    const { user } = useContext(UserContext)
    const { setRefreshData } = useContext(RefreshDataContext)
    const SaveScannedFood = useMutation(api.MealPlan.SaveScannedFood)

    const resetForm = () => {
        setImageUri(null)
        setUserHint('')
        setMealName('')
        setCalories('')
        setProtein('')
        setCarbohydrates('')
        setFat('')
        setSodium('')
        setSugar('')
        setAssumptions('')
        setSelectedMealType('Lunch')
        setSelectedDate(moment().format('DD/MM/YYYY'))
    }

    const handleClose = () => {
        setShowModal(false)
        resetForm()
    }

    const ensureLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photos to pick an image.')
            return false
        }
        return true
    }

    const ensureCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow camera to take a photo.')
            return false
        }
        return true
    }

    const pickPhoto = async (source) => {
        try {
            if (source === 'library') {
                if (!(await ensureLibraryPermission())) return
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    quality: 0.82,
                    base64: false,
                })
                if (!result.canceled && result.assets?.[0]?.uri) {
                    setImageUri(result.assets[0].uri)
                    triggerHaptic.light()
                }
            } else {
                if (!(await ensureCameraPermission())) return
                const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: false,
                    quality: 0.82,
                })
                if (!result.canceled && result.assets?.[0]?.uri) {
                    setImageUri(result.assets[0].uri)
                    triggerHaptic.light()
                }
            }
        } catch (e) {
            console.warn(e)
            Alert.alert('Error', 'Could not open camera or gallery.')
        }
    }

    const uriToBase64Payload = async (uri) => {
        const raw = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        })
        const isPng = /\.png(\?|$)/i.test(uri)
        const mime = isPng ? 'image/png' : 'image/jpeg'
        return { dataUrl: `data:${mime};base64,${raw}`, mime }
    }

    const handleAnalyze = async () => {
        if (!imageUri) {
            Alert.alert('Photo needed', 'Add a meal photo first.')
            return
        }
        if (!user?._id) {
            Alert.alert('Sign in required', 'Log in to continue.')
            return
        }

        triggerHaptic.medium()
        setAnalyzing(true)
        try {
            const { dataUrl, mime } = await uriToBase64Payload(imageUri)
            const result = await estimateMealFromPhoto({
                base64Image: dataUrl,
                mimeType: mime,
                userHint: userHint.trim() || undefined,
                uid: user._id,
            })

            const cals = Number(result?.calories) || 0
            const pro = Number(result?.protein) || 0
            const carbs = Number(result?.carbohydrates) || 0
            const fats = Number(result?.fat) || 0

            const empty = cals <= 0 && pro <= 0 && carbs <= 0 && fats <= 0

            if (empty) {
                Alert.alert(
                    'No estimate',
                    'Try a clearer top-down shot or a short note (e.g. dal chawal). You can edit values below.'
                )
            }

            const nameGuess = (result?.foodName || '').trim() || 'Meal (from photo)'
            setMealName(nameGuess)
            setCalories(String(Math.round(Math.max(cals, 0))))
            setProtein(String(Math.round((pro + Number.EPSILON) * 10) / 10))
            setCarbohydrates(String(Math.round((carbs + Number.EPSILON) * 10) / 10))
            setFat(String(Math.round((fats + Number.EPSILON) * 10) / 10))
            setSodium(String(Math.round(Math.max(Number(result?.sodium) || 0, 0))))
            setSugar(String(Math.round((Math.max(Number(result?.sugar) || 0, 0) + Number.EPSILON) * 10) / 10))

            const extra = []
            if (result?.foodDescription) extra.push(result.foodDescription.trim())
            if (result?.servingSize) extra.push(`Portion: ${result.servingSize}`)
            if (result?.assumptions) extra.push(result.assumptions.trim())
            setAssumptions(extra.filter(Boolean).join('\n'))

            triggerHaptic.success()
        } catch (e) {
            console.warn(e)
            const msg = e?.message || ''
            triggerHaptic.error()
            if (msg.includes('429') || msg.includes('rate')) {
                Alert.alert('Busy', 'Too many requests—try again shortly.')
            } else {
                Alert.alert('Failed', msg || 'Try again.')
            }
        } finally {
            setAnalyzing(false)
        }
    }

    const handleSave = async () => {
        if (!mealName.trim()) {
            triggerHaptic.error()
            Alert.alert('Name', 'Enter a meal name or re-run estimate.')
            return
        }

        const calNum = parseFloat(calories)
        if (!Number.isFinite(calNum) || calNum <= 0) {
            triggerHaptic.error()
            Alert.alert('Calories', 'Calories must be greater than 0.')
            return
        }

        if (!user?._id) {
            Alert.alert('Error', 'Log in first.')
            return
        }

        triggerHaptic.medium()
        setSaving(true)
        try {
            await SaveScannedFood({
                uid: user._id,
                date: selectedDate,
                mealType: selectedMealType,
                foodName: mealName.trim(),
                calories: calNum,
                protein: parseFloat(protein) || 0,
                carbohydrates: parseFloat(carbohydrates) || 0,
                fat: parseFloat(fat) || 0,
                sodium: parseFloat(sodium) || 0,
                sugar: parseFloat(sugar) || 0,
                servingSize: 'From photo estimate',
                servingsPerContainer: 1,
                imageUri: imageUri || undefined,
            })

            setRefreshData(Date.now())
            triggerHaptic.success()
            Alert.alert('Saved', 'Added to your day’s totals.')
            handleClose()
        } catch (err) {
            console.error(err)
            Alert.alert('Error', 'Save failed—try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <LinearGradient
                colors={[colors.PRIMARY, colors.BLUE]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    marginBottom: 20,
                    padding: 22,
                    borderRadius: 20,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOpacity: colors.isDark ? 0.35 : 0.18,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.WHITE + '22',
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        top: -36,
                        right: -28,
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: colors.WHITE + '12',
                    }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                    <View
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            backgroundColor: colors.WHITE + '25',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <HugeiconsIcon icon={Camera01Icon} color={colors.WHITE} size={26} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, paddingTop: 2 }}>
                        <Text
                            style={{
                                fontSize: 22,
                                fontWeight: '800',
                                color: colors.WHITE,
                                letterSpacing: -0.6,
                                marginBottom: 6,
                            }}
                        >
                            Meal photo estimate
                        </Text>
                        <Text
                            style={{
                                fontSize: 15,
                                color: colors.WHITE,
                                opacity: 0.95,
                                lineHeight: 22,
                                fontWeight: '500',
                            }}
                        >
                            For cooked or mixed meals—snap a photo, get a draft, adjust, then save.
                        </Text>
                        <Text
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                fontWeight: '600',
                                color: colors.WHITE,
                                opacity: 0.75,
                                letterSpacing: 0.2,
                            }}
                        >
                            Estimates only—not medical advice
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => {
                        triggerHaptic.medium()
                        setShowModal(true)
                    }}
                    style={{
                        paddingVertical: 15,
                        paddingHorizontal: 18,
                        backgroundColor: colors.WHITE,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        alignSelf: 'stretch',
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 6,
                        elevation: 3,
                    }}
                    activeOpacity={0.92}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.PRIMARY }}>
                        Estimate meal
                    </Text>
                    <HugeiconsIcon icon={ArrowRight02Icon} color={colors.PRIMARY} size={20} />
                </TouchableOpacity>
            </LinearGradient>

            <Modal visible={showModal} animationType="slide" transparent onRequestClose={handleClose}>
                <View style={[styles.overlay, {}]}>
                    <LinearGradient
                        colors={
                            colors.isDark ? [colors.CARD, colors.SURFACE] : ['#FFFFFF', '#f6fbfb']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.sheet,
                            {
                                paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 18) + 12 : 16,
                                borderColor: colors.BORDER,
                            },
                        ]}
                    >
                        <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
                            <View style={{ flex: 1, paddingRight: 12 }}>
                                <Text style={[styles.headerTitle, { color: colors.TEXT }]}>
                                    Photo estimate
                                </Text>
                                <Text style={{ fontSize: 14, color: colors.TEXT_SECONDARY, marginTop: 4, lineHeight: 20 }}>
                                    Photo → estimate → edit → save.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleClose} hitSlop={12} style={{ alignSelf: 'flex-start', paddingTop: 2 }}>
                                <Text style={[styles.close, { color: colors.TEXT_SECONDARY }]}>{'✕'}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 24 }}
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: '88%' }}
                        >
                            <View style={styles.rowButtons}>
                                <TouchableOpacity
                                    style={[styles.rowBtn, { borderColor: colors.BORDER }]}
                                    onPress={() => pickPhoto('camera')}
                                >
                                    <HugeiconsIcon icon={Camera01Icon} color={colors.PRIMARY} size={22} />
                                    <Text style={{ color: colors.TEXT, marginTop: 6, fontWeight: '600' }}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.rowBtn, { borderColor: colors.BORDER }]}
                                    onPress={() => pickPhoto('library')}
                                >
                                    <HugeiconsIcon icon={ImageAddIcon} color={colors.PRIMARY} size={22} />
                                    <Text style={{ color: colors.TEXT, marginTop: 6, fontWeight: '600' }}>Gallery</Text>
                                </TouchableOpacity>
                            </View>

                            {imageUri ? (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.preview}
                                    contentFit="cover"
                                />
                            ) : (
                                <Text style={{ color: colors.TEXT_SECONDARY, textAlign: 'center', marginVertical: 10 }}>
                                    No photo—use Camera or Gallery.
                                </Text>
                            )}

                            <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>
                                Optional hint
                            </Text>
                            <TextInput
                                placeholder="e.g. dal chawal, 2 roti"
                                placeholderTextColor={colors.TEXT_SECONDARY}
                                multiline
                                value={userHint}
                                onChangeText={setUserHint}
                                style={[
                                    styles.hintArea,
                                    {
                                        borderColor: colors.BORDER,
                                        color: colors.TEXT,
                                        backgroundColor: colors.CARD,
                                    },
                                ]}
                            />

                            <View style={{ marginTop: 8 }}>
                                <Button
                                    title={analyzing ? 'Working…' : 'Estimate'}
                                    onPress={handleAnalyze}
                                    loading={analyzing}
                                />
                            </View>

                            {assumptions ? (
                                <Text style={{ marginTop: 14, fontSize: 13, color: colors.TEXT_SECONDARY, lineHeight: 18 }}>
                                    {assumptions}
                                </Text>
                            ) : null}

                            <DateSelectionCard
                                onDateSelect={setSelectedDate}
                                selectedDate={selectedDate}
                                insideScrollView
                            />

                            <Text style={[styles.sectionLabel, { color: colors.TEXT, marginBottom: 8 }]}>Meal</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {MEAL_TYPES.map((mt) => {
                                    const on = selectedMealType === mt.key
                                    return (
                                        <TouchableOpacity
                                            key={mt.key}
                                            onPress={() => setSelectedMealType(mt.key)}
                                            style={{
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                                borderRadius: 20,
                                                borderWidth: on ? 2 : 1,
                                                borderColor: on ? colors.PRIMARY : colors.BORDER,
                                                backgroundColor: on ? colors.PRIMARY + '18' : colors.CARD,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: on ? colors.PRIMARY : colors.TEXT,
                                                    fontWeight: '600',
                                                }}
                                            >
                                                {mt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>

                            <Text style={[styles.sectionLabel, { color: colors.TEXT, marginTop: 16 }]}>Totals</Text>
                            <Input label="Name" value={mealName} onChangeText={setMealName} />
                            <Input label="Calories (kcal)" value={calories} onChangeText={setCalories} />
                            <Input label="Protein (g)" value={protein} onChangeText={setProtein} />
                            <Input label="Carbs (g)" value={carbohydrates} onChangeText={setCarbohydrates} />
                            <Input label="Fat (g)" value={fat} onChangeText={setFat} />
                            <Input label="Sodium (mg)" value={sodium} onChangeText={setSodium} />
                            <Input label="Sugar (g)" value={sugar} onChangeText={setSugar} />

                            <Button title={'Save'} onPress={handleSave} loading={saving} />
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.48)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '94%',
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    close: {
        fontSize: 22,
        fontWeight: '500',
    },
    rowButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        marginTop: 8,
    },
    rowBtn: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 220,
        borderRadius: 14,
        marginBottom: 12,
        backgroundColor: '#eee',
    },
    sectionLabel: {
        fontWeight: '700',
        fontSize: 16,
        marginTop: 6,
        marginBottom: 6,
    },
    hintArea: {
        borderWidth: 1,
        borderRadius: 12,
        minHeight: 72,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
    },
})

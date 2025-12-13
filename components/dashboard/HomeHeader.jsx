import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import React, { useContext, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { UserContext } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { logger } from '../../utils/logger'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import * as FileSystem from 'expo-file-system/legacy'
import ThemeSelector from '../common/ThemeSelector'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'
import ProfilePicturePicker from '../common/ProfilePicturePicker'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function HomeHeader() {
    const { user, setUser } = useContext(UserContext)
    const themeContext = useTheme()
    const { colors = {} } = themeContext || {}
    const [uploading, setUploading] = useState(false)
    const [showPicturePicker, setShowPicturePicker] = useState(false)
    const UpdateUserPicture = useMutation(api.Users.UpdateUserPicture)
    const imageScale = useSharedValue(1)
    
    // Safety check - don't render if theme context is unavailable
    if (!themeContext || !colors) {
        return null
    }

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: imageScale.value }],
    }))

    const handleImagePressIn = () => {
        imageScale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
        triggerHaptic.light()
    }

    const handleImagePressOut = () => {
        imageScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }

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
            logger.error('Error uploading image:', error)
            Alert.alert('Error', 'Failed to update profile picture. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const getImageSource = () => {
        if (user?.picture) {
            return { uri: user.picture }
        }
        return require('../../assets/images/user.png')
    }

    return (
        <View 
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                marginBottom: 12,
                paddingVertical: 8
            }}
        >
            <AnimatedTouchable
                onPress={pickImage}
                onPressIn={handleImagePressIn}
                onPressOut={handleImagePressOut}
                disabled={uploading}
                style={[
                    {
                        shadowColor: colors.PRIMARY,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 8
                    },
                    imageAnimatedStyle
                ]}
            >
                <View style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 3,
                    borderColor: colors.isDark ? colors.PRIMARY + '40' : colors.PRIMARY + '20',
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.isDark ? colors.SURFACE : colors.WHITE
                }}>
                    {uploading ? (
                        <ActivityIndicator size="small" color={colors.PRIMARY} />
                    ) : (
                        <Image
                            source={getImageSource()}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                            }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                        />
                    )}
                </View>
            </AnimatedTouchable>
            <View 
                style={{ flex: 1 }}
            >
                <Text style={{
                    fontSize: 15,
                    color: colors.TEXT_SECONDARY,
                    fontWeight: '500',
                    letterSpacing: 0.3,
                    marginBottom: 4
                }}>Hello, 👋</Text>
                <Text style={{
                    fontSize: 26,
                    fontWeight: '700',
                    color: colors.TEXT,
                    letterSpacing: -0.5
                }}>{user?.name || 'User'}</Text>
                <Text style={{
                    fontSize: 13,
                    color: colors.TEXT_SECONDARY,
                    marginTop: 2,
                    fontWeight: '400'
                }}>Ready to track your nutrition today</Text>
            </View>
            <View>
                <ThemeSelector />
            </View>
            
            <ProfilePicturePicker
                visible={showPicturePicker}
                onClose={() => setShowPicturePicker(false)}
                onCameraPress={takePhoto}
                onGalleryPress={selectFromGallery}
            />
        </View>
    )
}

export default React.memo(HomeHeader)
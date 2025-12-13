import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useCallback } from 'react'
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'expo-router';
import AddManualMeal from './AddManualMeal';
import { useTheme } from '../../context/ThemeContext';

function GenerateRecipeCard() {
    const router = useRouter()
    const { colors } = useTheme()
    
    const handleGeneratePress = useCallback(() => {
        router.push('/generate-ai-recipe')
    }, [router])
    
    return (
        <View>
            <LinearGradient
                colors={[colors.BLUE, colors.PRIMARY]}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{
                    marginTop: 0,
                    marginBottom: 20,
                    padding: 24,
                    borderRadius: 20,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOpacity: colors.isDark ? 0.4 : 0.2,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.PRIMARY + '30'
                }}>
                <Text style={{
                    fontSize: 26,
                    fontWeight: '800',
                    color: colors.WHITE,
                    marginBottom: 8,
                    letterSpacing: -0.5
                }}>Need Meal Ideas? ✨</Text>

                <Text style={{
                    color: colors.WHITE,
                    fontSize: 15,
                    opacity: 0.95,
                    marginBottom: 20,
                    lineHeight: 22,
                    fontWeight: '500'
                }}>Let Our AI generate personalized recipes just for you!</Text>

                <TouchableOpacity
                    onPress={handleGeneratePress}
                    style={{
                        padding: 16,
                        backgroundColor: colors.WHITE,
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        alignSelf: 'flex-start',
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4,
                        elevation: 3
                    }}>
                    <Text style={{
                        fontSize: 16,
                        color: colors.PRIMARY,
                        fontWeight: '700'
                    }}>Generate with AI</Text>
                    <HugeiconsIcon icon={ArrowRight02Icon} color={colors.PRIMARY} size={20} />
                </TouchableOpacity>
            </LinearGradient>

            {/* Manual Meal Entry Option */}
            <AddManualMeal />
        </View>
    )
}

export default React.memo(GenerateRecipeCard)
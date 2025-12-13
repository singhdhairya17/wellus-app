import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

export default function Input({ placeholder, password = false, onChangeText, label = '', value }) {
    const { colors } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    
    return (
        <View style={{
            marginTop: 15,
            width: '100%'
        }}>
            {label ? (
                <Text style={{
                    fontWeight: '600',
                    fontSize: 16,
                    color: colors.TEXT,
                    marginBottom: 8
                }}>{label}</Text>
            ) : null}
            <View style={{
                position: 'relative',
                width: '100%'
            }}>
                <TextInput 
                    placeholder={placeholder}
                    placeholderTextColor={colors.TEXT_SECONDARY}
                    secureTextEntry={password && !showPassword}
                    value={value}
                    onChangeText={(value) => onChangeText(value)}
                    style={{
                        padding: 15,
                        paddingRight: password ? 50 : 15,
                        borderWidth: 1,
                        borderColor: colors.BORDER,
                        borderRadius: 12,
                        fontSize: 16,
                        paddingVertical: 16,
                        width: '100%',
                        marginTop: 2,
                        backgroundColor: colors.CARD,
                        color: colors.TEXT,
                    }} 
                />
                {password && (
                    <View
                        style={{
                            position: 'absolute',
                            right: 15,
                            top: 2,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={{
                                padding: 8,
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={22}
                                color={colors.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    )
}
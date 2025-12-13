import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Color scheme definitions
const COLOR_SCHEMES = {
    purple: {
        name: 'Purple',
        light: { PRIMARY: '#8B5CF6', SECONDARY: '#A78BFA' },
        dark: { PRIMARY: '#A78BFA', SECONDARY: '#C4B5FD' }
    },
    blue: {
        name: 'Blue',
        light: { PRIMARY: '#3B82F6', SECONDARY: '#60A5FA' },
        dark: { PRIMARY: '#60A5FA', SECONDARY: '#93C5FD' }
    },
    green: {
        name: 'Green',
        light: { PRIMARY: '#10B981', SECONDARY: '#34D399' },
        dark: { PRIMARY: '#34D399', SECONDARY: '#6EE7B7' }
    },
    orange: {
        name: 'Orange',
        light: { PRIMARY: '#F97316', SECONDARY: '#FB923C' },
        dark: { PRIMARY: '#FB923C', SECONDARY: '#FDBA74' }
    },
    pink: {
        name: 'Pink',
        light: { PRIMARY: '#EC4899', SECONDARY: '#F472B6' },
        dark: { PRIMARY: '#F472B6', SECONDARY: '#F9A8D4' }
    },
    red: {
        name: 'Red',
        light: { PRIMARY: '#EF4444', SECONDARY: '#F87171' },
        dark: { PRIMARY: '#F87171', SECONDARY: '#FCA5A5' }
    },
    teal: {
        name: 'Teal',
        light: { PRIMARY: '#14B8A6', SECONDARY: '#2DD4BF' },
        dark: { PRIMARY: '#2DD4BF', SECONDARY: '#5EEAD4' }
    },
    indigo: {
        name: 'Indigo',
        light: { PRIMARY: '#6366F1', SECONDARY: '#818CF8' },
        dark: { PRIMARY: '#818CF8', SECONDARY: '#A5B4FC' }
    }
};

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState('light'); // 'light', 'dark', 'system'
    const [colorScheme, setColorScheme] = useState('teal'); // Color scheme key
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    useEffect(() => {
        if (theme === 'system') {
            setIsDark(systemColorScheme === 'dark');
        } else {
            setIsDark(theme === 'dark');
        }
    }, [theme, systemColorScheme]);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            const savedColorScheme = await AsyncStorage.getItem('colorScheme');
            if (savedTheme) {
                setTheme(savedTheme);
            }
            if (savedColorScheme) {
                setColorScheme(savedColorScheme);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleTheme = async (newTheme) => {
        try {
            setTheme(newTheme);
            await AsyncStorage.setItem('theme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const setColorSchemeTheme = async (scheme) => {
        try {
            setColorScheme(scheme);
            await AsyncStorage.setItem('colorScheme', scheme);
        } catch (error) {
            console.error('Error saving color scheme:', error);
        }
    };

    const selectedScheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.teal;
    const primaryColors = isDark ? selectedScheme.dark : selectedScheme.light;

    const colors = {
        ...primaryColors,
        // Base colors that adapt to light/dark
        BACKGROUND: isDark ? '#0F0F0F' : '#F5F5F5',
        SURFACE: isDark ? '#1A1A1A' : '#FFFFFF',
        CARD: isDark ? '#1F1F1F' : '#FFFFFF',
        TEXT: isDark ? '#FFFFFF' : '#1A1A1A',
        TEXT_SECONDARY: isDark ? '#B0B0B0' : '#666666',
        BORDER: isDark ? '#2A2A2A' : '#E5E5E5',
        // Fixed colors
        GRAY: '#808080',
        WHITE: '#FFFFFF',
        BLACK: '#000000',
        GREEN: '#10B981',
        RED: '#EF4444',
        YELLOW: '#F59E0B',
        BLUE: '#3B82F6',
        PINK: '#EC4899',
        ORANGE: '#F97316',
        isDark,
    };

    return (
        <ThemeContext.Provider value={{ 
            colors, 
            isDark, 
            theme, 
            toggleTheme, 
            colorScheme, 
            setColorScheme: setColorSchemeTheme,
            colorSchemes: COLOR_SCHEMES 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};


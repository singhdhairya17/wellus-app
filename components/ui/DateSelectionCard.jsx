import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import moment from 'moment';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring,
    FadeInDown
} from 'react-native-reanimated';
import { triggerHaptic } from '../../utils/haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Separate component for date item to use hooks properly
function DateItem({ item, index, isSelected, onPress, colors }) {
    const scale = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    };

    return (
        <View 
            style={{ flex: 1, margin: 5 }}
        >
            <AnimatedTouchable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    animatedStyle,
                    {
                        flex: 1,
                        borderRadius: 16,
                        overflow: 'hidden',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? colors.PRIMARY : colors.BORDER,
                        elevation: isSelected ? 3 : 1,
                        shadowColor: isSelected ? colors.PRIMARY : '#000',
                        shadowOpacity: isSelected ? 0.3 : 0.1,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4
                    }
                ]}
            >
                {isSelected ? (
                    <LinearGradient
                        colors={[colors.PRIMARY, colors.SECONDARY]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            padding: 12,
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.WHITE,
                            opacity: 0.9
                        }}>{index == 0 ? 'Today' : moment(item, 'DD/MM/YYYY').format('ddd')}</Text>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: '800',
                            color: colors.WHITE,
                            marginTop: 2
                        }}>{moment(item, 'DD/MM/YYYY').format('DD')}</Text>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.WHITE,
                            opacity: 0.9
                        }}>{moment(item, 'DD/MM/YYYY').format('MMM')}</Text>
                    </LinearGradient>
                ) : (
                    <View style={{
                        padding: 12,
                        alignItems: 'center',
                        backgroundColor: colors.CARD
                    }}>
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.TEXT_SECONDARY
                        }}>{index == 0 ? 'Today' : moment(item, 'DD/MM/YYYY').format('ddd')}</Text>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: '800',
                            color: colors.TEXT,
                            marginTop: 2
                        }}>{moment(item, 'DD/MM/YYYY').format('DD')}</Text>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.TEXT_SECONDARY
                        }}>{moment(item, 'DD/MM/YYYY').format('MMM')}</Text>
                    </View>
                )}
            </AnimatedTouchable>
        </View>
    );
}

export default function DateSelectionCard({ setSelctedDate, onDateSelect, selectedDate, insideScrollView = false }) {
    const { colors } = useTheme();
    
    // Initialize dates synchronously to avoid delay
    const initialDateList = useMemo(() => {
        const result = [];
        for (let i = 0; i < 4; i++) {
            const nextDate = moment().add(i, 'days').format('DD/MM/YYYY')
            result.push(nextDate);
        }
        return result;
    }, []);
    
    const [dateList, setDateList] = useState(initialDateList);
    const [selectedDate_, setSelectedDate_] = useState(selectedDate || moment().format('DD/MM/YYYY'));
    
    useEffect(() => {
        if (selectedDate) {
            setSelectedDate_(selectedDate);
        }
    }, [selectedDate])

    const handleDateSelect = (item) => {
        triggerHaptic.selection()
        setSelectedDate_(item);
        if (setSelctedDate) {
            setSelctedDate(item); // For backward compatibility
        }
        if (onDateSelect) {
            onDateSelect(item); // New prop
        }
    }

    const renderDateItem = ({ item, index }) => {
        const isSelected = selectedDate_ == item;
        return (
            <DateItem
                item={item}
                index={index}
                isSelected={isSelected}
                onPress={() => handleDateSelect(item)}
                colors={colors}
            />
        );
    }

    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={{
                fontSize: 20,
                fontWeight: '700',
                marginTop: 0,
                marginBottom: 12,
                color: colors.TEXT,
                letterSpacing: -0.3
            }}>Select Date</Text>
            {insideScrollView ? (
                // Use View with map when inside ScrollView to avoid nested VirtualizedList
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {dateList.map((item, index) => (
                        <DateItem
                            key={item}
                            item={item}
                            index={index}
                            isSelected={selectedDate_ == item}
                            onPress={() => handleDateSelect(item)}
                            colors={colors}
                        />
                    ))}
                </View>
            ) : (
                // Use FlatList when not inside ScrollView
                <FlatList
                    data={dateList}
                    numColumns={4}
                    scrollEnabled={false}
                    renderItem={renderDateItem}
                    keyExtractor={(item) => item}
                />
            )}
        </View>
    )
}
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Image } from 'expo-image'
import React, { useContext, useState, useMemo, useCallback } from 'react'
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01FreeIcons, Fire02Icon, Delete01Icon, HeartAdd01Icon } from '@hugeicons/core-free-icons';
import { Link } from 'expo-router';
import { UserContext } from '../../context/UserContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { RefreshDataContext } from '../../context/RefreshDataContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

function RecipeCard({ recipe }) {
    const { colors } = useTheme();
    const { user } = useContext(UserContext);
    const { setRefreshData } = useContext(RefreshDataContext);
    const [deleting, setDeleting] = useState(false);
    const DeleteRecipe = useMutation(api.Recipes.DeleteRecipe);
    const ToggleFavorite = useMutation(api.Recipes.ToggleFavoriteRecipe);
    
    const isFavorite = useQuery(
        api.Recipes.IsRecipeFavorite,
        user?._id && recipe?._id 
            ? { uid: user._id, recipeId: recipe._id } 
            : 'skip'
    ) || false;

    // Memoize recipe data to prevent unnecessary re-renders
    const recipeJson = useMemo(() => recipe?.jsonData, [recipe?.jsonData]);
    const recipeName = useMemo(() => recipe?.recipeName, [recipe?.recipeName]);
    const imageUrl = useMemo(() => recipe?.imageUrl, [recipe?.imageUrl]);
    const showDeleteButton = useMemo(() => user?._id === recipe?.uid, [user?._id, recipe?.uid]);

    const handleDelete = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user?._id) {
            Alert.alert('Error', 'Please login first');
            return;
        }

        Alert.alert(
            'Delete Recipe',
            `Are you sure you want to delete "${recipe?.recipeName}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await DeleteRecipe({
                                recipeId: recipe._id,
                                uid: user._id
                            });
                            setRefreshData(Date.now());
                            Alert.alert('Success', 'Recipe deleted successfully');
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', error.message || 'Failed to delete recipe');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    }, [user?._id, recipe?._id, recipe?.recipeName, DeleteRecipe, setRefreshData]);

    const handleToggleFavorite = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user?._id) {
            Alert.alert('Error', 'Please login first');
            return;
        }

        try {
            await ToggleFavorite({
                uid: user._id,
                recipeId: recipe._id
            });
            setRefreshData(Date.now());
        } catch (error) {
            console.error('Favorite error:', error);
            Alert.alert('Error', 'Failed to update favorite');
        }
    }, [user?._id, recipe?._id, ToggleFavorite, setRefreshData]);

    return (
        <View style={{
            flex: 1,
            margin: 5,
            position: 'relative'
        }}>
            <Link href={'/recipe-detail?recipeId=' + recipe?._id}
                style={{
                    flex: 1
                }}>
                <View>
                    <Image 
                        source={{ uri: imageUrl }}
                        style={{
                            width: '100%',
                            height: 100,
                            borderTopLeftRadius: 15,
                            borderTopRightRadius: 15
                        }}
                        contentFit="cover"
                        transition={200}
                        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                        cachePolicy="memory-disk"
                        priority="normal"
                        recyclingKey={recipe?._id}
                    />
                    <LinearGradient
                        colors={[colors.CARD, colors.SURFACE]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            padding: 14,
                            borderBottomLeftRadius: 16,
                            borderBottomRightRadius: 16,
                            borderWidth: 1,
                            borderTopWidth: 0,
                            borderColor: colors.BORDER
                        }}
                    >
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '700',
                            color: colors.TEXT,
                            marginBottom: 8
                        }} numberOfLines={2}>{recipeName}</Text>

                        <View style={[styles.infoContainer, { gap: 15, marginTop: 4 }]}>
                            <View style={styles.infoContainer}>
                                <HugeiconsIcon icon={Fire02Icon} color={colors.RED} size={18} />
                                <Text style={{
                                    fontSize: 13,
                                    color: colors.TEXT_SECONDARY,
                                    fontWeight: '600'
                                }}>{recipeJson?.calories} kCal</Text>
                            </View>
                            <View style={styles.infoContainer}>
                                <HugeiconsIcon icon={Clock01FreeIcons} color={colors.BLUE} size={18} />
                                <Text style={{
                                    fontSize: 13,
                                    color: colors.TEXT_SECONDARY,
                                    fontWeight: '600'
                                }}>{recipeJson?.cookTime} Min</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </Link>
            
            {/* Favorite Button */}
            {user?._id && (
                <TouchableOpacity
                    onPress={handleToggleFavorite}
                    activeOpacity={0.7}
                    style={[styles.favoriteButton, {
                        backgroundColor: isFavorite ? colors.RED + 'DD' : colors.CARD + 'DD',
                        borderWidth: 1,
                        borderColor: isFavorite ? colors.RED : colors.BORDER
                    }]}
                >
                    <Text style={{ fontSize: 18, color: isFavorite ? colors.WHITE : colors.TEXT }}>
                        {isFavorite ? '❤️' : '🤍'}
                    </Text>
                </TouchableOpacity>
            )}
            
            {/* Delete Button */}
            {showDeleteButton && (
                <LinearGradient
                    colors={[colors.RED, colors.RED + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.deleteButton}
                >
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={deleting}
                        activeOpacity={0.7}
                        style={{
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <HugeiconsIcon 
                            icon={Delete01Icon} 
                            color={colors.WHITE} 
                            size={18} 
                        />
                    </TouchableOpacity>
                </LinearGradient>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    infoContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center'
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6
    }
})

// Memoize component to prevent unnecessary re-renders
export default React.memo(RecipeCard, (prevProps, nextProps) => {
    // Only re-render if recipe data actually changed
    return prevProps.recipe?._id === nextProps.recipe?._id &&
           prevProps.recipe?.recipeName === nextProps.recipe?.recipeName &&
           prevProps.recipe?.imageUrl === nextProps.recipe?.imageUrl &&
           JSON.stringify(prevProps.recipe?.jsonData) === JSON.stringify(nextProps.recipe?.jsonData);
})  
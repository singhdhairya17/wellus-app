import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UserContext } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { logger } from '../../utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { UserSquareIcon, Delete01Icon, Add01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import Input from '../common/shared/Input';
import Button from '../common/shared/Button';
import { CalculateNutritionGoalsManually } from '../../services/calculation/ManualCalculationService';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function ProfileManager({ visible, onClose }) {
    const { user, setUser } = useContext(UserContext);
    const { colors } = useTheme();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [profileName, setProfileName] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState('');
    const [goal, setGoal] = useState('');
    const [loading, setLoading] = useState(false);

    const profiles = useQuery(api.Profiles.GetUserProfiles, user?._id ? { userId: user._id } : 'skip');
    const activeProfile = useQuery(api.Profiles.GetActiveProfile, user?._id ? { userId: user._id } : 'skip');
    
    const createProfile = useMutation(api.Profiles.CreateProfile);
    const updateProfile = useMutation(api.Profiles.UpdateProfile);
    const switchProfile = useMutation(api.Profiles.SwitchProfile);
    const deleteProfile = useMutation(api.Profiles.DeleteProfile);

    // Update user context when active profile changes
    useEffect(() => {
        if (activeProfile && user) {
            // Merge active profile data into user context for backward compatibility
            setUser(prev => ({
                ...prev,
                ...activeProfile,
                _id: user._id, // Keep user ID
                email: user.email, // Keep email
                name: activeProfile.name || user.name, // Use profile name or fallback
                credits: user.credits // Keep credits
            }));
        }
    }, [activeProfile]);

    const handleCreateProfile = async () => {
        if (!profileName || !weight || !height || !gender) {
            Alert.alert('Missing Fields', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Calculate nutrition goals
            const JSONContent = CalculateNutritionGoalsManually(weight, height, gender, goal || 'Weight Loss');

            await createProfile({
                userId: user._id,
                name: profileName,
                weight: weight,
                height: height,
                gender: gender,
                goal: goal || 'Weight Loss',
                ...JSONContent
            });

            Alert.alert('Success!', 'Profile created successfully');
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            logger.error('Error creating profile:', error);
            Alert.alert('Error', 'Failed to create profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchProfile = async (profileId) => {
        try {
            await switchProfile({
                userId: user._id,
                profileId: profileId
            });
            Alert.alert('Success!', 'Profile switched successfully');
        } catch (error) {
            logger.error('Error switching profile:', error);
            Alert.alert('Error', 'Failed to switch profile. Please try again.');
        }
    };

    const handleDeleteProfile = async (profileId, profileName) => {
        Alert.alert(
            'Delete Profile',
            `Are you sure you want to delete "${profileName}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProfile({
                                profileId: profileId,
                                userId: user._id
                            });
                            Alert.alert('Success!', 'Profile deleted successfully');
                        } catch (error) {
                            logger.error('Error deleting profile:', error);
                            Alert.alert('Error', 'Failed to delete profile. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleEditProfile = (profile) => {
        setEditingProfile(profile);
        setProfileName(profile.name);
        setWeight(profile.weight || '');
        setHeight(profile.height || '');
        setGender(profile.gender || '');
        setGoal(profile.goal || '');
        setShowCreateModal(true);
    };

    const handleUpdateProfile = async () => {
        if (!profileName || !weight || !height || !gender) {
            Alert.alert('Missing Fields', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Recalculate nutrition goals
            const JSONContent = CalculateNutritionGoalsManually(weight, height, gender, goal || 'Weight Loss');

            await updateProfile({
                profileId: editingProfile._id,
                name: profileName,
                weight: weight,
                height: height,
                gender: gender,
                goal: goal || 'Weight Loss',
                ...JSONContent
            });

            Alert.alert('Success!', 'Profile updated successfully');
            setShowCreateModal(false);
            setEditingProfile(null);
            resetForm();
        } catch (error) {
            logger.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setProfileName('');
        setWeight('');
        setHeight('');
        setGender('');
        setGoal('');
    };

    const getImageSource = (profile) => {
        if (profile?.picture) {
            return { uri: profile.picture };
        }
        return require('../../assets/images/user.png');
    };

    if (!visible) return null;

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.BACKGROUND }]}>
                        {/* Premium Header with Gradient */}
                        <LinearGradient
                            colors={colors.isDark 
                                ? [colors.PRIMARY + '25', colors.SECONDARY + '15', 'transparent']
                                : [colors.PRIMARY + '18', colors.SECONDARY + '10', 'transparent']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.modalHeaderGradient, { borderBottomColor: colors.BORDER }]}
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitleContainer}>
                                    <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Manage Profiles</Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.TEXT_SECONDARY }]}>
                                        {profiles?.length || 0} {profiles?.length === 1 ? 'Profile' : 'Profiles'}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                    style={[styles.closeButtonContainer, { 
                                        backgroundColor: colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 3,
                                        elevation: 2,
                                    }]}
                                >
                                    <Text style={[styles.closeButton, { color: colors.TEXT }]}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Premium Add Profile Button */}
                            <Animated.View entering={FadeInDown.delay(100).springify()}>
                                <TouchableOpacity
                                    onPress={() => {
                                        resetForm();
                                        setEditingProfile(null);
                                        setShowCreateModal(true);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={colors.isDark
                                            ? [colors.PRIMARY, colors.PRIMARY + 'DD', colors.PRIMARY + 'BB']
                                            : [colors.PRIMARY, colors.PRIMARY + 'EE', colors.PRIMARY + 'DD']
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[styles.addButton, { 
                                            borderColor: colors.PRIMARY,
                                            shadowColor: colors.PRIMARY,
                                        }]}
                                    >
                                        <View style={[styles.addButtonIconContainer, { 
                                            backgroundColor: colors.WHITE + '25',
                                            shadowColor: colors.PRIMARY,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 4,
                                            elevation: 4,
                                        }]}>
                                            <HugeiconsIcon icon={Add01Icon} size={26} color={colors.WHITE} />
                                        </View>
                                        <Text style={[styles.addButtonText, { color: colors.WHITE }]}>Add New Profile</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Profiles List */}
                            {profiles && profiles.length > 0 ? (
                                profiles.map((profile, index) => (
                                    <Animated.View
                                        key={profile._id}
                                        entering={FadeInDown.delay(150 + index * 100).springify()}
                                        style={[
                                            styles.profileCard,
                                            {
                                                backgroundColor: colors.CARD,
                                                borderColor: profile.isActive ? colors.PRIMARY : colors.BORDER,
                                                borderWidth: profile.isActive ? 2.5 : 1,
                                                shadowColor: profile.isActive ? colors.PRIMARY : '#000',
                                                shadowOffset: { width: 0, height: profile.isActive ? 6 : 2 },
                                                shadowOpacity: colors.isDark ? (profile.isActive ? 0.4 : 0.1) : (profile.isActive ? 0.2 : 0.05),
                                                shadowRadius: profile.isActive ? 12 : 4,
                                                elevation: profile.isActive ? 8 : 2,
                                            }
                                        ]}
                                    >
                                        {profile.isActive && (
                                            <LinearGradient
                                                colors={[colors.PRIMARY + '15', 'transparent']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.profileCardGradient}
                                            />
                                        )}
                                        <View style={styles.profileHeader}>
                                            <View style={[styles.profileImageContainer, { 
                                                borderColor: profile.isActive ? colors.PRIMARY : colors.BORDER,
                                                borderWidth: profile.isActive ? 2 : 1,
                                                shadowColor: profile.isActive ? colors.PRIMARY : '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: colors.isDark ? 0.3 : 0.1,
                                                shadowRadius: 4,
                                                elevation: 3,
                                            }]}>
                                                <Image
                                                    source={getImageSource(profile)}
                                                    style={styles.profileImage}
                                                    contentFit="cover"
                                                    transition={200}
                                                    cachePolicy="memory-disk"
                                                />
                                            </View>
                                            <View style={styles.profileInfo}>
                                                <View style={styles.profileNameRow}>
                                                    <Text style={[styles.profileName, { color: colors.TEXT }]}>
                                                        {profile.name}
                                                    </Text>
                                                    {profile.isActive && (
                                                        <LinearGradient
                                                            colors={[colors.PRIMARY, colors.SECONDARY]}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0 }}
                                                            style={styles.activeBadge}
                                                        >
                                                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color={colors.WHITE} />
                                                            <Text style={styles.activeText}>Active</Text>
                                                        </LinearGradient>
                                                    )}
                                                </View>
                                                <View style={[styles.profileDetailsContainer, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                                                    <Text style={[styles.profileDetails, { color: colors.TEXT_SECONDARY }]}>
                                                        {profile.gender || 'N/A'} • {profile.goal || 'N/A'}
                                                    </Text>
                                                    <Text style={[styles.profileDetails, { color: colors.TEXT_SECONDARY }]}>
                                                        {profile.weight || 'N/A'} kg • {profile.height || 'N/A'} ft
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.profileActions}>
                                            {!profile.isActive && (
                                                <TouchableOpacity
                                                    onPress={() => handleSwitchProfile(profile._id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <LinearGradient
                                                        colors={[colors.PRIMARY + '25', colors.PRIMARY + '15']}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 0 }}
                                                        style={styles.actionButton}
                                                    >
                                                        <Text style={[styles.actionButtonText, { color: colors.PRIMARY }]}>Switch</Text>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                onPress={() => handleEditProfile(profile)}
                                                activeOpacity={0.7}
                                            >
                                                <LinearGradient
                                                    colors={[colors.BLUE + '25', colors.BLUE + '15']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.actionButton}
                                                >
                                                    <Text style={[styles.actionButtonText, { color: colors.BLUE }]}>Edit</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                            {profiles.length > 1 && (
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteProfile(profile._id, profile.name)}
                                                    activeOpacity={0.7}
                                                    style={[styles.deleteButton, { backgroundColor: colors.RED + '20', borderColor: colors.RED + '40' }]}
                                                >
                                                    <HugeiconsIcon icon={Delete01Icon} size={18} color={colors.RED} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </Animated.View>
                                ))
                            ) : (
                                <Animated.View 
                                    entering={FadeIn.delay(200).springify()}
                                    style={[styles.emptyState, { 
                                        backgroundColor: colors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', 
                                        borderRadius: 24, 
                                        borderWidth: 2, 
                                        borderColor: colors.BORDER,
                                        borderStyle: 'dashed',
                                    }]}
                                >
                                    <LinearGradient
                                        colors={colors.isDark
                                            ? [colors.PRIMARY + '20', colors.PRIMARY + '10', 'transparent']
                                            : [colors.PRIMARY + '15', colors.PRIMARY + '08', 'transparent']
                                        }
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.emptyStateGradient}
                                    />
                                    <View style={[styles.emptyStateIconContainer, { 
                                        backgroundColor: colors.PRIMARY + '15',
                                        shadowColor: colors.PRIMARY,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 8,
                                        elevation: 6,
                                    }]}>
                                        <LinearGradient
                                            colors={[colors.PRIMARY + '30', colors.PRIMARY + '20']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.emptyStateIconGradient}
                                        >
                                            <HugeiconsIcon icon={UserSquareIcon} size={56} color={colors.PRIMARY} />
                                        </LinearGradient>
                                    </View>
                                    <Text style={[styles.emptyStateTitle, { color: colors.TEXT }]}>
                                        No Profiles Yet
                                    </Text>
                                    <Text style={[styles.emptyStateText, { color: colors.TEXT_SECONDARY }]}>
                                        Create your first profile to get started with personalized nutrition tracking!
                                    </Text>
                                </Animated.View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Create/Edit Profile Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowCreateModal(false);
                    setEditingProfile(null);
                    resetForm();
                }}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.BACKGROUND, maxHeight: '90%' }]}>
                        {/* Premium Header with Gradient */}
                        <LinearGradient
                            colors={colors.isDark 
                                ? [colors.PRIMARY + '20', colors.SECONDARY + '10', 'transparent']
                                : [colors.PRIMARY + '15', colors.SECONDARY + '08', 'transparent']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.modalHeaderGradient, { borderBottomColor: colors.BORDER }]}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.TEXT }]}>
                                    {editingProfile ? 'Edit Profile' : 'Create Profile'}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                        setShowCreateModal(false);
                                        setEditingProfile(null);
                                        resetForm();
                                    }}
                                    style={[styles.closeButtonContainer, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                >
                                    <Text style={[styles.closeButton, { color: colors.TEXT }]}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <Input
                                placeholder="Profile Name (e.g., John, Mom, Dad)"
                                label="Profile Name"
                                value={profileName}
                                onChangeText={setProfileName}
                            />

                            <View style={styles.formRow}>
                                <View style={{ flex: 1 }}>
                                    <Input
                                        placeholder="e.g 70"
                                        label="Weight (kg)"
                                        value={weight}
                                        onChangeText={setWeight}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Input
                                        placeholder="e.g 5.10"
                                        label="Height (ft)"
                                        value={height}
                                        onChangeText={setHeight}
                                    />
                                </View>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Gender</Text>
                                <View style={styles.genderRow}>
                                    <TouchableOpacity
                                        onPress={() => setGender('Male')}
                                        activeOpacity={0.7}
                                    >
                                        {gender === 'Male' ? (
                                            <LinearGradient
                                                colors={[colors.PRIMARY, colors.SECONDARY]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[styles.genderButton, { borderColor: colors.PRIMARY, borderWidth: 2 }]}
                                            >
                                                <Text style={[styles.genderText, { color: colors.WHITE }]}>Male</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={[styles.genderButton, { 
                                                borderColor: colors.BORDER, 
                                                backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                borderWidth: 1
                                            }]}>
                                                <Text style={[styles.genderText, { color: colors.TEXT }]}>Male</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setGender('Female')}
                                        activeOpacity={0.7}
                                    >
                                        {gender === 'Female' ? (
                                            <LinearGradient
                                                colors={[colors.PRIMARY, colors.SECONDARY]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[styles.genderButton, { borderColor: colors.PRIMARY, borderWidth: 2 }]}
                                            >
                                                <Text style={[styles.genderText, { color: colors.WHITE }]}>Female</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={[styles.genderButton, { 
                                                borderColor: colors.BORDER, 
                                                backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                borderWidth: 1
                                            }]}>
                                                <Text style={[styles.genderText, { color: colors.TEXT }]}>Female</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ marginTop: 20 }}>
                                <Text style={[styles.sectionLabel, { color: colors.TEXT }]}>Goal</Text>
                                <TouchableOpacity
                                    onPress={() => setGoal('Weight Loss')}
                                    activeOpacity={0.7}
                                >
                                    {goal === 'Weight Loss' ? (
                                        <LinearGradient
                                            colors={[colors.PRIMARY, colors.SECONDARY]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.goalButton, { borderColor: colors.PRIMARY, borderWidth: 2 }]}
                                        >
                                            <Text style={[styles.goalButtonText, { color: colors.WHITE }]}>Weight Loss</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={[styles.goalButton, { 
                                            borderColor: colors.BORDER, 
                                            backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
                                            borderWidth: 1
                                        }]}>
                                            <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>Weight Loss</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setGoal('Muscle Gain')}
                                    activeOpacity={0.7}
                                >
                                    {goal === 'Muscle Gain' ? (
                                        <LinearGradient
                                            colors={[colors.PRIMARY, colors.SECONDARY]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.goalButton, { borderColor: colors.PRIMARY, borderWidth: 2 }]}
                                        >
                                            <Text style={[styles.goalButtonText, { color: colors.WHITE }]}>Muscle Gain</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={[styles.goalButton, { 
                                            borderColor: colors.BORDER, 
                                            backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
                                            borderWidth: 1
                                        }]}>
                                            <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>Muscle Gain</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setGoal('Weight Gain')}
                                    activeOpacity={0.7}
                                >
                                    {goal === 'Weight Gain' ? (
                                        <LinearGradient
                                            colors={[colors.PRIMARY, colors.SECONDARY]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.goalButton, { borderColor: colors.PRIMARY, borderWidth: 2 }]}
                                        >
                                            <Text style={[styles.goalButtonText, { color: colors.WHITE }]}>Weight Gain</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={[styles.goalButton, { 
                                            borderColor: colors.BORDER, 
                                            backgroundColor: colors.isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
                                            borderWidth: 1
                                        }]}>
                                            <Text style={[styles.goalButtonText, { color: colors.TEXT }]}>Weight Gain</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginTop: 25, marginBottom: 20 }}>
                                <Button
                                    title={loading ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
                                    onPress={editingProfile ? handleUpdateProfile : handleCreateProfile}
                                    loading={loading}
                                />
                                <View style={{ height: 10 }} />
                                <Button
                                    title="Cancel"
                                    onPress={() => {
                                        setShowCreateModal(false);
                                        setEditingProfile(null);
                                        resetForm();
                                    }}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    modalHeaderGradient: {
        borderBottomWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 22,
    },
    modalTitleContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.6,
        marginBottom: 2,
    },
    modalSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    closeButtonContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        fontSize: 22,
        fontWeight: '700',
    },
    modalBody: {
        padding: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 18,
        borderWidth: 0,
        marginBottom: 24,
        gap: 14,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 19,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    profileCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 18,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    profileCardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 18,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileImageContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        marginRight: 18,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    profileImage: {
        width: 76,
        height: 76,
        borderRadius: 38,
    },
    profileInfo: {
        flex: 1,
    },
    profileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    activeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    profileDetailsContainer: {
        padding: 12,
        borderRadius: 14,
        marginTop: 10,
    },
    profileDetails: {
        fontSize: 14,
        marginTop: 4,
        lineHeight: 21,
        fontWeight: '500',
    },
    profileActions: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 3,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    deleteButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 3,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        marginTop: 20,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    emptyStateGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 24,
    },
    emptyStateIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    emptyStateIconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    emptyStateText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 30,
        fontWeight: '500',
    },
    formRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
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
        fontSize: 16,
        fontWeight: '600',
    },
    goalButton: {
        padding: 16,
        borderWidth: 2,
        borderRadius: 16,
        marginTop: 12,
    },
    goalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});


/**
 * ProfileScreen.js
 * Enhanced UI with modern design patterns
 */
import React, { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from "react-native-vector-icons/Ionicons";
import FeatherIcon from "react-native-vector-icons/Feather";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUserProfile } from '../services/userapi';
import { getUserProperties } from '../services/propertyService';
import CustomAlert from '../components/CustomAlert';

// Real API integration for profile data

// --- Color Scheme (matching HomeScreen) ---
const COLORS = {
    primary: "#FDB022",
    primaryLight: "#FDC55E",
    primaryDark: "#E5A01F",
    background: "#F8FAFC",
    white: "#FFFFFF",
    black: "#0F172A",
    greyText: "#64748B",
    greyLight: "#F1F5F9",
    redAccent: "#EF4444",
    cardBackground: "#FFFFFF",
    headerGradient: ["#FDB022", "#FDC55E"],
    accent: "#06B6D4",
    success: "#10B981",
    warning: "#F59E0B",
    purple: "#8B5CF6",
    pink: "#EC4899",
    orange: "#FDB022",
};

const ProfileScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [logoutAlert, setLogoutAlert] = useState({ visible: false });
    const [email, setEmail] = useState('');
    const [shortlistedCount, setShortlistedCount] = useState(0);
    const [myListingsCount, setMyListingsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());

    const loadProfileData = useCallback(async () => {
        setLoading(true);
        setError('');
        
        try {
            // Load user profile from API
            const response = await getCurrentUserProfile();
            
            if (response.success && response.user) {
                const userData = response.user;
                setName(userData.fullName || 'User');
                setEmail(userData.email || 'user@example.com');
                setAvatar(userData.profilePicture || null);
                
                // Fetch user's properties count
                const propertiesResponse = await getUserProperties();
                if (propertiesResponse.success && propertiesResponse.data) {
                    setMyListingsCount(propertiesResponse.data.length);
                } else {
                    setMyListingsCount(0);
                }
                
                setShortlistedCount(0); // Keep as 0 for now
                
            } else {
                // Fallback to stored data if API fails
                throw new Error(response.message || 'Failed to load profile');
            }
            
            setAvatarVersion(Date.now());
            
        } catch (err) {
            console.error("Profile loading failed:", err);
            setError('Could not load profile. Please try again.');
            
            // Fallback to stored data
            try {
                const storedUser = await AsyncStorage.getItem('userData');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    setName(user.fullName || user.name || 'User');
                    setEmail(user.email || '');
                    setAvatar(user.profilePicture || null);
                }
            } catch (fallbackErr) {
                console.error('Fallback profile loading failed:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Dummy profile - no server polling needed

    useFocusEffect(
        useCallback(() => {
            loadProfileData();
            return () => {};
        }, [loadProfileData])
    );

    const getInitials = (fullName) => {
        if (!fullName || fullName === 'N/A') return 'SS';
        const parts = fullName.split(' ').filter(p => p.length > 0);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        return '';
    };

    const initials = getInitials(name);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </SafeAreaView>
        );
    }
    
    if (error) {
        return (
            <SafeAreaView style={[styles.container, styles.centerContent]}>
                <View style={styles.errorIconContainer}>
                    <Icon name="alert-circle" size={60} color={COLORS.redAccent} />
                </View>
                <Text style={styles.errorTextTitle}>Unable to Load Profile</Text>
                <Text style={styles.errorTextDetail}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
                    <Icon name="refresh" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* Modern Header with Gradient */}
            <View style={styles.headerSection}>
                <View style={styles.headerBar}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity style={styles.headerButton}>
                        <Icon name="settings-outline" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <TouchableOpacity 
                        style={styles.avatarContainer} 
                        onPress={() => navigation.navigate('EditProfileScreen')}
                        activeOpacity={0.8}
                    >
                        {avatar ? (
                            (() => {
                                let uri = avatar;
                                try {
                                    const low = (avatar || '').toLowerCase();
                                    if (low.startsWith('http://') || low.startsWith('https://')) {
                                        const sep = avatar.includes('?') ? '&' : '?';
                                        uri = avatar + sep + 'v=' + avatarVersion;
                                    }
                                } catch (e) {
                                    uri = avatar;
                                }

                                return (
                                    <Image
                                        source={{ uri }}
                                        style={styles.avatarImage}
                                        onError={() => setAvatar(null)}
                                        resizeMode="cover"
                                    />
                                );
                            })()
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.cameraButton}>
                            <FeatherIcon name="edit-3" size={12} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                    
                    <Text style={styles.userName}>{name}</Text>
                    <Text style={styles.userEmail}>{email}</Text>
                    
                    <View style={styles.badgeContainer}>
                        <View style={styles.verifiedBadge}>
                            <Icon name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={styles.badgeText}>Verified</Text>
                        </View>
                    </View>
                </View>
            </View>
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: COLORS.purple + '10' }]}
                            onPress={() => navigation.navigate('MyPropertyScreen')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.purple + '20' }]}>
                                <Icon name="home" size={24} color={COLORS.purple} />
                            </View>
                            <Text style={styles.actionTitle}>My Properties</Text>
                            <Text style={styles.actionCount}>{myListingsCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: COLORS.pink + '10' }]}
                            onPress={() => navigation.navigate('Shortlisted')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.pink + '20' }]}>
                                <Icon name="heart" size={24} color={COLORS.pink} />
                            </View>
                            <Text style={styles.actionTitle}>Favorites</Text>
                            <Text style={styles.actionCount}>{shortlistedCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: COLORS.orange + '10' }]}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.orange + '20' }]}>
                                <Icon name="notifications" size={24} color={COLORS.orange} />
                            </View>
                            <Text style={styles.actionTitle}>Notifications</Text>
                            <Text style={styles.actionCount}>New</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: COLORS.accent + '10' }]}
                            onPress={() => navigation.navigate('PayRentScreen')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.accent + '20' }]}>
                                <Icon name="card" size={24} color={COLORS.accent} />
                            </View>
                            <Text style={styles.actionTitle}>Pay Rent</Text>
                            <Text style={styles.actionCount}>Quick</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Premium Features Card */}
                <TouchableOpacity 
                    style={styles.premiumCard} 
                    onPress={() => console.log('Go Premium')}
                    activeOpacity={0.9}
                >
                    <View style={styles.premiumHeader}>
                        <View style={styles.premiumIconWrapper}>
                            <FontAwesomeIcon name="crown" size={20} color={COLORS.warning} />
                        </View>
                        <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                    </View>
                    <Text style={styles.premiumDescription}>
                        Unlock exclusive features, priority support, and advanced analytics
                    </Text>
                    <View style={styles.premiumFeatures}>
                        <View style={styles.featureItem}>
                            <Icon name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={styles.featureText}>Priority Support</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Icon name="checkmark-circle" size={16} color={COLORS.success} />
                            <Text style={styles.featureText}>Advanced Analytics</Text>
                        </View>
                    </View>
                    <View style={styles.premiumButton}>
                        <Text style={styles.premiumButtonText}>Try Free for 7 Days</Text>
                        <Icon name="arrow-forward" size={16} color={COLORS.white} />
                    </View>
                </TouchableOpacity>

                {/* Settings Menu */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings & Support</Text>
                    <View style={styles.menuCard}>
                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('EditProfileScreen')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                <Icon name="person-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>Edit Profile</Text>
                            <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('PrivacySecurity')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Icon name="shield-checkmark-outline" size={20} color={COLORS.success} />
                            </View>
                            <Text style={styles.menuText}>Privacy & Security</Text>
                            <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('Help')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: COLORS.accent + '20' }]}>
                                <Icon name="help-circle-outline" size={20} color={COLORS.accent} />
                            </View>
                            <Text style={styles.menuText}>Help & Support</Text>
                            <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('ContactUs')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: COLORS.orange + '20' }]}>
                                <Icon name="call-outline" size={20} color={COLORS.orange} />
                            </View>
                            <Text style={styles.menuText}>Contact Us</Text>
                            <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('About')}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: COLORS.purple + '20' }]}>
                                <Icon name="information-circle-outline" size={20} color={COLORS.purple} />
                            </View>
                            <Text style={styles.menuText}>About Kirayedar24</Text>
                            <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={() => setLogoutAlert({
                        visible: true,
                        title: 'Logout',
                        message: 'Are you sure you want to logout?',
                        icon: 'log-out-outline',
                        iconColor: '#EF4444',
                        buttons: [
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => setLogoutAlert({ visible: false })
                            },
                            {
                                text: 'Logout',
                                onPress: async () => {
                                    await AsyncStorage.multiRemove(['authToken', 'userId', 'userData', 'userRole']);
                                    setLogoutAlert({ visible: false });
                                    navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
                                }
                            }
                        ]
                    })}
                    activeOpacity={0.8}
                >
                    <Icon name="log-out-outline" size={20} color={COLORS.redAccent} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
                
                <CustomAlert
                    visible={logoutAlert.visible}
                    title={logoutAlert.title}
                    message={logoutAlert.message}
                    icon={logoutAlert.icon}
                    iconColor={logoutAlert.iconColor}
                    buttons={logoutAlert.buttons}
                    onClose={() => setLogoutAlert({ visible: false })}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Modern Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // Header Section
    headerSection: {
        backgroundColor: COLORS.primary,
        paddingBottom: 30,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.white,
    },

    // Profile Card
    profileCard: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.white,
    },
    avatarImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: COLORS.white,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.white,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: COLORS.accent,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 12,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
        marginLeft: 4,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -20,
        marginBottom: 30,
        paddingHorizontal: 5,
    },
    statItem: {
        flex: 1,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        marginHorizontal: 5,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.black,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.greyText,
    },

    // Section
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },

    // Action Grid
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
        textAlign: 'center',
    },
    actionCount: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.greyText,
    },

    // Premium Card
    premiumCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        borderWidth: 2,
        borderColor: COLORS.warning + '30',
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    premiumIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    premiumTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
    },
    premiumDescription: {
        fontSize: 14,
        color: COLORS.greyText,
        lineHeight: 20,
        marginBottom: 16,
    },
    premiumFeatures: {
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: COLORS.greyText,
        marginLeft: 8,
        fontWeight: '500',
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    premiumButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginRight: 8,
    },

    // Menu Card
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.black,
    },

    // Logout Button
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.redAccent + '20',
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.redAccent,
        marginLeft: 8,
    },

    // Loading & Error States
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.greyText,
        fontWeight: '500',
    },
    errorIconContainer: {
        marginBottom: 16,
    },
    errorTextTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 8,
    },
    errorTextDetail: {
        fontSize: 14,
        color: COLORS.greyText,
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ProfileScreen;

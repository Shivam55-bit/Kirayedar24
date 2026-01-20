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
    Clipboard,
    ToastAndroid,
} from 'react-native';
import Icon from "react-native-vector-icons/Ionicons";
import FeatherIcon from "react-native-vector-icons/Feather";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUserProfile } from '../services/userapi';
import { getUserProperties } from '../services/propertyService';
import CustomAlert from '../components/CustomAlert';
import { useSubscription } from '../context/SubscriptionContext';
import { getNotificationCount } from '../utils/notificationManager';
import { propertyService } from '../services/propertyapi';

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
    const [userRole, setUserRole] = useState('');
    const [email, setEmail] = useState('');
    const [shortlistedCount, setShortlistedCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [myListingsCount, setMyListingsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarVersion, setAvatarVersion] = useState(Date.now());
    const [fcmToken, setFcmToken] = useState('');
    
    // Subscription context
    const { activeSubscription, userHasPackage, loadActiveSubscription } = useSubscription();

    const loadProfileData = useCallback(async () => {
        setLoading(true);
        setError('');
        
        try {
            // Load user profile from API
            const response = await getCurrentUserProfile();
            
            // Load subscription data
            await loadActiveSubscription();
            
            if (response.success && response.user) {
                const userData = response.user;
                setName(userData.fullName || 'User');
                setEmail(userData.email || 'user@example.com');
                setAvatar(userData.profilePicture || null);
                setUserRole(userData.role || userData.userType || '');
                
                // Fetch user's properties count
                const propertiesResponse = await getUserProperties();
                if (propertiesResponse.success && propertiesResponse.data) {
                    setMyListingsCount(propertiesResponse.data.length);
                } else {
                    setMyListingsCount(0);
                }
                
                // Fetch shortlisted/favorites count
                try {
                    const savedResponse = await propertyService.getSavedProperties();
                    console.log('[ProfileScreen] savedResponse:', savedResponse);
                    let savedData = [];
                    
                    // Handle different response structures (same as SavedScreen)
                    if (savedResponse && savedResponse.savedProperties && Array.isArray(savedResponse.savedProperties)) {
                        savedData = savedResponse.savedProperties;
                    } else if (savedResponse && Array.isArray(savedResponse.data)) {
                        savedData = savedResponse.data;
                    } else if (Array.isArray(savedResponse)) {
                        savedData = savedResponse;
                    }
                    
                    // Filter out null entries
                    savedData = savedData.filter(Boolean);
                    setShortlistedCount(savedData.length);
                } catch (e) {
                    console.error('[ProfileScreen] Error fetching saved properties:', e);
                    setShortlistedCount(0);
                }
                
                // Fetch notification count
                try {
                    const notifCount = await getNotificationCount();
                    setNotificationCount(notifCount || 0);
                } catch (e) {
                    setNotificationCount(0);
                }
                
                // Fetch FCM token for testing
                try {
                    const storedFcmToken = await AsyncStorage.getItem('current_fcm_token');
                    if (storedFcmToken) {
                        setFcmToken(storedFcmToken);
                    } else {
                        setFcmToken('No FCM Token Found');
                    }
                } catch (e) {
                    console.error('[ProfileScreen] Error fetching FCM token:', e);
                    setFcmToken('Error loading token');
                }
                
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
    }, [loadActiveSubscription]);

    // Helper function to calculate days remaining
    const getDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const now = new Date();
        const diff = end - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    // Helper function to calculate subscription progress (% of time used)
    const getSubscriptionProgress = (subscription) => {
        if (!subscription?.startDate || !subscription?.endDate) return 0;
        const start = new Date(subscription.startDate);
        const end = new Date(subscription.endDate);
        const now = new Date();
        const totalDuration = end - start;
        const elapsed = now - start;
        const progress = (elapsed / totalDuration) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

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
            
            {/* Beautiful Header Design */}
            <View style={styles.headerSection}>
                {/* Top Bar */}
                <View style={styles.headerTopBar}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerPageTitle}>My Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileCardInner}>
                        {/* Avatar */}
                        <TouchableOpacity 
                            style={styles.avatarWrapper} 
                            onPress={() => navigation.navigate('EditProfileScreen')}
                            activeOpacity={0.9}
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
                                            style={styles.avatarImg}
                                            onError={() => setAvatar(null)}
                                            resizeMode="cover"
                                        />
                                    );
                                })()
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitials}>{initials}</Text>
                                </View>
                            )}
                            <View style={styles.editIconBadge}>
                                <FeatherIcon name="camera" size={12} color={COLORS.white} />
                            </View>
                        </TouchableOpacity>

                        {/* User Info */}
                        <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
                        
                        {/* Edit Button */}
                        <TouchableOpacity 
                            style={styles.editProfileButton}
                            onPress={() => navigation.navigate('EditProfileScreen')}
                        >
                            <FeatherIcon name="edit-2" size={14} color={COLORS.primary} />
                            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
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
                            style={[styles.actionCard, { backgroundColor: COLORS.pink + '10' }]}
                            onPress={() => navigation.navigate('Saved')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.pink + '20' }]}>
                                <Icon name="heart" size={24} color={COLORS.pink} />
                            </View>
                            <Text style={styles.actionTitle}>Favorites</Text>
                            <Text style={styles.actionCount}>{String(shortlistedCount)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: COLORS.orange + '10' }]}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: COLORS.orange + '20' }]}>
                                <Icon name="notifications" size={24} color={COLORS.orange} />
                            </View>
                            <Text style={styles.actionTitle}>Notifications</Text>
                            <Text style={styles.actionCount}>{notificationCount}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Subscription Status Card - Only for Tenants */}
                {userRole !== 'owner' && userRole !== 'Owner' && userHasPackage && activeSubscription ? (
                    <View style={styles.subscriptionActiveCard}>
                        <View style={styles.subscriptionHeader}>
                            <View style={styles.subscriptionIconWrapper}>
                                <FontAwesomeIcon name="crown" size={20} color={COLORS.warning} />
                            </View>
                            <View style={styles.subscriptionTitleWrapper}>
                                <Text style={styles.subscriptionPlanName}>
                                    {activeSubscription.package?.name || activeSubscription.packageName || 'Premium Plan'}
                                </Text>
                                <View style={styles.activeStatusBadge}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.activeStatusText}>Active</Text>
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.subscriptionDetails}>
                            <View style={styles.subscriptionDetailRow}>
                                <Icon name="calendar-outline" size={18} color={COLORS.greyText} />
                                <Text style={styles.subscriptionDetailLabel}>Started:</Text>
                                <Text style={styles.subscriptionDetailValue}>
                                    {activeSubscription.startDate 
                                        ? new Date(activeSubscription.startDate).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                          })
                                        : 'N/A'}
                                </Text>
                            </View>
                            
                            <View style={styles.subscriptionDetailRow}>
                                <Icon name="time-outline" size={18} color={COLORS.greyText} />
                                <Text style={styles.subscriptionDetailLabel}>Expires:</Text>
                                <Text style={[styles.subscriptionDetailValue, { color: COLORS.redAccent }]}>
                                    {activeSubscription.endDate 
                                        ? new Date(activeSubscription.endDate).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                          })
                                        : 'N/A'}
                                </Text>
                            </View>
                            
                            <View style={styles.subscriptionDetailRow}>
                                <Icon name="hourglass-outline" size={18} color={COLORS.greyText} />
                                <Text style={styles.subscriptionDetailLabel}>Days Left:</Text>
                                <Text style={[styles.subscriptionDetailValue, { 
                                    color: getDaysRemaining(activeSubscription.endDate) <= 7 ? COLORS.redAccent : COLORS.success 
                                }]}>
                                    {getDaysRemaining(activeSubscription.endDate)} days
                                </Text>
                            </View>
                            
                            {activeSubscription.package?.contactLimit && (
                                <View style={styles.subscriptionDetailRow}>
                                    <Icon name="call-outline" size={18} color={COLORS.greyText} />
                                    <Text style={styles.subscriptionDetailLabel}>Contacts:</Text>
                                    <Text style={styles.subscriptionDetailValue}>
                                        {activeSubscription.contactsUsed || 0} / {activeSubscription.package.contactLimit}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.subscriptionProgress}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { 
                                    width: `${getSubscriptionProgress(activeSubscription)}%`,
                                    backgroundColor: getSubscriptionProgress(activeSubscription) > 80 ? COLORS.redAccent : COLORS.success
                                }]} />
                            </View>
                            <Text style={styles.progressText}>
                                {getSubscriptionProgress(activeSubscription).toFixed(0)}% used
                            </Text>
                        </View>
                    </View>
                ) : userRole !== 'owner' && userRole !== 'Owner' ? (
                    /* Premium Features Card - Show when no active subscription (only for tenants) */
                    <TouchableOpacity 
                        style={styles.premiumCard} 
                        onPress={() => navigation.navigate('SubscriptionPlans')}
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
                ) : null}

                {/* FCM Token Test Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>FCM Token (Test)</Text>
                    <View style={styles.fcmCard}>
                        <View style={styles.fcmHeader}>
                            <View style={[styles.menuIcon, { backgroundColor: COLORS.success + '20' }]}>
                                <Icon name="notifications-outline" size={20} color={COLORS.success} />
                            </View>
                            <Text style={styles.fcmLabel}>Current FCM Token</Text>
                        </View>
                        <Text 
                            style={styles.fcmTokenText}
                            numberOfLines={3}
                            ellipsizeMode="middle"
                        >
                            {fcmToken || 'Loading...'}
                        </Text>
                        <TouchableOpacity 
                            style={styles.copyButton}
                            onPress={() => {
                                if (fcmToken && fcmToken !== 'No FCM Token Found' && fcmToken !== 'Error loading token') {
                                    Clipboard.setString(fcmToken);
                                    if (Platform.OS === 'android') {
                                        ToastAndroid.show('FCM Token copied!', ToastAndroid.SHORT);
                                    }
                                }
                            }}
                        >
                            <Icon name="copy-outline" size={18} color={COLORS.white} />
                            <Text style={styles.copyButtonText}>Copy Token</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
                            onPress={() => navigation.navigate('PropertyInquiryFormScreen')}
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
        paddingTop: 20,
        paddingBottom: 40,
    },

    // Header Section - Beautiful Design
    headerSection: {
        backgroundColor: COLORS.background,
        paddingBottom: 10,
    },
    headerTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    headerPageTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
    },

    // Profile Card
    profileCard: {
        marginHorizontal: 16,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    profileCardInner: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarImg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
    },
    avatarInitials: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: 4,
        textAlign: 'center',
    },
    profileEmail: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        marginBottom: 16,
        textAlign: 'center',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 6,
    },
    editProfileButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
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

    // Subscription Active Card
    subscriptionActiveCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        borderWidth: 2,
        borderColor: COLORS.success + '40',
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
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    subscriptionIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subscriptionTitleWrapper: {
        flex: 1,
    },
    subscriptionPlanName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
    },
    activeStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
        marginRight: 6,
    },
    activeStatusText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.success,
    },
    subscriptionDetails: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    subscriptionDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    subscriptionDetailLabel: {
        fontSize: 14,
        color: COLORS.greyText,
        marginLeft: 10,
        flex: 1,
    },
    subscriptionDetailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
    },
    subscriptionProgress: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.greyLight,
        borderRadius: 4,
        overflow: 'hidden',
        marginRight: 12,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.greyText,
        minWidth: 60,
        textAlign: 'right',
    },

    // FCM Token Card
    fcmCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
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
    fcmHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    fcmLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginLeft: 12,
    },
    fcmTokenText: {
        fontSize: 12,
        color: COLORS.greyText,
        backgroundColor: COLORS.greyLight,
        padding: 12,
        borderRadius: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 12,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    copyButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
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

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    ScrollView,
    Dimensions,
    TextInput,
    Platform,
    ActivityIndicator,
    Alert,
    RefreshControl,
    StatusBar,
    KeyboardAvoidingView,
    Keyboard,
    FlatList,
    Animated,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { getRecentProperties, getResidentialProperties, getCommercialProperties } from '../services/propertyService';
import propertyService from '../services/propertyapi';
import { debugPropertyAPIs } from '../debug/propertyDebug';
import { checkAuthStatus } from '../utils/quickAuth';
import { getNotificationCount, addTestNotifications } from '../utils/notificationManager';
import { fetchAndProcessNotifications } from '../services/backgroundNotificationService';
import { getStoredCredentials, clearUserCredentials } from '../utils/authManager';
import { runCompleteNotificationTest } from '../utils/notificationTest';
import { runChatDiagnostics } from '../utils/chatDiagnostics';
import { runCompleteFCMTest, showFCMTestResults, sendTestFCMNotification } from '../utils/fcmTestService';
import { testAllNotificationStates, createFirebaseTestPayload, debugNotificationIssues, forceTestNotification } from '../utils/notificationTestHelper';
import { showQuickNotificationStatus } from '../utils/notificationStatus';

// Import MediaCard component
import MediaCard from '../components/MediaCard';
import ContactPreferenceIcons from '../components/ContactPreferenceIcons';
import DrawerMenu from '../components/DrawerMenu';
import SubscriptionModal from '../components/SubscriptionModal';
import { useSubscription } from '../context/SubscriptionContext';

// Theme & Layout Constants
const { width, height } = Dimensions.get("window");

// Helper functions to format API data
const formatImageUrl = (url) => {
    if (!url) return null;
    
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // If it's a relative path from API (like "uploads/filename.jpg"), make it absolute
    if (url.startsWith('uploads/')) {
        return `https://n5.bhoomitechzone.us/${url}`;
    }
    
    // For other relative paths, add base URL
    return url.startsWith('/') ? `https://n5.bhoomitechzone.us${url}` : `https://n5.bhoomitechzone.us/${url}`;
};

const formatPrice = (price) => `₹ ${price}`; // Using Rupee symbol instead of dollar

const getDisplayLocation = (property) => {
    if (!property) return 'Unknown Location';

    // Prefer nested address object if available (API format)
    if (property.address && typeof property.address === 'object') {
        const { locality, city, state, district } = property.address;
        // Build location string with available fields
        const parts = [];
        if (locality) parts.push(locality);
        if (city) parts.push(city);
        if (district && district !== city) parts.push(district);
        if (state) parts.push(state);
        
        if (parts.length > 0) {
            return parts.join(', ');
        }
    }

    // Fallback to flat fields
    const flatParts = [property.locality, property.city, property.state].filter(Boolean);
    if (flatParts.length) return flatParts.join(', ');

    // Fallback to propertyLocation string
    if (property.propertyLocation) return property.propertyLocation;

    return 'Location not specified';
};

const getFirstImageUrl = (photosAndVideo) => {
    if (!photosAndVideo || photosAndVideo.length === 0) return null;
    
    // Find the first image (not video) if possible
    const firstImage = photosAndVideo.find(media => {
        const mediaPath = media.uri || media;
        return mediaPath && (mediaPath.includes('.jpg') || mediaPath.includes('.jpeg') || 
               mediaPath.includes('.png') || mediaPath.includes('.webp') || mediaPath.includes('.gif'));
    });
    
    if (firstImage) {
        return firstImage.uri || firstImage;
    }
    
    // If no image found, return the first item anyway
    return photosAndVideo[0].uri || photosAndVideo[0];
};

const theme = {
    COLORS: {
        primary: "#FDB022",        // Orange color
        primaryLight: "#FDBF4D",   // Lighter orange
        primaryDark: "#E89E0F",    // Darker orange
        secondary: "#FDB022",      // Orange accent
        secondaryLight: "#FFD478", // Light orange
        background: "#F8FAFC",
        white: "#FFFFFF",
        black: "#1A1A1A",          // Black from logo
        greyLight: "#E2E8F0",
        greyMedium: "#64748B",
        greyDark: "#1E293B",
        accent: "#FDB022",         // Orange accent
        star: "#FBBF24",
        overlay: "rgba(26,26,26,0.85)",
        overlayLight: "rgba(26,26,26,0.4)",
        notification: "#EF4444",
        lightBackground: "rgba(253, 176, 34, 0.05)",
        success: "#FDB022",
        warning: "#F59E0B",
        danger: "#EF4444",
    },
    GRADIENTS: {
        primary: ["#FDBF4D", "#FDB022", "#E89E0F"],      // Orange gradient
        secondary: ["#FDBF4D", "#FDB022", "#E89E0F"],    // Orange gradient
        accent: ["#FDBF4D", "#FDB022", "#E89E0F"],       // Orange gradient
        warm: ["#FCD34D", "#F59E0B", "#D97706"],
        cool: ["#67E8F9", "#06B6D4", "#0891B2"],
    },
    SPACING: {
        xs: 4, s: 8, m: 16, l: 20, xl: 32,
    },
    FONT_SIZES: {
        caption: 12, body: 14, h4: 16, h3: 18, h2: 22, h1: 28,
    },
    RADIUS: {
        s: 8, m: 15, l: 20, full: 99,
    },
};

// Banner Images
const BANNER_IMAGES = [
    { id: '1', source: require("../assets/banner3.png") },
    { id: '2', source: require("../assets/banner1.jpeg") },
    { id: '3', source: require("../assets/banner2.jpeg") },
];

// Static Data - Get Started With section
const startedItems = [
    { id: "1", icon: "search", label: "Search", color: "#FDB022", gradientColors: ["#FFF4E6", "#FFFFFF"], screen: 'Search' },
    { id: "2", icon: "receipt", label: "Pay Bill", color: "#FDB022", gradientColors: ["#F0F9FF", "#FFFFFF"], screen: 'PayBillScreen' },
    { id: "3", icon: "card", label: "Pay Rent", color: "#FDB022", gradientColors: ["#F0FDF4", "#FFFFFF"], screen: 'PayRentScreen' },
];

// Layout Calculation
const HEADER_HEIGHT = 20;
const FIXED_HEADER_HEIGHT = HEADER_HEIGHT;
const FALLBACK_IMAGE_URI = "https://via.placeholder.com/400x200/5da9f6/FFFFFF?text=Property+Image";

// Chat Button Component
const ChatButton = ({ onPress, theme, hasUnreadMessages }) => (
    <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.chatButtonInnerGlass}>
            <Icon name="chatbubbles-outline" size={34} color={theme.COLORS.primary} />
        </View>
        {hasUnreadMessages && <View style={styles.notificationBadgeGlass} />}
    </TouchableOpacity>
);

// Location geocoding functionality removed

const Homescreen = ({ navigation }) => {
    // Subscription context
    const { userHasPackage, setPropertyForSubscription, loadActiveSubscription, activeSubscription } = useSubscription();
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    
    // Load subscription status on mount
    useEffect(() => {
        loadActiveSubscription();
    }, [loadActiveSubscription]);
    
    // Debug function to check login status (for testing)
    const checkLoginStatus = async () => {
        const credentials = await getStoredCredentials();
        Alert.alert(
            'Login Status Debug',
            `Logged In: ${credentials.isLoggedIn}\nToken: ${credentials.token ? 'Present' : 'None'}\nUser ID: ${credentials.userId || 'None'}`,
            [
                { text: 'OK' },
                { 
                    text: 'Clear Login (Test)', 
                    onPress: async () => {
                        await clearUserCredentials();
                        Alert.alert('Cleared', 'Login cleared! Close and reopen app to test.');
                    }
                }
            ]
        );
    };

    // State Initialization
    const [favorites, setFavorites] = useState([]);
    const [loadingSaveProperty, setLoadingSaveProperty] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const bannerScrollRef = useRef(null);

    // API Data States
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [residentialProperties, setResidentialProperties] = useState([]);
    const [commercialProperties, setCommercialProperties] = useState([]);
    const [isLoadingProperties, setIsLoadingProperties] = useState(false);

    // UI States
    const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Load user role on mount
    useEffect(() => {
        const loadUserRole = async () => {
            try {
                const role = await AsyncStorage.getItem('userRole');
                setUserRole(role);
            } catch (error) {
                console.warn('Error loading user role:', error);
            }
        };
        loadUserRole();
    }, []);

    // Load properties from API
    const loadProperties = useCallback(async () => {
        setIsLoadingProperties(true);
        
        try {
            console.log('🔄 Loading properties from API...');
            
            // Debug API issues
            await debugPropertyAPIs();
            
            // Check authentication status
            await checkAuthStatus();
            
            // Load all property types in parallel
            const [recentResponse, residentialResponse, commercialResponse] = await Promise.allSettled([
                getRecentProperties(),  // Public API - should always work
                getResidentialProperties(), // Requires auth
                getCommercialProperties()   // Requires auth
            ]);
            
            console.log('📊 API Response Status:', {
                recent: recentResponse.status,
                residential: residentialResponse.status, 
                commercial: commercialResponse.status
            });
            
            // Handle featured/recent properties (always try this first)
            if (recentResponse.status === 'fulfilled') {
                if (recentResponse.value.success) {
                    const recentData = recentResponse.value.data || recentResponse.value.properties || [];
                    console.log('📦 Recent data received:', recentData.length, 'properties');
                    console.log('🔍 Sample property:', recentData[0] || 'None');
                    // Filter only approved properties (backend returns lowercase 'approved')
                    const approvedRecent = recentData.filter(p => 
                        p.status === 'approved' || p.approvalStatus === 'Approved'
                    );
                    console.log('✅ Approved properties:', approvedRecent.length, 'out of', recentData.length);
                    setFeaturedProperties(Array.isArray(approvedRecent) ? approvedRecent : []);
                    console.log('✅ Featured properties loaded:', approvedRecent.length);
                } else {
                    console.warn('⚠️ Recent API returned success=false:', recentResponse.value.message);
                    setFeaturedProperties([]); // No dummy data
                }
            } else {
                console.error('❌ Recent API call failed completely:', recentResponse.reason);
                setFeaturedProperties([]); // No dummy data
            }
            
            // Handle residential properties (requires authentication)
            if (residentialResponse.status === 'fulfilled') {
                if (residentialResponse.value.success) {
                    const residentialData = residentialResponse.value.data || residentialResponse.value.properties || [];
                    console.log('📦 Residential data received:', residentialData.length, 'properties');
                    // Filter by propertyType and status (backend returns lowercase 'approved')
                    const filteredResidential = residentialData.filter(p => 
                        p.propertyType === 'Residential' && 
                        (p.status === 'approved' || p.approvalStatus === 'Approved')
                    );
                    setResidentialProperties(Array.isArray(filteredResidential) ? filteredResidential : []);
                    console.log('✅ Residential properties loaded:', filteredResidential.length);
                } else {
                    console.warn('⚠️ Residential API failed:', residentialResponse.value.message);
                    // If auth failed, use recent properties filtered by type
                    const fallbackResidential = featuredProperties.filter(p => p.propertyType === 'Residential');
                    setResidentialProperties(fallbackResidential); // No dummy data
                }
            } else {
                console.error('❌ Residential API call failed:', residentialResponse.reason);
                const fallbackResidential = featuredProperties.filter(p => p.propertyType === 'Residential');
                setResidentialProperties(fallbackResidential); // No dummy data
            }
            
            // Handle commercial properties (requires authentication)
            if (commercialResponse.status === 'fulfilled') {
                if (commercialResponse.value.success) {
                    const commercialData = commercialResponse.value.data || commercialResponse.value.properties || [];
                    console.log('📦 Commercial data received:', commercialData.length, 'properties');
                    // Filter by propertyType and status (backend returns lowercase 'approved')
                    const filteredCommercial = commercialData.filter(p => 
                        p.propertyType === 'Commercial' && 
                        (p.status === 'approved' || p.approvalStatus === 'Approved')
                    );
                    setCommercialProperties(Array.isArray(filteredCommercial) ? filteredCommercial : []);
                    console.log('✅ Commercial properties loaded:', filteredCommercial.length);
                } else {
                    console.warn('⚠️ Commercial API failed:', commercialResponse.value.message);
                    // If auth failed, use recent properties filtered by type
                    const fallbackCommercial = featuredProperties.filter(p => p.propertyType === 'Commercial');
                    setCommercialProperties(fallbackCommercial); // No dummy data
                }
            } else {
                console.error('❌ Commercial API call failed:', commercialResponse.reason);
                const fallbackCommercial = featuredProperties.filter(p => p.propertyType === 'Commercial');
                setCommercialProperties(fallbackCommercial); // No dummy data
            }
            
        } catch (error) {
            console.error('❌ Error loading properties:', error);
            // No dummy data - show empty state on error
            setFeaturedProperties([]);
            setResidentialProperties([]);
            setCommercialProperties([]);
        } finally {
            setIsLoadingProperties(false);
            
            // Final summary
            console.log('📊 Final property counts:', {
                featured: featuredProperties.length,
                residential: residentialProperties.length,
                commercial: commercialProperties.length
            });
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadProperties();
        setIsRefreshing(false);
    }, []); // Empty dependency array to prevent function recreation

    // Load properties on component mount
    useEffect(() => {
        loadProperties();
        loadSavedProperties();
    }, []); // Empty dependency array to run only once on mount

    // Listen for navigation focus to refresh data AND handle refresh params
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('Home screen focused - checking for refresh...');
            
            // Check for refresh param
            const params = navigation.getState()?.routes?.find(route => route.name === 'Home')?.params;
            if (params?.refresh) {
                console.log('Forced refresh requested from params');
                loadProperties();
                loadSavedProperties();
                // Clear the refresh param to avoid infinite refresh
                navigation.setParams({ refresh: false });
            } else {
                console.log('Normal focus refresh');
                loadProperties();
                loadSavedProperties();
            }
        });

        return unsubscribe;
    }, [navigation]); // Only depend on navigation, not the functions

    // Load saved properties on mount
    const loadSavedProperties = useCallback(async () => {
        try {
            const response = await propertyService.getSavedProperties();
            if (response.success && response.savedProperties && Array.isArray(response.savedProperties)) {
                const savedIds = response.savedProperties
                    .filter(p => p !== null && p !== undefined) // Filter out null/undefined values
                    .map(p => p._id || p.id)
                    .filter(Boolean);
                setFavorites(savedIds);
                console.log('✅ Loaded saved properties:', savedIds.length);
            }
        } catch (error) {
            console.error('Error loading saved properties:', error);
        }
    }, []);

    // Listen for saved property updates (simplified for dummy data)
    useEffect(() => {
        const listener = DeviceEventEmitter.addListener('savedListUpdated', (event) => {
            if (event.action === 'removed') {
                setFavorites(prev => prev.filter(id => id !== event.propertyId));
            } else if (event.action === 'added') {
                setFavorites(prev => [...prev, event.propertyId]);
            }
        });

        return () => listener.remove();
    }, []);

    // Auto-scroll banner effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex(prevIndex => {
                const nextIndex = (prevIndex + 1) % BANNER_IMAGES.length;
                bannerScrollRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
                return nextIndex;
            });
        }, 3000); // Change banner every 3 seconds

        return () => clearInterval(interval);
    }, []);

    // Listen for notification updates
    useEffect(() => {
        // Load initial notification count
        loadNotificationCount();

        // Listen for notification events
        const notificationAddedListener = DeviceEventEmitter.addListener('notificationAdded', (event) => {
            setNotificationCount(event.count);
        });

        const notificationCountUpdatedListener = DeviceEventEmitter.addListener('notificationCountUpdated', (count) => {
            setNotificationCount(count);
        });

        // Listen for focus to reload notification count
        const focusListener = navigation.addListener('focus', () => {
            loadNotificationCount();
        });

        return () => {
            notificationAddedListener.remove();
            notificationCountUpdatedListener.remove();
            focusListener(); // This should be focusListener.remove() if it exists
        };
    }, [navigation]);

    // Component Logic - Toggle property save/unsave
    const toggleFavorite = async (propertyId) => {
        if (loadingSaveProperty === propertyId) return; // Prevent multiple clicks
        
        const isCurrentlySaved = favorites.includes(propertyId);
        setLoadingSaveProperty(propertyId);
        
        try {
            let response;
            if (isCurrentlySaved) {
                // Remove from saved
                response = await propertyService.removeSavedProperty(propertyId);
                if (response.success) {
                    setFavorites((prev) => prev.filter((f) => f !== propertyId));
                    DeviceEventEmitter.emit('savedListUpdated', { propertyId, action: 'removed' });
                } else {
                    Alert.alert('Error', response.message || 'Failed to remove property from saved list');
                }
            } else {
                // Save property
                response = await propertyService.saveProperty(propertyId);
                if (response.success) {
                    setFavorites((prev) => [...prev, propertyId]);
                    DeviceEventEmitter.emit('savedListUpdated', { propertyId, action: 'added' });
                } else {
                    Alert.alert('Error', response.message || 'Failed to save property');
                }
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoadingSaveProperty(null);
        }
    };

    // Update the renderSectionHeader function to handle 'See All' click
    const renderSectionHeader = (title, showSeeAll = false, onSeeAllPress) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {showSeeAll && (
                <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.8}>
                    <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const handleQuickAction = (screenName) => {
        navigation.navigate(screenName);
    };

    const openProperty = (item) => {
        // Check if user has active subscription
        if (!userHasPackage) {
            // Debug: Check token before showing modal
            AsyncStorage.getItem('userToken').then(token => {
                console.log('🔑 Token check before modal:', token ? 'Token exists' : 'No token');
                if (!token) {
                    // Log all keys for debugging
                    AsyncStorage.getAllKeys().then(keys => {
                        console.log('📦 All AsyncStorage keys:', keys);
                    });
                }
            });
            
            setPropertyForSubscription(item);
            setShowSubscriptionModal(true);
            return;
        }
        
        // User has subscription, navigate to details
        navigation.navigate('PropertyDetailsScreen', { property: item });
    };

    const handleSubscriptionSuccess = () => {
        setShowSubscriptionModal(false);
        // Refresh subscription status
        loadActiveSubscription();
        // After subscription, user will have package and can view properties
        Alert.alert('Success', 'Subscription activated! You can now view property details.');
    };

    const handleChatPress = () => {
        setHasUnreadMessages(false);
        navigation.navigate('ChatListScreen');
    };

    // Property action button handlers
    const handlePhoneCall = (property) => {
        const phoneNumber = property.contactNumber || property.phoneNumber || property.ownerPhone || '1234567890';
        const phoneUrl = `tel:${phoneNumber}`;
        
        // Use React Native Linking to open phone dialer
        import('react-native').then(({ Linking }) => {
            Linking.openURL(phoneUrl).catch((err) => {
                console.error('Error opening phone dialer:', err);
                Alert.alert('Error', 'Could not open phone dialer');
            });
        });
    };

    const handleWhatsApp = (property) => {
        const phoneNumber = property.contactNumber || property.phoneNumber || property.ownerPhone || '1234567890';
        const message = encodeURIComponent(`Hi, I'm interested in your property: ${property.description || property.title || 'Property'}`);
        const whatsappUrl = `whatsapp://send?phone=+91${phoneNumber}&text=${message}`;
        
        import('react-native').then(({ Linking }) => {
            Linking.openURL(whatsappUrl).catch((err) => {
                console.error('Error opening WhatsApp:', err);
                Alert.alert('Error', 'WhatsApp is not installed or could not be opened');
            });
        });
    };

    const handlePropertyChat = async (property) => {
        try {
            // Navigate to chat with property owner
            // ChatDetailScreen expects 'user' object with '_id' field
            const ownerId = property.ownerId || property.userId || property.postedBy?._id || property.postedBy;
            
            if (!ownerId) {
                console.warn('No owner ID found for property:', property._id);
                Alert.alert('Error', 'Unable to start chat - owner information not available');
                return;
            }
            
            console.log('Starting chat with owner:', ownerId);
            navigation.navigate('ChatDetailScreen', { 
                user: {
                    _id: ownerId,
                    fullName: property.ownerName || property.postedBy?.fullName || 'Property Owner',
                },
                propertyId: property._id || property.id,
                propertyTitle: property.description || property.title || 'Property',
            });
        } catch (error) {
            console.error('Error starting chat:', error);
            Alert.alert('Error', 'Unable to start chat. Please try again.');
        }
    };

    const handleNotificationPress = () => {
        navigation.navigate('NotificationList');
    };

    // Load notification count from API
    const loadNotificationCount = async () => {
        try {
            // First get from local storage for instant UI update
            const localCount = await getNotificationCount();
            setNotificationCount(localCount);
            
            // Then fetch from API to get latest count
            const result = await fetchAndProcessNotifications(false);
            if (result && typeof result.count === 'number') {
                setNotificationCount(result.count);
            }
        } catch (error) {
            console.error('Error loading notification count:', error);
        }
    };

    // Complete notification system test (including FCM and backend API)
    const handleAddTestNotifications = async () => {
        try {
            Alert.alert(
                'Notification & FCM Test',
                'Choose test type:',
                [
                    {
                        text: '📊 Quick Status',
                        onPress: async () => {
                            await showQuickNotificationStatus();
                        }
                    },
                    {
                        text: 'FCM Quick Test',
                        onPress: async () => {
                            Alert.alert('Testing FCM', 'Sending test FCM notification...');
                            const result = await sendTestFCMNotification();
                            await loadNotificationCount();
                            
                            Alert.alert(
                                result.success ? '✅ FCM Test Sent' : '❌ FCM Test Failed',
                                result.success 
                                    ? `Test notification sent via ${result.method}\nToken: ${result.token?.substring(0, 20)}...` 
                                    : `Error: ${result.error}`
                            );
                        }
                    },
                    {
                        text: 'FCM Full Diagnostics',
                        onPress: async () => {
                            Alert.alert('Running FCM Tests', 'Please wait while we test Firebase Cloud Messaging...');
                            const results = await runCompleteFCMTest();
                            await loadNotificationCount();
                            showFCMTestResults(results);
                        }
                    },
                    {
                        text: 'Fix FCM Issues',
                        onPress: async () => {
                            Alert.alert('Fixing FCM', 'Attempting to fix common FCM issues...');
                            const { quickFixFCMIssues } = await import('../utils/fcmTestService');
                            const fixResult = await quickFixFCMIssues();
                            await loadNotificationCount();
                            
                            Alert.alert(
                                fixResult.success ? '🔧 FCM Fixes Applied' : '❌ Fix Attempt Failed',
                                fixResult.fixes.join('\n') + '\n\nTap "FCM Full Diagnostics" to test again.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                    {
                        text: 'Local Only',
                        onPress: async () => {
                            await addTestNotifications();
                            await loadNotificationCount();
                            Alert.alert('Success', 'Local test notifications added! Check the notification icon.');
                        }
                    },
                    {
                        text: 'Complete Test',
                        onPress: async () => {
                            Alert.alert('Running Tests', 'Please wait while we test the complete notification system...');
                            const results = await runCompleteNotificationTest();
                            await loadNotificationCount();
                            
                            const successCount = Object.values(results).filter(r => r.success).length;
                            const totalTests = Object.keys(results).length;
                            
                            Alert.alert(
                                'Test Results',
                                `Passed: ${successCount}/${totalTests} tests\n\n` +
                                `Local Storage: ${results.localStorage.success ? '✅' : '❌'}\n` +
                                `Backend API: ${results.backend.success ? '✅' : '❌'}\n` +
                                `FCM Token: ${results.fcmToken.success ? '✅' : '❌'}\n\n` +
                                'Check console for detailed logs.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                    {
                        text: 'Chat Test',
                        onPress: async () => {
                            Alert.alert('Running Tests', 'Testing chat system...');
                            const results = await runChatDiagnostics();
                            
                            Alert.alert(
                                'Chat Test Results',
                                `Auth: ${results.auth.success ? '✅' : '❌'}\n` +
                                `Endpoints: ${results.endpoints.success ? '✅' : '❌'}\n` +
                                `Socket: ${results.socket.success ? '✅' : '❌'}\n\n` +
                                'Check console for detailed logs.',
                                [{ text: 'OK' }]
                            );
                        }
                    },
                    {
                        text: '🧪 All States Test',
                        onPress: async () => {
                            Alert.alert('Testing All States', 'Testing notifications in foreground, background, and closed states...');
                            const results = await testAllNotificationStates();
                            await loadNotificationCount();
                        }
                    },
                    {
                        text: '🔍 Debug Issues',
                        onPress: async () => {
                            const debugResults = await debugNotificationIssues();
                            await loadNotificationCount();
                        }
                    },
                    {
                        text: '📋 Firebase Payload',
                        onPress: async () => {
                            await createFirebaseTestPayload();
                        }
                    },
                    {
                        text: '🚨 Force Test',
                        onPress: async () => {
                            await forceTestNotification();
                            await loadNotificationCount();
                        }
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to run tests: ' + error.message);
        }
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Services', { query: searchQuery.trim() });
            Keyboard.dismiss();
        }
    };

    const handleVoiceSearch = () => {
        Alert.alert('Voice Search', 'Voice search feature coming soon!');
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: async () => {
                        await clearUserCredentials();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'LoginScreen' }],
                        });
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // Distance-based filtering removed

    // Process featured properties for display
    const processedFeaturedProperties = useMemo(() => {
        return featuredProperties.map((item, index) => {
            // Handle multiple photo field names from API
            const photos = item.photos || item.photosAndVideo || item.images || [];
            const firstImage = getFirstImageUrl(photos);
            const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
            
            return {
                ...item,
                processedImageUrl: imageUrl,
                stableKey: `featured_${item._id || index}`
            };
        });
    }, [featuredProperties]);

    // Limit featured properties to display
    const displayedFeaturedProperties = useMemo(() => {
        return processedFeaturedProperties.slice(0, 15);
    }, [processedFeaturedProperties]);

    // Render Featured Content
    const renderFeaturedContent = () => {
        if (displayedFeaturedProperties.length === 0) {
            return <Text style={styles.noDataText}>No properties found.</Text>;
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
            >
                {displayedFeaturedProperties.map((item, index) => {
                    // Prefer property.photos -> photosAndVideo -> images -> processedImageUrl
                    const sourceMedia = (Array.isArray(item.photos) && item.photos.length > 0)
                        ? item.photos
                        : (Array.isArray(item.photosAndVideo) && item.photosAndVideo.length > 0)
                            ? item.photosAndVideo
                            : (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images
                                : [{ uri: item.processedImageUrl }];

                    const mediaItems = sourceMedia.map(media => {
                        const originalUri = (typeof media === 'string') ? media : (media.uri || media);
                        const formattedUri = formatImageUrl(originalUri);
                        const isVideo = originalUri && (originalUri.includes('.mp4') || originalUri.includes('.mov') || originalUri.includes('.avi'));
                        return {
                            uri: formattedUri || originalUri,
                            type: media.type || (isVideo ? 'video' : 'image')
                        };
                    });

                    return (
                        <TouchableOpacity
                            key={item.stableKey}
                            style={styles.featuredHouseCard}
                            onPress={() => openProperty(item)}
                            activeOpacity={0.9}
                        >
                            {/* Property Image with MediaCard */}
                            <View style={styles.featuredHouseImageContainer}>
                                <MediaCard
                                    mediaItems={mediaItems}
                                    fallbackImage={FALLBACK_IMAGE_URI}
                                    imageStyle={styles.featuredHouseImage}
                                    showControls={false}
                                    autoPlay={false}
                                    style={styles.featuredHouseMediaCard}
                                />
                                
                                {/* Favorite Icon - Top Left */}
                                <TouchableOpacity 
                                    onPress={() => toggleFavorite(item._id)} 
                                    style={styles.featuredHouseFavoriteIcon}
                                    activeOpacity={0.7}
                                    disabled={loadingSaveProperty === item._id}
                                >
                                    {loadingSaveProperty === item._id ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <Icon
                                            name={favorites.includes(item._id) ? "heart" : "heart-outline"}
                                            size={20}
                                            color={favorites.includes(item._id) ? "#EF4444" : "#64748B"}
                                        />
                                    )}
                                </TouchableOpacity>

                                {/* Property Type Badge - Bottom Left Deleted */}
                                {/* <View style={styles.propertyTypeBadge}>
                                    <Text style={styles.propertyTypeText}>
                                        {item.purpose || 'Apartment'}
                                    </Text>
                                </View> */}
                            </View>

                            {/* Property Details - Right Side */}
                            <View style={styles.featuredHouseDetails}>
                                {/* Title */}
                                <Text style={styles.featuredHouseTitle} numberOfLines={2}>
                                    {item.description || 'Property Details'}
                                </Text>

                                {/* Location */}
                                <View style={styles.featuredHouseLocation}>
                                    <Icon name="location-outline" size={12} color="#64748B" />
                                    <Text style={styles.featuredHouseLocationText} numberOfLines={1}>
                                        {getDisplayLocation(item)}
                                    </Text>
                                </View>

                                {/* Price */}
                                <Text style={styles.featuredHousePrice}>
                                    {formatPrice(item.price)}
                                    <Text style={styles.featuredHousePriceUnit}>/month</Text>
                                </Text>
                                
                                {/* Contact Preference Icons */}
                                <ContactPreferenceIcons
                                    contactPreferences={item.contactPreferences}
                                    onPhonePress={() => handlePhoneCall(item)}
                                    onWhatsAppPress={() => handleWhatsApp(item)}
                                    onChatPress={() => handlePropertyChat(item)}
                                    iconSize={16}
                                    buttonSize={28}
                                    containerStyle={styles.propertyActionButtons}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    // Process properties by category
    const processedProperties = useMemo(() => {
        const residential = residentialProperties.map((item, index) => {
            const firstImage = getFirstImageUrl(item.photosAndVideo);
            const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
            
            return {
                ...item,
                processedImageUrl: imageUrl,
                stableKey: `residential_${item._id || index}`
            };
        });
        
        const commercial = commercialProperties.map((item, index) => {
            const firstImage = getFirstImageUrl(item.photosAndVideo);
            const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
            
            return {
                ...item,
                processedImageUrl: imageUrl,
                stableKey: `commercial_${item._id || index}`
            };
        });
        
        return { residential, commercial };
    }, [residentialProperties, commercialProperties]);

    // Limit properties for home screen display
    const displayedResidentialProperties = useMemo(() => {
        return processedProperties.residential.slice(0, 20);
    }, [processedProperties]);

    const displayedCommercialProperties = useMemo(() => {
        return processedProperties.commercial.slice(0, 20);
    }, [processedProperties]);

    // Render Residential Properties (Horizontal List)
    const renderResidentialContent = () => {
        if (displayedResidentialProperties.length === 0) {
            return <Text style={styles.noDataText}>No residential properties found.</Text>;
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
            >
                {displayedResidentialProperties.map((item, index) => {
                    // Prefer property.photos -> photosAndVideo -> images -> processedImageUrl
                    const sourceMedia = (Array.isArray(item.photos) && item.photos.length > 0)
                        ? item.photos
                        : (Array.isArray(item.photosAndVideo) && item.photosAndVideo.length > 0)
                            ? item.photosAndVideo
                            : (Array.isArray(item.images) && item.images.length > 0)
                                ? item.images
                                : [{ uri: item.processedImageUrl }];

                    const mediaItems = sourceMedia.map(media => {
                        const originalUri = (typeof media === 'string') ? media : (media.uri || media);
                        const formattedUri = formatImageUrl(originalUri);
                        const isVideo = originalUri && (originalUri.includes('.mp4') || originalUri.includes('.mov') || originalUri.includes('.avi'));
                        return {
                            uri: formattedUri || originalUri,
                            type: media.type || (isVideo ? 'video' : 'image')
                        };
                    });

                    return (
                        <TouchableOpacity
                            key={item.stableKey}
                            style={styles.residentialCard}
                            onPress={() => openProperty(item)}
                            activeOpacity={0.9}
                        >
                            {/* Property Image */}
                            <View style={styles.residentialImageContainer}>
                                <MediaCard
                                    mediaItems={mediaItems}
                                    fallbackImage={FALLBACK_IMAGE_URI}
                                    imageStyle={styles.residentialImage}
                                    showControls={false}
                                    autoPlay={false}
                                    style={styles.residentialMediaCard}
                                />
                            </View>

                            {/* Property Details */}
                            <View style={styles.residentialDetails}>
                                {/* Title */}
                                <Text style={styles.residentialTitle} numberOfLines={1}>
                                    {item.description || 'Property Name'}
                                </Text>

                                {/* Location */}
                                <View style={styles.residentialLocation}>
                                    <Icon name="location-outline" size={13} color="#64748B" />
                                    <Text style={styles.residentialLocationText} numberOfLines={1}>
                                        {getDisplayLocation(item)}
                                    </Text>
                                </View>

                                {/* Price */}
                                <Text style={styles.residentialPrice}>
                                    {formatPrice(item.price)}
                                </Text>
                                
                                {/* Contact Preference Icons */}
                                <ContactPreferenceIcons
                                    contactPreferences={item.contactPreferences}
                                    onPhonePress={() => handlePhoneCall(item)}
                                    onWhatsAppPress={() => handleWhatsApp(item)}
                                    onChatPress={() => handlePropertyChat(item)}
                                    iconSize={14}
                                    buttonSize={28}
                                    containerStyle={styles.propertyActionButtons}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    // Render Commercial Properties
    const renderCommercialContent = () => {
        if (displayedCommercialProperties.length === 0) {
            return <Text style={styles.noDataText}>No commercial properties found.</Text>;
        }
        
        return (
            <View>
                <View style={styles.nearbyGrid}>
                        {displayedCommercialProperties.map((item, index) => {
                            // Prefer property.photos -> photosAndVideo -> images -> processedImageUrl
                            const sourceMedia = (Array.isArray(item.photos) && item.photos.length > 0)
                                ? item.photos
                                : (Array.isArray(item.photosAndVideo) && item.photosAndVideo.length > 0)
                                    ? item.photosAndVideo
                                    : (Array.isArray(item.images) && item.images.length > 0)
                                        ? item.images
                                        : [{ uri: item.processedImageUrl }];

                            const mediaItems = sourceMedia.map(media => {
                                const originalUri = (typeof media === 'string') ? media : (media.uri || media);
                                const formattedUri = formatImageUrl(originalUri);
                                const isVideo = originalUri && (originalUri.includes('.mp4') || originalUri.includes('.mov') || originalUri.includes('.avi'));
                                return {
                                    uri: formattedUri || originalUri,
                                    type: media.type || (isVideo ? 'video' : 'image')
                                };
                            });

                            return (
                                <TouchableOpacity
                                    key={item.stableKey} // Use stable key instead of _id
                                    style={styles.nearbyCard}
                                    onPress={() => openProperty(item)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.nearbyMediaContainer}>
                                        <MediaCard
                                            mediaItems={mediaItems}
                                            fallbackImage={FALLBACK_IMAGE_URI}
                                            imageStyle={styles.nearbyImage}
                                            showControls={true}
                                            autoPlay={false}
                                            style={styles.nearbyMediaCard}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => toggleFavorite(item._id)} 
                                            style={styles.nearbyFavoriteIcon}
                                            activeOpacity={0.7}
                                            disabled={loadingSaveProperty === item._id}
                                        >
                                            {loadingSaveProperty === item._id ? (
                                                <ActivityIndicator size="small" color="#EF4444" />
                                            ) : (
                                                <Icon
                                                    name={favorites.includes(item._id) ? "heart" : "heart-outline"}
                                                    size={24}
                                                    color={favorites.includes(item._id) ? "#EF4444" : "#6B7280"}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.nearbyInfo}>
                                        <Text style={styles.nearbyTitle} numberOfLines={1}>
                                            {item.description || 'Estate'}
                                        </Text>
                                        <View style={styles.locationRow}>
                                            <Icon name="location-outline" size={12} color="#64748B" />
                                            <Text style={styles.nearbyLocation} numberOfLines={1}>
                                                {getDisplayLocation(item)}
                                            </Text>
                                        </View>
                                        <Text style={styles.nearbyPrice}>{formatPrice(item.price)}</Text>
                                        
                                        {/* Contact Preference Icons */}
                                        <ContactPreferenceIcons
                                            contactPreferences={item.contactPreferences}
                                            onPhonePress={() => handlePhoneCall(item)}
                                            onWhatsAppPress={() => handleWhatsApp(item)}
                                            onChatPress={() => handlePropertyChat(item)}
                                            iconSize={14}
                                            buttonSize={28}
                                            containerStyle={styles.propertyActionButtons}
                                        />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
        );
    };

    // Manual location selection functionality removed

    // Stable render key
    const stableRenderKey = useMemo(() => {
        return 'home_dummy_data';
    }, []);

    return (
        <SafeAreaView style={styles.container} key={stableRenderKey} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            {/* Modern Header with Gradient */}
            <LinearGradient
                colors={['#FFFFFF', '#FFFFFF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modernHeader}
            >
                {/* Top Row */}
                <View style={styles.headerTopRow}>
                    {/* Menu Icon - Left */}
                    <TouchableOpacity
                        style={styles.menuButtonModern}
                        onPress={() => setDrawerVisible(true)}
                        activeOpacity={0.8}
                    >
                        <Icon 
                            name="menu-outline" 
                            size={26} 
                            color="#1A1A1A" 
                        />
                    </TouchableOpacity>

                    {/* Logo - Center */}
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require('../assets/Kirayedar_logo.png')}
                            style={styles.headerLogoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Notification Icon - Right */}
                    <TouchableOpacity
                        style={styles.notificationButtonModern}
                        onPress={handleNotificationPress}
                        onLongPress={handleAddTestNotifications}
                        activeOpacity={0.8}
                    >
                        <View style={styles.notificationIconModern}>
                            <Icon 
                                name="notifications-outline" 
                                size={20} 
                                color="#1A1A1A" 
                            />
                            {notificationCount > 0 && (
                                <View style={styles.notificationBadgeModern}>
                                    <Text style={styles.notificationBadgeTextModern}>
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Modern Banner with Indicators */}
            <View style={styles.bannerContainerModern}>
                <FlatList
                    ref={bannerScrollRef}
                    data={BANNER_IMAGES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            bannerScrollRef.current?.scrollToIndex({ index: info.index, animated: true });
                        });
                    }}
                    renderItem={({ item }) => (
                        <View style={styles.bannerSlideModern}>
                            <Image
                                source={item.source}
                                style={styles.bannerImageModern}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.4)']}
                                style={styles.bannerOverlay}
                            />
                        </View>
                    )}
                />
                
                {/* Banner Indicators */}
                <View style={styles.bannerIndicators}>
                    {BANNER_IMAGES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.bannerDot,
                                currentBannerIndex === index && styles.bannerDotActive
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Content with keyboard avoiding */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 60 }}
                    style={styles.scrollableContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.COLORS.primary}
                        />
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Modern Get Started Section */}
                    <View style={styles.getStartedSectionModern}>
                        <Text style={styles.getStartedTitleModern}>Get Started</Text>
                        <View style={styles.quickActionsRowModern}>
                            {startedItems.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.actionButtonModern}
                                    activeOpacity={0.6}
                                    onPress={() => handleQuickAction(item.screen)}
                                >
                                    <View style={styles.materialCard}>
                                        <View style={[styles.floatingIconContainer, { backgroundColor: item.color }]}>
                                            <Icon 
                                                name={item.icon} 
                                                size={20} 
                                                color="#FFFFFF"
                                            />
                                        </View>
                                        <View style={styles.cardContent}>
                                            <Text style={styles.actionButtonTextModern} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{item.label}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Featured Houses */}
                    {renderSectionHeader(
                        "Featured Properties",
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'Featured' })
                    )}
                    {renderFeaturedContent()}

                    {/* Residential Properties */}
                    {renderSectionHeader(
                        "Residential",
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'Residential' })
                    )}
                    {renderResidentialContent()}

                    {/* Commercial Properties */}
                    {renderSectionHeader(
                        "Commercial",
                        true,
                        () => navigation.navigate('AllPropertiesScreen', { category: 'Commercial' })
                    )}
                    {renderCommercialContent()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Drawer Menu Modal */}
            <DrawerMenu 
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                onLogout={handleLogout}
                navigation={navigation}
            />

            {/* Subscription Modal */}
            <SubscriptionModal
                visible={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                onSuccess={handleSubscriptionSuccess}
            />
        </SafeAreaView>
    );
};

export default Homescreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    
    // Modern Header Styles
    modernHeader: {
        paddingTop: Platform.OS === 'ios' ? height * 0.01 : height * 0.02,
        paddingHorizontal: width * 0.04,
        paddingBottom: height * 0.01,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
    },
    
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: height * 0.008,
    },

    menuButtonModern: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#FFF8EC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FDB022',
    },

    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: width * 0.05,
    },

    headerLogoImage: {
        width: width * 0.32,
        height: height * 0.05,
        maxWidth: 120,
        maxHeight: 40,
    },
    
    profileButtonModern: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    
    profileImageModern: {
        width: 35,
        height: 35,
        borderRadius: 17,
    },
    
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    
    greetingText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    
    appNameText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    
    notificationButtonModern: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#FFF8EC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FDB022',
        elevation: 4,
    },
    
    notificationIconModern: {
        position: 'relative',
        left:1,
    },
    
    notificationBadgeModern: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    
    notificationBadgeTextModern: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        flex: 0,
    },
    
    headerLogoImage: {
        width: 120,
        height: 40,
    },
    
    headerSpacer: {
        flex: 1,
    },
    
    searchBarModern: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    
    searchIcon: {
        marginRight: 8,
    },
    
    searchInputModern: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    
    filterButton: {
        padding: 8,
        backgroundColor: 'rgba(243, 156, 18, 0.1)',
        borderRadius: 8,
        marginLeft: 10,
    },
    
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 1 : 1,
        paddingBottom: 1,
        backgroundColor: '#FFFFFF',
        height: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 40 : 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 3,
    },
    profilePlaceholder: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FDB022',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    headerLogo: {
        width: width * 0.3,
        height: 38,
        resizeMode: 'contain',
        marginBottom: 0,
    },
    bannerContainer: {
        width: "100%",
        height: height * 0.28,
        backgroundColor: '#F8FAFC',
    },
    bannerSlide: {
        width: width,
        height: height * 0.28,
    },
    bannerImage: {
        width: "100%",
        height: "100%",
        resizeMode: 'cover',
    },
    notificationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'transparent',
        overflow: 'visible',
        marginBottom: 0,
    },
    notificationGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
        shadowColor: "#FDB022",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    notificationIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    notificationBadgeHeader: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 6,
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 8,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        paddingHorizontal: 18,
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.15)',
        shadowColor: "#FDB022",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 12,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
        paddingVertical: Platform.OS === 'ios' ? 12 : 0,
    },
    scrollableContent: {
        flex: 1
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.SPACING.l,
        marginTop: 28,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: '#1F2937',
        letterSpacing: -0.3,
        flex: 1,
    },
    seeAllText: {
        color: '#FDB022',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: -0.2,
        backgroundColor: '#FFF8EC',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        overflow: 'hidden',
    },
    nearbyInfoText: {
        fontSize: 13,
        color: '#475569',
        marginHorizontal: theme.SPACING.l,
        marginTop: -4,
        marginBottom: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(30, 144, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FDB022',
        shadowColor: "#FDB022",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    
    // Modern Get Started Styles
    getStartedSectionModern: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    
    getStartedTitleModern: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    
    quickActionsRowModern: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'nowrap',
    },
    
    actionButtonModern: {
        flex: 1,
        minHeight: 90,
        maxHeight: 100,
        marginHorizontal: 3,
    },
    
    materialCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        position: 'relative',
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        alignItems: 'center',
        overflow: 'visible',
        marginTop: 12,
        minHeight: 90,
        borderWidth: 1,
        borderColor: '#FFF8EC',
    },
    
    floatingIconContainer: {
        position: 'absolute',
        top: -12,
        left: '50%',
        marginLeft: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10,
    },
    
    cardContent: {
        flex: 1,
        paddingTop: 30,
        paddingHorizontal: 2,
        paddingBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    
    actionButtonTextModern: {
        fontSize: width < 380 ? 8.5 : 10,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: width < 380 ? 11 : 13,
        color: '#374151',
        letterSpacing: 0.1,
        textTransform: 'uppercase',
        flexShrink: 1,
        marginTop: 4,
    },
    
    actionButton: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    
    actionButtonLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: '#374151',
        letterSpacing: -0.1,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 2,
    },
    horizontalScrollContainer: {
        paddingHorizontal: theme.SPACING.l,
        paddingBottom: 32,
        paddingTop: 4,
    },
    featuredCard: {
        width: width * 0.75,
        height: height * 0.28,
        marginRight: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    favoriteIconContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 8,
        borderRadius: 20,
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    featuredInfo: {
        padding: 16,
        paddingBottom: 20,
    },
    featuredTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    featuredLocation: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    featuredPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    nearbyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.l,
        marginBottom: 10,
        marginTop: 4,
    },
    nearbyCard: {
        width: (width - theme.SPACING.l * 2 - 12) / 2,
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#FDB022",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#FFF8EC',
    },
    nearbyMediaContainer: {
        position: 'relative',
        width: '100%',
    },
    nearbyFavoriteIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 6,
        borderRadius: 20,
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    nearbyImage: {
        width: '100%',
        height: 130,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        resizeMode: 'cover',
        backgroundColor: '#F3F4F6',
    },
    nearbyInfo: {
        padding: 14,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    nearbyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: -0.2,
        lineHeight: 18,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    nearbyLocation: {
        fontSize: 11,
        color: '#64748B',
        marginLeft: 4,
        flex: 1,
        fontWeight: '500',
        lineHeight: 14,
    },
    priceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    nearbyPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FDB022',
        letterSpacing: -0.5,
    },
    pricePerMonth: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F59E0B',
        marginLeft: 3,
    },
    loaderStyle: {
        padding: theme.SPACING.xl,
    },
    retryContainer: {
        padding: theme.SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        margin: theme.SPACING.l,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    retryText: {
        fontSize: 14,
        color: '#FDB022',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    noDataText: {
        textAlign: 'center',
        padding: theme.SPACING.xl,
        color: '#64748B',
        fontSize: 15,
        fontWeight: '600',
    },
    floatingChatButton: {
        position: 'absolute',
        bottom: 85,
        right: 20,
        width: 66,
        height: 66,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: "#FDB022",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 15,
    },
    chatButtonInnerGlass: {
        width: '100%',
        height: '100%',
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        borderColor: '#FFE8CC',
        overflow: 'hidden',
    },
    notificationBadgeGlass: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EF4444',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 8,
    },
    locationFilterContainer: {
        padding: 18,
        marginHorizontal: theme.SPACING.l,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.15)',
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    locationText: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '800',
        marginLeft: 10,
        flex: 1,
        letterSpacing: -0.3,
    },
    locationButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDB022',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        flex: 1,
        gap: 8,
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    editLocationButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 2,
        borderColor: '#FDB022',
    },
    locationButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: -0.3,
    },
    editLocationText: {
        color: '#FDB022',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: -0.3,
    },
    distanceFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        backgroundColor: 'rgba(30, 144, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
    },
    distanceText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
    },
    distanceInput: {
        width: 65,
        height: 44,
        borderWidth: 2,
        borderColor: '#FDB022',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 10,
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    applyButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#10B981',
        borderRadius: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: -0.3,
    },
    manualLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 10,
    },
    manualLocationInput: {
        flex: 1,
        height: 50,
        borderWidth: 2,
        borderColor: '#FDB022',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        backgroundColor: '#FFFFFF',
        fontWeight: '700',
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10B981',
        borderRadius: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    disabledButton: {
        opacity: 0.5,
    },
    distanceUnitText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
        marginRight: 8,
    },
    selectedLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    selectedLocationText: {
        flex: 1,
        fontSize: 13,
        color: '#059669',
        fontWeight: '800',
        marginLeft: 8,
        letterSpacing: -0.3,
    },
    clearLocationButton: {
        padding: 6,
    },
    quickLocationsContainer: {
        marginBottom: 16,
    },
    quickLocationsTitle: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    quickLocationsScroll: {
        paddingRight: theme.SPACING.l,
    },
    quickLocationButton: {
        backgroundColor: 'rgba(30, 144, 255, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'rgba(30, 144, 255, 0.2)',
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    quickLocationText: {
        fontSize: 13,
        color: '#FDB022',
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    featuredMediaContainer: {
        position: 'relative',
        borderRadius: 28,
        overflow: 'hidden',
        height: '100%',
    },
    featuredMediaCard: {
        borderRadius: 28,
        height: '100%',
    },
    featuredMediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    nearbyMediaCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    // Featured Houses Card Styles (Enhanced Horizontal Layout)
    featuredHouseCard: {
        flexDirection: 'row',
        width: width * 0.88,
        height: 180,
        marginRight: 18,
        marginBottom: 8,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    featuredHouseImageContainer: {
        position: 'relative',
        width: '46%',
        height: '100%',
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
    },
    featuredHouseMediaCard: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
        overflow: 'hidden',
    },
    featuredHouseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    featuredHouseFavoriteIcon: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    propertyTypeBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: '#FDB022',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 10,
        shadowColor: "#FDB022",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    propertyTypeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
        textTransform: 'capitalize',
    },
    featuredHouseDetails: {
        flex: 1,
        padding: 14,
        paddingLeft: 16,
        paddingRight: 14,
        justifyContent: 'flex-start',
        backgroundColor: '#FFFFFF',
    },
    featuredHouseTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 5,
        letterSpacing: -0.4,
        lineHeight: 20,
    },
    featuredHouseRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    featuredHouseRatingText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginLeft: 5,
    },
    featuredHouseLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 2,
    },
    featuredHouseLocationText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 5,
        flex: 1,
        fontWeight: '600',
        letterSpacing: -0.1,
    },
    featuredHousePrice: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FDB022',
        letterSpacing: -0.8,
    },
    featuredHousePriceUnit: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: -0.2,
    },
    // Residential Card Styles (Horizontal List)
    residentialCard: {
        width: width * 0.76,
        marginRight: 16,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    residentialImageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    residentialMediaCard: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    residentialImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    residentialDetails: {
        padding: 14,
        paddingTop: 12,
    },
    residentialTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    residentialLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    residentialLocationText: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 4,
        flex: 1,
        fontWeight: '600',
    },
    residentialPriceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    residentialPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    residentialRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    residentialRatingText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginLeft: 4,
    },
    
    // Banner Modern Styles
    bannerContainerModern: {
        width: width,
        height: height * 0.25,
        marginBottom: 10,
        marginTop: 15,
    },
    
    bannerSlideModern: {
        width: width,
        height: height * 0.25,
        position: 'relative',
    },
    
    bannerImageModern: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    
    bannerIndicators: {
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    
    bannerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    
    bannerDotActive: {
        width: 24,
        backgroundColor: '#FDB022',
    },
    
    // Property Action Buttons Styles
    propertyActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    
    actionButton: {
        backgroundColor: '#FDB022',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
});

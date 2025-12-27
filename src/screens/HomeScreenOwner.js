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
    SafeAreaView,
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
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { getRecentProperties, getResidentialProperties, getCommercialProperties } from '../services/propertyService';
import { getNotificationCount, addTestNotifications } from '../utils/notificationManager';
import { getStoredCredentials, clearUserCredentials } from '../utils/authManager';
import { runCompleteNotificationTest } from '../utils/notificationTest';
import { runChatDiagnostics } from '../utils/chatDiagnostics';
import { runCompleteFCMTest, showFCMTestResults, sendTestFCMNotification } from '../utils/fcmTestService';
import { testAllNotificationStates, createFirebaseTestPayload, debugNotificationIssues, forceTestNotification } from '../utils/notificationTestHelper';
import { showQuickNotificationStatus } from '../utils/notificationStatus';

// Import MediaCard component
import MediaCard from '../components/MediaCard';
import DrawerMenu from '../components/DrawerMenu';
import { getUserProperties } from '../services/propertyService';

// Theme & Layout Constants
const { width, height } = Dimensions.get("window");

// Dummy Data
const DUMMY_PROPERTIES = [
    {
        _id: '1',
        description: 'Sky Dandelions Apartment',
        propertyLocation: 'Jakarta, Indonesia',
        price: 290,
        rating: 4.9,
        purpose: 'Rent',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', type: 'image' }],
        mainCategory: 'residential'
    },
    {
        _id: '2',
        description: 'Pranay Villa',
        propertyLocation: 'Ahmedabad, Gujarat',
        price: 450,
        rating: 4.8,
        purpose: 'Sale',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', type: 'image' }],
        mainCategory: 'residential'
    },
    {
        _id: '3',
        description: 'Modern Office Space',
        propertyLocation: 'Mumbai, Maharashtra',
        price: 850,
        rating: 4.7,
        purpose: 'Rent',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', type: 'image' }],
        mainCategory: 'commercial'
    },
    {
        _id: '4',
        description: 'Luxury Penthouse',
        propertyLocation: 'Delhi, India',
        price: 1200,
        rating: 5.0,
        purpose: 'Sale',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', type: 'image' }],
        mainCategory: 'residential'
    },
    {
        _id: '5',
        description: 'Commercial Plaza',
        propertyLocation: 'Bangalore, Karnataka',
        price: 2500,
        rating: 4.9,
        purpose: 'Rent',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', type: 'image' }],
        mainCategory: 'commercial'
    },
    {
        _id: '6',
        description: 'Beach House Villa',
        propertyLocation: 'Goa, India',
        price: 680,
        rating: 4.8,
        purpose: 'Rent',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', type: 'image' }],
        mainCategory: 'residential'
    },
    {
        _id: '7',
        description: 'Corporate Office',
        propertyLocation: 'Pune, Maharashtra',
        price: 1500,
        rating: 4.6,
        purpose: 'Sale',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800', type: 'image' }],
        mainCategory: 'commercial'
    },
    {
        _id: '8',
        description: 'Garden Apartment',
        propertyLocation: 'Chennai, Tamil Nadu',
        price: 320,
        rating: 4.7,
        purpose: 'Rent',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', type: 'image' }],
        mainCategory: 'residential'
    },
    {
        _id: '9',
        description: 'Retail Shop Space',
        propertyLocation: 'Kolkata, West Bengal',
        price: 450,
        rating: 4.5,
        purpose: 'Rent',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800', type: 'image' }],
        mainCategory: 'commercial'
    },
    {
        _id: '10',
        description: 'Hill View Bungalow',
        propertyLocation: 'Shimla, Himachal Pradesh',
        price: 890,
        rating: 5.0,
        purpose: 'Sale',
        photosAndVideo: [{ uri: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', type: 'image' }],
        mainCategory: 'residential'
    }
];

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
    { id: "1", icon: "home", label: "My\nProperty", color: "#FDB022", gradientColors: ["#FFF4E6", "#FFFFFF"], screen: 'MyPropertyScreen' },
    { id: "2", icon: "receipt", label: "Pay Bill", color: "#FDB022", gradientColors: ["#F0F9FF", "#FFFFFF"], screen: 'PayBillScreen' },
    { id: "3", icon: "card", label: "Pay Rent", color: "#FDB022", gradientColors: ["#F0FDF4", "#FFFFFF"], screen: 'PayRentScreen' },
    { id: "4", icon: "add-circle", label: "Add Property", color: "#FDB022", gradientColors: ["#FEF3F2", "#FFFFFF"], screen: 'AddSell' },
];

// Layout Calculation
const HEADER_HEIGHT = 20;
const FIXED_HEADER_HEIGHT = HEADER_HEIGHT;
// Fallback image for properties without images
const FALLBACK_IMAGE_URI = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=center';

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

const HomeScreenOwner = ({ navigation }) => {
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
    const [ownerProperties, setOwnerProperties] = useState([]);
    const [isLoadingOwnerProperties, setIsLoadingOwnerProperties] = useState(false);

    // UI States
    const [hasUnreadMessages, setHasUnreadMessages] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [drawerVisible, setDrawerVisible] = useState(false);

    // Load properties from API
    const loadProperties = useCallback(async () => {
        setIsLoadingProperties(true);
        
        try {
            console.log('🔄 Loading properties from API...');
            
            // Load all property types in parallel
            const [recentResponse, residentialResponse, commercialResponse] = await Promise.allSettled([
                getRecentProperties(),
                getResidentialProperties(),
                getCommercialProperties()
            ]);
            
            // Handle featured/recent properties
            if (recentResponse.status === 'fulfilled' && recentResponse.value.success) {
                const recentData = recentResponse.value.data || recentResponse.value.properties || [];
                console.log('📦 Recent data received:', recentData);
                setFeaturedProperties(Array.isArray(recentData) ? recentData : []);
                console.log('✅ Featured properties loaded:', recentData.length);
            } else {
                console.warn('⚠️ Failed to load featured properties:', recentResponse.reason || recentResponse.value?.message);
                setFeaturedProperties(DUMMY_PROPERTIES); // Fallback to dummy data
            }
            
            // Handle residential properties
            if (residentialResponse.status === 'fulfilled' && residentialResponse.value.success) {
                const residentialData = residentialResponse.value.data || residentialResponse.value.properties || [];
                console.log('📦 Residential data received:', residentialData);
                setResidentialProperties(Array.isArray(residentialData) ? residentialData : []);
                console.log('✅ Residential properties loaded:', residentialData.length);
            } else {
                console.warn('⚠️ Failed to load residential properties:', residentialResponse.reason || residentialResponse.value?.message);
                setResidentialProperties(DUMMY_PROPERTIES.filter(p => p.propertyType === 'Residential'));
            }
            
            // Handle commercial properties
            if (commercialResponse.status === 'fulfilled' && commercialResponse.value.success) {
                const commercialData = commercialResponse.value.data || commercialResponse.value.properties || [];
                console.log('📦 Commercial data received:', commercialData);
                setCommercialProperties(Array.isArray(commercialData) ? commercialData : []);
                console.log('✅ Commercial properties loaded:', commercialData.length);
            } else {
                console.warn('⚠️ Failed to load commercial properties:', commercialResponse.reason || commercialResponse.value?.message);
                setCommercialProperties(DUMMY_PROPERTIES.filter(p => p.propertyType === 'Commercial'));
            }
            
        } catch (error) {
            console.error('❌ Error loading properties:', error);
            // Fallback to dummy data on error
            setFeaturedProperties(DUMMY_PROPERTIES);
            setResidentialProperties(DUMMY_PROPERTIES.filter(p => p.propertyType === 'Residential'));
            setCommercialProperties(DUMMY_PROPERTIES.filter(p => p.propertyType === 'Commercial'));
        } finally {
            setIsLoadingProperties(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([
            loadProperties(),
            loadOwnerProperties()
        ]);
        setIsRefreshing(false);
    }, [loadProperties, loadOwnerProperties]);

    // Load properties on component mount
    useEffect(() => {
        loadProperties();
        loadOwnerProperties();
    }, [loadProperties]);

    // Load owner's properties
    const loadOwnerProperties = useCallback(async () => {
        setIsLoadingOwnerProperties(true);
        
        try {
            console.log('🏠 Loading owner properties...');
            
            const response = await getUserProperties();
            
            if (response.success && response.properties) {
                console.log('✅ Owner properties loaded:', response.properties.length);
                setOwnerProperties(response.properties);
            } else {
                console.log('❌ Failed to load owner properties:', response.message);
                setOwnerProperties([]);
            }
            
        } catch (error) {
            console.error('❌ Error loading owner properties:', error);
            setOwnerProperties([]);
        } finally {
            setIsLoadingOwnerProperties(false);
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
            focusListener();
        };
    }, [navigation]);

    // Component Logic (simplified for dummy data)
    const toggleFavorite = (id) => {
        const isCurrentlySaved = favorites.includes(id);
        setFavorites((prev) => (isCurrentlySaved ? prev.filter((f) => f !== id) : [...prev, id]));
        DeviceEventEmitter.emit('savedListUpdated', { propertyId: id, action: isCurrentlySaved ? 'removed' : 'added' });
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
        if (screenName === 'MyPropertyScreen') {
            // Pass owner properties to MyPropertyScreen for consistency
            navigation.navigate(screenName, { ownerProperties });
        } else {
            navigation.navigate(screenName);
        }
    };

    const openProperty = (item) => {
        navigation.navigate('PropertyDetailsScreen', { property: item });
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

    const handlePropertyChat = (property) => {
        // Navigate to chat with property owner
        navigation.navigate('ChatDetailScreen', { 
            propertyId: property._id || property.id,
            ownerId: property.ownerId || property.userId,
            propertyTitle: property.description || property.title || 'Property',
            ownerName: property.ownerName || 'Property Owner'
        });
    };

    const handleNotificationPress = () => {
        navigation.navigate('NotificationList');
    };

    // Load notification count
    const loadNotificationCount = async () => {
        try {
            const count = await getNotificationCount();
            setNotificationCount(count);
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
            const firstImage = getFirstImageUrl(item.photosAndVideo);
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
                    // Prepare media items for MediaCard
                    const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
                        ? item.photosAndVideo.map(media => {
                            const originalUri = media.uri || media;
                            const formattedUri = formatImageUrl(originalUri);
                            return {
                                uri: formattedUri || originalUri,
                                type: media.type || (originalUri?.includes('.mp4') || originalUri?.includes('.mov') || originalUri?.includes('.avi') ? 'video' : 'image')
                            };
                        })
                        : [{ uri: item.processedImageUrl, type: 'image' }];

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
                                >
                                    <Icon
                                        name={favorites.includes(item._id) ? "heart" : "heart-outline"}
                                        size={20}
                                        color={favorites.includes(item._id) ? "#EF4444" : "#64748B"}
                                    />
                                </TouchableOpacity>

                                {/* Property Type Badge - Bottom Left */}
                                <View style={styles.propertyTypeBadge}>
                                    <Text style={styles.propertyTypeText}>
                                        {item.purpose || 'Apartment'}
                                    </Text>
                                </View>
                            </View>

                            {/* Property Details - Right Side */}
                            <View style={styles.featuredHouseDetails}>
                                {/* Title */}
                                <Text style={styles.featuredHouseTitle} numberOfLines={2}>
                                    {item.description || 'Sky Dandelions Apartment'}
                                </Text>

                                {/* Location */}
                                <View style={styles.featuredHouseLocation}>
                                    <Icon name="location-outline" size={12} color="#64748B" />
                                    <Text style={styles.featuredHouseLocationText} numberOfLines={1}>
                                        {item.propertyLocation || 'Jakarta, Indonesia'}
                                    </Text>
                                </View>

                                {/* Price */}
                                <Text style={styles.featuredHousePrice}>
                                    {formatPrice(item.price)}
                                    <Text style={styles.featuredHousePriceUnit}>/month</Text>
                                </Text>
                                
                                {/* Action Buttons */}
                                <View style={styles.propertyActionButtons}>
                                    <TouchableOpacity 
                                        style={styles.actionButton}
                                        onPress={() => handlePhoneCall(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="call" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                                        onPress={() => handleWhatsApp(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="logo-whatsapp" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
                                        onPress={() => handlePropertyChat(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="chatbubble-outline" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
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
                    const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
                        ? item.photosAndVideo.map(media => {
                            const originalUri = media.uri || media;
                            const formattedUri = formatImageUrl(originalUri);
                            return {
                                uri: formattedUri || originalUri,
                                type: media.type || (originalUri?.includes('.mp4') || originalUri?.includes('.mov') || originalUri?.includes('.avi') ? 'video' : 'image')
                            };
                        })
                        : [{ uri: item.processedImageUrl, type: 'image' }];

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
                                        {item.propertyLocation || 'Unknown Location'}
                                    </Text>
                                </View>

                                {/* Price */}
                                <Text style={styles.residentialPrice}>
                                    {formatPrice(item.price)}
                                </Text>
                                
                                {/* Action Buttons */}
                                <View style={styles.propertyActionButtons}>
                                    <TouchableOpacity 
                                        style={styles.actionButton}
                                        onPress={() => handlePhoneCall(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="call" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                                        onPress={() => handleWhatsApp(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="logo-whatsapp" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
                                        onPress={() => handlePropertyChat(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="chatbubble-outline" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
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
                            // Prepare media items for MediaCard
                            const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
                                ? item.photosAndVideo.map(media => {
                                    const originalUri = media.uri || media;
                                    const formattedUri = formatImageUrl(originalUri);
                                    return {
                                        uri: formattedUri || originalUri,
                                        type: media.type || (originalUri?.includes('.mp4') || originalUri?.includes('.mov') || originalUri?.includes('.avi') ? 'video' : 'image')
                                    };
                                })
                                : [{ uri: item.processedImageUrl, type: 'image' }];

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
                                        >
                                            <Icon
                                                name={favorites.includes(item._id) ? "heart" : "heart-outline"}
                                                size={24}
                                                color={favorites.includes(item._id) ? "#EF4444" : "#6B7280"}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.nearbyInfo}>
                                        <Text style={styles.nearbyTitle} numberOfLines={1}>
                                            {item.description || 'Estate'}
                                        </Text>
                                        <View style={styles.locationRow}>
                                            <Icon name="location-outline" size={12} color="#64748B" />
                                            <Text style={styles.nearbyLocation} numberOfLines={1}>
                                                {item.propertyLocation || 'Unknown'}
                                            </Text>
                                        </View>
                                        <Text style={styles.nearbyPrice}>{formatPrice(item.price)}</Text>
                                        
                                        {/* Action Buttons */}
                                        <View style={styles.propertyActionButtons}>
                                            <TouchableOpacity 
                                                style={styles.actionButton}
                                                onPress={() => handlePhoneCall(item)}
                                                activeOpacity={0.7}
                                            >
                                                <Icon name="call" size={14} color="#FFFFFF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                                                onPress={() => handleWhatsApp(item)}
                                                activeOpacity={0.7}
                                            >
                                                <Icon name="logo-whatsapp" size={14} color="#FFFFFF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.actionButton, { backgroundColor: '#6B7280' }]}
                                                onPress={() => handlePropertyChat(item)}
                                                activeOpacity={0.7}
                                            >
                                                <Icon name="chatbubble-outline" size={14} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
        );
    };

    // Render Owner Properties Content
    const renderOwnerPropertiesContent = () => {
        if (isLoadingOwnerProperties) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FDB022" />
                    <Text style={styles.loadingText}>Loading your properties...</Text>
                </View>
            );
        }

        if (ownerProperties.length === 0) {
            return (
                <View style={styles.emptyStateContainer}>
                    <Icon name="home-outline" size={48} color="#94A3B8" />
                    <Text style={styles.emptyStateText}>No properties added yet</Text>
                    <Text style={styles.emptyStateSubtext}>Add your first property to get started</Text>
                    <TouchableOpacity 
                        style={styles.addPropertyButton}
                        onPress={() => navigation.navigate('AddSell')}
                    >
                        <Icon name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addPropertyButtonText}>Add Property</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Process owner properties for display
        const processedOwnerProperties = ownerProperties.slice(0, 5).map((item, index) => {
            const firstImage = getFirstImageUrl(item.photosAndVideo);
            const imageUrl = formatImageUrl(firstImage) || FALLBACK_IMAGE_URI;
            
            return {
                ...item,
                processedImageUrl: imageUrl,
                stableKey: `owner_${item._id || index}`
            };
        });

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
            >
                {processedOwnerProperties.map((item, index) => {
                    const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
                        ? item.photosAndVideo.map(media => {
                            const originalUri = media.uri || media;
                            const formattedUri = formatImageUrl(originalUri);
                            return {
                                uri: formattedUri || originalUri,
                                type: media.type || (originalUri?.includes('.mp4') || originalUri?.includes('.mov') ? 'video' : 'image')
                            };
                        })
                        : [{ uri: item.processedImageUrl, type: 'image' }];

                    // Get property status
                    const getPropertyStatus = () => {
                        if (item.isRented) return { status: 'Rented', color: '#10B981', icon: 'checkmark-circle' };
                        if (item.isAvailable === false) return { status: 'Unavailable', color: '#EF4444', icon: 'close-circle' };
                        return { status: 'Available', color: '#FDB022', icon: 'time' };
                    };

                    const propertyStatus = getPropertyStatus();

                    return (
                        <TouchableOpacity
                            key={item.stableKey}
                            style={styles.ownerPropertyCard}
                            onPress={() => navigation.navigate('PropertyDetailsScreen', { property: item })}
                            activeOpacity={0.9}
                        >
                            <View style={styles.ownerPropertyImageContainer}>
                                <MediaCard
                                    mediaItems={mediaItems}
                                    fallbackImage={FALLBACK_IMAGE_URI}
                                    imageStyle={styles.ownerPropertyImage}
                                    showControls={false}
                                    autoPlay={false}
                                    style={styles.ownerPropertyMediaCard}
                                />
                                
                                {/* Status Badge */}
                                <View style={[styles.ownerPropertyStatusBadge, { backgroundColor: propertyStatus.color }]}>
                                    <Icon name={propertyStatus.icon} size={12} color="#FFFFFF" />
                                    <Text style={styles.ownerPropertyStatusText}>{propertyStatus.status}</Text>
                                </View>

                                {/* Edit Button */}
                                <TouchableOpacity 
                                    style={styles.ownerPropertyEditButton}
                                    onPress={() => navigation.navigate('EditPropertyScreen', { property: item })}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="pencil" size={16} color="#FDB022" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.ownerPropertyDetails}>
                                <Text style={styles.ownerPropertyTitle} numberOfLines={1}>
                                    {item.description || item.title || 'My Property'}
                                </Text>

                                <View style={styles.ownerPropertyLocation}>
                                    <Icon name="location-outline" size={12} color="#64748B" />
                                    <Text style={styles.ownerPropertyLocationText} numberOfLines={1}>
                                        {item.propertyLocation || item.address || 'Location'}
                                    </Text>
                                </View>

                                <Text style={styles.ownerPropertyPrice}>
                                    {formatPrice(item.price || item.rentAmount)}
                                    <Text style={styles.ownerPropertyPriceUnit}>/month</Text>
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    // Manual location selection functionality removed

    // Stable render key
    const stableRenderKey = useMemo(() => {
        return 'home_dummy_data';
    }, []);

    return (
        <SafeAreaView style={styles.container} key={stableRenderKey}>
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
                            name="menu" 
                            size={24} 
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
                    {/* Get Started With Section */}
                    <View style={styles.getStartedSectionModern}>
                        <Text style={styles.getStartedTitleModern}>Get Started with</Text>
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
                                            <Text style={styles.actionButtonTextModern}>{item.label}</Text>
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
        </SafeAreaView>
    );
};

export default HomeScreenOwner;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    
    // Modern Header Styles
    modernHeader: {
        paddingTop: Platform.OS === 'ios' ? 3 : StatusBar.currentHeight + 3,
        paddingHorizontal: 16,
        paddingBottom: 3,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 8,
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },

    menuButtonModern: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(253, 176, 34, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(253, 176, 34, 0.3)',
    },

    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    headerLogoImage: {
        width: 120,
        height: 40,
    },
    
    headerSpacer: {
        flex: 1,
    },
    
    notificationButtonModern: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    
    notificationIconModern: {
        position: 'relative',
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
    newHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        marginTop: 32,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: '#1F2937',
        letterSpacing: -0.6,
        flex: 1,
    },
    seeAllText: {
        color: '#FDB022',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: -0.3,
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
    getStartedSectionModern: {
        paddingHorizontal: 20,
        marginTop: 25,
        marginBottom: 20,
    },
    
    getStartedTitleModern: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    
    quickActionsRowModern: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    
    actionButtonModern: {
        flex: 1,
        height: 95,
        marginHorizontal: 4,
    },
    
    materialCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'visible',
        marginTop: 12,
    },
    
    floatingIconContainer: {
        position: 'absolute',
        top: -12,
        left: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 10,
    },
    
    cardContent: {
        flex: 1,
        paddingTop: 24,
        paddingHorizontal: 12,
        paddingBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    
    actionButtonTextModern: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 14,
        color: '#374151',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    horizontalScrollContainer: {
        paddingHorizontal: theme.SPACING.l,
        paddingBottom: 24,
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
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F9FAFB',
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
        height: 120,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        resizeMode: 'cover',
        backgroundColor: '#E5E7EB',
    },
    nearbyInfo: {
        padding: 12,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
    },
    nearbyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: -0.3,
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
    },
    featuredHouseMediaCard: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
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
    },
    residentialMediaCard: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
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

    // Owner Properties Styles
    ownerPropertiesSection: {
        marginBottom: 20,
    },

    propertyCountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },

    propertyCountText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },

    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },

    emptyStateContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        marginHorizontal: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderStyle: 'dashed',
    },

    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
        marginTop: 12,
        marginBottom: 4,
    },

    emptyStateSubtext: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        textAlign: 'center',
    },

    addPropertyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDB022',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },

    addPropertyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    ownerPropertyCard: {
        width: width * 0.72,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },

    ownerPropertyImageContainer: {
        position: 'relative',
        width: '100%',
        height: 120,
        backgroundColor: '#F1F5F9',
    },

    ownerPropertyMediaCard: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },

    ownerPropertyImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },

    ownerPropertyStatusBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        gap: 4,
    },

    ownerPropertyStatusText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },

    ownerPropertyEditButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },

    ownerPropertyDetails: {
        padding: 12,
    },

    ownerPropertyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: -0.2,
    },

    ownerPropertyLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    ownerPropertyLocationText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
        flex: 1,
        fontWeight: '500',
    },

    ownerPropertyPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FDB022',
        letterSpacing: -0.4,
    },

    ownerPropertyPriceUnit: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
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


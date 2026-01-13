import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
    StatusBar,
    Platform,
    Animated,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getRecentProperties } from '../services/propertyService';

const { width } = Dimensions.get('window');

// Helper function to format image URLs
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

// Helper function to get the first image URL from media array
const getFirstImageUrl = (photosAndVideo) => {
    if (!photosAndVideo || photosAndVideo.length === 0) return null;
    
    // Find the first image (not video) if possible
    const firstImage = photosAndVideo.find(media => {
        const mediaPath = (typeof media === 'string') ? media : (media?.uri || media);
        if (!mediaPath) return false;
        
        return mediaPath.includes('.jpg') || mediaPath.includes('.jpeg') || 
               mediaPath.includes('.png') || mediaPath.includes('.webp') || 
               mediaPath.includes('.gif');
    });
    
    if (firstImage) {
        return (typeof firstImage === 'string') ? firstImage : (firstImage.uri || firstImage);
    }
    
    // If no image found, return the first item anyway
    const firstItem = photosAndVideo[0];
    return (typeof firstItem === 'string') ? firstItem : (firstItem?.uri || firstItem);
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';

// ---- Animated Property Card ----
const PropertyCard = ({ property, navigation }) => {
    const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

    React.useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [scaleAnim]);

    const handleImageError = () => {
        console.log('Image failed to load for property:', property.title);
    };

    const handleCardPress = () => {
        navigation.navigate('PropertyDetailsScreen', { 
            property: property,
            propertyId: property.id 
        });
    };

    const handleHeartPress = (e) => {
        e.stopPropagation();
        // Handle favorite functionality here
        console.log('Added to favorites:', property.title);
    };

    return (
        <TouchableOpacity 
            style={[cardStyles.card, { transform: [{ scale: scaleAnim }] }]}
            activeOpacity={0.95}
            onPress={handleCardPress}
        >
            <View style={cardStyles.imageWrapper}>
                <Image 
                    source={{ uri: property.image || FALLBACK_IMAGE }} 
                    style={cardStyles.image}
                    onError={handleImageError}
                    resizeMode="cover"
                />
                
                {/* Gradient overlay */}
                <View style={cardStyles.gradientOverlay} />
                
                {/* Heart button */}
                <TouchableOpacity 
                    style={cardStyles.heartButton}
                    activeOpacity={0.7}
                    accessibilityLabel="Add to favorites"
                    onPress={handleHeartPress}
                >
                    <Icon name="heart-outline" size={18} color="#fff" />
                </TouchableOpacity>

                {/* Property type badge */}
                <View style={cardStyles.propertyBadge}>
                    <Text style={cardStyles.propertyBadgeText}>FOR RENT</Text>
                </View>

                {/* Price tag */}
                <View style={cardStyles.priceContainer}>
                    <Text style={cardStyles.priceText}>₹{property.price}</Text>
                    <Text style={cardStyles.priceSubtext}>/month</Text>
                </View>
            </View>

            <View style={cardStyles.cardContent}>
                {/* Title and rating */}
                <View style={cardStyles.titleRow}>
                    <Text style={cardStyles.title} numberOfLines={1}>{property.title}</Text>
                    <View style={cardStyles.ratingContainer}>
                        <Icon name="star" size={12} color="#FDB022" />
                        <Text style={cardStyles.rating}>4.8</Text>
                    </View>
                </View>

                {/* Location */}
                <View style={cardStyles.locationRow}>
                    <Icon name="location-outline" size={14} color="#9CA3AF" />
                    <Text style={cardStyles.location} numberOfLines={1}>{property.location}</Text>
                </View>

                {/* Features */}
                <View style={cardStyles.featuresRow}>
                    <View style={cardStyles.featureItem}>
                        <View style={cardStyles.featureIcon}>
                            <Icon name="bed-outline" size={12} color="#FDB022" />
                        </View>
                        <Text style={cardStyles.featureText}>{property.beds}</Text>
                    </View>
                    
                    <View style={cardStyles.featureItem}>
                        <View style={cardStyles.featureIcon}>
                            <Icon name="water-outline" size={12} color="#FDB022" />
                        </View>
                        <Text style={cardStyles.featureText}>{property.baths}</Text>
                    </View>
                    
                    <View style={cardStyles.featureItem}>
                        <View style={cardStyles.featureIcon}>
                            <Icon name="resize-outline" size={12} color="#FDB022" />
                        </View>
                        <Text style={cardStyles.featureText}>1200 sq ft</Text>
                    </View>
                </View>

                {/* Action buttons */}
                <View style={cardStyles.actionRow}>
                    <TouchableOpacity 
                        style={cardStyles.contactButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            // Handle call functionality
                            console.log('Calling for property:', property.title);
                        }}
                    >
                        <Icon name="call-outline" size={14} color="#FDB022" />
                        <Text style={cardStyles.contactText}>Call</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={cardStyles.viewButton}
                        onPress={handleCardPress}
                    >
                        <Text style={cardStyles.viewText}>View Details</Text>
                        <Icon name="arrow-forward" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [properties, setProperties] = useState([]);
    const [error, setError] = useState(null);

    // Fetch properties from API on mount
    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('🔍 [SearchScreen] Fetching all properties from API...');
            
            const response = await getRecentProperties();
            console.log('📦 [SearchScreen] API Response:', response);
            
            if (response.success && response.data && response.data.length > 0) {
                // Transform API data to match component format
                const transformedProperties = response.data.map((item, index) => {
                    // Get first image - matching PropertyDetailsScreen logic
                    let firstImageUrl = null;
                    
                    // Backend sends photos array (preferred)
                    if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
                        const firstPhoto = item.photos[0];
                        if (firstPhoto && typeof firstPhoto === 'string') {
                            firstImageUrl = formatImageUrl(firstPhoto);
                        }
                    }
                    
                    // Fallback to photosAndVideo
                    if (!firstImageUrl && item.photosAndVideo && Array.isArray(item.photosAndVideo) && item.photosAndVideo.length > 0) {
                        const firstMedia = item.photosAndVideo[0];
                        const mediaUrl = firstMedia.uri || firstMedia;
                        if (mediaUrl && typeof mediaUrl === 'string') {
                            firstImageUrl = formatImageUrl(mediaUrl);
                        }
                    }
                    
                    // Fallback to images array
                    if (!firstImageUrl && item.images && Array.isArray(item.images) && item.images.length > 0) {
                        firstImageUrl = formatImageUrl(item.images[0]);
                    }
                    
                    // Final fallback to single image field
                    if (!firstImageUrl && item.image) {
                        firstImageUrl = formatImageUrl(item.image);
                    }
                    
                    const imageUrl = firstImageUrl || FALLBACK_IMAGE;
                    
                    // Debug logging for first 2 properties
                    if (index < 2) {
                        console.log(`🏠 Property ${index + 1} [${item.description || item.title}]:`, {
                            hasPhotos: !!item.photos,
                            photosCount: item.photos?.length || 0,
                            firstPhoto: item.photos?.[0],
                            finalImageUrl: imageUrl
                        });
                    }
                    
                    return {
                        id: item._id || item.id || `property_${index}`,
                        title: item.description || item.title || 'Property',
                        location: [item.locality, item.city, item.state].filter(Boolean).join(', ') || item.propertyLocation || 'Location',
                        price: item.price ? item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0',
                        beds: item.bedrooms || 2,
                        baths: item.bathrooms || 2,
                        image: imageUrl,
                        ...item // Keep all original data for details screen
                    };
                });
                
                setProperties(transformedProperties);
                console.log('✅ [SearchScreen] Loaded', transformedProperties.length, 'properties from API');
            } else {
                console.warn('⚠️ [SearchScreen] API returned no data');
                setError('No properties available');
                setProperties([]);
            }
        } catch (error) {
            console.error('❌ [SearchScreen] Error loading properties:', error);
            setError(error.message || 'Failed to load properties');
            setProperties([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = properties.filter(
        (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (text) => {
        setSearchQuery(text);
    };

    const renderEmptyState = () => {
        if (isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#FDB022" />
                    <Text style={styles.emptySubtitle}>Loading properties...</Text>
                </View>
            );
        }
        
        if (error) {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="alert-circle-outline" size={60} color="#EF4444" />
                    <Text style={styles.emptyTitle}>Error loading properties</Text>
                    <Text style={styles.emptySubtitle}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={loadProperties}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        return (
            <View style={styles.emptyContainer}>
                <Icon name="home-outline" size={60} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No properties found</Text>
                <Text style={styles.emptySubtitle}>
                    {searchQuery ? 'Try adjusting your search terms' : 'No properties available'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar 
                backgroundColor={Platform.OS === 'android' ? '#F3F4F6' : undefined}
                barStyle="dark-content" 
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation?.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                    accessibilityLabel="Go back"
                >
                    <Icon name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Find Your Home</Text>

                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrapper}>
                <View style={styles.searchBar}>
                    <Icon name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search city, area or address"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        accessibilityLabel="Search properties"
                        returnKeyType="search"
                        numberOfLines={1}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Icon name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity 
                    style={styles.filterButton}
                    activeOpacity={0.8}
                    accessibilityLabel="Filter properties"
                >
                    <Icon name="options-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Results Count */}
            {searchQuery.length > 0 && (
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsText}>
                        {filtered.length} properties found
                    </Text>
                </View>
            )}

            {/* Property List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PropertyCard property={item} navigation={navigation} />}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                refreshing={isLoading}
                onRefresh={loadProperties}
            />
        </SafeAreaView>
    );
};

// ---- Card Styles ----
const cardStyles = StyleSheet.create({
    card: {
        width: width * 0.92,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignSelf: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    imageWrapper: {
        position: 'relative',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heartButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    propertyBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    propertyBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    priceContainer: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    priceSubtext: {
        fontSize: 12,
        fontWeight: '500',
        color: '#E5E7EB',
        marginLeft: 2,
    },
    cardContent: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7E6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    rating: {
        fontSize: 11,
        fontWeight: '600',
        color: '#92400E',
        marginLeft: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    location: {
        marginLeft: 4,
        color: '#6B7280',
        fontSize: 13,
        flex: 1,
    },
    featuresRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    featureIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF4E6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF4E6',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDB022',
    },
    contactText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FDB022',
        marginLeft: 4,
    },
    viewButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDB022',
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    viewText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginRight: 4,
    },
});

// ---- Screen Styles ----
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    searchBarWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
        marginTop: 5,
    },
    searchBar: {
        flexDirection: 'row',
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        height: 52,
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        marginLeft: 10,
        fontSize: 15,
        flex: 1,
        color: '#111827',
        paddingVertical: 0,
    },
    clearButton: {
        padding: 4,
    },
    filterButton: {
        width: 52,
        height: 52,
        backgroundColor: '#FDB022',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        shadowColor: '#FDB022',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    resultsHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    resultsText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    listContainer: {
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#FDB022',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});

export default SearchScreen;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
    StatusBar,
    Platform,
    Animated,
    ActivityIndicator,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { DeviceEventEmitter } from 'react-native';
import { getRecentProperties } from '../services/propertyService';
import propertyService from '../services/propertyapi';
import { useSubscription } from '../context/SubscriptionContext';
import SubscriptionModal from '../components/SubscriptionModal';

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
        return `https://kiraeydarback.bhoomi.cloud/${url}`;
    }
    
    // For other relative paths, add base URL
    return url.startsWith('/') ? `https://kiraeydarback.bhoomi.cloud${url}` : `https://kiraeydarback.bhoomi.cloud/${url}`;
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
const PropertyCard = ({ property, onPress, toggleFavorite, favorites, loadingSaveProperty }) => {
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
        onPress(property);
    };

    const handleHeartPress = (e) => {
        e.stopPropagation();
        toggleFavorite(property.id || property._id);
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
                    disabled={loadingSaveProperty === (property.id || property._id)}
                >
                    {loadingSaveProperty === (property.id || property._id) ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                        <Icon 
                            name={favorites.includes(property.id || property._id) ? "heart" : "heart-outline"} 
                            size={18} 
                            color={favorites.includes(property.id || property._id) ? "#EF4444" : "#fff"} 
                        />
                    )}
                </TouchableOpacity>

                {/* Price tag */}
                <View style={cardStyles.priceContainer}>
                    <Text style={cardStyles.priceText}>₹{property.price}</Text>
                    <Text style={cardStyles.priceSubtext}>/month</Text>
                </View>
            </View>

            <View style={cardStyles.cardContent}>
                {/* Title */}
                <View style={cardStyles.titleRow}>
                    <Text style={cardStyles.title} numberOfLines={1}>{property.title}</Text>
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
                        <Text style={cardStyles.featureText}>{property.area || property.areaSqFt || property.areaDetails || 'N/A'} sq ft</Text>
                    </View>
                </View>

                {/* Action buttons */}
                <View style={cardStyles.actionRow}>
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
    // Subscription context
    const { userHasPackage, setPropertyForSubscription, loadActiveSubscription } = useSubscription();
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [properties, setProperties] = useState([]);
    const [error, setError] = useState(null);
    
    // Favorites state
    const [favorites, setFavorites] = useState([]);
    const [loadingSaveProperty, setLoadingSaveProperty] = useState(null);
    
    // Filter state
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        propertyType: '',
        purpose: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
    });
    
    // Filter options
    const propertyTypes = ['House', 'Apartment', 'Villa', 'Plot', 'Commercial', 'Office'];
    const purposes = ['Rent', 'Lease'];
    const bedroomOptions = ['1', '2', '3', '4', '5+'];
    const priceRanges = [
        { label: 'Under ₹10K', min: '0', max: '10000' },
        { label: '₹10K - ₹25K', min: '10000', max: '25000' },
        { label: '₹25K - ₹50K', min: '25000', max: '50000' },
        { label: '₹50K - ₹1L', min: '50000', max: '100000' },
        { label: 'Above ₹1L', min: '100000', max: '' },
    ];
    
    // Count active filters
    const activeFiltersCount = useMemo(() => {
        return Object.values(filters).filter(v => v && v.toString().trim() !== '').length;
    }, [filters]);

    // Fetch properties from API on mount
    useEffect(() => {
        loadProperties();
        loadSavedProperties();
    }, []);

    // Load saved properties
    const loadSavedProperties = useCallback(async () => {
        try {
            const response = await propertyService.getSavedProperties();
            if (response.success && response.savedProperties && Array.isArray(response.savedProperties)) {
                const savedIds = response.savedProperties
                    .filter(p => p !== null && p !== undefined)
                    .map(p => p._id || p.id)
                    .filter(Boolean);
                setFavorites(savedIds);
                console.log('✅ Loaded saved properties:', savedIds.length);
            }
        } catch (error) {
            console.error('Error loading saved properties:', error);
        }
    }, []);

    // Toggle favorite property
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
                    
                    // ✅ Get location from nested address object (backend format)
                    let locationStr = 'Location';
                    if (item.address && typeof item.address === 'object') {
                        const { locality, city, state } = item.address;
                        locationStr = [locality, city, state].filter(Boolean).join(', ') || 'Location';
                    } else {
                        locationStr = [item.locality, item.city, item.state].filter(Boolean).join(', ') || item.propertyLocation || 'Location';
                    }
                    
                    return {
                        id: item._id || item.id || `property_${index}`,
                        title: item.description || item.title || 'Property',
                        location: locationStr,
                        price: item.price ? item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0',
                        beds: item.bedrooms || 0,
                        baths: item.bathrooms || 0,
                        area: item.areaSqFt || item.areaDetails || item.area || null,
                        purpose: item.purpose || 'Rent',
                        status: item.status || 'pending',
                        image: imageUrl,
                        ...item // Keep all original data for details screen
                    };
                });
                
                // ✅ Filter only approved properties
                const approvedProperties = transformedProperties.filter(p => 
                    p.status === 'approved' || p.approvalStatus === 'Approved'
                );
                
                setProperties(approvedProperties);
                console.log('✅ [SearchScreen] Loaded', approvedProperties.length, 'approved properties from', transformedProperties.length, 'total');
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

    // Apply filters and search
    const filtered = useMemo(() => {
        let result = [...properties];
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title?.toLowerCase().includes(query) ||
                p.location?.toLowerCase().includes(query) ||
                p.propertyType?.toLowerCase().includes(query)
            );
        }
        
        // Property type filter
        if (filters.propertyType) {
            result = result.filter(p => 
                p.propertyType?.toLowerCase().includes(filters.propertyType.toLowerCase())
            );
        }
        
        // Purpose filter
        if (filters.purpose) {
            result = result.filter(p => 
                p.purpose?.toLowerCase().includes(filters.purpose.toLowerCase())
            );
        }
        
        // Min price filter
        if (filters.minPrice) {
            const minPrice = parseFloat(filters.minPrice);
            result = result.filter(p => {
                const price = parseFloat(p.price?.toString().replace(/,/g, '')) || 0;
                return price >= minPrice;
            });
        }
        
        // Max price filter
        if (filters.maxPrice) {
            const maxPrice = parseFloat(filters.maxPrice);
            result = result.filter(p => {
                const price = parseFloat(p.price?.toString().replace(/,/g, '')) || 0;
                return price <= maxPrice;
            });
        }
        
        // Bedrooms filter
        if (filters.bedrooms) {
            const beds = filters.bedrooms === '5+' ? 5 : parseInt(filters.bedrooms);
            result = result.filter(p => {
                const propBeds = parseInt(p.beds) || 0;
                if (filters.bedrooms === '5+') return propBeds >= 5;
                return propBeds === beds;
            });
        }
        
        return result;
    }, [properties, searchQuery, filters]);
    
    // Clear all filters
    const clearFilters = () => {
        setFilters({
            propertyType: '',
            purpose: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
        });
    };
    
    // Select price range
    const selectPriceRange = (range) => {
        setFilters(prev => ({
            ...prev,
            minPrice: range.min,
            maxPrice: range.max
        }));
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
    };

    const handleSubscriptionSuccess = () => {
        setShowSubscriptionModal(false);
        // Refresh subscription status
        loadActiveSubscription();
        // After subscription, user will have package and can view properties
    };

    const handlePropertyPress = (property) => {
        // Check if user has active subscription
        if (!userHasPackage) {
            setPropertyForSubscription(property);
            setShowSubscriptionModal(true);
            return;
        }
        
        // User has subscription, navigate to details
        navigation.navigate('PropertyDetailsScreen', { 
            property: property,
            propertyId: property.id 
        });
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
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar 
                backgroundColor="#F8FAFC"
                barStyle="dark-content"
                translucent={false}
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
                    style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
                    activeOpacity={0.8}
                    accessibilityLabel="Filter properties"
                    onPress={() => setShowFilterModal(true)}
                >
                    <Icon name="options-outline" size={22} color="#fff" />
                    {activeFiltersCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Results Count */}
            {(searchQuery.length > 0 || activeFiltersCount > 0) && (
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsText}>
                        {filtered.length} properties found
                    </Text>
                    {activeFiltersCount > 0 && (
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearFiltersText}>Clear filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Property List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PropertyCard property={item} onPress={handlePropertyPress} toggleFavorite={toggleFavorite} favorites={favorites} loadingSaveProperty={loadingSaveProperty} />}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                refreshing={isLoading}
                onRefresh={loadProperties}
            />
            
            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Properties</Text>
                            <TouchableOpacity 
                                onPress={() => setShowFilterModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Icon name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {/* Property Type Filter */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Property Type</Text>
                                <View style={styles.filterRow}>
                                    {propertyTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.filterChip,
                                                filters.propertyType === type && styles.filterChipActive
                                            ]}
                                            onPress={() => setFilters(prev => ({
                                                ...prev,
                                                propertyType: prev.propertyType === type ? '' : type
                                            }))}
                                        >
                                            <Text style={[
                                                styles.filterChipText,
                                                filters.propertyType === type && styles.filterChipTextActive
                                            ]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Purpose Filter */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Purpose</Text>
                                <View style={styles.filterRow}>
                                    {purposes.map((purpose) => (
                                        <TouchableOpacity
                                            key={purpose}
                                            style={[
                                                styles.filterChip,
                                                filters.purpose === purpose && styles.filterChipActive
                                            ]}
                                            onPress={() => setFilters(prev => ({
                                                ...prev,
                                                purpose: prev.purpose === purpose ? '' : purpose
                                            }))}
                                        >
                                            <Text style={[
                                                styles.filterChipText,
                                                filters.purpose === purpose && styles.filterChipTextActive
                                            ]}>
                                                {purpose}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Bedrooms Filter */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Bedrooms</Text>
                                <View style={styles.filterRow}>
                                    {bedroomOptions.map((bed) => (
                                        <TouchableOpacity
                                            key={bed}
                                            style={[
                                                styles.filterChip,
                                                filters.bedrooms === bed && styles.filterChipActive
                                            ]}
                                            onPress={() => setFilters(prev => ({
                                                ...prev,
                                                bedrooms: prev.bedrooms === bed ? '' : bed
                                            }))}
                                        >
                                            <Text style={[
                                                styles.filterChipText,
                                                filters.bedrooms === bed && styles.filterChipTextActive
                                            ]}>
                                                {bed} BHK
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Price Range Filter */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Price Range (₹/month)</Text>
                                <View style={styles.filterRow}>
                                    {priceRanges.map((range, index) => {
                                        const isSelected = filters.minPrice === range.min && filters.maxPrice === range.max;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.filterChip,
                                                    isSelected && styles.filterChipActive
                                                ]}
                                                onPress={() => selectPriceRange(range)}
                                            >
                                                <Text style={[
                                                    styles.filterChipText,
                                                    isSelected && styles.filterChipTextActive
                                                ]}>
                                                    {range.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                
                                {/* Custom Price Range */}
                                <View style={styles.priceInputContainer}>
                                    <View style={styles.priceInputWrapper}>
                                        <Text style={styles.priceInputLabel}>Min</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            placeholder="₹0"
                                            value={filters.minPrice}
                                            onChangeText={(text) => setFilters(prev => ({ ...prev, minPrice: text }))}
                                            keyboardType="numeric"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                    <Text style={styles.priceInputSeparator}>-</Text>
                                    <View style={styles.priceInputWrapper}>
                                        <Text style={styles.priceInputLabel}>Max</Text>
                                        <TextInput
                                            style={styles.priceInput}
                                            placeholder="Any"
                                            value={filters.maxPrice}
                                            onChangeText={(text) => setFilters(prev => ({ ...prev, maxPrice: text }))}
                                            keyboardType="numeric"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearFilters}
                            >
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setShowFilterModal(false)}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Subscription Modal */}
            <SubscriptionModal
                visible={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                onSuccess={handleSubscriptionSuccess}
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
    viewButton: {
        flex: 1,
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
    filterButtonActive: {
        backgroundColor: '#E89E0F',
    },
    filterBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    clearFiltersText: {
        color: '#FDB022',
        fontSize: 14,
        fontWeight: '600',
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    // Filter Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        padding: 20,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    filterChipActive: {
        backgroundColor: '#FDB022',
        borderColor: '#FDB022',
    },
    filterChipText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    priceInputWrapper: {
        flex: 1,
    },
    priceInputLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    priceInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    priceInputSeparator: {
        marginHorizontal: 12,
        color: '#6B7280',
        fontSize: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 12,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    applyButton: {
        flex: 2,
        backgroundColor: '#FDB022',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default SearchScreen;

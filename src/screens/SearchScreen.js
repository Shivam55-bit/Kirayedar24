import React, { useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

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
                    source={{ uri: property.image }} 
                    style={cardStyles.image}
                    onError={handleImageError}
                    defaultSource={{ uri: 'https://via.placeholder.com/400x250/E5E7EB/9CA3AF?text=Property' }}
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

const MOCK_PROPERTIES = [
    { id: '1', title: 'Sky Dandelions Apartment', location: 'Ahmedabad, Gujarat', price: '25,000', beds: 2, baths: 2, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800' },
    { id: '2', title: 'Sunset View Villa', location: 'Mumbai, Maharashtra', price: '45,000', beds: 4, baths: 3, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' },
    { id: '3', title: 'Downtown Studio', location: 'Delhi, India', price: '18,000', beds: 1, baths: 1, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
    { id: '4', title: 'Lakeside Cabin', location: 'Bangalore, Karnataka', price: '32,000', beds: 3, baths: 2, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800' },
];

const SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const filtered = MOCK_PROPERTIES.filter(
        (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (text) => {
        setSearchQuery(text);
        // Simulate loading state for better UX
        if (text.length > 0) {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 300);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="home-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search terms</Text>
        </View>
    );

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
                        placeholder="Search by city, area, or address"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        accessibilityLabel="Search properties"
                        returnKeyType="search"
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
                ListEmptyComponent={searchQuery.length > 0 ? renderEmptyState : null}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
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
        fontSize: 16,
        flex: 1,
        color: '#111827',
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
});

export default SearchScreen;

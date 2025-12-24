import React, { useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { DeviceEventEmitter } from 'react-native';
// Import API services and helper functions
import { formatImageUrl, formatPrice } from '../services/propertyHelpers'; 
import propertyService from '../services/propertyapi';

// Fallback image URL when a property has no photo link
const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/180x180.png?text=No+Image';

const SavedScreen = ({ navigation }) => {
    const [search, setSearch] = useState("");
    // removed comparison feature state (not needed anymore)
    const [properties, setProperties] = useState([]); 
    const [loadingId, setLoadingId] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadSaved = useCallback(async () => {
        setLoading(true);
        try {
            const responseData = await propertyService.getSavedProperties(); 
            console.log('[SavedScreen] getSavedProperties responseData:', responseData);
            let data = [];

            // 1. **CRITICAL FIX: Extract data from savedProperties array**
            if (responseData && responseData.savedProperties && Array.isArray(responseData.savedProperties)) {
                data = responseData.savedProperties;
            } else if (Array.isArray(responseData.data)) {
                data = responseData.data;
            } else if (Array.isArray(responseData)) {
                data = responseData;
            }
            
            if (Array.isArray(data)) {
                // 2. **FIX: Filter out null entries from the array**
                data = data.filter(Boolean); 
                
                console.log('[SavedScreen] Raw property data sample:', data[0] || 'No data');
                console.log('[SavedScreen] Total properties:', data.length); 

                const mapped = data.map(p => {
                    // 3. **FIXED: Use exact API field names**
                    const primaryLocation = p.propertyLocation || p.location || p.address || 'Unknown Location';
                    const primaryType = p.propertyType || p.type || p.tag || '';
                    
                    let imageUrl = DEFAULT_IMAGE_URL;

                    // 4. **IMPROVED: Handle image path and format it with base URL**
                    console.log('[SavedScreen] Processing property:', p.description || p.title, {
                        photosAndVideo: p.photosAndVideo,
                        images: p.images,
                        image: p.image
                    });
                    
                    if (p.photosAndVideo && p.photosAndVideo.length > 0) {
                        const firstPhoto = p.photosAndVideo[0];
                        const rawPath = typeof firstPhoto === 'string' 
                            ? firstPhoto 
                            : (firstPhoto?.url || firstPhoto?.uri || firstPhoto);

                        if (rawPath) {
                            imageUrl = formatImageUrl(rawPath);
                            console.log('[SavedScreen] Using photosAndVideo:', rawPath, '→', imageUrl);
                        }
                    } else if (p.images && p.images.length > 0) {
                        const firstImage = p.images[0];
                        const rawPath = typeof firstImage === 'string' 
                            ? firstImage 
                            : (firstImage?.url || firstImage?.uri || firstImage);
                        if (rawPath) {
                            imageUrl = formatImageUrl(rawPath);
                            console.log('[SavedScreen] Using images array:', rawPath, '→', imageUrl);
                        }
                    } else if (p.image) {
                        // Single image field
                        const rawPath = typeof p.image === 'string' ? p.image : p.image?.url || p.image?.uri;
                        if (rawPath) {
                            imageUrl = formatImageUrl(rawPath);
                            console.log('[SavedScreen] Using single image:', rawPath, '→', imageUrl);
                        }
                    }
                    
                    console.log('[SavedScreen] Final imageUrl for property:', imageUrl);

                    return {
                        // Use _id as the primary unique identifier
                        id: p._id || p.id || p.propertyId || String(p._id || Date.now()),
                        title: p.description || p.title || p.name || 'Untitled Property',
                        price: p.price || p.listPrice || p.sellingPrice || 'N/A', 
                        location: primaryLocation,
                        image: { uri: imageUrl },
                        tag: primaryType,
                        isSaved: true,
                    };
                });
                setProperties(mapped);
            } else {
                setProperties([]);
            }
        } catch (err) {
            console.error('Error loading saved properties:', err);
            Alert.alert("Error", err.message || "Failed to load shortlisted properties. Please check your network or API status.");
            setProperties([]);
        } finally {
            setLoading(false);
        };

    }, []);

    React.useEffect(() => {
        loadSaved();
    }, [loadSaved]);

    // Listen for save/remove events from other screens so we can refresh immediately
    React.useEffect(() => {
        const sub = DeviceEventEmitter.addListener('savedListUpdated', (payload) => {
            loadSaved();
        });
        return () => sub.remove();
    }, [loadSaved]);

    useFocusEffect(
        useCallback(() => {
            if (!loading) {
                loadSaved();
            }
            return () => {};
        }, [loadSaved, loading])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadSaved();
        } catch (e) {
            console.error('Refresh failed', e);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRemoveProperty = useCallback((propertyId) => {
        Alert.alert(
            "Remove Property",
            "Are you sure you want to remove this property from your shortlist?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "Remove", 
                    style: "destructive",
                    onPress: async () => {
                        setLoadingId(propertyId);
                        try {
                            // Using the dedicated DELETE function as it is clearer for removal
                            await propertyService.removeSavedProperty(propertyId); 
                            await loadSaved();

                        } catch (error) {
                            console.error("Remove Property failed:", error);
                            Alert.alert("Error", error.message || "Failed to remove property. Please retry.");
                        } finally {
                            setLoadingId(null);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    }, [loadSaved]);

    // comparison handlers removed

    const filteredProperties = properties.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.tag.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => {
        console.log('[SavedScreen] Rendering item:', item.title, 'with image:', item.image);
        
        return (
            <View style={styles.cardRow}>
                <Image
                    source={item.image || { uri: DEFAULT_IMAGE_URL }}
                    style={styles.imageRow}
                    resizeMode="cover"
                    onError={(error) => {
                        console.log('[SavedScreen] Image load error for:', item.title, error.nativeEvent.error);
                    }}
                    onLoad={() => {
                        console.log('[SavedScreen] Image loaded successfully for:', item.title);
                    }}
                />

                <View style={styles.infoRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.location} numberOfLines={1}><Icon name="location-outline" size={12} color="#777" /> {item.location}</Text>
                        <View style={styles.tagRow}><Text style={styles.tagText}>{item.tag}</Text></View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.priceTextRow}>{typeof item.price === 'number' ? formatPrice(item.price) : item.price}</Text>
                        <TouchableOpacity style={styles.deleteCircle} onPress={() => handleRemoveProperty(item.id)} disabled={loadingId === item.id}>
                            {loadingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="trash-outline" size={16} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
                <Icon name="heart-outline" size={80} color="#EF4444" />
                <Text style={styles.emptyTextTitle}>No property shortlisted</Text>
                <Text style={styles.emptyTextSubtitle}>You haven't shortlisted any properties yet. Tap the heart on a listing to save it here.</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('AllPropertiesScreen')}>
                    <Text style={styles.browseBtnText}>Browse Properties</Text>
                </TouchableOpacity>
            </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRowTop}>
                <Text style={styles.header}>Shortlisted Properties</Text>
                <Text style={styles.countText}>{properties.length} saved</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="search-outline" size={20} color="#555" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search shortlisted properties..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredProperties}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={renderEmpty}
            />

            {/* Comparison feature removed */}
        </View>
    );
};

// ----------------------------------------------------------------
// ## Stylesheet
// ----------------------------------------------------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f9f9", paddingHorizontal: 15 },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#222",
        paddingTop: 40,
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        borderRadius: 10,
        elevation: 2,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 10 },

    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    image: { width: "100%", height: 180, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    priceTag: {
        position: "absolute",
        bottom: 10,
        left: 10,
        backgroundColor: "rgba(30, 136, 229,0.9)",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    priceText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

    deleteBtn: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "rgba(211, 47, 47, 0.8)", // Reddish background for delete
        borderRadius: 20,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },

    checkbox: {
        position: "absolute",
        top: 10,
        left: 10,
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#fff",
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxSelected: { backgroundColor: "#FDB022", borderColor: "#FDB022" },

    info: { padding: 12 },
    title: { fontSize: 16, fontWeight: "bold", color: "#333" },
    location: { fontSize: 13, color: "#777", marginTop: 2 },
    tag: {
        marginTop: 6,
        alignSelf: "flex-start",
        backgroundColor: "#E3F2FD",
        paddingHorizontal: 8,
        paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { fontSize: 12, color: "#FDB022", fontWeight: '500' },    /* comparison styles removed */
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        padding: 20,
    },
    emptyTextTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginTop: 10,
    },
    emptyTextSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 5,
        textAlign: 'center',
    }
    ,
    // --- New/Updated styles for improved SavedScreen UI ---
    headerRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 8,
    },
    countText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    cardRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 14,
        padding: 10,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    imageRow: {
        width: 110,
        height: 90,
        borderRadius: 8,
        backgroundColor: '#eee'
    },
    infoRow: {
        flex: 1,
        paddingLeft: 12,
    },
    priceTextRow: {
        fontSize: 14,
    color: '#FDB022',
        fontWeight: '700'
    },
    deleteCircle: {
        marginTop: 10,
        backgroundColor: '#d32f2f',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tagRow: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    browseBtn: {
        marginTop: 16,
    backgroundColor: '#FDB022',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },
    browseBtnText: {
        color: '#fff',
        fontWeight: '700'
    }
});

export default SavedScreen;

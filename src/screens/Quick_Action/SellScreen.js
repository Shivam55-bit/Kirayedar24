// SellScreen.js - Display all posted properties (cleaned)
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Dimensions,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useFocusEffect } from '@react-navigation/native';
// API services
import propertyService from '../../services/propertyapi';
import { formatImageUrl } from '../../services/propertyHelpers';
import MediaCard from '../../components/MediaCard';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

const COLORS = {
  primary: "#FDB022",
  primaryDark: "#E89E0F",
  accent: "#FDBF4D",
  success: "#10B981",
  warning: "#F59E0B",
  background: "#FAFAFA",
  cardBg: "#FFFFFF",
  dark: "#111827",
  gray: "#9CA3AF",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

// Small sample data so screen renders in isolation. App will replace with real API data.
const SAMPLE_LISTINGS = [
  {
    id: "1",
    purpose: "Sell",
    propertyType: "Residential",
    subPropertyType: "House/Villa",
    location: "Sector 62, Noida, UP",
    areaDetails: "2400 sq.ft",
    availabilityStatus: "Ready to Move",
    price: "₹1.2 Cr",
    description: "Spacious 4BHK villa with modern amenities, garden, and parking space.",
    furnishing: "Furnished",
    parking: "Available",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1080&q=80",
    status: "Active",
    views: 245,
    beds: 4,
    baths: 3,
  },
  {
    id: "2",
    purpose: "Rent / Lease",
    propertyType: "Residential",
    subPropertyType: "Apartment",
    location: "Koramangala, Bangalore",
    areaDetails: "1200 sq.ft",
    availabilityStatus: "Ready to Move",
    price: "₹35,000/mo",
    description: "Modern 2BHK apartment in prime location with gym, pool and security.",
    furnishing: "Furnished",
    parking: "Available",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1080&q=80",
    status: "Active",
    views: 189,
    beds: 2,
    baths: 2,
  },
];

const SellScreen = ({ navigation }) => {
  const [filter, setFilter] = useState("All");
  const [showStats, setShowStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // load user's sell properties
  const loadMySellProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await propertyService.getMySellProperties();
      console.log('[SellScreen] API Response:', response);
      
      if (response.success) {
        const propertiesData = response.data || response.properties || [];
        console.log('[SellScreen] Properties data:', propertiesData);
        
        // Map API data to screen format
        const mappedProperties = propertiesData.map(property => {
          // Format address object to string if it exists
          const locationText = property.propertyLocation || property.location || 
            (property.address && typeof property.address === 'object' 
              ? `${property.address.locality || ''}, ${property.address.city || ''}, ${property.address.state || ''}`.replace(/^, |, $/g, '').trim()
              : property.address) || 'Location not specified';
          
          return {
            id: property._id || property.id,
            purpose: property.purpose || property.purposeType || 'Sell',
            propertyType: property.propertyType || 'Property',
            subPropertyType: property.specificType || property.residentialType || property.commercialType || 'Type',
            location: locationText,
            areaDetails: property.areaDetails || property.sqft || property.area || property.size || '',
            availabilityStatus: property.availabilityStatus || property.status || 'Available',
            price: property.price || property.rentAmount || property.sellingPrice || 'Price not available',
            description: property.description || property.title || 'Property description',
            furnishing: property.furnishing || 'Not specified',
            parking: property.parking || 'Not specified',
            photosAndVideo: property.photosAndVideo || [],
            image: property.image,
            status: property.status || 'Active',
            views: property.views || 0,
            beds: property.bedrooms || property.beds || 'N/A',
            baths: property.bathrooms || property.baths || 'N/A'
          };
        });
        
        setListings(mappedProperties);
        console.log('[SellScreen] Mapped properties:', mappedProperties.length);
      } else {
        console.error('[SellScreen] API Error:', response.message);
        setError(response.message || 'Could not load your listings.');
        setListings([]);
      }
    } catch (err) {
      console.error('Failed to load my sell properties:', err);
      setError('Could not load your listings.');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMySellProperties(); }, [loadMySellProperties]);

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen focuses
      loadMySellProperties();
    }, [loadMySellProperties])
  );

  const filteredListings = (listings || []).filter((item) => {
    const purpose = item.purpose || (item.purposeType || '').toString();
    const matchesFilter = filter === "All" || purpose === filter;
    const q = searchQuery.trim().toLowerCase();
    const hay = `${item.subPropertyType || ''} ${item.propertyType || ''} ${item.propertyLocation || item.location || ''} ${item.description || ''}`.toLowerCase();
    const matchesSearch = q === "" || hay.includes(q);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return COLORS.success;
      case "Pending":
        return COLORS.warning;
      default:
        return COLORS.gray;
    }
  };

  const getPurposeColor = (purpose) => {
    switch (purpose) {
      case "Sell":
        return COLORS.primary;
      case "Rent / Lease":
        return COLORS.accent;
      case "Paying Guest":
        return COLORS.warning;
      default:
        return COLORS.gray;
    }
  };

  const renderListing = ({ item }) => {
    // Prepare media items for MediaCard
    const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
      ? item.photosAndVideo.map(media => ({
          uri: formatImageUrl(media.uri || media.url || media) || media.uri || media.url || media,
          type: media.type || (media.uri?.includes('.mp4') || media.uri?.includes('.mov') || media.uri?.includes('.avi') ? 'video' : 'image')
        }))
      : item.image ? [{ uri: formatImageUrl(item.image) || item.image, type: 'image' }] : 
        [{ uri: 'https://via.placeholder.com/400x200/5da9f6/FFFFFF?text=Property+Image', type: 'image' }];

    return (
      <Pressable
        style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.995 : 1 }] }]}
        onPress={() => navigation.navigate('PropertyDetailsScreen', { property: item })}
      >
        <View style={styles.cardImageSection}>
          <MediaCard
            mediaItems={mediaItems}
            fallbackImage="https://via.placeholder.com/400x200/5da9f6/FFFFFF?text=Property+Image"
            imageStyle={styles.cardImage}
            showControls={true}
            autoPlay={false}
            style={styles.sellMediaCard}
          />
          <View style={styles.cardOverlay} />
          <View style={styles.cardTopRow}>
            <View style={[styles.typeChip, { backgroundColor: getPurposeColor(item.purpose) }]}>
              <Text style={styles.typeChipText}>{item.purpose}</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusChipText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.pricePill}>
            <Text style={styles.cardPrice}>{item.price}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.subPropertyType} • {item.propertyType}
          </Text>
          <View style={styles.locationContainer}>
            <Icon name="location-sharp" size={14} color={COLORS.accent} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.propertyLocation || item.location || item.property_location || 'Location not specified'}
            </Text>
            {/* show area/size if available */}
            <View style={{ marginLeft: 8 }} />
            <Text style={[styles.locationText, { marginLeft: 6 }]} numberOfLines={1}>
              {item.areaDetails || item.sqft || item.area || item.size || ''}
            </Text>
          </View>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.viewsContainer}>
              <Icon name="eye" size={14} color={COLORS.gray} />
              <Text style={styles.viewsText}>{item.views} views</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditPropertyScreen", { property: item })}>
              <Icon name="pencil" size={14} color={COLORS.white} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderStats = () => {
    const total = listings.length;
    const totalViews = listings.reduce((s, i) => s + (i.views || 0), 0);
    const avg = total ? Math.round(totalViews / total) : 0;
    return (
      <View style={styles.statsWrap}>
        <View style={styles.statsBox}>
          <Text style={styles.statsValue}>{total}</Text>
          <Text style={styles.statsLabel}>Properties</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsValue}>{totalViews}</Text>
          <Text style={styles.statsLabel}>Total Views</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsValue}>{avg}</Text>
          <Text style={styles.statsLabel}>Avg Views</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={22} color={COLORS.dark} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Listings</Text>
            <Text style={styles.headerSubtitle}>Manage your properties</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="notifications-outline" size={20} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate("AddSell")}> 
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.quickActionGradient}>
              <Icon name="add-circle" size={18} color={COLORS.white} />
              <Text style={styles.quickActionText}>Post Property</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowStats((s) => !s)}>
            <LinearGradient colors={[COLORS.accent, "#D946A6"]} style={styles.quickActionGradient}>
              <Icon name="bar-chart" size={18} color={COLORS.white} />
              <Text style={styles.quickActionText}>{showStats ? "List" : "Analytics"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.filterChips}>
            {["All", "Sell", "Rent / Lease", "Paying Guest"].map((f) => (
              <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={COLORS.gray} />
            <TextInput placeholder="Search properties..." placeholderTextColor={COLORS.gray} style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        </View>

        {showStats ? (
          renderStats()
        ) : isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Icon name="alert-circle" size={48} color={COLORS.accent} />
            <Text style={[styles.emptyTitle, { marginTop: 12 }]}>{error}</Text>
            <TouchableOpacity style={[styles.emptyButton, { marginTop: 16 }]} onPress={loadMySellProperties}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredListings}
            renderItem={renderListing}
            keyExtractor={(i) => (i._id || i.id || Math.random().toString())}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Icon name="home-outline" size={64} color={COLORS.gray} />
                <Text style={styles.emptyTitle}>No Properties Found</Text>
                <Text style={styles.emptySubtitle}>Post your first property to get started.</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate("AddSell")}> 
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.emptyButtonGradient}>
                    <Icon name="add" size={18} color={COLORS.white} />
                    <Text style={styles.emptyButtonText}>Post Property</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: COLORS.cardBg },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.lightGray, alignItems: "center", justifyContent: "center" },
  headerTextContainer: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.dark, textAlign: "center" },
  headerSubtitle: { fontSize: 12, color: COLORS.gray, textAlign: "center", marginTop: 2 },
  quickActions: { flexDirection: "row", padding: 16, gap: 12 },
  quickActionBtn: { flex: 1 },
  quickActionGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 12, gap: 8 },
  quickActionText: { color: COLORS.white, fontWeight: "700", marginLeft: 8 },
  filtersSection: { paddingHorizontal: 16, paddingBottom: 8 },
  filterChips: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.lightGray, borderRadius: 20 },
  filterChipActive: { backgroundColor: COLORS.dark },
  filterChipText: { color: COLORS.gray, fontWeight: "600" },
  filterChipTextActive: { color: COLORS.white },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.cardBg, padding: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { width: CARD_WIDTH, backgroundColor: COLORS.cardBg, borderRadius: 14, marginVertical: 10, overflow: "hidden", alignSelf: "center", elevation: 2 },
  cardImageSection: { height: 180, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.08)" },
  cardTopRow: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  typeChipText: { color: COLORS.white, fontWeight: "700" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusChipText: { color: COLORS.white, fontWeight: "700" },
  pricePill: { position: "absolute", bottom: 12, left: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12 },
  cardPrice: { color: COLORS.white, fontWeight: "800", fontSize: 18 },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.dark },
  locationContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  locationText: { color: COLORS.gray, flex: 1 },
  cardDescription: { color: COLORS.gray, marginTop: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  viewsContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  viewsText: { color: COLORS.gray },
  editBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.dark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 8 },
  editBtnText: { color: COLORS.white, fontWeight: "700" },
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 },
  emptySubtitle: { color: COLORS.gray, marginTop: 8, textAlign: "center" },
  emptyButton: { marginTop: 16, borderRadius: 12, overflow: "hidden" },
  emptyButtonGradient: { paddingHorizontal: 20, paddingVertical: 12, alignItems: "center", flexDirection: "row", gap: 8 },
  emptyButtonText: { color: COLORS.white, fontWeight: "800" },
  statsWrap: { flexDirection: "row", justifyContent: "space-around", padding: 16 },
  statsBox: { alignItems: "center" },
  statsValue: { fontSize: 20, fontWeight: "800", color: COLORS.dark },
  statsLabel: { color: COLORS.gray, marginTop: 4 },
  sellMediaCard: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
});

export default SellScreen;
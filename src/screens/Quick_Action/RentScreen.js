import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
// API services removed\n// import { get } from \"../../services/api\";
// import { formatImageUrl, formatPrice } from '../../services/homeApi';
import MediaCard from "../../components/MediaCard";

// --- Import the custom asset based on your folder structure ---
// Assuming RentScreen.js is at 'src/screens/RentScreen.js' 
// and the asset is at 'src/assets/phone_alert.png'
const PHONE_ALERT_ICON = require('../../assets/phone_alert.png'); 

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

// --- Mock Data ---
const rentalsData = [
  {
    id: "1",
    title: "Modern Apartment",
    price: "$1200/month",
    location: "Downtown, NY",
    type: "Apartment",
    image:
      "https://images.unsplash.com/photo-1560184897-dfc0cf40b29c?auto=format&fit=crop&w=1080&q=80",
    beds: 2,
    baths: 2,
    sqft: 1050,
  },
  {
    id: "2",
    title: "Cozy Studio",
    price: "$900/month",
    location: "Brooklyn, NY",
    type: "Studio",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1080&q=80",
    beds: 1,
    baths: 1,
    sqft: 600,
  },
  {
    id: "3",
    title: "Luxury Condo",
    price: "$2000/month",
    location: "Manhattan, NY",
    type: "Condo",
    image:
      "https://images.unsplash.com/photo-1572120360610-d971b9c5c57d?auto=format&fit=crop&w=1080&q=80",
    beds: 3,
    baths: 3,
    sqft: 1800,
  },
];
// --- End Mock Data ---

const COLORS = {
  primary: "#FDB022",
  secondary: "#FDBF4D",
  background: "#F8F9FA",
  card: "#FFFFFF",
  textPrimary: "#1E1E1E",
  textSecondary: "#6C757D",
  favorite: "#FF3B30",
  shadow: "rgba(0, 0, 0, 0.1)",
  danger: '#D9534F', // Specific red for scammer warnings
  buttonBlue: '#FDB022', // Orange for the button
  // New color for the SCAMMER text line
  scammerTextRed: '#FF0000', 
};

const RentScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [rentals, setRentals] = useState(rentalsData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [modalVisible, setModalVisible] = useState(false);
  // keep modalShown on every mount as per requirement (show when user opens RentScreen)

  const propertyTypes = [
    "All",
    "Apartment",
    "Studio",
    "Condo",
    "Villa",
    "House",
    "PG",
    "Shop",
    "Office",
  ];

  // --- Fetch Rentals from API ---
  useEffect(() => {
    let mounted = true;
    const load = async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        // Fetch from /api/properties/other-rent endpoint
        const response = await get('/api/properties/other-rent');
        console.log('Rent properties response:', response);
        
        // Extract data array from response
        const serverRentals = response?.data || [];

        if (mounted && Array.isArray(serverRentals) && serverRentals.length > 0) {
          const mapped = serverRentals.map((p, idx) => ({
            id: p._id || p.id || String(idx),
            title: p.description || p.title || "Rental Property",
            price: formatPrice(p.price),
            location: p.propertyLocation || p.location || "Unknown",
            type: p.residentialType || p.commercialType || p.propertyType || "Rent",
            image: formatImageUrl(p.photosAndVideo && p.photosAndVideo[0] ? p.photosAndVideo[0] : null),
            beds: p.beds || 2,
            baths: p.baths || 2,
            sqft: p.areaDetails || p.area || 1000,
            propertyType: p.propertyType || "Residential",
          }));
          setRentals(mapped);
        } else {
          // Fallback to mock data if no properties found
          setRentals(
            rentalsData.map((r) => ({
              ...r,
              price: r.price.replace("/month", "/mo"),
            }))
          );
        }
      } catch (e) {
        console.warn("Could not load rent properties:", e.message || e);
        // Fallback to mock data on error
        setRentals(
          rentalsData.map((r) => ({
            ...r,
            price: r.price.replace("/month", "/mo"),
          }))
        );
      } finally {
        if (mounted) setLoading(false);
        setRefreshing(false);
      }
    };
    load(true);
    return () => {
      mounted = false;
    };
  }, []);
  // --- End Fetch Rentals ---

  // --- Filter Rentals (omitted for brevity, keep existing logic) ---
  const filteredRentals =
    selectedType === "All"
      ? rentals
      : rentals.filter(
          (item) =>
            item.type &&
            item.type.toLowerCase() === selectedType.toLowerCase()
        );

  // --- Handlers (omitted for brevity, keep existing logic) ---
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Show safety modal when the screen mounts (user arrives on Rent screen)
  useEffect(() => {
    setModalVisible(true);
  }, []);

  // --- Render Each Property Card (omitted for brevity, keep existing logic) ---
  const renderRental = ({ item }) => {
    // Prepare media items for MediaCard
    const mediaItems = item.photosAndVideo && item.photosAndVideo.length > 0 
      ? item.photosAndVideo.map(media => ({
          uri: formatImageUrl(media.uri || media) || media.uri || media,
          type: media.type || (media.uri?.includes('.mp4') || media.uri?.includes('.mov') || media.uri?.includes('.avi') ? 'video' : 'image')
        }))
      : item.image ? [{ uri: item.image, type: 'image' }] : [];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("PropertyDetails", { property: item })
        }
        activeOpacity={0.85}
      >
        <View style={styles.imageContainer}>
          <MediaCard
            mediaItems={mediaItems}
            fallbackImage="https://via.placeholder.com/400x200/5da9f6/FFFFFF?text=Property+Image"
            imageStyle={styles.rentalImage}
            showControls={true}
            autoPlay={false}
            style={styles.rentalMediaCard}
          />
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => toggleFavorite(item.id)}
          >
            <Icon
              name={favorites.includes(item.id) ? "heart" : "heart-outline"}
              size={22}
              color={
                favorites.includes(item.id) ? COLORS.favorite : COLORS.card
              }
            />
          </TouchableOpacity>
          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>{item.price}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.rentalTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.locationRow}>
            <Icon
              name="location-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.rentalLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="bed-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>{item.beds || "-"} Beds</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="bathtub-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>{item.baths || "-"} Baths</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="expand-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>{item.sqft || "-"} sqft</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safety modal (Updated) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Never pay booking amount without visiting the property</Text>
            </View>

            {/* Custom Image Icon */}
            <Image 
                source={PHONE_ALERT_ICON} 
                style={styles.customIconImage} 
                resizeMode="contain"
            />
          </View>

          <View style={styles.modalScammerTextContainer}>
            <Text style={styles.modalScammerText}>SCAMMERS WILL ASK FOR :</Text>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.bulletRow}>
              {/* Using Icon for red circle with X, styled to look like the image */}
              <Icon name="close-circle" size={18} color={COLORS.danger} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Gate pass booking</Text>
            </View>
            <View style={styles.bulletRow}>
              <Icon name="close-circle" size={18} color={COLORS.danger} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Property visit charges</Text>
            </View>
            <View style={styles.bulletRow}>
              <Icon name="close-circle" size={18} color={COLORS.danger} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Refundable booking amount</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={() => setModalVisible(false)}>
            {/* Solid blue button matching the image */}
            <LinearGradient
              colors={[COLORS.buttonBlue, COLORS.buttonBlue]} 
              style={styles.modalBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.modalBtnText}>Ok, understood</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Header and other components (omitted for brevity, keep existing logic) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rent Homes</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("PostProperty")}
        >
          <Icon name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.topControls}>
        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={20}
            color={COLORS.textSecondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="Search by location, type, or budget..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {propertyTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterBtn,
                selectedType === type && { backgroundColor: COLORS.primary },
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedType === type && { color: COLORS.card },
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Rentals List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching Rentals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRentals}
          renderItem={renderRental}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            (async () => {
              try {
                const response = await get('/api/properties/other-rent');
                const serverRentals = response?.data || [];
                
                if (Array.isArray(serverRentals) && serverRentals.length > 0) {
                  const mapped = serverRentals.map((p, idx) => ({
                    id: p._id || p.id || String(idx),
                    title: p.description || p.title || "Rental Property",
                    price: formatPrice(p.price),
                    location: p.propertyLocation || p.location || "Unknown",
                    type: p.residentialType || p.commercialType || p.propertyType || "Rent",
                    image: formatImageUrl(p.photosAndVideo && p.photosAndVideo[0] ? p.photosAndVideo[0] : null),
                    beds: p.beds || 2,
                    baths: p.baths || 2,
                    sqft: p.areaDetails || p.area || 1000,
                    propertyType: p.propertyType || "Residential",
                  }));
                  setRentals(mapped);
                }
              } catch (e) {
                console.warn('Refresh failed:', e.message || e);
              } finally {
                setRefreshing(false);
              }
            })();
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="sad-outline" size={50} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                No rentals found for this type.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    width: "100%",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: { padding: 5 },
  addBtn: { padding: 5 },
  headerTitle: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },

  topControls: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  filterScroll: { marginVertical: 5 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  listContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  card: {
    width: CARD_WIDTH,
    borderRadius: 15,
    marginBottom: 25,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  imageContainer: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: "hidden",
    position: "relative",
  },
  rentalImage: { width: "100%", height: 200 },
  favoriteBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
  },
  priceTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopRightRadius: 15,
  },
  priceTagText: { fontSize: 16, fontWeight: "bold", color: COLORS.card },

  cardDetails: { padding: 15, paddingTop: 10 },
  rentalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rentalLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
  },
  infoItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 5 },
  infoText: {
    marginLeft: 5,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  // --- MODAL STYLES (UPDATED TO MATCH NEW IMAGE) ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 25, 
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: Dimensions.get('window').height * 0.45, 
    minHeight: Dimensions.get('window').height * 0.35, 
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E6E6E6",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalHeaderRow: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    justifyContent: "space-between", 
    marginBottom: 0, 
    marginTop: 0, 
  },
  modalTitle: {
    fontSize: 22, 
    fontWeight: "900", 
    color: COLORS.textPrimary,
    textAlign: "left",
    lineHeight: 28, 
    marginRight: 10, 
  },
  
  customIconImage: {
    width: 60, // Adjusted width/height to match the visual size
    height: 60, 
    resizeMode: 'contain',
  },

  modalScammerTextContainer: {
    marginTop: 25, 
    marginBottom: 15, 
  },
  modalScammerText: { 
    color: COLORS.scammerTextRed, // New red color
    fontSize: 12, 
    fontWeight: '700', 
    letterSpacing: 0.5, // Added letter spacing for uppercase text
  },

  modalContent: { 
    marginTop: 0, 
    paddingHorizontal: 0, 
  },
  bulletRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  bulletIcon: {
    marginRight: 10, 
  },
  bulletText: { 
    color: COLORS.textPrimary, 
    fontSize: 15, 
    fontWeight: '500' 
  },

  modalBtn: {
    marginTop: 25, 
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6,
    elevation: 6,
  },
  modalBtnText: { color: COLORS.card, fontWeight: "600", fontSize: 16 },
  rentalMediaCard: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});

export default RentScreen;
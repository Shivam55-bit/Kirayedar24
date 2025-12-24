import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from '@react-navigation/native';
import propertyService from '../services/propertyapi';
import { formatImageUrl, formatPrice } from '../services/propertyHelpers';

// Get screen width for card calculations
const { width } = Dimensions.get("window");

const MyPropertyScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's posted properties from API
  const loadMyProperties = React.useCallback(async () => {
    console.log('📥📥📥 LOADING MY PROPERTIES - API CALL STARTING 📥📥📥');
    setLoading(true);
    try {
      const response = await propertyService.getMySellProperties();
      console.log('✅✅✅ API RESPONSE RECEIVED:', response.success, 'Properties count:', response.data?.length || 0);
      
      if (response.success) {
        const propertiesData = response.data || response.properties || [];
        console.log('🏠🏠🏠 TOTAL PROPERTIES TO DISPLAY:', propertiesData.length);
        
        // Map API data to screen format
        const mappedProperties = propertiesData.map(property => {
          
          // ✅ FIXED: Backend sends photos and videos separately, not photosAndVideo
          let imageUrl = null;
          if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
            const firstImage = property.photos[0];
            if (typeof firstImage === 'string') {
              imageUrl = formatImageUrl(firstImage);
            }
          } else if (property.photosAndVideo && Array.isArray(property.photosAndVideo) && property.photosAndVideo.length > 0) {
            const firstImage = property.photosAndVideo[0];
            if (typeof firstImage === 'string') {
              imageUrl = formatImageUrl(firstImage);
            } else if (firstImage && typeof firstImage === 'object') {
              imageUrl = formatImageUrl(firstImage.uri || firstImage.url || firstImage);
            }
          } else if (property.image) {
            imageUrl = formatImageUrl(property.image);
          }
          
          console.log('[MyPropertyScreen] Final image URL for property', property._id, ':', imageUrl);
          
          // Format address object to string if it exists
          const locationText = property.propertyLocation || property.location || 
            (property.address && typeof property.address === 'object' 
              ? `${property.address.locality || ''}, ${property.address.city || ''}, ${property.address.state || ''}`.replace(/^, |, $/g, '').trim()
              : property.address) || 'Location not specified';
          
          return {
            id: property._id || property.id,
            title: property.description || property.title || `${property.specificType || 'Property'} in ${property.address?.city || 'City'}`,
            location: locationText,
            price: formatPrice(property.price || property.rentAmount || property.sellingPrice),
            type: property.specificType || property.propertyType || 'Property',
            bedrooms: property.bedrooms || property.beds || 'N/A',
            bathrooms: property.bathrooms || property.baths || 'N/A',
            area: `${property.areaSqFt || property.areaDetails || property.sqft || property.area || 'N/A'} sqft`,
            status: property.status || property.availabilityStatus || 'Available',
            image: imageUrl || 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image',
            purpose: property.purpose || property.purposeType || 'Rent',
            furnishing: property.furnishingStatus || property.furnishing || 'Not specified',
            parking: property.parking || 'Not specified',
            availableFor: property.availableFor || 'Any',
            views: property.visitCount || property.views || 0,
            createdAt: property.createdAt || new Date().toISOString(),
            originalData: property  // ✅ Store complete original backend data
          };
        });
        
        console.log('💾💾💾 SETTING PROPERTIES STATE WITH COUNT:', mappedProperties.length);
        setProperties(mappedProperties);
        console.log('✅✅✅ PROPERTIES STATE UPDATED SUCCESSFULLY!');
      } else {
        console.error('[MyPropertyScreen] API Error:', response.message);
        Alert.alert('Error', response.message || 'Failed to load your properties');
        setProperties([]);
      }
    } catch (error) {
      console.error('[MyPropertyScreen] Load properties error:', error);
      Alert.alert('Error', 'Failed to load properties. Please check your connection.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency - function won't change

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("@user_data");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // ✅ FIXED: Use useFocusEffect to reload data every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄🔄🔄 MY PROPERTY SCREEN FOCUSED - LOADING DATA 🔄🔄🔄');
      loadMyProperties();
    }, [loadMyProperties])
  );

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyProperties();
    setRefreshing(false);
  };

  const handlePropertyPress = (property) => {
    // Pass original backend data instead of mapped property
    console.log('🔍🔍🔍 PROPERTY PRESS DEBUG:');
    console.log('Has originalData?', !!property.originalData);
    console.log('Original Data Keys:', property.originalData ? Object.keys(property.originalData) : 'NONE');
    console.log('Mapped property keys:', Object.keys(property));
    
    const dataToPass = property.originalData || property;
    console.log('📤 PASSING TO DETAILS SCREEN:', dataToPass);
    
    navigation.navigate('PropertyDetailsScreen', { 
      property: dataToPass
    });
  };

  const handleEditProperty = (property) => {
    console.log('[MyPropertyScreen] Navigating to edit with property:', property);
    // Pass the original API data for proper editing
    const propertyToEdit = property.originalData || {
      _id: property.id,
      description: property.title,
      propertyLocation: property.location,
      price: property.price.replace(/[^0-9.]/g, ''), // Remove currency symbols
      propertyType: property.type,
      bedrooms: property.bedrooms === 'N/A' ? '' : property.bedrooms,
      bathrooms: property.bathrooms === 'N/A' ? '' : property.bathrooms,
      areaDetails: property.area === 'N/A' ? '' : property.area,
      status: property.status,
      photosAndVideo: property.image ? [property.image] : [],
      purpose: property.purpose
    };
    navigation.navigate('EditPropertyScreen', { property: propertyToEdit });
  };

  const handleDeleteProperty = (propertyId) => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            Alert.alert("Success", "Property deleted successfully");
          }
        }
      ]
    );
  };

  // Property contact action handlers
  const handlePhoneCall = (property) => {
    const phoneNumber = property.originalData?.contactNumber || property.originalData?.phoneNumber || property.originalData?.ownerPhone || '1234567890';
    const phoneUrl = `tel:${phoneNumber}`;
    
    import('react-native').then(({ Linking }) => {
      Linking.openURL(phoneUrl).catch((err) => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Could not open phone dialer');
      });
    });
  };

  const handleWhatsApp = (property) => {
    const phoneNumber = property.originalData?.contactNumber || property.originalData?.phoneNumber || property.originalData?.ownerPhone || '1234567890';
    const message = encodeURIComponent(`Hi, I want to inquire about your property: ${property.title}`);
    const whatsappUrl = `whatsapp://send?phone=+91${phoneNumber}&text=${message}`;
    
    import('react-native').then(({ Linking }) => {
      Linking.openURL(whatsappUrl).catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('Error', 'WhatsApp is not installed or could not be opened');
      });
    });
  };

  const handlePropertyChat = (property) => {
    // For owner's own properties, maybe show inquiries or tenant messages
    navigation.navigate('ChatDetailScreen', { 
      propertyId: property.id,
      propertyTitle: property.title,
      ownerId: property.originalData?.ownerId || property.originalData?.userId,
      ownerName: property.originalData?.ownerName || 'Property Owner'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Rented":
        return "#10B981";
      case "Available":
        return "#FDB022";
      default:
        return "#64748B";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Rented":
        return "checkmark-circle";
      case "Available":
        return "time";
      default:
        return "help-circle";
    }
  };

  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.residentialCard}
      onPress={() => handlePropertyPress(item)}
      activeOpacity={0.9}
    >
      {/* Property Image Container */}
      <View style={styles.residentialImageContainer}>
        <Image 
          source={{ uri: item.image || 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image' }} 
          style={styles.residentialImage}
          resizeMode="cover"
          onError={(error) => {
            console.log('Image load error:', error.nativeEvent.error);
            console.log('Image URL:', item.image);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', item.image);
          }}
        />
        
        {/* Status Badge */}
        <View style={[styles.statusBadgeNew, { backgroundColor: getStatusColor(item.status) }]}>
          <Icon 
            name={getStatusIcon(item.status)} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusTextNew}>{item.status}</Text>
        </View>
      </View>

      {/* Property Details */}
      <View style={styles.residentialDetails}>
        {/* Title - Show property type and description */}
        <Text style={styles.residentialTitle} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Location */}
        <View style={styles.residentialLocation}>
          <Icon name="location-outline" size={13} color="#64748B" />
          <Text style={styles.residentialLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        {/* Property Details Row */}
        <View style={styles.propertyDetailsRow}>
          {item.bedrooms !== 'N/A' && (
            <Text style={styles.detailItemNew}>
              <Icon name="bed-outline" size={12} color="#64748B" /> {item.bedrooms}BR
            </Text>
          )}
          {item.bathrooms !== 'N/A' && (
            <Text style={styles.detailItemNew}>
              <Icon name="water-outline" size={12} color="#64748B" /> {item.bathrooms}BA
            </Text>
          )}
          <Text style={styles.detailItemNew}>
            <Icon name="resize-outline" size={12} color="#64748B" /> {item.area}
          </Text>
        </View>
        
        {/* Additional Info Row - Furnishing & Available For */}
        <View style={styles.propertyDetailsRow}>
          {item.furnishing && item.furnishing !== 'Not specified' && (
            <Text style={styles.detailItemNew}>
              <Icon name="home-outline" size={12} color="#64748B" /> {item.furnishing}
            </Text>
          )}
          {item.availableFor && (
            <Text style={styles.detailItemNew}>
              <Icon name="people-outline" size={12} color="#64748B" /> {item.availableFor}
            </Text>
          )}
        </View>

        {/* Price */}
        <Text style={styles.residentialPrice}>
          {item.price}
        </Text>
        
        {/* Action Buttons */}
        <View style={styles.propertyActionButtons}>
          <TouchableOpacity 
            style={styles.actionButtonNew}
            onPress={() => handlePhoneCall(item)}
            activeOpacity={0.7}
          >
            <Icon name="call" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButtonNew, { backgroundColor: '#25D366' }]}
            onPress={() => handleWhatsApp(item)}
            activeOpacity={0.7}
          >
            <Icon name="logo-whatsapp" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButtonNew, { backgroundColor: '#6B7280' }]}
            onPress={() => handlePropertyChat(item)}
            activeOpacity={0.7}
          >
            <Icon name="chatbubble-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Management Buttons - Show on long press or separate section */}
        <View style={styles.managementButtons}>
          <TouchableOpacity 
            style={styles.managementButton}
            onPress={() => handleEditProperty(item)}
          >
            <Icon name="create-outline" size={16} color="#FDB022" />
            <Text style={styles.managementButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.managementButton}
            onPress={() => handlePropertyPress(item)}
          >
            <Icon name="eye-outline" size={16} color="#3B82F6" />
            <Text style={styles.managementButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.managementButton}
            onPress={() => handleDeleteProperty(item.id)}
          >
            <Icon name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.managementButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Properties</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("AddSell")}
        >
          <Icon name="add" size={24} color="#FDB022" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FDB022']}
            tintColor="#FDB022"
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{properties.length}</Text>
            <Text style={styles.statLabel}>Total Properties</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === "Rented").length}
            </Text>
            <Text style={styles.statLabel}>Rented</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === "Available").length}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <View style={styles.propertiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Properties</Text>
            <Text style={styles.sectionSubtitle}>Manage your rental listings</Text>
          </View>
          
          {loading && properties.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
          ) : properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="home-outline" size={64} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No Properties Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start by adding your first property to rent out
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate("AddSell")}
              >
                <Text style={styles.emptyButtonText}>Add Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={properties}
              renderItem={renderPropertyCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContainer}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFB",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF7ED",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FDB022",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  propertiesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: "#FDB022",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  flatListContainer: {
    paddingBottom: 20,
  },
  
  // New Residential Card Styles (matching home screen)
  residentialCard: {
    width: '100%',
    marginBottom: 16,
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
    height: 200,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  residentialImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadgeNew: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTextNew: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
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
    marginBottom: 8,
  },
  residentialLocationText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
    flex: 1,
    fontWeight: '600',
  },
  propertyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItemNew: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  residentialPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FDB022',
    letterSpacing: -0.5,
    marginBottom: 8,
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
  
  actionButtonNew: {
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
  
  // Management Buttons Styles
  managementButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  
  managementButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  
  // Old styles (keeping for reference)
  propertyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  propertyTitleContainer: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  propertyDetails: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginLeft: 4,
  },
  tenantInfo: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  tenantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tenantLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
    marginLeft: 4,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  tenantPhone: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  rentDue: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  propertyActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E8F5F0",
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 4,
  },
});

export default MyPropertyScreen;
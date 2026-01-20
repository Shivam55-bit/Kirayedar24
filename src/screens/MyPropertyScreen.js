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
import ContactPreferenceIcons from '../components/ContactPreferenceIcons';

// Get screen width for card calculations
const { width } = Dimensions.get("window");

const MyPropertyScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's posted properties from API and merge local drafts
  const loadMyProperties = React.useCallback(async () => {
    console.log('📥📥📥 LOADING MY PROPERTIES - API CALL STARTING 📥📥📥');
    setLoading(true);
    try {
      const response = await propertyService.getMySellProperties();
      console.log('✅✅✅ API RESPONSE RECEIVED:', response.success, 'Properties count:', response.data?.length || 0);
      
      let propertiesData = [];
      if (response.success) {
        propertiesData = response.data || response.properties || [];
      } else {
        console.error('[MyPropertyScreen] API Error:', response.message);
        Alert.alert('Error', response.message || 'Failed to load your properties');
      }

      // Map API data to screen format
      const mappedProperties = propertiesData.map(property => {
        let imageUrl = null;
        if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
          const firstImage = property.photos[0];
          if (typeof firstImage === 'string') {
            imageUrl = formatImageUrl(firstImage);
            } else if (firstImage && typeof firstImage === 'object') {
              // object may contain uri or url keys
              const candidate = firstImage.uri || firstImage.url || firstImage;
              if (typeof candidate === 'string' && (candidate.startsWith('file:') || candidate.startsWith('content:') || candidate.startsWith('data:'))) {
                imageUrl = candidate;
              } else {
                imageUrl = formatImageUrl(candidate);
              }
            imageUrl = formatImageUrl(firstImage);
          } else if (firstImage && typeof firstImage === 'object') {
            imageUrl = formatImageUrl(firstImage.uri || firstImage.url || firstImage);
          }
        } else if (property.image) {
          imageUrl = formatImageUrl(property.image);
        }

        const locationText = property.propertyLocation || property.location || 
          (property.address && typeof property.address === 'object' 
            ? [
                property.address.locality || '',
                property.address.post || property.address.city || '',
                property.address.city || '',
                property.address.state || ''
              ].filter(part => part.trim()).join(', ')
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
          contactPreferences: property.contactPreferences,  // ✅ Include contact preferences
          contactNumber: property.contactNumber || property.phone,  // ✅ Include contact number
          originalData: property  // ✅ Store complete original backend data
        };
      });

      // Load local drafts and merge them at the top
      let localDrafts = [];
      try {
        const draftRaw = await AsyncStorage.getItem('@local_draft_properties');
        localDrafts = draftRaw ? JSON.parse(draftRaw) : [];
      } catch (e) {
        console.warn('[MyPropertyScreen] Failed to read local drafts:', e);
        localDrafts = [];
      }

      const mappedDrafts = (localDrafts || []).map(d => {
        // Handle local file URIs vs server filenames
        let imageUrl = 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image';
        try {
          const first = d.photos && d.photos.length > 0 ? d.photos[0] : null;
          if (first) {
            if (typeof first === 'string' && (first.startsWith('file:') || first.startsWith('content:') || first.startsWith('data:'))) {
              imageUrl = first; // local URI, use directly
            } else {
              imageUrl = formatImageUrl(first);
            }
          } else if (d.image) {
            if (typeof d.image === 'string' && (d.image.startsWith('file:') || d.image.startsWith('content:') || d.image.startsWith('data:'))) {
              imageUrl = d.image;
            } else {
              imageUrl = formatImageUrl(d.image);
            }
          }
        } catch (e) {
          console.warn('[MyPropertyScreen] Failed to determine draft image URL:', e);
        }

        return {
          id: d._id,
          title: d.description || `${d.specificType || 'Property'} in ${d.city || 'City'}`,
          location: [
            d.locality || '',
            d.post || '',
            d.city || '', 
            d.propertyState || d.state || ''
          ].filter(part => part.trim()).join(', ') || 'Location not specified',
          price: formatPrice(d.price || 0),
          type: d.specificType || d.propertyType || 'Property',
          bedrooms: d.bedrooms || 'N/A',
          bathrooms: d.bathrooms || 'N/A',
          area: `${d.areaSqFt || 'N/A'} sqft`,
          status: d.status || 'Pending Payment',
          image: imageUrl,
          purpose: d.purpose || '',
          furnishing: d.furnishingStatus || 'Not specified',
          parking: d.parking || 'Not specified',
          availableFor: d.availableFor || 'Any',
          views: 0,
          createdAt: d.createdAt || new Date().toISOString(),
          originalData: d,
          isLocalDraft: true
        };
      });

      const combined = [...mappedDrafts, ...mappedProperties];

      console.log('💾💾💾 SETTING PROPERTIES STATE WITH COUNT:', combined.length);
      setProperties(combined);
      console.log('✅✅✅ PROPERTIES STATE UPDATED SUCCESSFULLY!');

      // If navigation asked to prompt payment for a draft, do it now
      const routeParams = route?.params || {};
      if (routeParams.draftId && routeParams.showPaymentPrompt) {
        // Find the draft
        const draftFound = mappedDrafts.find(d => d.id === routeParams.draftId);
        if (draftFound) {
          Alert.alert(
            'Property Saved',
            'Your property was saved as a draft and is visible in My Properties. Do you want to proceed to payment now?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Pay Now', onPress: () => navigation.navigate('AddSell', { openPayment: true, draftId: routeParams.draftId }) }
            ],
            { cancelable: true }
          );

          // Clear params so prompt doesn't show again
          try { navigation.setParams({ draftId: null, showPaymentPrompt: false }); } catch (e) { }
        }
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
    console.log('====================================');
    console.log('[MyPropertyScreen] EDIT BUTTON PRESSED');
    console.log('====================================');
    console.log('Display property:', JSON.stringify(property, null, 2));
    console.log('Has originalData:', !!property.originalData);
    
    if (property.originalData) {
      console.log('originalData keys:', Object.keys(property.originalData));
      console.log('originalData.photos:', property.originalData.photos);
      console.log('originalData.bedrooms:', property.originalData.bedrooms);
      console.log('originalData.bathrooms:', property.originalData.bathrooms);
      console.log('originalData.propertyLocation:', property.originalData.propertyLocation);
      console.log('originalData.price:', property.originalData.price);
    }
    console.log('====================================');
    
    // Pass the original API data for proper editing
    let propertyToEdit;
    
    if (property.originalData) {
      // Use original backend data - it contains all the server fields
      propertyToEdit = { ...property.originalData };
      console.log('[MyPropertyScreen] Using originalData');
    } else {
      // Create proper mapping from display data back to backend format
      console.log('[MyPropertyScreen] Creating fallback data from display fields');
      propertyToEdit = {
        _id: property.id,
        description: property.title,
        propertyLocation: property.location,
        price: typeof property.price === 'string' ? property.price.replace(/[^0-9.]/g, '') : property.price,
        specificType: property.type,
        propertyType: property.type,
        bedrooms: property.bedrooms === 'N/A' ? null : property.bedrooms,
        bathrooms: property.bathrooms === 'N/A' ? null : property.bathrooms,
        areaDetails: property.area && property.area !== 'N/A' ? property.area.replace(/[^0-9.]/g, '') : null,
        areaSqFt: property.area && property.area !== 'N/A' ? property.area.replace(/[^0-9.]/g, '') : null,
        status: property.status,
        purpose: property.purpose,
        photos: property.image ? [property.image] : [],
        photosAndVideo: property.image ? [property.image] : [],
        image: property.image,
        furnishingStatus: property.furnishing,
        parking: property.parking,
        availableFor: property.availableFor
      };
    }
    
    console.log('[MyPropertyScreen] Passing to EditPropertyScreen:', JSON.stringify(propertyToEdit, null, 2));
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
          onPress: async () => {
            try {
              setLoading(true);
              // Check if it's a local draft (not a real Mongo ID)
              if (typeof propertyId === 'string' && !/^[0-9a-fA-F]{24}$/.test(propertyId)) {
                // Remove from local drafts
                const draftRaw = await AsyncStorage.getItem('@local_draft_properties');
                let drafts = draftRaw ? JSON.parse(draftRaw) : [];
                drafts = drafts.filter(d => d._id !== propertyId);
                await AsyncStorage.setItem('@local_draft_properties', JSON.stringify(drafts));
                setProperties(prev => prev.filter(p => p.id !== propertyId));
                Alert.alert("Success", "Draft property deleted successfully");
              } else {
                // Call API to delete property from server
                const response = await propertyService.deleteProperty(propertyId);
                if (response.success || response.status === 200) {
                  setProperties(prev => prev.filter(p => p.id !== propertyId));
                  Alert.alert("Success", "Property deleted successfully");
                } else {
                  throw new Error(response.message || 'Failed to delete property');
                }
              }
            } catch (error) {
              console.error('Delete property error:', error);
              Alert.alert("Error", error.message || "Failed to delete property. Please try again.");
            } finally {
              setLoading(false);
            }
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
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case "approved":
        return "#10B981"; // Green for approved
      case "pending":
      case "pending payment":
        return "#FDB022"; // Orange for pending
      case "rejected":
        return "#EF4444"; // Red for rejected
      case "rented":
        return "#10B981";
      case "available":
        return "#FDB022";
      default:
        return "#64748B";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case "approved":
        return "checkmark-circle";
      case "pending":
      case "pending payment":
        return "time";
      case "rejected":
        return "close-circle";
      case "rented":
        return "checkmark-circle";
      case "available":
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
        
        {/* Status Badge - Show approval status (backend returns lowercase status) */}
        <View style={[styles.statusBadgeNew, { backgroundColor: getStatusColor(
          item.originalData?.status || item.originalData?.approvalStatus || item.status
        ) }]}>
          <Icon 
            name={getStatusIcon(
              item.originalData?.status || item.originalData?.approvalStatus || item.status
            )} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusTextNew}>
            {(item.originalData?.status || item.originalData?.approvalStatus || item.status || 'pending').charAt(0).toUpperCase() + (item.originalData?.status || item.originalData?.approvalStatus || item.status || 'pending').slice(1)}
          </Text>
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
          {/* Pay Now button for local drafts / pending payment items */}
          {(item.isLocalDraft || item.status === 'Pending Payment') && (
            <TouchableOpacity
              style={styles.managementButton}
              onPress={() => {
                Alert.alert(
                  'Pending Payment',
                  'This property has a pending payment. Do you want to proceed to pay now?',
                  [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Pay Now', onPress: () => navigation.navigate('AddSell', { openPayment: true, draftId: item.id }) }
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Icon name="card-outline" size={16} color="#10B981" />
              <Text style={styles.managementButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
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
              {properties.filter(p => 
                p.originalData?.approvalStatus === "Approved" || 
                p.originalData?.status === "approved" ||
                p.status === "Approved" || 
                p.status === "approved"
              ).length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => 
                p.originalData?.approvalStatus === "Pending" || 
                p.originalData?.status === "pending" ||
                p.status === "Pending" || 
                p.status === "pending" ||
                p.status === "Pending Payment"
              ).length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
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
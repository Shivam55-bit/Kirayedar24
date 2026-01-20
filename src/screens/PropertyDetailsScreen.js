import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  Linking,
  Modal,
  StatusBar,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { saveProperty, getSavedProperties } from '../services/api';
import { getPropertyById } from '../services/propertyService';

// import {
//   formatImageUrl,
//   formatPrice,
//   getRecentProperties,
//   getNearbyProperties,
// } from "../services/homeApi"; // REMOVED

// Helper functions for image and data formatting
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

const formatPrice = (price) => price ? `₹${Number(price).toLocaleString()}` : '₹0';
const getRecentProperties = async (limit) => ({ success: true, properties: [] });
const getNearbyProperties = async (lat, lng) => ({ success: true, properties: [] });

const { width, height } = Dimensions.get("window");
const GALLERY_HEIGHT = Math.round(height * 0.44);
const DOT_SIZE = 8;

// --- Colors ---
const colors = {
  // switch to blue primary/accent
  primary: "#FDB022",
  accent: "#5DA9F6",
  white: "#FFFFFF",
  background: "#F5F8FF",
  text: "#222",
  muted: "#6B7280",
};

// Helper function to safely convert any value to string (handles location objects)
const safeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  // Handle location objects {state, city, locality, pincode}
  if (typeof value === 'object') {
    if (value.state || value.city || value.locality || value.pincode) {
      return [value.locality, value.city, value.state, value.pincode]
        .filter(Boolean)
        .join(', ') || fallback;
    }
    // Handle name objects
    if (value.fullName) return String(value.fullName);
    if (value.name) return String(value.name);
    return fallback;
  }
  return fallback;
};

// --- Amenity Icons ---
const getAmenityIcon = (name) => {
  switch (name) {
    case "Gym": return "barbell-outline";
    case "Pool": return "water-outline";
    case "Balcony": return "sunny-outline";
    case "Security": return "shield-checkmark-outline";
    case "Parking": return "car-outline";
    case "Lift": return "business-outline";
    case "Park": return "leaf-outline";
    default: return "flash-outline";
  }
};

const PropertyDetailsScreen = ({ navigation, route }) => {
  const { property: routeProperty, itemId, user: routeUser, fromAddProperty } = route?.params || {};
  
  console.log('🏠 PropertyDetailsScreen - Route property received:', routeProperty);
  console.log('🏠 Property state value:', routeProperty?.state);
  console.log('🏠 Property city value:', routeProperty?.city);
  console.log('🏠 Property locality value:', routeProperty?.locality);
  console.log('🏠 Property address object:', routeProperty?.address);
  console.log('🏠 Property availableFrom:', routeProperty?.availableFrom);
  console.log('🏠 Property societyFeatures:', routeProperty?.societyFeatures);
  console.log('🏠 Property societyMaintenance:', routeProperty?.societyMaintenance);
  console.log('🏠 Property availableFor:', routeProperty?.availableFor);
  console.log('🏠 Property parking:', routeProperty?.parking);
  
  // Utility to get address fields from nested address object or flat structure
  const getAddressField = (property, field) => {
    if (!property) return null;
    
    console.log(`🔍 getAddressField called for "${field}"`, {
      hasAddressObject: !!property.address,
      addressValue: property.address?.[field],
      flatValue: property[field],
      propertyLocation: property.propertyLocation
    });
    
    // Try nested address object first (new backend format)
    if (property.address && typeof property.address === 'object') {
      const value = property.address[field];
      if (value) {
        console.log(`✅ Found "${field}" in address object:`, value);
        return safeString(value, null);
      }
    }
    
    // Fallback to flat structure (old format)
    if (property[field]) {
      console.log(`✅ Found "${field}" in flat structure:`, property[field]);
      return safeString(property[field], null);
    }
    
    // Special mapping for locality - can also be propertyLocation in old format
    if (field === 'locality' && property.propertyLocation) {
      console.log(`✅ Found locality as propertyLocation:`, property.propertyLocation);
      return safeString(property.propertyLocation, null);
    }
    
    console.log(`❌ "${field}" not found anywhere`);
    return null;
  };
  
  // All hooks must be called at the top level, before any early returns
  const [property, setProperty] = useState(routeProperty || null);
  const [loading, setLoading] = useState(!routeProperty);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullscreenMedia, setShowFullscreenMedia] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Smart back navigation handler
  const handleBackPress = () => {
    if (fromAddProperty) {
      // If coming from AddSellScreen, navigate to Home
      navigation.navigate('Home');
    } else {
      // Otherwise, use normal back navigation
      navigation.goBack();
    }
  };

  // Handle favorite/shortlist button
  const handleSaveProperty = async () => {
    if (!property) return;
    
    const propertyId = property._id || property.id;
    if (!propertyId) {
      Alert.alert('Error', 'Unable to save this property');
      return;
    }

    try {
      setSavingProperty(true);
      console.log('💾 Saving property:', propertyId);
      
      const response = await saveProperty(propertyId);
      
      if (response.success) {
        setIsSaved(true);
        Alert.alert(
          'Success',
          'Property added to your shortlist!',
          [{ text: 'OK' }]
        );
        console.log('✅ Property saved successfully');
      } else {
        Alert.alert(
          'Info',
          response.message || 'Property already in your shortlist',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error saving property:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save property. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSavingProperty(false);
    }
  };

  useEffect(() => {
    // Check if we have complete property data
    const hasCompleteData = property && (
      property.photos?.length > 0 || 
      property.photosAndVideo?.length > 0 || 
      property.images?.length > 0 ||
      property.description ||
      property.propertyType
    );
    
    // If property data is incomplete but we have propertyId, fetch full details
    const propertyId = property?._id || property?.id || itemId;
    
    if (!hasCompleteData && propertyId) {
      const fetchPropertyDetails = async () => {
        setLoading(true);
        try {
          console.log('📥 Fetching full property details for ID:', propertyId);
          const response = await getPropertyById(propertyId);
          console.log('📦 Property API Response:', response);
          
          if (response.success && response.data) {
            setProperty(response.data);
            console.log('✅ Property details loaded successfully');
          } else if (response.property) {
            setProperty(response.property);
            console.log('✅ Property details loaded successfully (from response.property)');
          } else {
            console.warn('⚠️ Property not found or incomplete response');
          }
        } catch (err) {
          console.error("❌ Property fetch failed:", err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPropertyDetails();
      return;
    }
    
    // Fallback: try to find in recent/nearby properties
    if (!property && itemId) {
      const fetchAndFind = async () => {
        setLoading(true);
        try {
          const [recent, nearby] = await Promise.all([
            getRecentProperties(20),
            getNearbyProperties(0, 0),
          ]);

          const all = [...(recent || []), ...(nearby || [])];
          const found = all.find((p) => p._id === itemId || p.id === itemId);
          if (found) setProperty(found);
        } catch (err) {
          console.warn("Property lookup failed", err);
        } finally {
          setLoading(false);
        }
      };

      fetchAndFind();
    } else {
      setLoading(false);
    }
  }, [itemId, property?._id]);

  // Check if property is already saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!property) return;
      
      const propertyId = property._id || property.id;
      if (!propertyId) return;

      try {
        console.log('🔍 Checking if property is saved:', propertyId);
        const response = await getSavedProperties();
        console.log('📦 Saved Properties API Response:', response);
        
        // Extract saved properties array - matching SavedScreen logic
        let savedPropertiesList = [];
        
        if (response && response.savedProperties && Array.isArray(response.savedProperties)) {
          savedPropertiesList = response.savedProperties;
        } else if (Array.isArray(response.data)) {
          savedPropertiesList = response.data;
        } else if (Array.isArray(response)) {
          savedPropertiesList = response;
        }
        
        // Filter out null entries
        savedPropertiesList = savedPropertiesList.filter(Boolean);
        
        console.log('📋 Saved properties count:', savedPropertiesList.length);
        
        if (savedPropertiesList.length > 0) {
          const savedPropertyIds = savedPropertiesList.map(p => p._id || p.id).filter(Boolean);
          const isAlreadySaved = savedPropertyIds.includes(propertyId);
          setIsSaved(isAlreadySaved);
          
          console.log(isAlreadySaved ? '✅ Property is already in shortlist' : 'ℹ️ Property is not in shortlist');
        } else {
          console.log('ℹ️ No saved properties found');
        }
      } catch (error) {
        console.error('❌ Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [property]);

  // Get all available images with proper URL formatting
  const getAllImages = () => {
    if (!property) return ['https://via.placeholder.com/400x300/E2E8F0/64748B?text=Property+Image'];
    
    const images = [];
    
    // Backend sends photos array
    if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
      property.photos.forEach(photo => {
        if (photo && typeof photo === 'string') {
          const formattedUrl = formatImageUrl(photo);
          if (formattedUrl) {
            images.push(formattedUrl);
          }
        }
      });
    }
    
    // Fallback to old photosAndVideo field
    if (images.length === 0 && property.photosAndVideo && property.photosAndVideo.length > 0) {
      property.photosAndVideo.forEach(media => {
        const imageUrl = media.uri || media;
        if (imageUrl && typeof imageUrl === 'string') {
          const formattedUrl = formatImageUrl(imageUrl);
          if (formattedUrl) {
            images.push(formattedUrl);
          }
        }
      });
    }
    
    if (property.images && property.images.length > 0) {
      property.images.forEach(image => {
        if (image && typeof image === 'string') {
          const formattedUrl = formatImageUrl(image);
          if (formattedUrl) {
            images.push(formattedUrl);
          }
        }
      });
    }
    
    // If no images found, return fallback
    return images.length > 0 ? images : ['https://via.placeholder.com/400x300/E2E8F0/64748B?text=Property+Image'];
  };
  
  const allImages = getAllImages();
  const currentImage = allImages[currentImageIndex];

  // Enhanced debugging with image URL testing
  console.log('🏠 Property data debugging:', {
    propertyId: property?._id || property?.id,
    hasPhotos: !!property?.photos,
    photosLength: property?.photos?.length || 0,
    hasPhotosAndVideo: !!property?.photosAndVideo,
    photosAndVideoLength: property?.photosAndVideo?.length || 0,
    hasImages: !!property?.images,
    imagesLength: property?.images?.length || 0,
    samplePhoto: property?.photos?.[0],
    allImagesCount: allImages.length,
    currentImage: currentImage,
    addressStructure: property?.address,
    city: getAddressField(property, 'city'),
    state: getAddressField(property, 'state'),
    locality: getAddressField(property, 'locality'),
    areaSqFt: property?.areaSqFt,
    specificType: property?.specificType,
    bedrooms: property?.bedrooms,
    bathrooms: property?.bathrooms,
    description: property?.description,
    title: property?.title,
    propertyKeys: Object.keys(property || {}),
    FULL_PROPERTY: JSON.stringify(property, null, 2)
  });

  // Test image URL accessibility
  const testImageUrl = (url) => {
    if (url) {
      console.log('🔍 Testing image URL accessibility:', url);
    }
  };
  
  useEffect(() => {
    if (allImages.length > 0) {
      testImageUrl(allImages[currentImageIndex]);
    }
  }, [currentImageIndex, allImages]);

  // Handle call button press
  const handleCallPress = () => {
    if (!property) return;
    
    // Get phone number from property owner
    const owner = property.postedBy || property.userId || property.owner;
    let phoneNumber = null;

    // Extract phone number from owner object or property
    if (owner && typeof owner === 'object') {
      phoneNumber = owner.phone || owner.phoneNumber || owner.contactNumber || owner.mobile;
    } else if (property.contactNumber) {
      phoneNumber = property.contactNumber;
    } else if (property.phone) {
      phoneNumber = property.phone;
    }

    if (!phoneNumber) {
      Alert.alert(
        'Contact Not Available',
        'Phone number for this property is not available.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

    Alert.alert(
      'Call Property Owner',
      `Would you like to call ${cleanPhone}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Call',
          onPress: () => {
            const phoneUrl = `tel:${cleanPhone}`;
            Linking.canOpenURL(phoneUrl)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(phoneUrl);
                } else {
                  Alert.alert('Error', 'Phone calling is not supported on this device.');
                }
              })
              .catch((err) => {
                console.error('Error opening phone dialer:', err);
                Alert.alert('Error', 'Failed to open phone dialer.');
              });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          Property details not available 😟
        </Text>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={handleBackPress}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Improved image handling with proper URL construction
  const getPropertyImage = () => {
    // Try different sources in order of priority
    if (property.photosAndVideo && property.photosAndVideo.length > 0) {
      const firstMedia = property.photosAndVideo[0];
      const imageUrl = firstMedia.uri || firstMedia;
      if (imageUrl && typeof imageUrl === 'string') {
        return formatImageUrl(imageUrl);
      }
    }
    
    if (property.images && property.images.length > 0) {
      const firstImage = property.images[0];
      if (firstImage && typeof firstImage === 'string') {
        return formatImageUrl(firstImage);
      }
    }
    
    // Fallback to a placeholder image
    return 'https://via.placeholder.com/400x300/E2E8F0/64748B?text=Property+Image';
  };

  // Improved title extraction
  const title = safeString(property.title) || safeString(property.description?.substring(0, 50)) || safeString(property.propertyLocation) || "Property";
  const price =
    typeof property.price === "number"
      ? formatPrice(property.price)
      : safeString(property.price, 'N/A');

  const keyDetails = [
    { label: property.bedrooms ? `${property.bedrooms} Bed` : (property.specificType || property.propertyType), icon: "bed-outline" },
    { 
      label: property.bathrooms ? `${property.bathrooms} Bath` : (property.status || 'N/A'),
      icon: "water-outline"
    },
    {
      label: property.areaSqFt
        ? `${property.areaSqFt} sq.ft`
        : (property.areaDetails ? `${property.areaDetails} sq.ft` : 'N/A'),
      icon: "resize-outline",
    },
    { 
      label: property.floorNumber ? `Floor ${property.floorNumber}` : (property.floor ? `Floor ${property.floor}` : (property.furnishingStatus || 'N/A')), 
      icon: "layers-outline" 
    },
    {
      label: property.parking || 'Parking Info N/A',
      icon: "car-outline"
    },
  ].filter((d) => d.label && d.label !== 'N/A');

  // --- Static Google Map URL ---
  const latitude = property.latitude || 37.78825;
  const longitude = property.longitude || -122.4324;
  // REMINDER: Replace YOUR_API_KEY with an actual Google Maps API key
  // Use blue marker instead of orange
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:blue%7C${latitude},${longitude}&key=YOUR_API_KEY`;

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleMediaPress = (media, index) => {
    console.log('Media pressed:', media, 'Index:', index);
    console.log('All images:', allImages);
    setShowFullscreenMedia(true);
  };

  const closeFullscreenMedia = () => {
    setShowFullscreenMedia(false);
  };

  const renderAmenity = ({ item }) => (
    <View style={styles.amenityCard}>
      <View style={styles.amenityIconWrap}>
        <Icon name={getAmenityIcon(item)} size={18} color={colors.primary} />
      </View>
      <Text style={styles.amenityText} numberOfLines={1}>
        {item}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Image Gallery */}
      <View style={styles.galleryContainer}>
        <TouchableOpacity onPress={() => setShowFullscreenMedia(true)}>
          <Image
            source={{ uri: currentImage }}
            style={styles.galleryImage}
            resizeMode="cover"
            onError={(error) => {
              setImageError(true);
              console.log('❌ Image failed to load:', currentImage);
              console.log('Error details:', error.nativeEvent);
            }}
            onLoad={() => {
              setImageError(false);
              console.log('✅ Image loaded successfully:', currentImage);
            }}
          />
        </TouchableOpacity>
        
        {/* Show error overlay if image fails to load */}
        {imageError && (
          <View style={styles.imageErrorOverlay}>
            <Icon name="image-outline" size={48} color="#9CA3AF" />
            <Text style={styles.imageErrorText}>Image not available</Text>
          </View>
        )}
        
        {/* Image indicators */}
        {allImages.length > 1 && (
          <View style={styles.imageIndicators}>
            {allImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
        
        {/* Navigation arrows */}
        {allImages.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => {
                setCurrentImageIndex(prev => 
                  prev === 0 ? allImages.length - 1 : prev - 1
                );
                setImageError(false);
              }}
            >
              <Icon name="chevron-back" size={20} color={colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => {
                setCurrentImageIndex(prev => 
                  prev === allImages.length - 1 ? 0 : prev + 1
                );
                setImageError(false);
              }}
            >
              <Icon name="chevron-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          </>
        )}

        {/* Header Buttons Overlay */}
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.glassButton} onPress={handleBackPress}>
            <Icon name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.glassButton} 
            onPress={handleSaveProperty}
            disabled={savingProperty}
          >
            {savingProperty ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon 
                name={isSaved ? "heart" : "heart-outline"} 
                size={20} 
                color={isSaved ? "#EF4444" : colors.white} 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Media Counter */}
        {allImages.length > 1 && (
          <View style={styles.mediaCounter}>
            <Text style={styles.mediaCounterText}>
              {allImages.length} images
            </Text>
          </View>
        )}

        <View style={styles.curveBottom} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={styles.infoCard}>
          {routeUser ? (
            <View style={styles.userBanner}>
              <Text style={styles.userBannerText}>Viewing as: {routeUser.name} • {routeUser.phone}</Text>
            </View>
          ) : null}
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{price}</Text>
            {(property.propertyLocation || getAddressField(property, 'locality') || getAddressField(property, 'city')) && (
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {safeString(property.propertyLocation) || 
                    `${getAddressField(property, 'locality') || ''}${getAddressField(property, 'locality') && getAddressField(property, 'city') ? ', ' : ''}${getAddressField(property, 'city') || ''}`}
              </Text>
            )}
          </View>
          
          <Text style={styles.titleText}>{title}</Text>

          {/* Property Quick Info Grid */}
          {/* <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <Icon name="home-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.specificType || property.residentialType || property.commercialType || property.propertyType || 'N/A'}
                </Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Icon name="calendar-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : (property.postedDate ? new Date(property.postedDate).toLocaleDateString() : 'N/A')}
                </Text>
              </View>
            </View>
            
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <Icon name="resize-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.areaSqFt ? `${property.areaSqFt} sqft` : (property.areaDetails ? `${property.areaDetails} sqft` : 'N/A')}
                </Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Icon name="people-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.availableFor || (property.purpose ? `For ${property.purpose}` : 'N/A')}
                </Text>
              </View>
            </View>
            
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <Icon name="construct-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.furnishingStatus || 'Unfurnished'}
                </Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Icon name="cash-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.negotiable ? 'Negotiable' : 'Not Negotiable'}
                </Text>
              </View>
            </View>
          </View> */}

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Property Details</Text>
            <View style={styles.featuresGrid}>
              {/* Property Type */}
              {property.propertyType && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Property Type</Text>
                  <Text style={styles.featureValue}>
                    {property.propertyType}
                  </Text>
                </View>
              )}
              {/* Specific Type (Apartment, Villa, etc.) */}
              {(property.specificType || property.residentialType || property.commercialType) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Type</Text>
                  <Text style={styles.featureValue}>
                    {property.specificType || property.residentialType || property.commercialType}
                  </Text>
                </View>
              )}
              {/* Purpose (Sell/Rent) */}
              {property.purpose && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Purpose</Text>
                  <Text style={styles.featureValue}>
                    {property.purpose}
                  </Text>
                </View>
              )}
              {property.bedrooms && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Bedrooms</Text>
                  <Text style={styles.featureValue}>
                    {property.bedrooms}
                  </Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Bathrooms</Text>
                  <Text style={styles.featureValue}>
                    {property.bathrooms}
                  </Text>
                </View>
              )}
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Carpet Area</Text>
                <Text style={styles.featureValue}>
                  {property.areaSqFt ? `${property.areaSqFt} sqft` : (property.areaDetails ? `${property.areaDetails} sqft` : 'N/A')}
                </Text>
              </View>
              {/* Space Available (for Commercial) */}
              {property.spaceAvailable && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Space Available</Text>
                  <Text style={styles.featureValue}>
                    {property.spaceAvailable} sqft
                  </Text>
                </View>
              )}
              {(property.floorNumber || property.floor) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Floor</Text>
                  <Text style={styles.featureValue}>
                    {property.floorNumber || property.floor}{property.totalFloors ? ` of ${property.totalFloors}` : ''}
                  </Text>
                </View>
              )}
              {/* Furnishing Status */}
              {(property.furnishingStatus || property.furnishing) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Furnishing</Text>
                  <Text style={styles.featureValue}>
                    {property.furnishingStatus || property.furnishing}
                  </Text>
                </View>
              )}
              {(property.parking || property.parkingAvailable) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Parking</Text>
                  <Text style={styles.featureValue}>
                    {property.parking || property.parkingAvailable}
                  </Text>
                </View>
              )}
              {(() => {
                console.log('🔍 Checking availableFrom field:', {
                  raw: property.availableFrom,
                  exists: !!property.availableFrom,
                  type: typeof property.availableFrom
                });
                return property.availableFrom ? (
                  <View style={styles.featureItem}>
                    <Text style={styles.featureLabel}>Available From</Text>
                    <Text style={styles.featureValue}>
                      {new Date(property.availableFrom).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                ) : null;
              })()}
              {property.availableFor && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Available For</Text>
                  <Text style={styles.featureValue}>
                    {property.availableFor}
                  </Text>
                </View>
              )}
              {property.balconies !== undefined && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Balcony</Text>
                  <Text style={styles.featureValue}>
                    {property.balconies === true || property.balconies === 'true' ? 'Yes' : 'No'}
                  </Text>
                </View>
              )}
              {property.kitchenType && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Kitchen</Text>
                  <Text style={styles.featureValue}>
                    {property.kitchenType}
                  </Text>
                </View>
              )}
              {(property.availabilityStatus || property.availability) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Availability</Text>
                  <Text style={styles.featureValue}>
                    {property.availabilityStatus || property.availability}
                  </Text>
                </View>
              )}
              {property.contactNumber && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Contact Number</Text>
                  <Text style={styles.featureValue}>
                    {property.contactNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Location</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>State</Text>
                <Text style={styles.featureValue}>
                  {getAddressField(property, 'state') || safeString(property.state, 'N/A')}
                </Text>
              </View>
              {/* District */}
              {(getAddressField(property, 'district') || property.district) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>District</Text>
                  <Text style={styles.featureValue}>
                    {getAddressField(property, 'district') || safeString(property.district, '')}
                  </Text>
                </View>
              )}
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>City</Text>
                <Text style={styles.featureValue}>
                  {getAddressField(property, 'city') || safeString(property.city, 'N/A')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Locality</Text>
                <Text style={styles.featureValue}>
                  {getAddressField(property, 'locality') || safeString(property.propertyLocation, 'N/A')}
                </Text>
              </View>
              {(getAddressField(property, 'post') || property.post) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Post Office</Text>
                  <Text style={styles.featureValue}>
                    {getAddressField(property, 'post') || safeString(property.post, '')}
                  </Text>
                </View>
              )}
              {(getAddressField(property, 'pincode') || property.pincode) && (
                <View style={styles.featureItem}>
                  <Text style={styles.featureLabel}>Pincode</Text>
                  <Text style={styles.featureValue}>
                    {getAddressField(property, 'pincode') || safeString(property.pincode, '')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Society Features - Enhanced Display */}
          {(() => {
            // Parse societyFeatures from multiple possible formats
            let featuresArray = [];
            
            // Try to get features from property.societyFeatures
            if (property.societyFeatures) {
              if (typeof property.societyFeatures === 'string') {
                try {
                  // Try parsing as JSON
                  featuresArray = JSON.parse(property.societyFeatures);
                } catch (e) {
                  // If not JSON, try splitting by comma
                  featuresArray = property.societyFeatures.split(',').map(f => f.trim()).filter(Boolean);
                }
              } else if (Array.isArray(property.societyFeatures)) {
                featuresArray = property.societyFeatures;
              }
            }
            
            // Also check if features are in nested address or other objects
            if (featuresArray.length === 0 && property.address?.societyFeatures) {
              if (Array.isArray(property.address.societyFeatures)) {
                featuresArray = property.address.societyFeatures;
              }
            }
            
            const maintenance = property.societyMaintenance || property.address?.societyMaintenance;
            
            console.log('🏢 Society Features Complete Debug:', {
              rawFeatures: property.societyFeatures,
              parsedArray: featuresArray,
              arrayLength: featuresArray.length,
              maintenance: maintenance,
              addressObject: property.address,
              shouldShow: !!(maintenance || featuresArray.length > 0)
            });
            
            // Show section if EITHER maintenance OR features exist
            const shouldShow = !!(maintenance || featuresArray.length > 0);
            
            if (!shouldShow) {
              console.log('❌ Society section hidden - no data found');
              return null;
            }
            
            console.log('✅ Society section will be displayed');
            
            return (
              <View style={styles.featuresSection}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                  <Icon name="business-outline" size={20} color={colors.primary} />
                  <Text style={[styles.featuresTitle, {marginLeft: 8, marginBottom: 0}]}>Society Details</Text>
                </View>
                
                {maintenance && (
                  <View style={styles.societyMaintenanceRow}>
                    <Icon name="cash-outline" size={18} color={colors.primary} />
                    <Text style={styles.societyMaintenanceText}>
                      Maintenance: ₹{maintenance}
                    </Text>
                  </View>
                )}
                
                {featuresArray.length > 0 && (
                  <View>
                    <Text style={{fontSize: 13, color: colors.muted, marginBottom: 8, fontWeight: '600'}}>
                      Available Facilities:
                    </Text>
                    <View style={styles.societyFeaturesWrap}>
                      {featuresArray.map((feature, index) => (
                        <View key={index} style={styles.societyFeatureChip}>
                          <Icon name="checkmark-circle" size={14} color="#22C55E" />
                          <Text style={styles.societyFeatureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Show debug info in development */}
                {__DEV__ && (
                  <Text style={{fontSize: 10, color: '#999', marginTop: 8}}>
                    Debug: {featuresArray.length} features found
                  </Text>
                )}
              </View>
            );
          })()}

          {/* Property Status and Type */}
          <View style={styles.propertyMetaRow}>
            {/* {property.purpose && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#22C55E' }]}>
                  {property.purpose}
                </Text>
              </View>
            )} */}
            {property.propertyType && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#3B82F6' }]}>
                  {property.propertyType}
                </Text>
              </View>
            )}
            {property.availability && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(251, 146, 60, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#FB923C' }]}>
                  {property.availability}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        {property.description ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="document-text" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>About this property</Text>
            </View>
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionText}>{property.description}</Text>
            </View>
          </View>
        ) : null}

        {/* Amenities */}
        {property.amenities?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Amenities & Features</Text>
            </View>
            <FlatList
              data={property.amenities}
              renderItem={renderAmenity}
              keyExtractor={(item, i) => i.toString()}
              numColumns={3}
              columnWrapperStyle={styles.amenityRow}
              scrollEnabled={false}
            />
          </View>
        ) : null}

      </ScrollView>

      {/* Bottom Bar - Respects owner's contact preferences */}
      <View style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          {/* Call Button - Only show if owner allows phone contact */}
          {(property.contactPreferences?.phone !== false && property.contactPreferences?.phone !== 'false') && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCallPress}
          >
            <Icon name="call" size={16} color={colors.white} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          )}

          {/* WhatsApp Button - Only show if owner allows whatsapp contact */}
          {(property.contactPreferences?.whatsapp !== false && property.contactPreferences?.whatsapp !== 'false') && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.whatsappBtn]}
            onPress={() => {
              const phoneNumber = property.contactNumber || property.phone;
              if (!phoneNumber) {
                Alert.alert(
                  'Contact Not Available',
                  'WhatsApp contact is not available for this property.',
                  [{ text: 'OK' }]
                );
                return;
              }
              
              const message = `Hi! I'm interested in your property: ${property.title || property.description || 'Property'}. Price: ${price}`;
              const whatsappUrl = `whatsapp://send?phone=91${phoneNumber}&text=${encodeURIComponent(message)}`;              
              Linking.canOpenURL(whatsappUrl).then((supported) => {
                if (supported) {
                  Linking.openURL(whatsappUrl);
                } else {
                  Alert.alert(
                    'WhatsApp Not Available',
                    'WhatsApp is not installed on your device.',
                    [{ text: 'OK' }]
                  );
                }
              });
            }}
          >
            <Icon name="logo-whatsapp" size={16} color={colors.white} />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          )}

          {/* Chat Button - Only show if owner allows chat contact */}
          {(property.contactPreferences?.chat !== false && property.contactPreferences?.chat !== 'false') && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.chatBtn]}
            onPress={() => {
              // Extract ownerId from property data (try all possible fields)
              let ownerId = null;
              let ownerData = null;
              
              // Try to get full owner object first
              if (property.postedBy && typeof property.postedBy === 'object') {
                ownerData = property.postedBy;
                ownerId = property.postedBy._id || property.postedBy.id;
              } else if (property.postedBy) {
                ownerId = property.postedBy;
              } else if (property.userId && typeof property.userId === 'object') {
                ownerData = property.userId;
                ownerId = property.userId._id || property.userId.id;
              } else if (property.userId) {
                ownerId = property.userId;
              } else if (property.owner && typeof property.owner === 'object') {
                ownerData = property.owner;
                ownerId = property.owner._id || property.owner.id;
              } else if (property.owner) {
                ownerId = property.owner;
              } else if (property.user && typeof property.user === 'object') {
                ownerData = property.user;
                ownerId = property.user._id || property.user.id;
              } else if (property.user) {
                ownerId = property.user;
              } else if (property.createdBy && typeof property.createdBy === 'object') {
                ownerData = property.createdBy;
                ownerId = property.createdBy._id || property.createdBy.id;
              } else if (property.createdBy) {
                ownerId = property.createdBy;
              }

              console.log('💬 Chat button pressed:', {
                propertyId: property._id || property.id,
                ownerId: ownerId,
                ownerData: ownerData,
                propertyTitle: property.title
              });

              // Validate ownerId exists
              if (!ownerId) {
                Alert.alert(
                  'Chat Not Available',
                  'Owner information is not available for this property. Please contact support.',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Navigate to ChatDetailScreen with user object (for compatibility)
              navigation.navigate("ChatDetailScreen", {
                user: ownerData || { _id: ownerId, id: ownerId },
                propertyId: property._id || property.id,
                propertyTitle: property.title || "Property",
                chatId: null, // Will be created/fetched in ChatDetailScreen
              });
            }}
          >
            <Icon name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Chat</Text>
          </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Simple Fullscreen Image Modal */}
      <Modal
        visible={showFullscreenMedia}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreenMedia}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenModalContainer}>
          <Image
            source={{ uri: currentImage }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.fullscreenCloseButton} 
            onPress={closeFullscreenMedia}
          >
            <Icon name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          
          {/* Media Info */}
          <View style={styles.fullscreenMediaInfo}>
            <Text style={styles.fullscreenMediaTitle}>{title}</Text>
            <Text style={styles.fullscreenMediaPrice}>{price}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: "center", alignItems: "center" },
  galleryContainer: { 
    height: GALLERY_HEIGHT, 
    width,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: GALLERY_HEIGHT,
    backgroundColor: colors.background,
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: colors.white,
    width: 20,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -20 }],
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  headerButtons: {
    position: "absolute",
    top: Platform.OS === "ios" ? 42 : 18,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mediaCounter: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 66,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  mediaCounterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  curveBottom: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  content: { flex: 1, marginTop: -20 },
  infoCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  priceRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: 'flex-start',
  },
  priceText: { 
    fontSize: 26, 
    fontWeight: "900", 
    color: colors.primary,
    letterSpacing: -0.5,
  },
  locationText: { 
    color: colors.muted, 
    fontSize: 12, 
    flexShrink: 1,
    marginTop: 4,
  },
  titleText: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: colors.text, 
    marginTop: 10,
    lineHeight: 28,
  },
  detailsRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginTop: 16,
    gap: 10,
  },
  detailPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,144,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  detailPillText: { 
    marginLeft: 8, 
    color: colors.primary, 
    fontWeight: "700",
    fontSize: 13,
  },
  
  // New Quick Info Grid Styles
  quickInfoGrid: {
    marginTop: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  quickInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.48,
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  quickInfoText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    marginLeft: 8,
  },
  
  // Features Section Styles
  featuresSection: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  featureLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  featureValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  showMoreButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  showMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  
  // Society Features Styles
  societyMaintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  societyMaintenanceText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  societyFeaturesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  societyFeatureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  societyFeatureText: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
  },
  
  propertyMetaRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(30, 144, 255, 0.15)",
    gap: 8,
  },
  metaPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  section: { marginTop: 20, marginHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: colors.text,
    marginLeft: 8,
  },
  sectionText: { 
    color: colors.text, 
    lineHeight: 24, 
    fontSize: 15,
  },
  descriptionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  amenityRow: { justifyContent: "space-between" },
  amenityCard: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.08)',
  },
  amenityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(30,144,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityText: { 
    marginTop: 10, 
    fontSize: 12, 
    color: colors.text, 
    fontWeight: "600",
    textAlign: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  locationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  userBanner: {
    backgroundColor: 'rgba(30,144,255,0.06)',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  userBannerText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  bottomBarWrap: { 
    position: "absolute", 
    left: 0, 
    right: 0, 
    bottom: Platform.OS === 'ios' ? 34 : 30, 
    alignItems: "center",
    paddingHorizontal: 20,
    // Extra padding for devices with gesture navigation
    paddingBottom: Platform.OS === 'android' ? 10 : 0,
  },
  bottomBar: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    justifyContent: "center",
    marginHorizontal: 2,
  },
  callBtn: {
    backgroundColor: '#22C55E',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',  // WhatsApp green color
  },
  chatBtn: {
    backgroundColor: "rgba(30,144,255,0.08)",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  actionText: { 
    color: colors.white, 
    fontWeight: "800", 
    fontSize: 14,
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  
  // Fullscreen Modal Styles
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height * 0.8,
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullscreenMediaInfo: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
  },
  fullscreenMediaTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  fullscreenMediaPrice: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Property Specifications Styles
  specificationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,144,255,0.05)',
  },
  specLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },

  // Nearby Facilities Styles
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  facilityCard: {
    width: '30%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  facilityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  facilityName: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  facilityDistance: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },

  // Special Features Styles
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Property Owner Styles
  ownerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  ownerPhone: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  ownerType: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Property Specifications Styles
  specificationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,144,255,0.05)',
  },
  specLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },

  // Nearby Facilities Styles
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  facilityCard: {
    width: '30%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  facilityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  facilityName: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  facilityDistance: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },

  // Special Features Styles
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Property Owner Styles
  ownerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  ownerPhone: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  ownerType: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Property History Styles
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,144,255,0.05)',
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '400',
  },

  // Neighborhood Information Styles
  neighborhoodCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  neighborhoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  neighborhoodItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30,144,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  neighborhoodValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 2,
  },
  neighborhoodLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },

  // Investment Potential Styles
  investmentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  investmentItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  investmentValue: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 4,
  },
  investmentLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  investmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  investmentTrend: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 2,
  },
  priceAnalysis: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,144,255,0.1)',
  },
  priceAnalysisTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceComparisonLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
  },
  priceComparisonValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
  priceInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(93, 169, 246, 0.1)',
    borderRadius: 8,
  },
  priceInsightText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },

  // Additional Information Styles
  additionalInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(30,144,255,0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Property Documents Styles
  documentsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,144,255,0.05)',
  },
  documentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30,144,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '500',
  },

  // Financial Information Styles
  financialCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  financialValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PropertyDetailsScreen;

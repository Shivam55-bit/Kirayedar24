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
  
  // All hooks must be called at the top level, before any early returns
  const [property, setProperty] = useState(routeProperty || null);
  const [loading, setLoading] = useState(!routeProperty);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullscreenMedia, setShowFullscreenMedia] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  useEffect(() => {
    if (property) return;

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

    if (itemId) fetchAndFind();
    else setLoading(false);
  }, [itemId]);

  // Get all available images with proper URL formatting
  const getAllImages = () => {
    if (!property) return ['https://via.placeholder.com/400x300/E2E8F0/64748B?text=Property+Image'];
    
    const images = [];
    
    if (property.photosAndVideo && property.photosAndVideo.length > 0) {
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
  console.log('🏠 Property image debugging:', {
    propertyId: property?._id || property?.id,
    hasPhotosAndVideo: !!property?.photosAndVideo,
    photosAndVideoLength: property?.photosAndVideo?.length || 0,
    hasImages: !!property?.images,
    imagesLength: property?.images?.length || 0,
    samplePhotosAndVideo: property?.photosAndVideo?.[0],
    sampleImages: property?.images?.[0],
    allImages: allImages,
    currentImage: currentImage,
    formattedCurrentImage: formatImageUrl(currentImage),
    propertyKeys: Object.keys(property || {})
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

  const title = property.title || property.description || "Property";
  const price =
    typeof property.price === "number"
      ? formatPrice(property.price)
      : property.price || "N/A";

  const keyDetails = [
    { label: property.bedrooms || property.propertyType, icon: "bed-outline" },
    { 
      label: property.bathrooms ? `${property.bathrooms} Bath` : property.status,
      icon: "water-outline"
    },
    {
      label: property.areaDetails
        ? `${property.areaDetails} sq.ft`
        : property.size,
      icon: "resize-outline",
    },
    { 
      label: property.floor ? `Floor ${property.floor}` : property.furnishingStatus, 
      icon: "layers-outline" 
    },
    {
      label: property.parking ? `${property.parking} Parking` : 'No Parking Info',
      icon: "car-outline"
    },
  ].filter((d) => d.label);

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
          <TouchableOpacity style={styles.glassButton}>
            <Icon name="heart-outline" size={20} color={colors.white} />
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
            {property.propertyLocation && (
              <Text style={styles.locationText} numberOfLines={1}>
                📍 {property.propertyLocation}
              </Text>
            )}
          </View>
          
          <Text style={styles.titleText}>{title}</Text>

          {/* Property Quick Info Grid */}
          <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <Icon name="home-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.residentialType || property.commercialType || property.propertyType}
                </Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Icon name="calendar-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : '2025-02-28'}
                </Text>
              </View>
            </View>
            
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <Icon name="resize-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.areaDetails ? `${property.areaDetails} sqft` : '400 sqft'}
                </Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Icon name="people-outline" size={16} color={colors.text} />
                <Text style={styles.quickInfoText}>
                  {property.availableFor || 'Family'}
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
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>City</Text>
                <Text style={styles.featureValue}>
                  {property.city || 'Normadapuram'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Area</Text>
                <Text style={styles.featureValue}>
                  {property.locality || 'ITI HOUSING BOARD'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Floor</Text>
                <Text style={styles.featureValue}>
                  {property.floorNumber || '2'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureLabel}>Carpet Area</Text>
                <Text style={styles.featureValue}>
                  {property.areaDetails ? `${property.areaDetails} sqft` : '400 sqft'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>Show More</Text>
            </TouchableOpacity>
          </View>

          {/* Property Status and Type */}
          <View style={styles.propertyMetaRow}>
            {property.purpose && (
              <View style={[styles.metaPill, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Text style={[styles.metaPillText, { color: '#22C55E' }]}>
                  {property.purpose}
                </Text>
              </View>
            )}
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

      {/* Bottom Bar */}
      <View style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          {/* Call Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCallPress}
          >
            <Icon name="call" size={16} color={colors.white} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          {/* WhatsApp Button */}
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

          {/* Chat Button */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.chatBtn]}
            onPress={() => {
              const chatUser = property.postedBy || property.userId || property.owner; 

              if (!chatUser) {
                Alert.alert(
                  'Contact Not Available',
                  'Chat is not available for this property.',
                  [{ text: 'OK' }]
                );
                return;
              }

              navigation.navigate("ChatDetailScreen", {
                user: chatUser,
                propertyId: property._id || property.id,
                propertyTitle: property.title || "Property",
              });
            }}
          >
            <Icon name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Chat</Text>
          </TouchableOpacity>
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
    bottom: Platform.OS === 'ios' ? 30 : 20, 
    alignItems: "center",
    paddingHorizontal: 20,
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

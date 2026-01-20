import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  SafeAreaView,
  Alert,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

import { formatImageUrl, formatPrice } from '../services/propertyHelpers';
import { launchImageLibrary } from 'react-native-image-picker';
import propertyService from '../services/propertyapi';

// Fallback functions in case imports fail
const safeFormatImageUrl = (url) => {
  if (!url) return 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('uploads/')) return `https://n5.bhoomitechzone.us/${url}`;
  return url.startsWith('/') ? `https://n5.bhoomitechzone.us${url}` : `https://n5.bhoomitechzone.us/${url}`;
};

const safeFormatPrice = (price) => {
  if (!price) return '₹0';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '₹0';
  if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(1)}Cr`;
  if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(1)}L`;
  if (numPrice >= 1000) return `₹${(numPrice / 1000).toFixed(1)}K`;
  return `₹${numPrice}`;
};

// --- Color Palette (Consistent) ---
const COLORS = {
  primary: '#FDB022',
  primaryDark: '#F59E0B',
  accent: '#EC4899',
  danger: '#EF4444',
  success: '#10B981',
  background: '#F8FAFB',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#9CA3AF',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
};

const EditPropertyScreen = ({ navigation, route }) => {
  // Use property passed via route params, or mock data for testing
  const initialProperty = route?.params?.listing || route?.params?.property || {};
  
  console.log('====================================');
  console.log('[EditPropertyScreen] RECEIVED DATA:');
  console.log('====================================');
  console.log('Full property:', JSON.stringify(initialProperty, null, 2));
  console.log('Photos field:', initialProperty.photos);
  console.log('PhotosAndVideo field:', initialProperty.photosAndVideo);
  console.log('Images field:', initialProperty.images);
  console.log('Image field:', initialProperty.image);
  console.log('Price:', initialProperty.price);
  console.log('Location:', initialProperty.propertyLocation);
  console.log('Bedrooms:', initialProperty.bedrooms);
  console.log('Bathrooms:', initialProperty.bathrooms);
  console.log('====================================');

  // Normalize incoming property keys from server
  const normalizedProperty = {
    ...initialProperty,
    _id: initialProperty._id || initialProperty.id,
    id: initialProperty._id || initialProperty.id || 'temp_' + Date.now(),
    title: initialProperty.description || initialProperty.title || 'Property',
    // Build location from multiple possible fields
    location: (() => {
      // First check direct location fields
      if (initialProperty.propertyLocation) return initialProperty.propertyLocation;
      if (initialProperty.location) return initialProperty.location;
      
      // Build from individual fields (locality, city, state, post)
      const parts = [
        initialProperty.locality || '',
        initialProperty.post || '',
        initialProperty.city || '',
        initialProperty.state || initialProperty.propertyState || ''
      ].filter(part => part && part.trim());
      
      if (parts.length > 0) return parts.join(', ');
      
      // Try address object
      if (initialProperty.address && typeof initialProperty.address === 'object') {
        const addressParts = [
          initialProperty.address.locality || '',
          initialProperty.address.post || initialProperty.address.city || '',
          initialProperty.address.city || '',
          initialProperty.address.state || ''
        ].filter(part => part && part.trim());
        if (addressParts.length > 0) return addressParts.join(', ');
      }
      
      return '';
    })(),
    sqft: (() => {
      const val = initialProperty.areaDetails || initialProperty.areaSqFt || initialProperty.sqft || initialProperty.area || initialProperty.size || '';
      return val ? String(val).replace(/[^0-9.]/g, '') : '';
    })(),
    beds: initialProperty.bedrooms || initialProperty.beds || '',
    baths: initialProperty.bathrooms || initialProperty.baths || '',
    // specificType contains the actual property type like "Flat", "House", etc.
    type: initialProperty.specificType || initialProperty.propertyType || initialProperty.purpose || '',
    status: initialProperty.status || initialProperty.availabilityStatus || 'pending',
    price: initialProperty.price != null ? String(initialProperty.price) : (initialProperty.amount != null ? String(initialProperty.amount) : ''),
    images: (() => {
      // Handle multiple possible image field names
      let imageArray = [];
      
      console.log('[EditPropertyScreen] Processing images...');
      console.log('photos:', initialProperty.photos);
      console.log('photosAndVideo:', initialProperty.photosAndVideo);
      console.log('images:', initialProperty.images);
      console.log('image:', initialProperty.image);
      
      if (initialProperty.photos && Array.isArray(initialProperty.photos) && initialProperty.photos.length > 0) {
        console.log('Using photos array');
        imageArray = initialProperty.photos;
      } else if (initialProperty.photosAndVideo && Array.isArray(initialProperty.photosAndVideo) && initialProperty.photosAndVideo.length > 0) {
        console.log('Using photosAndVideo array');
        imageArray = initialProperty.photosAndVideo;
      } else if (initialProperty.images && Array.isArray(initialProperty.images) && initialProperty.images.length > 0) {
        console.log('Using images array');
        imageArray = initialProperty.images;
      } else if (initialProperty.image) {
        console.log('Using single image');
        imageArray = [initialProperty.image];
      }
      
      console.log('imageArray before mapping:', imageArray);
      
      const result = imageArray.map((it) => {
        if (!it) return null;
        if (typeof it === 'string') return it;
        if (it.url) return it.url;
        if (it.uri) return { uri: it.uri, fileName: it.fileName };
        if (it.path) return it.path;
        if (it.file && it.file.url) return it.file.url;
        return typeof it === 'object' ? (it.uri || it.url || JSON.stringify(it)) : String(it);
      }).filter(Boolean);
      
      console.log('Final images array:', result);
      return result;
    })(),
    description: initialProperty.description || 'No description available',
    furnishing: initialProperty.furnishingStatus || initialProperty.furnishing || '',
    parking: initialProperty.parking || '',
    availableFor: initialProperty.availableFor || '',
  };
  
  console.log('====================================');
  console.log('[EditPropertyScreen] NORMALIZED DATA:');
  console.log('====================================');
  console.log('Images:', normalizedProperty.images);
  console.log('Location:', normalizedProperty.location);
  console.log('Beds:', normalizedProperty.beds);
  console.log('Baths:', normalizedProperty.baths);
  console.log('Price:', normalizedProperty.price);
  console.log('====================================');

  const [property, setProperty] = useState(normalizedProperty);
  const [removedImages, setRemovedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Derived display values for preview
  const firstImage = (property.images && property.images.length > 0)
    ? (typeof property.images[0] === 'string' ? (formatImageUrl || safeFormatImageUrl)(property.images[0]) : property.images[0]?.uri)
    : (property.image ? (formatImageUrl || safeFormatImageUrl)(property.image) : (formatImageUrl || safeFormatImageUrl)(null));

  const displayPrice = (() => {
    const p = property.price;
    const n = Number(p);
    if (!isNaN(n)) return (formatPrice || safeFormatPrice)(n);
    return p || '';
  })();

  const handleChange = (key, value) => {
    setProperty(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    (async () => {
      setLoading(true);
      try {
        // Basic validation
        if (!property.price) {
          Alert.alert('Error', 'Please fill in the Price field.');
          setLoading(false);
          return;
        }

        const propId = property._id || property.id;
        // Validate Mongo ObjectId
        const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
        if (!propId || !isValidObjectId(propId)) {
          setLoading(false);
          Alert.alert('Invalid property id', 'This property appears to be a local/mock item (id: ' + String(propId) + ").\n\nTo update a real property, open Edit from My Listings or ensure the route provides the server _id.");
          return;
        }

        // Map local property fields to API expected keys
        const payload = {
          propertyLocation: property.location || property.propertyLocation || property.propertyLocation,
          description: property.description,
          price: property.price ? Number(property.price) : undefined,
          areaDetails: property.sqft ? Number(property.sqft) : undefined,
          bedrooms: property.beds ? Number(property.beds) : undefined,
          bathrooms: property.baths ? Number(property.baths) : undefined,
          purpose: property.type || property.purpose,
          removedFiles: removedImages.length ? JSON.stringify(removedImages) : undefined,
          removePhotos: removedImages.length ? JSON.stringify(removedImages) : undefined,
        };

        // Collect only local file objects for upload
        const files = (property.images || []).filter(img => {
          if (!img) return false;
          if (typeof img === 'object' && img.uri) return true;
          if (typeof img === 'string') {
            return img.startsWith('file:') || img.startsWith('content:');
          }
          return false;
        }).map(img => (typeof img === 'string' ? { uri: img, fileName: `file-${Date.now()}` } : img));

        // Prepare FormData for file upload
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });
        // Attach files
        files.forEach((file, idx) => {
          formData.append('photos', {
            uri: file.uri,
            name: file.fileName || `photo_${idx}.jpg`,
            type: file.type || 'image/jpeg',
          });
        });

        const resp = await propertyService.updateProperty(propId, formData);
        const updated = resp && (resp.property || resp.data || resp);
        setLoading(false);
        if (resp.success) {
          Alert.alert('Success', 'Property updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          throw new Error(resp.message || 'Failed to update property');
        }
      } catch (err) {
        console.error('Failed to update property:', err);
        setLoading(false);
        let message = 'Failed to update property';
        try {
          if (err && err.body) {
            const body = err.body;
            if (typeof body === 'string') message = body;
            else if (body && body.message) message = body.message;
            else message = JSON.stringify(body);
          } else if (err && err.message) {
            message = String(err.message);
          }
        } catch (e) {
          message = String(err);
        }
        Alert.alert('Error', message);
      }
    })();
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the listing for "${property.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              const resp = await propertyService.deleteProperty(property._id || property.id);
              setLoading(false);
              if (resp.success) {
                Alert.alert(
                  "Deleted", 
                  "Listing removed.",
                  [{ text: "OK", onPress: () => navigation.goBack() }]
                );
              } else {
                throw new Error(resp.message || 'Failed to delete property');
              }
            } catch (err) {
              setLoading(false);
              Alert.alert('Error', err.message || 'Failed to delete property');
            }
          }
        },
      ]
    );
  };

  const removeImage = (index) => {
    const removed = (property.images || [])[index];
    const updatedImages = (property.images || []).filter((_, i) => i !== index);
    if (removed) {
      if (typeof removed === 'string' || (typeof removed === 'object' && !removed.uri)) {
        setRemovedImages(prev => [...prev, removed]);
      }
      if (typeof removed === 'object' && removed.uri && (removed.uri.startsWith('http') || removed.uri.startsWith('uploads') || removed.uri.includes('/uploads/'))) {
        setRemovedImages(prev => [...prev, removed.uri]);
      }
    }
    setProperty(prev => ({ ...prev, images: updatedImages }));
  };

  const handleImagePicker = () => {
    const options = { mediaType: 'photo', selectionLimit: 10 };
    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorCode) {
        if (response.errorCode) {
          console.warn('ImagePicker Error: ', response.errorMessage || response.errorCode);
          Alert.alert('Error', response.errorMessage || 'Failed to pick media');
        }
        return;
      }

      const assets = response.assets || [];
      const normalized = assets.map((a) => ({ uri: a.uri, type: a.type, fileName: a.fileName || `file-${Date.now()}` }));
      setProperty(prev => ({ ...prev, images: [...(prev.images || []), ...normalized] }));
    });
  };

  const InputField = ({ label, value, onChangeText, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value ?? ''}
        onChangeText={(text) => onChangeText(text)}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={COLORS.textSecondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextLoading]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Property Preview Card */}
        <View style={styles.previewCard}>
          <Image 
            source={{ uri: firstImage || 'https://placehold.co/400x200/CCCCCC/888888?text=No+Image' }} 
            style={styles.previewImage} 
            resizeMode="cover" 
          />
          <View style={styles.previewOverlay} />
          <View style={styles.previewContent}>
            <View style={styles.previewBadges}>
              {property.type ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{property.type}</Text>
                </View>
              ) : null}
              <View style={[styles.statusBadge, { 
                backgroundColor: property.status === 'approved' || property.status === 'Active' ? '#10B981' : '#F59E0B' 
              }]}>
                <Text style={styles.statusBadgeText}>
                  {property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={styles.previewPrice}>
              <Text style={styles.previewPriceText}>{displayPrice || '₹0'}</Text>
              <Text style={styles.previewLocationText}>{property.location || 'Location not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Photos & Media */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="images" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Photos ({(property.images || []).length}/10)</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScrollContent}
          >
            {(property.images || []).map((item, index) => (
              <View key={index} style={styles.imageThumbContainer}>
                <Image source={{ uri: typeof item === 'string' ? (formatImageUrl || safeFormatImageUrl)(item) : item.uri }} style={styles.imageThumb} />
                <TouchableOpacity 
                  style={styles.deleteImageBtn} 
                  onPress={() => removeImage(index)}
                >
                  <Icon name="close-circle" size={24} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addMediaBtn} onPress={handleImagePicker}>
              <Icon name="add-circle" size={32} color={COLORS.primary} />
              <Text style={styles.addMediaText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Section 2: Core Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Property Details</Text>
          </View>
          
          <InputField 
            label="Location/Address" 
            value={property.location} 
            onChangeText={(text) => handleChange('location', text)} 
          />
          <View style={styles.rowWrapper}>
            <View style={styles.rowItem}>
              <InputField 
                label="Bedrooms" 
                value={String(property.beds || '')}
                onChangeText={(text) => handleChange('beds', text)} 
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rowItem}>
              <InputField 
                label="Bathrooms" 
                value={String(property.baths || '')}
                onChangeText={(text) => handleChange('baths', text)} 
                keyboardType="numeric"
              />
            </View>
          </View>
          <InputField 
            label="Description" 
            value={property.description} 
            onChangeText={(text) => handleChange('description', text)} 
            multiline
          />
        </View>

        {/* Section 3: Financials & Size */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="cash" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Pricing & Measurements</Text>
          </View>
          
          <InputField 
            label="Price (₹)" 
            value={property.price} 
            onChangeText={(text) => handleChange('price', text)} 
            keyboardType="numeric"
          />
          
          <View style={styles.rowWrapper}>
            <View style={styles.rowItem}>
              <InputField 
                label="Area (sqft)" 
                value={property.sqft} 
                onChangeText={(text) => handleChange('sqft', text)} 
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rowItem}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Property Type</Text>
                <View style={styles.typeDisplay}>
                  <Text style={styles.typeText}>{property.type || 'Not specified'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: Status Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="toggle" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Listing Status</Text>
          </View>
          
          <View style={styles.statusGroup}>
            <View>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[
                styles.statusValue,
                { color: property.status === 'approved' || property.status === 'Active' ? COLORS.success : COLORS.accent }
              ]}>
                {property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
        >
          <Icon name="trash" size={20} color={COLORS.card} />
          <Text style={styles.deleteText}>Delete Listing</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContent: { 
    padding: 20 
  },

  // --- Header ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFB",
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  saveBtn: { 
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FDB022",
    borderRadius: 12,
  },
  saveText: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#FFFFFF",
  },
  saveTextLoading: { 
    opacity: 0.6,
  },

  // --- Sections ---
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: '#1A1A1A',
  },

  // --- Preview Card ---
  previewCard: {
    height: 200,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  previewContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  previewBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#FDB022',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  previewPrice: {
    alignSelf: 'flex-start',
  },
  previewPriceText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  previewLocationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },

  // --- Image Gallery ---
  imageScrollContent: {
    gap: 12,
  },
  imageThumbContainer: {
    position: 'relative',
    height: 120,
    width: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  imageThumb: {
    height: '100%',
    width: '100%',
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  addMediaBtn: {
    height: 120,
    width: 120,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 6,
    fontWeight: '600'
  },

  // --- Input Fields ---
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputMultiline: {
    height: 120,
    textAlignVertical: 'top',
    paddingVertical: 14,
  },

  // --- Layout Wrappers ---
  rowWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  rowItem: {
    flex: 1,
  },
  typeDisplay: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // --- Status Management ---
  statusGroup: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  statusButtonText: {
    color: COLORS.card,
    fontWeight: '700',
    fontSize: 14,
  },

  // --- Delete Button ---
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  deleteText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditPropertyScreen;
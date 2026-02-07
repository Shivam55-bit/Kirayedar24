import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const MediaPickerModal = ({ visible, onClose, onCamera, onGallery }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <LinearGradient
              colors={['#f39c12', '#e67e22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Icon name="images-outline" size={44} color="#fff" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Add Media</Text>
              <Text style={styles.headerSubtitle}>Choose photos or videos for your property</Text>
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
              {/* Camera Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  onCamera();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionIconContainer}
                >
                  <Icon name="camera-outline" size={32} color="#fff" />
                </LinearGradient>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Camera</Text>
                  <Text style={styles.optionSubtitle}>Take a new photo or video</Text>
                </View>
                <Icon name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              {/* Gallery Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  onGallery();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#e74c3c', '#c0392b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionIconContainer}
                >
                  <Icon name="image-outline" size={32} color="#fff" />
                </LinearGradient>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Gallery</Text>
                  <Text style={styles.optionSubtitle}>Select from your device</Text>
                </View>
                <Icon name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Icon name="information-circle" size={20} color="#f39c12" />
                <Text style={styles.infoText}>
                  You can upload multiple photos and videos to showcase your property better
                </Text>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 8,
    zIndex: 10,
  },
  headerIcon: {
    marginTop: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#fff9f0',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default MediaPickerModal;

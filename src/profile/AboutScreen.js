import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

let pkg = {};
try { pkg = require('../../package.json'); } catch (e) { pkg = {}; }

const COLORS = {
  primary: '#FDB022',
  primaryDark: '#E5A01F',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  greyText: '#64748B',
  accent: '#06B6D4',
};

const AboutScreen = ({ navigation }) => {
  const appName = 'Kirayedar24';
  const version = pkg.version || '1.0.0';

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Icon name="home" size={50} color={COLORS.primary} />
          </View>
        </View>

        {/* App Name & Version */}
        <Text style={styles.appName}>{appName}</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>Version {version}</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            Kirayedar24 helps buyers, sellers and renters manage property listings and enquiries in one place.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Icon name="search-outline" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Find Properties</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="heart-outline" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Save Favorites</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="chatbubble-outline" size={24} color={COLORS.primary} />
            <Text style={styles.featureText}>Quick Enquiry</Text>
          </View>
        </View>

        {/* Contact Support Button */}
        <TouchableOpacity 
          style={styles.supportButton} 
          onPress={() => openLink('mailto:support@kirayedar24.com')}
          activeOpacity={0.8}
        >
          <Icon name="mail-outline" size={20} color={COLORS.white} />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>Made with ❤️ in India</Text>
        <Text style={styles.copyrightText}>© 2024-2026 Kirayedar24. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.text 
  },
  content: { 
    flex: 1,
    padding: 24, 
    alignItems: 'center' 
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  appName: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  versionBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
  },
  versionText: { 
    fontSize: 14, 
    color: COLORS.primaryDark, 
    fontWeight: '600',
  },
  descriptionCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  description: { 
    color: COLORS.greyText, 
    textAlign: 'center', 
    lineHeight: 24,
    fontSize: 15,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
    paddingVertical: 16,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.greyText,
    fontWeight: '500',
  },
  supportButton: { 
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  supportButtonText: { 
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
  },
  footerText: {
    marginTop: 40,
    fontSize: 14,
    color: COLORS.greyText,
  },
  copyrightText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.greyText + '80',
  },
});

export default AboutScreen;

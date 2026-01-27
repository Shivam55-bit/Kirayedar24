import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const TermAndConditionScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        {/* Balancer to keep title centered */}
        <View style={styles.addButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Terms and Conditions</Text>
        <Text style={styles.sectionText}>
          Kirayedar24 provides this service to facilitate connections between property owners and tenants without brokerage fees. To access the service (including this site), acceptance of these terms and conditions ("Terms of Use") and our Privacy Policy is required.
        </Text>

        <Text style={styles.sectionTitle}>Service Description</Text>
        <Text style={styles.sectionText}>
          This service offers Residents building-specific networks to foster neighborly interaction and knowledge sharing about the surrounding area. Subject to the following provisions and any agreements with building owners, management, or associations, the following service elements are available to Residents:
        </Text>

        <Text style={styles.sectionSubTitle}>1. Location approach:</Text>
        <Text style={styles.sectionText}>
          Each user is permitted only one username and password, using the user's provided email address or contact number. We retain the right to verify this information prior to account activation. Account rejection or deactivation may occur if the account is deemed a brokerage account or for any other reason deemed appropriate by Kirayedar24, for which no explanation or justification is required.
        </Text>
        <Text style={styles.sectionText}>
          Users are responsible for maintaining password and account confidentiality and are liable for all activities performed under their password or account, regardless of knowledge or authorization. Knowingly sharing login credentials may result in account suspension or termination, in addition to other available legal remedies.
        </Text>
        <Text style={styles.sectionText}>
          Unauthorized password or account use, or any security breach, must be reported immediately. We are not liable for losses resulting from password or account compromise or security breaches, nor for losses resulting from non-compliance with this section.
        </Text>

        <Text style={styles.sectionSubTitle}>2. Membership Information:</Text>
        <Text style={styles.sectionText}>
          To register, please provide your full name, address, email address, phone number, and a chosen password. Your email address and/or phone number will serve as your login credentials. All registration information must be accurate and complete. This information will be publicly viewable on the website. We reserve the right to verify your ownership or tenancy status using the provided information, though we are not obligated to do so.
        </Text>

        <Text style={styles.sectionSubTitle}>3. Detailed profile:</Text>
        <Text style={styles.sectionText}>
          Your Kirayedar24 profile must not contain telephone numbers (except where requested), or any photographs depicting nudity, profanity, obscenity, excessive violence, harassment, sexually explicit content, or other objectionable material.
        </Text>
        <Text style={styles.sectionText}>
          While we prohibit such content, user-generated profile information may contain inaccurate, inappropriate, offensive, or sexually explicit material, products, or services in violation of our Terms of Use. Kirayedar24 disclaims all responsibility and liability for such material. However, we encourage you to assist us in maintaining a clean website by reporting any misuse of the service.
        </Text>

        <Text style={styles.sectionSubTitle}>4. Locality (neighbor) information:</Text>
        <Text style={styles.sectionText}>
          The platform incorporates local information sourced from third-party providers such as Google Maps. Kirayedar24 disclaims any responsibility for the accuracy, integrity, or quality of this third-party content.
        </Text>
        <Text style={styles.sectionText}>
          Furthermore, all interactions with businesses accessed via the service, including transactions, delivery of goods or services, and associated terms, are solely the responsibility of the user and the respective business. Kirayedar24 bears no liability for damages resulting from user interactions with these third parties.
        </Text>

        <Text style={styles.smallNote}>© 2024 Kirayedar24. All rights reserved.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Kirayedar24</Text>
        <Text style={styles.footerSub}>All rights reserved</Text>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFB',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF7ED',
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionSubTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 20,
  },
  listItem: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    marginBottom: 6,
  },
  smallNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 20,
    marginBottom: 20,
  },
  footer: {
    backgroundColor: '#FDB022',
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  footerSub: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default TermAndConditionScreen;
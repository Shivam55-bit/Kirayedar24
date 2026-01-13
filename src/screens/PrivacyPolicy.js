import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const PrivacyPolicy = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        {/* Balancer to keep title centered */}
        <View style={styles.addButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>AGREEMENT BETWEEN KIRAYEDAR24 AND PROPERTY OWNERS</Text>
        
        <Text style={styles.sectionSubTitle}>Terms and Conditions for Property Owners:</Text>
        
        <Text style={styles.sectionTitle}>Registration and Use of Services:</Text>
        <Text style={styles.listItem}>• The Property Owner must register on Kirayedar24, providing accurate and up-to-date personal and property details.</Text>
        <Text style={styles.listItem}>• The Property Owner agrees to pay the specified fee to Kirayedar24 for availing of its services.</Text>

        <Text style={styles.sectionTitle}>Property Listings:</Text>
        <Text style={styles.listItem}>• The Property Owner is responsible for uploading authentic property photos and accurate descriptions of the property, including location, rental terms, and amenities.</Text>
        <Text style={styles.listItem}>• Any misleading, fraudulent, or inaccurate information will lead to the suspension or termination of the Property Owner's account.</Text>

        <Text style={styles.sectionTitle}>Background Verification:</Text>
        <Text style={styles.listItem}>• Kirayedar24 acts solely as a mediator between Property Owners and tenants.</Text>
        <Text style={styles.listItem}>• Kirayedar24 does not conduct any background verification of tenants. The Property Owner is solely responsible for such verifications.</Text>

        <Text style={styles.sectionTitle}>Rental Agreements and Police Verification:</Text>
        <Text style={styles.listItem}>• Before giving any property on rent, the Property Owner must ensure that the necessary rent agreements and police verification are completed.</Text>

        <Text style={styles.sectionTitle}>Communication with Tenants:</Text>
        <Text style={styles.listItem}>• The Property Owner is solely responsible for responding to tenant inquiries and negotiating rental agreements.</Text>
        <Text style={styles.listItem}>• The Property Owner acknowledges that Kirayedar24 is not a party to any rental agreement or contract entered into with the tenant.</Text>

        <Text style={styles.sectionTitle}>Compliance with Laws:</Text>
        <Text style={styles.listItem}>• The Property Owner is responsible for ensuring that their property complies with all applicable local laws, including but not limited to building codes, rental regulations, and tax requirements.</Text>

        <Text style={styles.sectionTitle}>Payment Terms:</Text>
        <Text style={styles.listItem}>• The Property Owner agrees to pay any listing or subscription fees as prescribed by Kirayedar24.</Text>
        <Text style={styles.listItem}>• Fees paid to Kirayedar24 are non-refundable under any circumstances.</Text>

        <Text style={styles.sectionTitle}>Liability Disclaimer:</Text>
        <Text style={styles.listItem}>• Kirayedar24 is not liable for any disputes, damages, or losses arising from the Property Owner's interactions with tenants.</Text>
        <Text style={styles.listItem}>• Addendums or changes in rent amounts and security charges are solely the responsibility of the Property Owner and tenant. Kirayedar24 is not responsible for any changes in rent agreements or disputes arising from such changes.</Text>
        <Text style={styles.listItem}>• Neither the tenant nor the Property Owner has the right to claim any payment disputes with Kirayedar24.</Text>

        <Text style={styles.sectionTitle}>Advance Payments:</Text>
        <Text style={styles.listItem}>• Kirayedar24 will not be responsible for any advance payments made to Property Owners. If tenants make any payments without viewing the property or obtaining confirmation from the Property Owner, the entire responsibility lies with the tenant.</Text>

        <Text style={styles.sectionTitle}>Completion of Tenancy Transaction:</Text>
        <Text style={styles.listItem}>• The Property Owner shall provide Kirayedar24 with confirmation of the successful execution of the agreement and completion of the tenancy transaction.</Text>
        <Text style={styles.listItem}>• The Property Owner must upload the tenancy agreement, possession certificate, and self-attested KYC documents of both the Property Owner and the Tenant.</Text>

        <Text style={styles.sectionTitle}>Termination of Services:</Text>
        <Text style={styles.listItem}>• Kirayedar24 reserves the right to suspend or terminate the Property Owner's account in case of a breach of these terms and conditions.</Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>AGREEMENT BETWEEN KIRAYEDAR24 AND PROBABLE TENANTS</Text>
        
        <Text style={styles.sectionSubTitle}>Terms and Conditions for Probable Tenants:</Text>

        <Text style={styles.sectionTitle}>Registration and Use of Services:</Text>
        <Text style={styles.listItem}>• The Tenant must register on Kirayedar24, providing accurate and up-to-date personal details.</Text>
        <Text style={styles.listItem}>• The Tenant agrees to pay the specified fee to Kirayedar24 for availing of its services.</Text>

        <Text style={styles.sectionTitle}>Property Search and Contact:</Text>
        <Text style={styles.listItem}>• The Tenant can search for rental properties using the filters and information provided on the platform.</Text>
        <Text style={styles.listItem}>• The Tenant is solely responsible for contacting the Property Owner and negotiating the rental agreement.</Text>

        <Text style={styles.sectionTitle}>Accuracy of Information:</Text>
        <Text style={styles.listItem}>• Kirayedar24 does not guarantee the accuracy or authenticity of property listings.</Text>
        <Text style={styles.listItem}>• The Tenant acknowledges that they must conduct their due diligence before entering into any rental agreement.</Text>

        <Text style={styles.sectionTitle}>Advance Payments:</Text>
        <Text style={styles.listItem}>• Kirayedar24 will not be responsible for any advance payments made to Property Owners. If tenants make any payments without viewing the property or obtaining confirmation from the Property Owner, the entire responsibility lies with the tenant.</Text>

        <Text style={styles.sectionTitle}>Rental Charges and Brokerage:</Text>
        <Text style={styles.listItem}>• Kirayedar24 is only a browsing/searching platform for properties. Kirayedar24 is not responsible for any rental charges or brokerage fees charged by the Property Owner. Tenants must clarify such charges directly with the Property Owner.</Text>

        <Text style={styles.sectionTitle}>Addendums in Agreements:</Text>
        <Text style={styles.listItem}>• Addendums or changes in rent amounts and security charges are solely the responsibility of the Tenant and Property Owner. Kirayedar24 is not responsible for any changes in rent agreements or disputes arising from such changes.</Text>
        <Text style={styles.listItem}>• Neither the Tenant nor the Property Owner has the right to claim any payment disputes with Kirayedar24.</Text>

        <Text style={styles.sectionTitle}>Compliance with Laws:</Text>
        <Text style={styles.listItem}>• The Tenant is responsible for ensuring that their rental activities comply with all applicable local laws and regulations.</Text>

        <Text style={styles.sectionTitle}>Liability Disclaimer:</Text>
        <Text style={styles.listItem}>• Kirayedar24 is not liable for any disputes, damages, or losses arising from interactions between the Tenant and the Property Owner.</Text>
        <Text style={styles.listItem}>• The Tenant indemnifies Kirayedar24 against any claims, disputes, or legal actions initiated by the Property Owner or third parties.</Text>

        <Text style={styles.sectionTitle}>Completion of Tenancy Transaction:</Text>
        <Text style={styles.listItem}>• The Tenant shall provide Kirayedar24 with confirmation of the successful execution of the agreement and completion of the tenancy transaction.</Text>
        <Text style={styles.listItem}>• The Tenant must upload the tenancy agreement, possession certificate, and self-attested KYC documents of both the Property Owner and the Tenant.</Text>

        <Text style={styles.sectionTitle}>Termination of Services:</Text>
        <Text style={styles.listItem}>• Kirayedar24 reserves the right to suspend or terminate the Tenant's account in case of a breach of these terms and conditions.</Text>

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
  bodyText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
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
    marginBottom: 12,
    marginTop: 8,
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

export default PrivacyPolicy;
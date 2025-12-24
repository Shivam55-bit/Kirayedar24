/**
 * ContactUsScreen.js
 * Contact information with modern design matching app theme
 */
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Color Scheme matching app theme
const COLORS = {
    primary: "#FDB022",
    primaryLight: "#FDC55E",
    background: "#F8FAFC",
    white: "#FFFFFF",
    black: "#0F172A",
    greyText: "#64748B",
    greyLight: "#F1F5F9",
    cardBackground: "#FFFFFF",
};

const ContactUsScreen = ({ navigation }) => {
    const handleCall = () => {
        Linking.openURL('tel:+919981454039');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:kirayedar24@gmail.com');
    };

    const handleWebsite = () => {
        Linking.openURL('https://www.kirayedar24.com');
    };

    const handleWhatsApp = () => {
        Linking.openURL('https://wa.me/919981454039');
    };

    const handleAddress = () => {
        const address = 'LIG B67, Niyas Colony, Narmadapuram (M.P.) 461001';
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        Linking.openURL(url);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* Header */}
            <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Us</Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo/Title Section */}
                <View style={styles.brandSection}>
                    <View style={styles.logoCircle}>
                        <Icon name="home" size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.brandName}>Kirayedar24</Text>
                    <Text style={styles.brandTagline}>Your Trusted Property Partner</Text>
                </View>

                {/* Contact Cards */}
                <View style={styles.contactSection}>
                    <Text style={styles.sectionTitle}>Get in Touch</Text>

                    {/* Phone Card */}
                    <TouchableOpacity 
                        style={styles.contactCard}
                        onPress={handleCall}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#10B981' + '20' }]}>
                            <Icon name="call" size={24} color="#10B981" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Phone</Text>
                            <Text style={styles.contactValue}>+91 9981454039</Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                    </TouchableOpacity>

                    {/* Email Card */}
                    <TouchableOpacity 
                        style={styles.contactCard}
                        onPress={handleEmail}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#EF4444' + '20' }]}>
                            <Icon name="mail" size={24} color="#EF4444" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Email</Text>
                            <Text style={styles.contactValue}>kirayedar24@gmail.com</Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                    </TouchableOpacity>

                    {/* Website Card */}
                    <TouchableOpacity 
                        style={styles.contactCard}
                        onPress={handleWebsite}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' + '20' }]}>
                            <Icon name="globe" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Website</Text>
                            <Text style={styles.contactValue}>www.kirayedar24.com</Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                    </TouchableOpacity>

                    {/* Address Card */}
                    <TouchableOpacity 
                        style={styles.contactCard}
                        onPress={handleAddress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
                            <Icon name="location" size={24} color="#8B5CF6" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Office Address</Text>
                            <Text style={styles.contactValue}>
                                LIG B67, Niyas Colony,{'\n'}Narmadapuram (M.P.) 461001
                            </Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color={COLORS.greyText} />
                    </TouchableOpacity>
                </View>

                {/* WhatsApp Section */}
                <View style={styles.whatsappSection}>
                    <Text style={styles.whatsappTitle}>Need Quick Help?</Text>
                    <Text style={styles.whatsappSubtitle}>
                        अधिक जानकारी के लिए हमारे WhatsApp Number पर संपर्क करें।
                    </Text>
                    <TouchableOpacity 
                        style={styles.whatsappButton}
                        onPress={handleWhatsApp}
                        activeOpacity={0.8}
                    >
                        <Icon name="logo-whatsapp" size={24} color={COLORS.white} />
                        <Text style={styles.whatsappButtonText}>Chat on WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © 2024 Kirayedar24. All rights reserved.
                    </Text>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    brandSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.black,
        marginBottom: 8,
    },
    brandTagline: {
        fontSize: 14,
        color: COLORS.greyText,
    },
    contactSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: COLORS.greyText,
        marginBottom: 4,
    },
    contactValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
        lineHeight: 20,
    },
    whatsappSection: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    whatsappTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 8,
        textAlign: 'center',
    },
    whatsappSubtitle: {
        fontSize: 14,
        color: COLORS.greyText,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#25D366',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    whatsappButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
        marginLeft: 12,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.greyText,
    },
});

export default ContactUsScreen;

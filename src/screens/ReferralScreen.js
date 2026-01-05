/**
 * ReferralScreen.js
 * Modern referral program screen with invite friends functionality
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
    Clipboard,
    Share,
    Platform,
    Image,
} from 'react-native';
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Color Scheme (matching ProfileScreen) ---
const COLORS = {
    primary: "#FDB022",
    primaryLight: "#FDC55E",
    primaryDark: "#E5A01F",
    background: "#F8FAFC",
    white: "#FFFFFF",
    black: "#0F172A",
    greyText: "#64748B",
    greyLight: "#F1F5F9",
    cardBackground: "#FFFFFF",
    accent: "#06B6D4",
    success: "#10B981",
    warning: "#F59E0B",
    purple: "#8B5CF6",
    pink: "#EC4899",
    orange: "#FDB022",
};

const ReferralScreen = ({ navigation }) => {
    const [referralCode, setReferralCode] = useState('KD24REF123');
    const [totalReferrals, setTotalReferrals] = useState(5);
    const [earnedRewards, setEarnedRewards] = useState(2500);
    const [pendingRewards, setPendingRewards] = useState(1000);

    // Copy referral code to clipboard
    const copyReferralCode = useCallback(async () => {
        try {
            await Clipboard.setString(referralCode);
            Alert.alert('Copied!', 'Referral code copied to clipboard');
        } catch (error) {
            Alert.alert('Error', 'Failed to copy referral code');
        }
    }, [referralCode]);

    // Share referral code
    const shareReferralCode = useCallback(async () => {
        try {
            const shareMessage = `Join Kirayedar24 using my referral code: ${referralCode} and get amazing rewards! Download the app now: https://kirayedar24.com`;
            
            const result = await Share.share({
                message: shareMessage,
                title: 'Join Kirayedar24 - Get Rewards!',
                url: 'https://kirayedar24.com' // Add your app store URL here
            });

            if (result.action === Share.sharedAction) {
                console.log('Referral shared successfully');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to share referral code');
        }
    }, [referralCode]);

    const referralBenefits = [
        {
            icon: 'gift-outline',
            title: '₹500 Bonus',
            description: 'For every successful referral',
            color: COLORS.success
        },
        {
            icon: 'people-outline',
            title: 'Friend Gets ₹200',
            description: 'Your friend also gets rewards',
            color: COLORS.purple
        },
        {
            icon: 'star-outline',
            title: 'VIP Status',
            description: 'Unlock premium features',
            color: COLORS.warning
        },
        {
            icon: 'trending-up-outline',
            title: 'Higher Limits',
            description: 'Increase your transaction limits',
            color: COLORS.accent
        }
    ];

    const howItWorks = [
        {
            step: 1,
            title: 'Share Your Code',
            description: 'Share your unique referral code with friends',
            icon: 'share-social-outline'
        },
        {
            step: 2,
            title: 'Friend Joins',
            description: 'They sign up using your referral code',
            icon: 'person-add-outline'
        },
        {
            step: 3,
            title: 'Get Rewards',
            description: 'Both of you receive instant rewards',
            icon: 'trophy-outline'
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* Header */}
            <View style={styles.headerSection}>
                <View style={styles.headerBar}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Invite Friends</Text>
                    <TouchableOpacity style={styles.headerButton}>
                        <Icon name="help-circle-outline" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.rewardIconContainer}>
                        <Icon name="gift" size={60} color={COLORS.primary} />
                    </View>
                    <Text style={styles.heroTitle}>Earn ₹500 for Every Friend!</Text>
                    <Text style={styles.heroSubtitle}>
                        Invite your friends to Kirayedar24 and earn amazing rewards together
                    </Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Icon name="people" size={24} color={COLORS.primary} />
                        <Text style={styles.statNumber}>{totalReferrals}</Text>
                        <Text style={styles.statLabel}>Total Referrals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="wallet" size={24} color={COLORS.success} />
                        <Text style={styles.statNumber}>₹{earnedRewards}</Text>
                        <Text style={styles.statLabel}>Earned Rewards</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Icon name="time" size={24} color={COLORS.warning} />
                        <Text style={styles.statNumber}>₹{pendingRewards}</Text>
                        <Text style={styles.statLabel}>Pending Rewards</Text>
                    </View>
                </View>

                {/* Referral Code Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Referral Code</Text>
                    <View style={styles.referralCodeCard}>
                        <View style={styles.referralCodeContainer}>
                            <Text style={styles.referralCodeText}>{referralCode}</Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
                                onPress={copyReferralCode}
                            >
                                <Icon name="copy-outline" size={18} color={COLORS.white} />
                                <Text style={styles.actionButtonText}>Copy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                                onPress={shareReferralCode}
                            >
                                <Icon name="share-outline" size={18} color={COLORS.white} />
                                <Text style={styles.actionButtonText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Benefits Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Referral Benefits</Text>
                    <View style={styles.benefitsGrid}>
                        {referralBenefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitCard}>
                                <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '20' }]}>
                                    <Icon name={benefit.icon} size={24} color={benefit.color} />
                                </View>
                                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                <Text style={styles.benefitDescription}>{benefit.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* How It Works Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <View style={styles.stepsContainer}>
                        {howItWorks.map((step, index) => (
                            <View key={index} style={styles.stepCard}>
                                <View style={styles.stepIconContainer}>
                                    <Text style={styles.stepNumber}>{step.step}</Text>
                                    <Icon name={step.icon} size={24} color={COLORS.primary} />
                                </View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                    <Text style={styles.stepDescription}>{step.description}</Text>
                                </View>
                                {index < howItWorks.length - 1 && <View style={styles.stepConnector} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Quick Share Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Share</Text>
                    <View style={styles.shareOptionsContainer}>
                        <TouchableOpacity style={styles.shareOption} onPress={shareReferralCode}>
                            <Icon name="logo-whatsapp" size={24} color="#25D366" />
                            <Text style={styles.shareOptionText}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareOption} onPress={shareReferralCode}>
                            <Icon name="logo-facebook" size={24} color="#1877F2" />
                            <Text style={styles.shareOptionText}>Facebook</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareOption} onPress={shareReferralCode}>
                            <Icon name="logo-instagram" size={24} color="#E4405F" />
                            <Text style={styles.shareOptionText}>Instagram</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareOption} onPress={shareReferralCode}>
                            <Icon name="mail-outline" size={24} color={COLORS.greyText} />
                            <Text style={styles.shareOptionText}>Email</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsSection}>
                    <Text style={styles.termsTitle}>Terms & Conditions</Text>
                    <Text style={styles.termsText}>
                        • Referral bonus is credited after friend's successful registration{'\n'}
                        • Minimum 1 property transaction required for reward activation{'\n'}
                        • Rewards are processed within 24-48 hours{'\n'}
                        • Terms subject to change without prior notice
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // Header Section
    headerSection: {
        backgroundColor: COLORS.primary,
        paddingBottom: 30,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.white,
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        marginTop: -20,
    },
    rewardIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 12,
    },
    heroSubtitle: {
        fontSize: 16,
        color: COLORS.greyText,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },

    // Stats Container
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        marginHorizontal: 5,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.black,
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.greyText,
        textAlign: 'center',
    },

    // Section
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },

    // Referral Code Card
    referralCodeCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    referralCodeContainer: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: COLORS.primary + '20',
        borderStyle: 'dashed',
    },
    referralCodeText: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 5,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginLeft: 8,
    },

    // Benefits Grid
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    benefitCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    benefitIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 6,
        textAlign: 'center',
    },
    benefitDescription: {
        fontSize: 12,
        color: COLORS.greyText,
        textAlign: 'center',
        lineHeight: 16,
    },

    // Steps Container
    stepsContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        position: 'relative',
    },
    stepIconContainer: {
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
    },
    stepNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 8,
    },
    stepContent: {
        flex: 1,
        paddingTop: 5,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: COLORS.greyText,
        lineHeight: 20,
    },
    stepConnector: {
        position: 'absolute',
        left: 14.5,
        top: 68,
        width: 1,
        height: 30,
        backgroundColor: COLORS.greyLight,
    },

    // Share Options
    shareOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    shareOption: {
        alignItems: 'center',
        padding: 10,
    },
    shareOptionText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.greyText,
        marginTop: 6,
    },

    // Terms Section
    termsSection: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
    },
    termsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 12,
    },
    termsText: {
        fontSize: 13,
        color: COLORS.greyText,
        lineHeight: 18,
    },
});

export default ReferralScreen;
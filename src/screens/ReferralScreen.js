/**
 * ReferralScreen.js
 * Simple referral screen with code sharing
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    Clipboard,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";

const COLORS = {
    primary: "#FDB022",
    primaryLight: "#FDC55E",
    background: "#F8FAFC",
    white: "#FFFFFF",
    black: "#0F172A",
    greyText: "#64748B",
    cardBackground: "#FFFFFF",
};

const ReferralScreen = ({ navigation }) => {
    const [referralCode, setReferralCode] = useState('KD24REF123');

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
            const shareMessage = `Join Kirayedar24 using my referral code: ${referralCode}\n\nDownload the app now: https://kirayedar24.com`;
            
            await Share.share({
                message: shareMessage,
                title: 'Join Kirayedar24',
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share referral code');
        }
    }, [referralCode]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Refer & Earn</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Icon name="gift" size={60} color={COLORS.primary} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Invite Friends, Earn Rewards</Text>
                <Text style={styles.subtitle}>
                    Share your referral code with friends
                </Text>

                {/* Referral Code Card */}
                <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>Your Referral Code</Text>
                    <Text style={styles.codeText}>{referralCode}</Text>
                    
                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.copyButton]}
                            onPress={copyReferralCode}
                        >
                            <Icon name="copy-outline" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Copy Code</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.shareButton]}
                            onPress={shareReferralCode}
                        >
                            <Icon name="share-social-outline" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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
        backgroundColor: COLORS.primary,
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.greyText,
        textAlign: 'center',
        marginBottom: 32,
    },
    codeCard: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    codeLabel: {
        fontSize: 12,
        color: COLORS.greyText,
        textAlign: 'center',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    copyButton: {
        backgroundColor: COLORS.greyText,
    },
    shareButton: {
        backgroundColor: COLORS.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});

export default ReferralScreen;

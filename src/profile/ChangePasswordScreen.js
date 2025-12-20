import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput, // Added for input fields
    ScrollView,
    SafeAreaView,
    Alert, // Using Alert for placeholder messaging as it's standard in RN
    ActivityIndicator,
} from 'react-native';
import Icon from "react-native-vector-icons/Ionicons";
// import { profileService } from '../services/profileApi.js'; // REMOVED

// --- Theme Colors (Copied for consistency) ---
const COLORS = {
    primary: "#FF7A00",
    secondary: "#4CAF50", // Green
    background: "#F4F7F9",
    white: "#FFFFFF",
    black: "#333333",
    greyText: "#757575",
    greyLight: "#E0E0E0",
    redAccent: "#D32F2F",
    toggleActive: "#4CAF50",
};

const ChangePasswordScreen = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        setError(''); // Clear previous errors

        // Mock validation (API removed)
        const validation = {
            isValid: currentPassword && newPassword && newPassword === confirmPassword && newPassword.length >= 6,
            errors: {
                ...(!currentPassword && { current: 'Current password is required' }),
                ...(!newPassword && { new: 'New password is required' }),
                ...(newPassword && newPassword.length < 6 && { length: 'Password must be at least 6 characters' }),
                ...(newPassword && confirmPassword && newPassword !== confirmPassword && { match: 'Passwords do not match' })
            }
        };
        
        if (!validation.isValid) {
            const errorMessages = Object.values(validation.errors).join('\\n');
            setError(errorMessages);
            return;
        }

        try {
            setLoading(true);
            
            // Mock password change (API removed)
            const response = {
                success: true,
                message: 'Password changed successfully (offline mode)'
            };
            
            if (response.success) {
                Alert.alert(
                    'Success', 
                    'Password changed successfully!',
                    [
                        { 
                            text: 'OK', 
                            onPress: () => {
                                // Clear fields and go back
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                setError(response.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Change password error:', error);
            setError('Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back-outline" size={26} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                
                <Text style={styles.instructionText}>
                    Please enter your current password, then choose a strong new password.
                </Text>

                {/* Current Password Input */}
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        secureTextEntry={!showCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor={COLORS.greyText}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeToggle}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                        <Icon 
                            name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={COLORS.greyText} 
                        />
                    </TouchableOpacity>
                </View>

                {/* New Password Input */}
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        secureTextEntry={!showNewPassword}
                        placeholder="Enter new password (min 6 characters)"
                        placeholderTextColor={COLORS.greyText}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeToggle}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                        <Icon 
                            name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={COLORS.greyText} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Confirm New Password Input */}
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        secureTextEntry={!showConfirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={COLORS.greyText}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity 
                        style={styles.eyeToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        <Icon 
                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={COLORS.greyText} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error ? (
                    <Text style={styles.errorText}>
                        <Icon name="alert-circle-outline" size={14} color={COLORS.redAccent} /> {error}
                    </Text>
                ) : null}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>Change Password</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

// ----------------------------------------------------------------
// ## Stylesheet
// ----------------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    // --- Header Styles ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyLight,
        elevation: 2,
    },
    backButton: {
        paddingRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.black,
    },
    // --- Content & ScrollView ---
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    instructionText: {
        fontSize: 15,
        color: COLORS.greyText,
        marginBottom: 25,
        lineHeight: 22,
    },
    // --- Input Styles ---
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 8,
        marginTop: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.greyLight,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    input: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.black,
    },
    eyeToggle: {
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    errorText: {
        marginTop: 15,
        fontSize: 14,
        color: COLORS.redAccent,
        fontWeight: '500',
    },
    // --- Button Styles ---
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
});

export default ChangePasswordScreen;

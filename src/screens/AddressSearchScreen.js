/**
 * AddressSearchScreen.js
 * Simple Address Selection (Temporarily simplified)
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Alert,
    Platform,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";
import FeatherIcon from "react-native-vector-icons/Feather";

const COLORS = {
    primary: "#FDB022",
    primaryLight: "#FDC55E",
    primaryDark: "#E5A01F",
    background: "#F8FAFC",
    white: "#FFFFFF",
    black: "#0F172A",
    greyText: "#64748B",
    greyLight: "#F1F5F9",
    redAccent: "#EF4444",
    cardBackground: "#FFFFFF",
    success: "#10B981",
};

const AddressSearchScreen = ({ navigation, route }) => {
    const [selectedAddress, setSelectedAddress] = useState('');
    const [searchText, setSearchText] = useState('');

    const handleSearch = () => {
        if (searchText.trim()) {
            setSelectedAddress(searchText.trim());
            Alert.alert('Address Selected', `You selected: ${searchText.trim()}`);
        }
    };

    const handleConfirmAddress = () => {
        if (!selectedAddress) {
            Alert.alert('No Address Selected', 'Please enter an address first.');
            return;
        }

        // Pass the selected address back to the previous screen
        if (route.params?.onAddressSelect) {
            route.params.onAddressSelect({
                address: selectedAddress,
                location: null // No location data for now
            });
        }
        
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" translucent={false} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Address</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.textInputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your address..."
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                        <Icon name="search" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Map Placeholder */}
            <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                    <Icon name="map-outline" size={80} color={COLORS.greyText} />
                    <Text style={styles.placeholderText}>Map Integration Coming Soon</Text>
                    <Text style={styles.placeholderSubtext}>
                        For now, please enter your address in the search box above
                    </Text>
                </View>
            </View>

            {/* Selected Address Display */}
            {selectedAddress ? (
                <View style={styles.selectedAddressContainer}>
                    <View style={styles.addressInfo}>
                        <Icon name="location-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.selectedAddressText} numberOfLines={2}>
                            {selectedAddress}
                        </Text>
                    </View>
                </View>
            ) : null}

            {/* Confirm Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        !selectedAddress && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmAddress}
                    disabled={!selectedAddress}
                >
                    <Text style={[
                        styles.confirmButtonText,
                        !selectedAddress && styles.confirmButtonTextDisabled
                    ]}>
                        Confirm Address
                    </Text>
                </TouchableOpacity>
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
        paddingVertical: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.white,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    headerSpacer: {
        width: 40,
    },
    searchContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    textInputContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.greyLight,
        borderRadius: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: COLORS.black,
        backgroundColor: 'transparent',
    },
    searchButton: {
        padding: 8,
        marginLeft: 8,
    },
    mapContainer: {
        flex: 1,
        backgroundColor: COLORS.greyLight,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.greyText,
        marginTop: 16,
        textAlign: 'center',
    },
    placeholderSubtext: {
        fontSize: 14,
        color: COLORS.greyText,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    selectedAddressContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedAddressText: {
        fontSize: 14,
        color: COLORS.black,
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
    bottomContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.greyLight,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    confirmButtonTextDisabled: {
        color: COLORS.greyText,
    },
});

export default AddressSearchScreen;

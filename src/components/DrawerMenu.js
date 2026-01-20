import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#FDB022',
    background: '#FFFFFF',
    text: '#1E293B',
    grey: '#64748B',
    border: '#E5E7EB',
    danger: '#DC2626',
};

const DrawerMenu = ({ visible, onClose, onLogout, navigation }) => {
    const menuItems = [
        { label: 'Refer & Earn', icon: 'gift', screen: 'ReferralScreen' },
        { label: 'Help & Support', icon: 'headset', screen: 'PropertyInquiryFormScreen' },
        { label: 'Contact Us', icon: 'call', screen: 'ContactUs' },
        { label: 'Privacy Policy', icon: 'shield-checkmark', screen: 'PrivacyPolicy' },
        { label: 'Terms & Conditions', icon: 'document-text', screen: 'TermAndConditionScreen' },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <StatusBar backgroundColor="rgba(0,0,0,0.4)" barStyle="dark-content" />

            <View style={styles.overlay}>
                <View style={styles.drawer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.appName}>Kirayedar24</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Icon name="close" size={22} color={COLORS.grey} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* Menu */}
                        <ScrollView>
                            {menuItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.menuItem}
                                    onPress={() => {
                                        onClose();
                                        navigation?.navigate(item.screen);
                                    }}
                                >
                                    <Icon name={item.icon} size={20} color={COLORS.primary} />
                                    <Text style={styles.menuText}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.divider} />

                        {/* Logout */}
                        <TouchableOpacity
                            style={styles.logout}
                            onPress={() => {
                                onClose();
                                onLogout();
                            }}
                        >
                            <Icon name="log-out-outline" size={20} color={COLORS.danger} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>

                        <Text style={styles.version}>Version 1.0.0</Text>
                    </SafeAreaView>
                </View>

                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        width: width * 0.75,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    },
    appName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuText: {
        marginLeft: 14,
        fontSize: 15,
        color: COLORS.text,
    },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    logoutText: {
        marginLeft: 14,
        fontSize: 15,
        color: COLORS.danger,
        fontWeight: '500',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.grey,
        marginBottom: 16,
    },
});

export default DrawerMenu;

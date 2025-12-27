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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const DrawerMenu = ({ visible, onClose, onLogout, navigation }) => {
    const menuItems = [
        {
            id: 'menu',
            label: 'Menu',
            icon: 'menu-outline',
            onPress: () => {
                onClose();
                // Menu item action
            }
        },
        {
            id: 'message',
            label: 'Message',
            icon: 'chatbox-outline',
            onPress: () => {
                onClose();
                navigation?.navigate('ChatListScreen');
            }
        },
        {
            id: 'referral',
            label: 'Referral',
            icon: 'share-social-outline',
            onPress: () => {
                onClose();
                // Referral logic
            }
        },
        {
            id: 'help',
            label: 'Help & Support',
            icon: 'help-circle-outline',
            onPress: () => {
                onClose();
                navigation?.navigate('PropertyInquiryFormScreen');
            }
        },
        {
            id: 'contact',
            label: 'Contact Us',
            icon: 'call-outline',
            onPress: () => {
                onClose();
                navigation.navigate('ContactUsScreen');
            }
        },
        {
            id: 'privacy',
            label: 'Privacy Policy',
            icon: 'shield-outline',
            onPress: () => {
                onClose();
                // Navigate to privacy policy
            }
        },
        {
            id: 'terms',
            label: 'Terms & Condition',
            icon: 'document-text-outline',
            onPress: () => {
                onClose();
                // Navigate to terms and conditions
            }
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Left drawer panel */}
                <View style={styles.drawer}>
                    <SafeAreaView style={styles.safeArea}>
                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Icon name="close" size={28} color="#1A1A1A" />
                        </TouchableOpacity>

                        {/* Menu items */}
                        <ScrollView
                            style={styles.menuList}
                            showsVerticalScrollIndicator={false}
                        >
                            {menuItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.menuItem}
                                    onPress={item.onPress}
                                    activeOpacity={0.6}
                                >
                                    <Icon
                                        name={item.icon}
                                        size={22}
                                        color="#FDB022"
                                        style={styles.menuIcon}
                                    />
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Logout button */}
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={() => {
                                onClose();
                                onLogout();
                            }}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name="log-out-outline"
                                size={22}
                                color="#FFFFFF"
                                style={styles.menuIcon}
                            />
                            <Text style={styles.logoutLabel}>Logout</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* Overlay area - close on tap */}
                <TouchableOpacity
                    style={styles.overlayArea}
                    onPress={onClose}
                    activeOpacity={1}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
        width: width * 0.75,
        backgroundColor: '#FFFFFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    closeButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    menuList: {
        flex: 1,
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E0E0E0',
    },
    menuIcon: {
        marginRight: 16,
        width: 24,
    },
    menuLabel: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
        flex: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDB022',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 8,
    },
    logoutLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
        flex: 1,
    },
    overlayArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export default DrawerMenu;

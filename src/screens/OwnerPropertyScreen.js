import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

const OwnerPropertyScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dummy property data for the owner
  const dummyProperties = [
    {
      id: "1",
      title: "Modern 2BHK Apartment",
      location: "Andheri West, Mumbai",
      price: "₹45,000",
      type: "Apartment",
      bedrooms: 2,
      bathrooms: 2,
      area: "1200 sq ft",
      status: "Rented",
      tenantName: "Raj Sharma",
      tenantPhone: "+91 98765 43210",
      rentDue: "15th of every month",
    },
    {
      id: "2",
      title: "Spacious 3BHK Villa",
      location: "Bandra East, Mumbai", 
      price: "₹85,000",
      type: "Villa",
      bedrooms: 3,
      bathrooms: 3,
      area: "2100 sq ft",
      status: "Available",
      tenantName: null,
      tenantPhone: null,
      rentDue: null,
    },
    {
      id: "3",
      title: "Cozy 1BHK Studio",
      location: "Powai, Mumbai",
      price: "₹28,000", 
      type: "Studio",
      bedrooms: 1,
      bathrooms: 1,
      area: "650 sq ft",
      status: "Rented",
      tenantName: "Priya Patel",
      tenantPhone: "+91 87654 32109",
      rentDue: "1st of every month",
    },
  ];

  useEffect(() => {
    loadUserData();
    loadProperties();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("@user_data");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      // Simulate API call with dummy data
      setTimeout(() => {
        setProperties(dummyProperties);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading properties:", error);
      setLoading(false);
    }
  };

  const handlePropertyPress = (property) => {
    Alert.alert(
      property.title,
      `Location: ${property.location}\nType: ${property.type}\nArea: ${property.area}\nStatus: ${property.status}${
        property.status === "Rented" 
          ? `\nTenant: ${property.tenantName}\nPhone: ${property.tenantPhone}\nRent Due: ${property.rentDue}`
          : ""
      }`,
      [
        { text: "OK", style: "default" },
        { text: "Edit Property", onPress: () => console.log("Edit property") },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Rented":
        return "#10B981";
      case "Available":
        return "#FDB022";
      default:
        return "#64748B";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Rented":
        return "check-circle";
      case "Available":
        return "schedule";
      default:
        return "help";
    }
  };

  const renderPropertyCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item)}
    >
      <View style={styles.propertyHeader}>
        <View style={styles.propertyTitleContainer}>
          <Text style={styles.propertyTitle}>{item.title}</Text>
          <Text style={styles.propertyLocation}>{item.location}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Icon 
            name={getStatusIcon(item.status)} 
            size={16} 
            color="#FFFFFF" 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.propertyDetails}>
        <View style={styles.detailItem}>
          <Icon name="attach-money" size={20} color="#FDB022" />
          <Text style={styles.detailText}>{item.price}/month</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="home" size={20} color="#64748B" />
          <Text style={styles.detailText}>{item.bedrooms}BR/{item.bathrooms}BA</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="square-foot" size={20} color="#64748B" />
          <Text style={styles.detailText}>{item.area}</Text>
        </View>
      </View>

      {item.status === "Rented" && (
        <View style={styles.tenantInfo}>
          <View style={styles.tenantHeader}>
            <Icon name="person" size={18} color="#10B981" />
            <Text style={styles.tenantLabel}>Current Tenant</Text>
          </View>
          <Text style={styles.tenantName}>{item.tenantName}</Text>
          <Text style={styles.tenantPhone}>{item.tenantPhone}</Text>
          <Text style={styles.rentDue}>Rent Due: {item.rentDue}</Text>
        </View>
      )}

      <View style={styles.propertyActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={18} color="#FDB022" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="visibility" size={18} color="#3B82F6" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        {item.status === "Rented" && (
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="chat" size={18} color="#10B981" />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Properties</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("AddSell")}
        >
          <Icon name="add" size={24} color="#FDB022" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{properties.length}</Text>
            <Text style={styles.statLabel}>Total Properties</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === "Rented").length}
            </Text>
            <Text style={styles.statLabel}>Rented</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === "Available").length}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <View style={styles.propertiesSection}>
          <Text style={styles.sectionTitle}>Your Properties</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
          ) : (
            <FlatList
              data={properties}
              renderItem={renderPropertyCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F8FAFB",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF7ED",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FDB022",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  propertiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  propertyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  propertyTitleContainer: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  propertyDetails: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginLeft: 4,
  },
  tenantInfo: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  tenantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tenantLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
    marginLeft: 4,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  tenantPhone: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  rentDue: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  propertyActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E8F5F0",
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 4,
  },
});

export default OwnerPropertyScreen;
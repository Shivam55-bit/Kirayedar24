import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
} from "react-native";
import { COLORS as THEME_COLORS, FONTS } from '../constants/theme';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

import DynamicHomeScreen from "../screens/DynamicHomeScreen";
import ChatListScreen from "../screens/ChatListScreen";
import SavedScreen from "../screens/SavedScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");
const tabs = ["Home", "Shortlisted", "Chat", "Profile"];

// Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const tabWidth = width / state.routes.length;

  return (
    <View style={styles.tabBarContainer} pointerEvents="box-none">
      <View style={styles.tabItemsContainer}>
        {/* simple bar: no active indicator */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = isFocused
            ? options.tabBarIconName.replace("-outline", "")
            : options.tabBarIconName;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // No animations: static sizes and opacities

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={{ alignItems: "center" }}>
                <Icon
                  name={iconName}
                  size={isFocused ? 26 : 22} // slightly larger when active to feel bolder
                  color={isFocused ? '#FDB022' : "#5c6067ff"}
                />
                <Text
                  style={{
                    ...FONTS.caption,
                    fontWeight: isFocused ? '700' : '600',
                    color: isFocused ? '#FDB022' : "#7d8187ff",
                    marginTop: 3,
                  }}
                >
                  {route.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Main Navigator
const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // hide default labels
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={DynamicHomeScreen}
        options={{ tabBarIconName: "home-outline" }}
      />
      <Tab.Screen
        name="Shortlisted"
        component={SavedScreen}
        options={{ tabBarIconName: "heart-outline" }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{ tabBarIconName: "chatbox-ellipses-outline" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIconName: "person-circle-outline" }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "transparent",
  },
  tabItemsContainer: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
    backgroundColor: THEME_COLORS.white || '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  // no active indicator for a simpler look
});

export default BottomTabNavigator;

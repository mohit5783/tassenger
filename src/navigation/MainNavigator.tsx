"use client";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "./types";
import { useTheme } from "../theme/ThemeProvider";
import { List, MessageCircle, User, Home, Users } from "react-native-feather";

// Import navigators
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import TasksNavigator from "./TasksNavigator";
import ChatNavigator from "./ChatNavigator";
import ProfileNavigator from "./ProfileNavigator";
import GroupNavigator from "./GroupNavigator";

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outline,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home stroke={color} width={size} height={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <List stroke={color} width={size} height={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MessageCircle stroke={color} width={size} height={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Users stroke={color} width={size} height={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <User stroke={color} width={size} height={size} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;

"use client";

import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { checkAuth } from "../store/slices/authSlice";
import { View, ActivityIndicator } from "react-native";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import type { RootStackParamList, MainTabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector(
    (state) => state.auth
  );
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await dispatch(checkAuth()).unwrap();
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setInitializing(false);
      }
    };

    checkAuthentication();
  }, [dispatch]);

  // Determine initial route based on user profile completion
  const getInitialParams = () => {
    if (user && !user.hasCompletedProfile) {
      // First time login - go to profile
      return {
        screen: "Profile" as keyof MainTabParamList,
        params: { screen: "EditProfile" },
      };
    } else {
      // Subsequent login - go to tasks
      return {
        screen: "Tasks" as keyof MainTabParamList,
        params: { screen: "TasksList" },
      };
    }
  };

  if (initializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            initialParams={getInitialParams()}
          />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;

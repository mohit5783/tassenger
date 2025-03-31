"use client"

import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import type { RootStackParamList } from "./types"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { checkAuth } from "../store/slices/authSlice"

// Import navigators
import AuthNavigator from "./AuthNavigator"
import MainNavigator from "./MainNavigator"

const Stack = createNativeStackNavigator<RootStackParamList>()

const RootNavigator = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3497F9" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default RootNavigator


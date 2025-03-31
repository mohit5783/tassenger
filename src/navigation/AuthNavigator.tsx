import { createNativeStackNavigator } from "@react-navigation/native-stack"
import type { AuthStackParamList } from "./types"

// Import screens
import WelcomeScreen from "../screens/auth/WelcomeScreen"
import PhoneAuthScreen from "../screens/auth/PhoneAuthScreen"
import OTPVerificationScreen from "../screens/auth/OTPVerificationScreen"
// import SetupProfileScreen from "../screens/auth/SetupProfileScreen"; // Uncomment when implemented

const Stack = createNativeStackNavigator<AuthStackParamList>()

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      {/* <Stack.Screen name="SetupProfile" component={SetupProfileScreen} /> */}
    </Stack.Navigator>
  )
}

export default AuthNavigator


import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

// Import screens
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import EmailAuthScreen from "../screens/auth/EmailAuthScreen";
import PhoneAuthScreen from "../screens/auth/PhoneAuthScreen";
import OTPVerificationScreen from "../screens/auth/OTPVerificationScreen";
import ProfileCompletionScreen from "@/screens/auth/ProfileCompletionScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen
        name="ProfileCompletion"
        component={ProfileCompletionScreen}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

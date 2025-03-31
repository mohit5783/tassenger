import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";

// Import screens
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import HelpScreen from "../screens/profile/HelpScreen";
import AboutScreen from "../screens/profile/AboutScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;

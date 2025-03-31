import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ContactsStackParamList } from "./types";

// Import screens
import ContactsScreen from "../screens/contacts/ContactsScreen";

const Stack = createNativeStackNavigator<ContactsStackParamList>();

const ContactsNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ContactsList"
        component={ContactsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ContactsNavigator;

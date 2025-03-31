import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ChatStackParamList } from "./types";

// Import screens
import ConversationsListScreen from "../screens/chat/ConversationsListScreen";
import ConversationDetailScreen from "../screens/chat/ConversationDetailScreen";
import NewConversationScreen from "../screens/chat/NewConversationScreen";
import UserSearchScreen from "../screens/chat/UserSearchScreen";
import PlaceholderChatScreen from "../screens/chat/PlaceholderChatScreen";
import ContactsForChatScreen from "@/screens/contacts/ContactsForChatScreen";


const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ConversationDetail"
        component={ConversationDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlaceholderChat"
        component={PlaceholderChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactsForChat"
        component={ContactsForChatScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ChatNavigator;

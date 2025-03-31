"use client";

import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Appbar,
  Avatar,
  ActivityIndicator,
  Divider,
  Searchbar,
  Button,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector } from "../../store/hooks";
import {
  requestContactsPermission,
  getContacts,
  sendInviteSMS,
  type Contact,
} from "../../services/ContactsService";
import { createConversation } from "../../store/slices/chatSlice";
import { useAppDispatch } from "../../store/hooks";

const ContactsForChatScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingContact, setInvitingContact] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredContacts(
        contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(query) ||
            contact.phoneNumber.includes(query)
        )
      );
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Tassenger needs access to your contacts to help you connect with friends and colleagues.",
          [{ text: "OK" }]
        );
        setIsLoading(false);
        return;
      }

      const contactsList = await getContacts();
      setContacts(contactsList);
      setFilteredContacts(contactsList);
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactPress = async (contact: Contact) => {
    if (!user) return;

    if (contact.hasApp && contact.userId) {
      try {
        // Create or get existing conversation
        const result = await dispatch(
          createConversation({
            participants: [user.id, contact.userId],
            participantNames: {
              [user.id]: user.displayName || user.phoneNumber || "You",
              [contact.userId]: contact.name,
            },
            isGroup: false,
          })
        ).unwrap();

        // Navigate to conversation
        navigation.navigate("ConversationDetail", {
          conversationId: result.id,
        });
      } catch (error) {
        console.error("Error creating conversation:", error);
        Alert.alert("Error", "Failed to open chat");
      }
    } else {
      // Show placeholder chat screen for non-app users
      navigation.navigate("PlaceholderChat", { contact });
    }
  };

  const handleInvite = async (contact: Contact) => {
    setInvitingContact(contact.id);
    try {
      await sendInviteSMS(contact.phoneNumber, contact.name);
      Alert.alert(
        "Invitation Sent",
        `An SMS invitation has been sent to ${contact.name}`
      );
    } catch (error) {
      console.error("Error sending invitation:", error);
      Alert.alert("Error", "Failed to send invitation");
    } finally {
      setInvitingContact(null);
    }
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
    >
      <Avatar.Text
        size={50}
        label={item.name.substring(0, 1).toUpperCase()}
        style={{
          backgroundColor: item.hasApp ? theme.colors.primary : "#CCCCCC",
        }}
      />

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>

      {!item.hasApp && (
        <Button
          mode="outlined"
          onPress={() => handleInvite(item)}
          loading={invitingContact === item.id}
          disabled={invitingContact === item.id}
        >
          Invite
        </Button>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="New Chat" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <Searchbar
        placeholder="Search contacts"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          }
          ListHeaderComponent={
            filteredContacts.some((c) => c.hasApp)
              ? renderSectionHeader("Contacts on Tassenger")
              : null
          }
          stickyHeaderIndices={
            filteredContacts.some((c) => c.hasApp) ? [0] : []
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    margin: 8,
  },
  contactItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactPhone: {
    fontSize: 14,
    color: "#8E8E93",
  },
  sectionHeader: {
    padding: 8,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8E8E93",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
  },
});

export default ContactsForChatScreen;

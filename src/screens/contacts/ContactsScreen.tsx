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
  Button,
  Searchbar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { sendInviteSMS, type Contact } from "../../services/ContactsService";
import { createConversation } from "../../store/slices/chatSlice";
import {
  fetchContacts,
  setSearchQuery,
} from "../../store/slices/contactsSlice";

const ContactsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { contacts, filteredContacts, isLoading, hasPermission, searchQuery } =
    useAppSelector((state) => state.contacts);
  const [invitingContact, setInvitingContact] = useState<string | null>(null);
  // Add state for permission request status
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  // Update the loadContacts function
  const loadContacts = async () => {
    setPermissionRequested(true);
    setShowLoadingIndicator(true);

    // Add delay to ensure loading indicator is visible
    setTimeout(() => {
      dispatch(fetchContacts());
    }, 500);
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
        navigation.navigate("Chat", {
          screen: "ConversationDetail",
          params: { conversationId: result.id },
        });
      } catch (error) {
        console.error("Error creating conversation:", error);
        Alert.alert("Error", "Failed to open chat");
      }
    } else {
      // Show placeholder chat screen for non-app users
      navigation.navigate("Chat", {
        screen: "PlaceholderChat",
        params: { contact },
      });
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

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
    >
      {item.photoURL ? (
        <Avatar.Image size={50} source={{ uri: item.photoURL }} />
      ) : (
        <Avatar.Text
          size={50}
          label={item.name.substring(0, 1).toUpperCase()}
          style={{
            backgroundColor: item.hasApp ? theme.colors.primary : "#CCCCCC",
          }}
        />
      )}

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
        {item.email && (
          <Text style={styles.contactEmail} numberOfLines={1}>
            {item.email}
          </Text>
        )}
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

  // Replace the permission request section
  if (!hasPermission) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: "black" }}>
          <Appbar.BackAction
            color="white"
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content title="Contacts" color="white"
 />
        </Appbar.Header>

        <View style={styles.centered}>
          {showLoadingIndicator ? (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  color: theme.colors.text,
                }}
              >
                Loading contacts...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{
                  marginBottom: 20,
                  textAlign: "center",
                  color: theme.colors.text,
                }}
              >
                Tassenger needs access to your contacts to help you connect with
                friends and colleagues.
              </Text>
              <Button
                mode="contained"
                onPress={loadContacts}
                buttonColor={theme.colors.primary}
                disabled={permissionRequested}
                loading={permissionRequested}
              >
                {permissionRequested ? "Loading..." : "Grant Permission"}
              </Button>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Contacts" color="white"
 />
      </Appbar.Header>

      <Searchbar
        placeholder="Search contacts"
        onChangeText={handleSearch}
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
  contactEmail: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
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

export default ContactsScreen;

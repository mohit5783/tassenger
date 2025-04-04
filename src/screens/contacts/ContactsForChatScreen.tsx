"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { sendInviteSMS, type Contact } from "../../services/ContactsService";
import { createConversation } from "../../store/slices/chatSlice";
import {
  fetchContacts,
  setSearchQuery,
} from "../../store/slices/contactsSlice";

const BATCH_SIZE = 20; // Number of contacts to load initially

const ContactsForChatScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { contacts, filteredContacts, isLoading, hasPermission, searchQuery } =
    useAppSelector((state) => state.contacts);
  const [invitingContact, setInvitingContact] = useState<string | null>(null);
  const [displayedContacts, setDisplayedContacts] = useState<Contact[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  // Request contacts permission and start loading
  const loadContacts = useCallback(async () => {
    setPermissionRequested(true);
    setShowLoadingIndicator(true);

    // Add a delay to ensure loading indicator is visible
    setTimeout(() => {
      dispatch(fetchContacts());
    }, 500);
  }, [dispatch]);

  // Initialize contacts when they're loaded
  useEffect(() => {
    if (contacts.length > 0 && !isLoading) {
      // First prioritize contacts with the app installed
      const appContacts = contacts.filter((contact) => contact.hasApp);
      const nonAppContacts = contacts.filter((contact) => !contact.hasApp);

      // Initially show app contacts and first batch of non-app contacts
      const initialNonAppContacts = nonAppContacts.slice(
        0,
        Math.max(0, BATCH_SIZE - appContacts.length)
      );
      setDisplayedContacts([...appContacts, ...initialNonAppContacts]);
      setShowLoadingIndicator(false);
    } else if (!isLoading && permissionRequested) {
      // If loading is complete but no contacts found
      setShowLoadingIndicator(false);
    }
  }, [contacts, isLoading, permissionRequested]);

  // Handle filtered contacts changes
  useEffect(() => {
    if (searchQuery) {
      // When searching, show all filtered contacts
      setDisplayedContacts(filteredContacts);
    } else if (contacts.length > 0 && !isLoading) {
      // When not searching, apply batching logic
      const appContacts = contacts.filter((contact) => contact.hasApp);
      const nonAppContacts = contacts.filter((contact) => !contact.hasApp);
      const initialNonAppContacts = nonAppContacts.slice(
        0,
        Math.max(0, BATCH_SIZE - appContacts.length)
      );
      setDisplayedContacts([...appContacts, ...initialNonAppContacts]);
    }
  }, [filteredContacts, searchQuery]);

  const loadMoreContacts = () => {
    if (searchQuery || isLoadingMore) return; // Don't load more when searching or already loading

    const appContacts = contacts.filter((contact) => contact.hasApp);
    const nonAppContacts = contacts.filter((contact) => !contact.hasApp);

    // Calculate how many non-app contacts we're currently showing
    const currentNonAppCount = displayedContacts.length - appContacts.length;

    // If we've shown all non-app contacts, don't do anything
    if (currentNonAppCount >= nonAppContacts.length) return;

    setIsLoadingMore(true);

    // Load the next batch
    const nextBatch = nonAppContacts.slice(
      currentNonAppCount,
      currentNonAppCount + BATCH_SIZE
    );

    // Add the next batch to displayed contacts
    setDisplayedContacts([
      ...appContacts,
      ...nonAppContacts.slice(0, currentNonAppCount + BATCH_SIZE),
    ]);
    setIsLoadingMore(false);
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
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
      >
        {title}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, marginLeft: 8 }}>
            Loading more contacts...
          </Text>
        </View>
      );
    }

    if (!searchQuery && displayedContacts.length < contacts.length) {
      return (
        <Button
          mode="text"
          onPress={loadMoreContacts}
          style={styles.loadMoreButton}
        >
          Load more contacts
        </Button>
      );
    }

    return null;
  };

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
          <Appbar.Content title="New Chat" color="white" />
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

  // Separate contacts into those with the app and those without
  const appUsers = displayedContacts.filter((contact) => contact.hasApp);
  const nonAppUsers = displayedContacts.filter((contact) => !contact.hasApp);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Chat" color="white" />
      </Appbar.Header>

      <Searchbar
        placeholder="Search contacts"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {isLoading && displayedContacts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.text, marginTop: 16 },
            ]}
          >
            Loading contacts...
          </Text>
        </View>
      ) : displayedContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No contacts found
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider />}
          ListHeaderComponent={
            <>
              {appUsers.length > 0 &&
                renderSectionHeader("Contacts on Tassenger")}
              {appUsers.length > 0 && nonAppUsers.length > 0 && (
                <Divider style={styles.sectionDivider} />
              )}
              {nonAppUsers.length > 0 &&
                renderSectionHeader("Invite to Tassenger")}
            </>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreContacts}
          onEndReachedThreshold={0.5}
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
    padding: 20,
  },
  searchBar: {
    margin: 8,
    elevation: 0,
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
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadMoreButton: {
    alignSelf: "center",
    margin: 16,
  },
});

export default ContactsForChatScreen;

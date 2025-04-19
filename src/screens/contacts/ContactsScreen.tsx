"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  Appbar,
  Avatar,
  ActivityIndicator,
  Divider,
  Button,
  Searchbar,
  Snackbar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import type { Contact } from "../../services/ContactsService";
import {
  fetchContacts,
  setSearchQuery,
  forceRefreshContacts,
  checkForNewAppUsers,
} from "../../store/slices/contactsSlice";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { sendInviteSMS } from "../../utils/sms";
import { contactsEventEmitter } from "../../utils/eventEmitter";

const CONTACTS_BATCH_SIZE = 20;

const ContactsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const {
    contacts,
    filteredContacts,
    isLoading,
    hasPermission,
    searchQuery,
    loadingProgress,
    loadingPercentage,
    isCheckingNewUsers,
    lastNewUserCheck,
    newUsersFound,
  } = useAppSelector((state) => state.contacts);

  const [invitingContact, setInvitingContact] = useState<string | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [displayedContacts, setDisplayedContacts] = useState<Contact[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Set up event listener for partial contacts loading
  useEffect(() => {
    const onPartialContacts = (data: {
      contacts: Contact[];
      isPartial?: boolean;
      isCache?: boolean;
    }) => {
      if (data.contacts && data.contacts.length > 0) {
        setDisplayedContacts((prev) => [...prev, ...data.contacts]);
      }
    };

    const onProgress = (data: {
      message: string;
      percentage?: number;
      complete?: boolean;
    }) => {
      if (data.message) {
        console.log(`Contact loading progress: ${data.message}`);
      }

      if (data.complete) {
        setShowLoadingIndicator(false);
      }
    };

    contactsEventEmitter.on("partialContacts", onPartialContacts);
    contactsEventEmitter.on("progress", onProgress);

    return () => {
      contactsEventEmitter.off("partialContacts", onPartialContacts);
      contactsEventEmitter.off("progress", onProgress);
    };
  }, []);

  // Update displayed contacts when filtered contacts change
  useEffect(() => {
    if (filteredContacts.length > 0 && !isLoading) {
      // If searching, show all filtered results
      if (searchQuery) {
        setDisplayedContacts(filteredContacts);
      } else {
        // Otherwise, maintain pagination
        const initialCount = Math.min(
          CONTACTS_BATCH_SIZE,
          filteredContacts.length
        );
        setDisplayedContacts(filteredContacts.slice(0, initialCount));
      }
    }
  }, [filteredContacts, searchQuery, isLoading]);

  // Check for new app users when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only check for new users if we already have contacts loaded
      if (contacts.length > 0) {
        handleCheckForNewUsers();
      }
    }, [contacts.length])
  );

  // Show snackbar when new users are found
  useEffect(() => {
    if (newUsersFound > 0) {
      setSnackbarMessage(
        `Found ${newUsersFound} new ${
          newUsersFound === 1 ? "user" : "users"
        } in your contacts!`
      );
      setShowSnackbar(true);
    }
  }, [newUsersFound]);

  // Load contacts with permission request
  const loadContacts = useCallback(async () => {
    setPermissionRequested(true);
    setShowLoadingIndicator(true);
    setDisplayedContacts([]); // Reset displayed contacts

    // Add delay to ensure loading indicator is visible
    setTimeout(() => {
      dispatch(fetchContacts());
    }, 500);
  }, [dispatch]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setDisplayedContacts([]); // Reset displayed contacts to avoid duplicates
    dispatch(forceRefreshContacts()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Load more contacts when scrolling
  const loadMoreContacts = () => {
    if (searchQuery || isLoadingMore || isLoading) return; // Don't load more when searching or already loading

    // If we've shown all contacts, don't do anything
    if (displayedContacts.length >= filteredContacts.length) return;

    setIsLoadingMore(true);

    // Load the next batch
    const nextBatch = filteredContacts.slice(
      displayedContacts.length,
      displayedContacts.length + CONTACTS_BATCH_SIZE
    );

    // Add delay to simulate loading (can be removed in production)
    setTimeout(() => {
      setDisplayedContacts((prev) => [...prev, ...nextBatch]);
      setIsLoadingMore(false);
    }, 300);
  };

  // Check for new app users
  const handleCheckForNewUsers = async () => {
    dispatch(checkForNewAppUsers()).then((result: any) => {
      if (result?.payload > 0) {
        setSnackbarMessage(
          `Found ${result.payload} new ${
            result.payload === 1 ? "user" : "users"
          } in your contacts!`
        );
        setShowSnackbar(true);
      }
    });
  };

  const handleContactPress = async (contact: Contact) => {
    if (!user) return;

    if (contact.hasApp) {
      navigation.navigate("Chat", {
        screen: "ConversationDetail",
        params: { conversationId: contact.userId },
      });
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
        <Text style={[styles.contactName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.contactPhone, { color: theme.colors.textSecondary }]}
        >
          {item.phoneNumber}
        </Text>
        {item.email && (
          <Text
            style={[styles.contactEmail, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
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

    if (!searchQuery && displayedContacts.length < filteredContacts.length) {
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

  // Replace the permission request section
  if (!hasPermission) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: "black" }}>
          <Appbar.Content title="Contacts" color="white" />
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
                disabled={permissionRequested && showLoadingIndicator}
                loading={permissionRequested && showLoadingIndicator}
              >
                {permissionRequested && showLoadingIndicator
                  ? "Loading..."
                  : "Grant Permission"}
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
        <Appbar.Content title="Contacts" color="white" />
        {contacts.length > 0 && (
          <Appbar.Action
            icon="account-search"
            color="white"
            onPress={handleCheckForNewUsers}
            disabled={isCheckingNewUsers}
          />
        )}
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
            {loadingProgress || "Loading contacts..."}
          </Text>
          {loadingPercentage !== null && (
            <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
              {loadingPercentage}% complete
            </Text>
          )}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  {searchQuery
                    ? "No contacts match your search"
                    : "No contacts found"}
                </Text>
              </View>
            ) : null
          }
        />
      )}
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {snackbarMessage}
      </Snackbar>
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
    color: "#8E8E93",
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
    color: "#8E8E93",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#8E8E93",
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
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default ContactsScreen;

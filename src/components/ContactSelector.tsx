"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  Searchbar,
  Avatar,
  ActivityIndicator,
  Divider,
  Button,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchContacts,
  setSearchQuery,
  forceRefreshContacts,
} from "../store/slices/contactsSlice";
import type { Contact } from "../services/ContactsService";

interface ContactSelectorProps {
  onSelectContact: (contact: Contact) => void;
  onCancel: () => void;
  title?: string;
  visible?: boolean; // Add optional visible prop
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  onSelectContact,
  onCancel,
  title = "Select Contact",
  visible = true, // Add default value
}) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const {
    contacts,
    filteredContacts,
    isLoading,
    hasPermission,
    searchQuery,
    loadingProgress,
  } = useAppSelector((state) => state.contacts);
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setPermissionRequested(true);
    dispatch(fetchContacts());
  };

  const handleRefreshContacts = () => {
    dispatch(forceRefreshContacts());
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  // Filter to only show contacts with the app installed
  const appContacts = filteredContacts.filter((contact) => contact.hasApp);

  const handleContactSelect = (contact: Contact) => {
    onSelectContact(contact);
  };

  const handleCancel = () => {
    onCancel();
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactSelect(item)}
      activeOpacity={0.7}
    >
      {item.photoURL ? (
        <Avatar.Image size={50} source={{ uri: item.photoURL }} />
      ) : (
        <Avatar.Text
          size={50}
          label={item.name.substring(0, 1).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
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
    </TouchableOpacity>
  );

  // If not visible, return null
  if (!visible) {
    return null;
  }

  if (!hasPermission) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Button onPress={handleCancel}>Cancel</Button>
        </View>

        <View style={styles.centered}>
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Tassenger needs access to your contacts to help you assign tasks to
            your contacts.
          </Text>
          <Button
            mode="contained"
            onPress={loadContacts}
            style={{ backgroundColor: theme.colors.primary }}
          >
            Grant Permission
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Button onPress={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
      </View>

      <View style={styles.searchContainer}>
        {isLoading ? (
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.dark ? "#333" : "#e0e0e0" },
            ]}
          >
            <Text style={{ color: theme.colors.textSecondary, padding: 12 }}>
              Loading contacts...
            </Text>
          </View>
        ) : (
          <Searchbar
            placeholder="Search contacts"
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            iconColor={theme.colors.primary}
          />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.text, marginTop: 20 },
            ]}
          >
            {loadingProgress || "Loading contacts..."}
          </Text>
          <Text
            style={[
              styles.loadingSubText,
              { color: theme.colors.textSecondary, marginTop: 10 },
            ]}
          >
            This may take a moment if you have many contacts
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={appContacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.refreshContainer}>
                <Button
                  mode="outlined"
                  onPress={handleRefreshContacts}
                  icon="refresh"
                  style={styles.refreshButton}
                >
                  Refresh Contacts
                </Button>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No contacts with Tassenger found
                </Text>
                <Text
                  style={[
                    styles.emptySubText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Invite your contacts to join Tassenger
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: 14,
    textAlign: "center",
  },
  searchContainer: {
    padding: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
  },
  refreshContainer: {
    padding: 8,
    alignItems: "center",
  },
  refreshButton: {
    marginVertical: 8,
  },
  listContent: {
    flexGrow: 1,
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
  },
  contactEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default ContactSelector;

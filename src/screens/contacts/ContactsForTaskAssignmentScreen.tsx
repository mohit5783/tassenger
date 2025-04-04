"use client";

import { useEffect, useState } from "react";
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
import type { Contact } from "../../services/ContactsService";
import { updateTask } from "../../store/slices/taskSlice";
import {
  fetchContacts,
  setSearchQuery,
} from "../../store/slices/contactsSlice";

const ContactsForTaskAssignmentScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { taskId, returnScreen = "TaskDetail" } = route.params || {};
  const { user } = useAppSelector((state) => state.auth);
  const { contacts, filteredContacts, isLoading, hasPermission, searchQuery } =
    useAppSelector((state) => state.contacts);
  const [permissionRequested, setPermissionRequested] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setPermissionRequested(true);
    dispatch(fetchContacts());
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleContactPress = async (contact: Contact) => {
    if (!user || !taskId || !contact.userId) return;

    try {
      // Update the task with the selected assignee
      await dispatch(
        updateTask({
          taskId,
          updates: {
            assignedTo: contact.userId,
            assignedToName: contact.name,
          },
        })
      ).unwrap();

      // Navigate back to the task detail screen
      navigation.navigate(returnScreen, { taskId });
    } catch (error) {
      console.error("Error assigning task:", error);
      Alert.alert("Error", "Failed to assign task to contact");
    }
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
          style={{ backgroundColor: theme.colors.primary }}
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
    </TouchableOpacity>
  );

  // Filter to only show contacts with the app installed
  const appContacts = filteredContacts.filter((contact) => contact.hasApp);

  if (!hasPermission) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction
            color={theme.colors.onPrimary}
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content title="Assign Task" color={theme.colors.onPrimary} />
        </Appbar.Header>

        <View style={styles.centered}>
          <Text style={{ marginBottom: 20, textAlign: "center" }}>
            Tassenger needs access to your contacts to help you assign tasks to
            your contacts.
          </Text>
          <Button mode="contained" onPress={loadContacts}>
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
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Assign Task" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search contacts"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={appContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No contacts with Tassenger found
              </Text>
              <Text style={styles.emptySubText}>
                Invite your contacts to join Tassenger
              </Text>
            </View>
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
    padding: 20,
  },
  searchContainer: {
    padding: 8,
    backgroundColor: "transparent",
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#8E8E93",
  },
});

export default ContactsForTaskAssignmentScreen;

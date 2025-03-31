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
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector } from "../../store/hooks";
import {
  requestContactsPermission,
  getContacts,
  type Contact,
} from "../../services/ContactsService";
import { useAppDispatch } from "../../store/hooks";
import { updateTask } from "../../store/slices/taskSlice";

const ContactsForTaskAssignmentScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { taskId, returnScreen = "TaskDetail" } = route.params || {};
  const { user } = useAppSelector((state) => state.auth);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      // Filter to only show contacts with the app installed
      const appContacts = contactsList.filter((contact) => contact.hasApp);
      setContacts(appContacts);
      setFilteredContacts(appContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
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
      <Avatar.Text
        size={50}
        label={item.name.substring(0, 1).toUpperCase()}
        style={{ backgroundColor: theme.colors.primary }}
      />

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
    </TouchableOpacity>
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
        <Appbar.Content title="Assign Task" color={theme.colors.onPrimary} />
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

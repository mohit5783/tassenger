"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Text,
  Appbar,
  TextInput,
  Button,
  Checkbox,
  Chip,
  Divider,
  Switch,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createGroup } from "../../store/slices/groupSlice";
import {
  requestContactsPermission,
  getContacts,
} from "../../services/ContactsService";

interface SelectedContact {
  id: string;
  userId: string;
  name: string;
  role: "admin" | "member";
}

const CreateGroupScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.groups);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [hasChat, setHasChat] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
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
    setLoadingContacts(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setLoadingContacts(false);
        return;
      }

      const contactsList = await getContacts();
      // Only include contacts with app installed
      const appContacts = contactsList.filter(
        (contact) => contact.hasApp && contact.userId
      );
      setContacts(appContacts);
      setFilteredContacts(appContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleToggleContact = (contact: any) => {
    const isSelected = selectedContacts.some(
      (c) => c.userId === contact.userId
    );

    if (isSelected) {
      setSelectedContacts(
        selectedContacts.filter((c) => c.userId !== contact.userId)
      );
    } else {
      setSelectedContacts([
        ...selectedContacts,
        {
          id: contact.userId,
          userId: contact.userId,
          name: contact.name,
          role: "member", // Default role
        },
      ]);
    }
  };

  const handleToggleRole = (userId: string) => {
    setSelectedContacts(
      selectedContacts.map((contact) => {
        if (contact.userId === userId) {
          return {
            ...contact,
            role: contact.role === "admin" ? "member" : "admin",
          };
        }
        return contact;
      })
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;

    try {
      await dispatch(
        createGroup({
          name: groupName.trim(),
          description: description.trim(),
          members: selectedContacts.map((contact) => ({
            userId: contact.userId,
            userName: contact.name,
            role: contact.role,
          })),
          hasChat,
        })
      ).unwrap();

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const renderContactItem = ({ item }: { item: any }) => {
    const isSelected = selectedContacts.some((c) => c.userId === item.userId);
    const selectedContact = selectedContacts.find(
      (c) => c.userId === item.userId
    );

    return (
      <View style={styles.contactRow} key={item.id}>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleToggleContact(item)}
        >
          <Checkbox
            status={isSelected ? "checked" : "unchecked"}
            onPress={() => handleToggleContact(item)}
            color={theme.colors.primary}
          />
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[
                styles.contactPhone,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.phoneNumber}
            </Text>
          </View>
        </TouchableOpacity>

        {isSelected && (
          <Button
            mode="text"
            onPress={() => handleToggleRole(item.userId)}
            style={{ marginRight: 8 }}
            textColor={theme.colors.primary}
          >
            {selectedContact?.role === "admin" ? "Admin" : "Member"}
          </Button>
        )}
        <Divider style={styles.divider} />
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Create Group" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View
          style={[styles.formSection, { backgroundColor: theme.colors.card }]}
        >
          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { text: theme.colors.text } }}
          />

          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            theme={{ colors: { text: theme.colors.text } }}
          />

          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
              Enable Group Chat
            </Text>
            <Switch
              value={hasChat}
              onValueChange={setHasChat}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <View
          style={[
            styles.membersSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Add Members
          </Text>

          <TextInput
            label="Search Contacts"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="magnify" />}
            theme={{ colors: { text: theme.colors.text } }}
          />

          {selectedContacts.length > 0 && (
            <View style={styles.selectedContactsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedContacts.map((contact) => (
                  <Chip
                    key={contact.userId}
                    style={[
                      styles.contactChip,
                      { backgroundColor: theme.dark ? "#333333" : "#f0f0f0" },
                    ]}
                    onClose={() =>
                      handleToggleContact({ userId: contact.userId })
                    }
                    onPress={() => handleToggleRole(contact.userId)}
                    closeIcon="close"
                    textStyle={{ color: theme.colors.text }}
                  >
                    {contact.name} (
                    {contact.role === "admin" ? "Admin" : "Member"})
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}

          {loadingContacts ? (
            <View style={styles.centered}>
              <Text style={{ color: theme.colors.text }}>
                Loading contacts...
              </Text>
            </View>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) =>
              renderContactItem({ item: contact })
            )
          ) : (
            <View style={styles.centered}>
              <Text style={{ color: theme.colors.text }}>
                No contacts with Tassenger found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleCreateGroup}
          loading={isLoading}
          disabled={
            isLoading || !groupName.trim() || selectedContacts.length === 0
          }
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          Create Group
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  content: {
    flex: 1,
  },
  formSection: {
    padding: 16,
    marginBottom: 8,
  },
  membersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
  },
  selectedContactsContainer: {
    marginBottom: 16,
  },
  contactChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  contactRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactInfo: {
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactPhone: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    paddingVertical: 8,
  },
});

export default CreateGroupScreen;

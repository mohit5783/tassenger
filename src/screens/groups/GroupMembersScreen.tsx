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
  List,
  Avatar,
  ActivityIndicator,
  Button,
  Menu,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchGroup,
  addGroupMember,
  removeGroupMember,
  changeGroupMemberRole,
} from "../../store/slices/groupSlice";
import type { GroupMember } from "../../types/group";
import {
  requestContactsPermission,
  getContacts,
} from "../../services/ContactsService";

const GroupMembersScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentGroup, isLoading } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);

  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, groupId]);

  // Check if current user is an admin
  const isAdmin = currentGroup?.members.some(
    (member) => member.userId === user?.id && member.role === "admin"
  );

  const handleChangeRole = (member: GroupMember) => {
    if (!isAdmin || !currentGroup) return;

    const newRole = member.role === "admin" ? "member" : "admin";

    // Check if this is the last admin
    if (member.role === "admin") {
      const admins = currentGroup.members.filter((m) => m.role === "admin");
      if (admins.length <= 1) {
        Alert.alert(
          "Cannot Change Role",
          "You cannot demote the last admin of the group."
        );
        return;
      }
    }

    Alert.alert(
      "Change Role",
      `Are you sure you want to make ${
        member.userName || member.userId
      } a ${newRole}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await dispatch(
                changeGroupMemberRole({
                  groupId,
                  userId: member.userId,
                  newRole,
                })
              ).unwrap();
            } catch (error) {
              console.error("Failed to change role:", error);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (!isAdmin || !currentGroup) return;

    // Cannot remove yourself if you're the last admin
    if (member.userId === user?.id && member.role === "admin") {
      const admins = currentGroup.members.filter((m) => m.role === "admin");
      if (admins.length <= 1) {
        Alert.alert(
          "Cannot Remove Yourself",
          "You cannot remove yourself if you're the last admin. Make someone else an admin first."
        );
        return;
      }
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${
        member.userName || member.userId
      } from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(
                removeGroupMember({
                  groupId,
                  userId: member.userId,
                })
              ).unwrap();
            } catch (error) {
              console.error("Failed to remove member:", error);
            }
          },
        },
      ]
    );
  };

  const handleAddMember = () => {
    // This would open a modal or navigate to a screen to select contacts
    // For this example, let's just show an alert
    loadContacts();
    setAddModalVisible(true);
  };

  const loadContacts = async () => {
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        return;
      }

      const contactsList = await getContacts();

      // Filter out contacts that are already members
      const existingMemberIds =
        currentGroup?.members.map((m) => m.userId) || [];
      const availableContacts = contactsList.filter(
        (contact) =>
          contact.hasApp &&
          contact.userId &&
          !existingMemberIds.includes(contact.userId)
      );

      setContacts(availableContacts);
      setFilteredContacts(availableContacts);
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };

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

  const handleAddNewMember = async (contact: any) => {
    if (!currentGroup) return;

    try {
      await dispatch(
        addGroupMember({
          groupId,
          member: {
            userId: contact.userId,
            userName: contact.name,
            role: "member", // Default role for new members
          },
        })
      ).unwrap();

      setAddModalVisible(false);
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => {
    const isCurrentUser = item.userId === user?.id;

    return (
      <List.Item
        title={item.userName || item.userId}
        description={item.role === "admin" ? "Admin" : "Member"}
        left={() => (
          <Avatar.Text
            size={40}
            label={(item.userName?.[0] || "U").toUpperCase()}
            style={{
              backgroundColor:
                item.role === "admin" ? theme.colors.primary : "#CCCCCC",
            }}
          />
        )}
        right={() =>
          isAdmin && !isCurrentUser ? (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() =>
                setMenuVisible(menuVisible === item.userId ? null : item.userId)
              }
            >
              <Text style={{ fontSize: 20 }}>⋮</Text>
              {menuVisible === item.userId && (
                <View
                  style={[
                    styles.menu,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(null);
                      handleChangeRole(item);
                    }}
                  >
                    <Text>
                      Make {item.role === "admin" ? "Member" : "Admin"}
                    </Text>
                  </TouchableOpacity>
                  <Divider />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(null);
                      handleRemoveMember(item);
                    }}
                  >
                    <Text style={{ color: theme.colors.error }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    );
  };

  const renderContactItem = ({ item }: { item: any }) => (
    <List.Item
      title={item.name}
      description={item.phoneNumber}
      left={() => (
        <Avatar.Text
          size={40}
          label={(item.name[0] || "U").toUpperCase()}
          style={{ backgroundColor: "#CCCCCC" }}
        />
      )}
      right={() => (
        <Button onPress={() => handleAddNewMember(item)}>Add</Button>
      )}
    />
  );

  if (isLoading || !currentGroup) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Appbar.Content title="Group Members" color={theme.colors.onPrimary} />
        {isAdmin && (
          <Appbar.Action
            icon="account-plus"
            color={theme.colors.onPrimary}
            onPress={handleAddMember}
          />
        )}
      </Appbar.Header>

      <FlatList
        data={currentGroup.members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.userId}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.list}
      />

      <Menu
        visible={addModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        style={styles.contactsMenu}
        anchor={{ x: 0, y: 0 }}
      >
        <Menu.Item
          title="Add Members"
          disabled
          style={{ backgroundColor: theme.colors.primary }}
          titleStyle={{ color: theme.colors.onPrimary, fontWeight: "bold" }}
        />
        <Divider />
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <Menu.Item
              key={contact.id}
              title={`${contact.name} (${contact.phoneNumber})`}
              onPress={() => handleAddNewMember(contact)}
            />
          ))
        ) : (
          <Menu.Item title="No contacts to add" disabled />
        )}
      </Menu>
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
  },
  list: {
    flexGrow: 1,
  },
  menuButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  menu: {
    position: "absolute",
    top: 24,
    right: 0,
    width: 120,
    borderRadius: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactsMenu: {
    width: "80%",
    maxHeight: "80%",
    alignSelf: "center",
    marginTop: 56,
  },
});

export default GroupMembersScreen;

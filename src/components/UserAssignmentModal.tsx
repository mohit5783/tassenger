"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  Modal,
  Portal,
  Button,
  Searchbar,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../api/firebase/config";
import { useAppSelector } from "../store/hooks";

interface UserProfile {
  id: string;
  displayName?: string;
  phoneNumber: string;
  photoURL?: string;
}

interface UserAssignmentModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectUser: (user: UserProfile | null) => void;
  currentAssigneeId?: string | null;
  allowMultiple?: boolean;
}

const UserAssignmentModal = ({
  visible,
  onDismiss,
  onSelectUser,
  currentAssigneeId,
  allowMultiple = false,
}: UserAssignmentModalProps) => {
  const { theme } = useTheme();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setSelectedUsers(currentAssigneeId ? [currentAssigneeId] : []);
      loadUsers();
    }
  }, [visible, currentAssigneeId]);

  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            (user.displayName &&
              user.displayName.toLowerCase().includes(query)) ||
            user.phoneNumber.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);

      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          id: doc.id,
          displayName: userData.displayName,
          phoneNumber: userData.phoneNumber,
          photoURL: userData.photoURL,
        });
      });

      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = () => {
    onSelectUser(null);
    onDismiss();
  };

  const handleUserSelect = (user: UserProfile) => {
    if (allowMultiple) {
      // For multiple selection mode
      const isSelected = selectedUsers.includes(user.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user.id]);
      }
    } else {
      // For single selection mode
      onSelectUser(user);
      onDismiss();
    }
  };

  const handleConfirmMultipleSelection = () => {
    // This would be implemented for multiple selection mode
    // For now, just dismiss
    onDismiss();
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isCurrentAssignee = selectedUsers.includes(item.id);
    const isCurrentUser = item.id === currentUser?.id;
    const displayName = item.displayName || item.phoneNumber;

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          isCurrentAssignee && { backgroundColor: "rgba(7, 94, 84, 0.1)" },
        ]}
        onPress={() => handleUserSelect(item)}
      >
        <Avatar.Text
          size={40}
          label={displayName.substring(0, 1).toUpperCase()}
          style={{
            backgroundColor: isCurrentAssignee
              ? theme.colors.primary
              : "#CCCCCC",
          }}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {displayName} {isCurrentUser ? "(You)" : ""}
          </Text>
          <Text style={styles.userPhone}>{item.phoneNumber}</Text>
        </View>

        {isCurrentAssignee && (
          <View
            style={[
              styles.checkmark,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={{ color: "white" }}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text style={styles.modalTitle}>Assign Task</Text>

          <Searchbar
            placeholder="Search users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              style={styles.userList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text>No users found</Text>
                </View>
              }
            />
          )}

          <View style={styles.buttonContainer}>
            {currentAssigneeId && (
              <Button
                mode="outlined"
                onPress={handleRemoveAssignment}
                style={styles.removeButton}
              >
                Remove Assignment
              </Button>
            )}
            <Button mode="outlined" onPress={onDismiss}>
              Cancel
            </Button>

            {allowMultiple && (
              <Button
                mode="contained"
                onPress={handleConfirmMultipleSelection}
                style={{ backgroundColor: theme.colors.primary }}
              >
                Confirm
              </Button>
            )}
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 20,
  },
  modalContent: {
    flex: 1,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  userPhone: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  removeButton: {
    borderColor: "red",
  },
});

export default UserAssignmentModal;

"use client";

import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Text,
  Appbar,
  Avatar,
  Searchbar,
  Chip,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createConversation } from "../../store/slices/chatSlice";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../api/firebase/config";

interface UserProfile {
  id: string;
  displayName?: string;
  phoneNumber: string;
  photoURL?: string;
}

const NewConversationScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

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
    if (!user) return;

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("id", "!=", user.id));
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
      setIsSearching(false);
    }
  };

  const handleUserSelect = (selectedUser: UserProfile) => {
    const isSelected = selectedUsers.some(
      (user) => user.id === selectedUser.id
    );

    if (isSelected) {
      setSelectedUsers(
        selectedUsers.filter((user) => user.id !== selectedUser.id)
      );
    } else {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  const handleCreateConversation = async () => {
    if (!user || selectedUsers.length === 0) return;

    try {
      // Prepare participants data
      const participants = [user.id, ...selectedUsers.map((u) => u.id)];

      // Prepare participant names
      const participantNames: Record<string, string> = {
        [user.id]: user.displayName || user.phoneNumber || "You",
      };

      selectedUsers.forEach((u) => {
        participantNames[u.id] = u.displayName || u.phoneNumber;
      });

      // Create conversation
      const result = await dispatch(
        createConversation({
          participants,
          participantNames,
          title: isGroupChat ? groupTitle : undefined,
          isGroup: isGroupChat || selectedUsers.length > 1,
        })
      ).unwrap();

      // Navigate to the conversation
      navigation.replace("ConversationDetail", { conversationId: result.id });
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isSelected = selectedUsers.some((user) => user.id === item.id);
    const displayName = item.displayName || item.phoneNumber;

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          isSelected && { backgroundColor: "rgba(7, 94, 84, 0.1)" },
        ]}
        onPress={() => handleUserSelect(item)}
      >
        <Avatar.Text
          size={50}
          label={displayName.substring(0, 1).toUpperCase()}
          style={{
            backgroundColor: isSelected ? theme.colors.primary : "#CCCCCC",
          }}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userPhone}>{item.phoneNumber}</Text>
        </View>

        {isSelected && (
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Conversation" color="white" />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {selectedUsers.length > 0 && (
        <View style={styles.selectedUsersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedUsers.map((item) => (
              <Chip
                key={item.id}
                style={styles.userChip}
                onClose={() => handleUserSelect(item)}
                avatar={
                  <Avatar.Text
                    size={24}
                    label={(item.displayName || item.phoneNumber)
                      .substring(0, 1)
                      .toUpperCase()}
                  />
                }
              >
                {item.displayName || item.phoneNumber}
              </Chip>
            ))}
          </ScrollView>

          {selectedUsers.length > 1 && (
            <Button
              mode={isGroupChat ? "contained" : "outlined"}
              onPress={() => setIsGroupChat(!isGroupChat)}
              style={styles.groupButton}
            >
              Group Chat
            </Button>
          )}
        </View>
      )}

      {isGroupChat && (
        <View style={styles.groupTitleContainer}>
          <Searchbar
            placeholder="Group name (optional)"
            onChangeText={setGroupTitle}
            value={groupTitle}
            style={styles.groupTitleInput}
            inputStyle={styles.searchInput}
          />
        </View>
      )}

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.usersList}
        />
      )}

      {selectedUsers.length > 0 && (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCreateConversation}
            loading={isLoading}
            disabled={isLoading}
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            {selectedUsers.length === 1 ? "Start Conversation" : "Create Group"}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "white",
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#F0F0F0",
  },
  searchInput: {
    paddingVertical: 0, // Fix vertical alignment
    height: 40,
    alignSelf: "center",
  },
  selectedUsersContainer: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  userChip: {
    marginRight: 8,
  },
  groupButton: {
    marginTop: 8,
  },
  groupTitleContainer: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  groupTitleInput: {
    elevation: 0,
    backgroundColor: "#F0F0F0",
  },
  usersList: {
    backgroundColor: "white",
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
  buttonContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  createButton: {
    paddingVertical: 8,
  },
});

export default NewConversationScreen;

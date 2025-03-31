"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  Appbar,
  Avatar,
  Searchbar,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../api/firebase/config";
import { useAppSelector } from "../../store/hooks";

interface UserProfile {
  id: string;
  displayName?: string;
  phoneNumber: string;
  photoURL?: string;
}

const UserSearchScreen = ({ navigation, route }: any) => {
  const { onSelectUser } = route.params || {};
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleSelectUser = (selectedUser: UserProfile) => {
    if (onSelectUser) {
      onSelectUser(selectedUser);
      navigation.goBack();
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const displayName = item.displayName || item.phoneNumber;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleSelectUser(item)}
      >
        <Avatar.Text
          size={50}
          label={displayName.substring(0, 1).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userPhone}>{item.phoneNumber}</Text>
        </View>
      </TouchableOpacity>
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
        <Appbar.Content title="Search Users" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name or phone number..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
});

export default UserSearchScreen;

"use client";

import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Text,
  FAB,
  Avatar,
  ActivityIndicator,
  Searchbar,
  Chip,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchUserGroups } from "../../store/slices/groupsSlice";

const GroupsListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { groups, isLoading, error } = useAppSelector((state) => state.groups);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [dispatch, user]);

  const loadGroups = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchUserGroups(user.id));
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleGroupPress = (groupId: string) => {
    navigation.navigate("GroupDetail", { groupId });
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.groupItem,
        { backgroundColor: theme.dark ? theme.colors.card : "white" },
      ]}
      onPress={() => handleGroupPress(item.id)}
    >
      <View style={styles.groupContainer}>
        <Avatar.Text
          size={50}
          label={item.name.substring(0, 2).toUpperCase()}
          style={{ backgroundColor: theme.colors.primary }}
        />
        <View style={styles.groupContent}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
              {item.name}
            </Text>
          </View>
          <View style={styles.groupPreview}>
            <Text
              numberOfLines={1}
              style={[
                styles.groupDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.description || "No description"}
            </Text>
            <Chip icon="account-multiple" style={styles.memberChip}>
              {item.members.length}
            </Chip>
          </View>
        </View>
      </View>
      <Divider
        style={[
          styles.divider,
          { backgroundColor: theme.dark ? "#333333" : "#E0E0E0" },
        ]}
      />
    </TouchableOpacity>
  );

  if (isLoading && groups.length === 0 && !refreshing) {
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

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={{ color: theme.colors.error }}>{error}</Text>
        <TouchableOpacity onPress={loadGroups} style={styles.retryButton}>
          <Text style={{ color: theme.colors.primary }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: "black" }]}>
        <Text style={[styles.title, { color: "white" }]}>Groups</Text>
      </View>

      <Searchbar
        placeholder="Search groups"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[
          styles.searchBar,
          { backgroundColor: theme.dark ? theme.colors.card : "#F5F5F5" },
        ]}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.textSecondary}
      />

      {filteredGroups.length > 0 ? (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      ) : (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={{ color: theme.colors.textSecondary }}>
            {searchQuery
              ? "No groups match your search"
              : "No groups yet. Create one!"}
          </Text>
        </View>
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate("CreateGroup")}
      />
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
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchBar: {
    margin: 8,
    borderRadius: 8,
  },
  groupList: {
    flexGrow: 1,
  },
  groupItem: {
    backgroundColor: "white",
  },
  groupContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  groupContent: {
    flex: 1,
    marginLeft: 15,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  groupPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupDescription: {
    fontSize: 14,
    color: "#8E8E93",
    flex: 1,
  },
  memberChip: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginLeft: 76,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  retryButton: {
    marginTop: 16,
    padding: 8,
  },
});

export default GroupsListScreen;

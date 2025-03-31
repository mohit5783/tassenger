"use client";

import { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  FAB,
  Avatar,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGroups } from "../../store/slices/groupSlice";
import { Users } from "react-native-feather";

const GroupsListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { groups, isLoading } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [dispatch, user]);

  const loadGroups = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchGroups());
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadGroups();
  };

  const renderGroupItem = ({ item }: { item: any }) => {
    const memberCount = item.members.length;
    // Check if current user is an admin in this group
    const isAdmin = item.members.some(
      (member: any) => member.userId === user?.id && member.role === "admin"
    );

    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
      >
        <View style={styles.groupContainer}>
          <Avatar.Text
            size={50}
            label={item.name.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: theme.colors.primary }}
          />

          <View style={styles.groupContent}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.groupMeta}>
              <Text style={styles.memberCount}>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
              {isAdmin && (
                <Text
                  style={[styles.adminBadge, { color: theme.colors.primary }]}
                >
                  Admin
                </Text>
              )}
            </View>
          </View>
        </View>
        <Divider style={styles.divider} />
      </TouchableOpacity>
    );
  };

  if (isLoading && groups.length === 0) {
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
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
          Groups
        </Text>
      </View>

      {groups.length > 0 ? (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupsList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <View style={[styles.centered, { flex: 1 }]}>
          <Users width={60} height={60} stroke="#CCCCCC" />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 16 }}>
            No groups yet
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Create a group to collaborate with others
          </Text>
        </View>
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color={theme.colors.onPrimary}
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
  groupsList: {
    flexGrow: 1,
  },
  groupItem: {
    backgroundColor: "white",
  },
  groupContainer: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  groupContent: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberCount: {
    fontSize: 14,
    color: "#8E8E93",
  },
  adminBadge: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginLeft: 82,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GroupsListScreen;

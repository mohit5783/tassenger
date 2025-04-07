"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  Appbar,
  Button,
  List,
  Avatar,
  FAB,
  Menu,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchGroup,
  removeGroupMember, // Changed from leaveGroup to removeGroupMember
  deleteGroup,
} from "../../store/slices/groupsSlice"; // Changed from groupSlice to groupsSlice
import { filterTasksByGroup, clearFilters } from "../../store/slices/taskSlice";
import UserService, { type UserProfile } from "../../services/UserService";

const GroupDetailScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentGroup, isLoading } = useAppSelector((state) => state.groups);
  const { filteredTasks } = useAppSelector((state) => state.tasks);
  const [menuVisible, setMenuVisible] = useState(false);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    // First clear any existing filters
    dispatch(clearFilters());
    // Then fetch the group
    dispatch(fetchGroup(groupId));
    // Then apply the group filter
    dispatch(filterTasksByGroup(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (currentGroup?.members) {
      loadMembers();
    }
  }, [currentGroup]);

  const loadMembers = async () => {
    if (!currentGroup?.members || currentGroup.members.length === 0) return;

    setLoadingMembers(true);
    try {
      const memberData = await UserService.getUsersByIds(currentGroup.members);
      setMembers(memberData);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleLeaveGroup = () => {
    if (!user) return;

    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            // Use removeGroupMember instead of leaveGroup
            await dispatch(
              removeGroupMember({
                groupId,
                userId: user.id,
              })
            ).unwrap();
            navigation.goBack();
          } catch (error) {
            console.error("Failed to leave group:", error);
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteGroup(groupId)).unwrap();
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete group:", error);
            }
          },
        },
      ]
    );
  };

  const isAdmin = currentGroup?.createdBy === user?.id;

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
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title={currentGroup.name} color="white" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              color="white"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate("EditGroup", { groupId });
            }}
            title="Edit Group"
            disabled={!isAdmin}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleLeaveGroup();
            }}
            title="Leave Group"
            disabled={isAdmin && currentGroup.members.length > 1}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleDeleteGroup();
            }}
            title="Delete Group"
            disabled={!isAdmin}
          />
        </Menu>
      </Appbar.Header>

      <ScrollView style={{ backgroundColor: theme.colors.background }}>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            {currentGroup.description || "No description provided."}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Members
          </Text>
          {loadingMembers ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <>
              {members.map((member) => (
                <List.Item
                  key={member.id}
                  title={
                    member.displayName || member.phoneNumber || "Unknown User"
                  }
                  titleStyle={{ color: theme.colors.text }}
                  description={
                    member.id === currentGroup.createdBy ? "Admin" : "Member"
                  }
                  descriptionStyle={{ color: theme.colors.textSecondary }}
                  left={(props) => (
                    <Avatar.Text
                      {...props}
                      size={40}
                      label={(member.displayName || member.phoneNumber || "?")
                        .substring(0, 1)
                        .toUpperCase()}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  )}
                />
              ))}
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("GroupMembers", { groupId })}
                style={styles.viewAllButton}
                textColor={theme.colors.primary}
              >
                View All Members
              </Button>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Tasks
          </Text>
          {filteredTasks.length > 0 ? (
            <>
              {filteredTasks.slice(0, 3).map((task) => (
                <List.Item
                  key={task.id}
                  title={task.title}
                  titleStyle={{ color: theme.colors.text }}
                  description={`Status: ${task.status}`}
                  descriptionStyle={{ color: theme.colors.textSecondary }}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        task.status === "completed"
                          ? "check-circle"
                          : "circle-outline"
                      }
                      color={theme.colors.primary}
                    />
                  )}
                  onPress={() =>
                    navigation.navigate("Tasks", {
                      screen: "TaskDetail",
                      params: { taskId: task.id },
                    })
                  }
                />
              ))}
              {filteredTasks.length > 3 && (
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("GroupTasks", { groupId })}
                  style={styles.viewAllButton}
                  textColor={theme.colors.primary}
                >
                  View All Tasks
                </Button>
              )}
            </>
          ) : (
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No tasks in this group yet.
            </Text>
          )}
        </View>
      </ScrollView>

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate("CreateGroupTask", { groupId })}
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
  section: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  viewAllButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
    color: "#888",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GroupDetailScreen;

"use client";

import { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  FAB,
  Avatar,
  ActivityIndicator,
  Chip,
  Appbar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTasks,
  filterTasksByGroup,
  type Task,
} from "../../store/slices/taskSlice";
import { fetchGroup } from "../../store/slices/groupSlice";
import type { TaskGroupStatus } from "../../types/group";

interface GroupTasksScreenProps {
  navigation: any;
  route: any;
}

const statusLabels: Record<TaskGroupStatus, string> = {
  assigned: "Assigned",
  inProgress: "In Progress",
  doneByAssignee: "Done by Assignee",
  pendingReview: "Pending Review",
  reviewed: "Reviewed",
  reopened: "Reopened",
};

const GroupTasksScreen = ({ navigation, route }: GroupTasksScreenProps) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { filteredTasks, isLoading } = useAppSelector((state) => state.tasks);
  const { currentGroup } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      loadTasks();
    }
  }, [dispatch, groupId]);

  const loadTasks = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchTasks(user.id));
      dispatch(filterTasksByGroup(groupId));
      setRefreshing(false);
    }
  };

  // Check if current user is an admin
  const isAdmin = currentGroup?.members.some(
    (member) => member.userId === user?.id && member.role === "admin"
  );

  // Get appropriate tasks sorted by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by due date (null/undefined dates at the end)
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return theme.colors.customColors.task.todo;
      case "inProgress":
        return theme.colors.customColors.task.inProgress;
      case "doneByAssignee":
        return "#8E24AA"; // Purple
      case "pendingReview":
        return "#FF9800"; // Orange
      case "reviewed":
        return theme.colors.customColors.task.completed;
      case "reopened":
        return "#F44336"; // Red
      default:
        return theme.colors.customColors.task.todo;
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isAssignee = item.assignment?.assigneeId === user?.id;
    const isReviewer = item.assignment?.reviewerId === user?.id;

    const assigneeName = item.assignment?.assigneeName || "Unassigned";
    const reviewerName = item.assignment?.reviewerName || "No reviewer";
    const statusLabel =
      statusLabels[item.status as TaskGroupStatus] || item.status;

    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() =>
          navigation.navigate("GroupTaskDetail", {
            taskId: item.id,
            groupId,
          })
        }
      >
        <View style={styles.taskContainer}>
          <Avatar.Text
            size={50}
            label={item.title.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: getStatusColor(item.status) }}
          />

          <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>{item.title}</Text>

            <View style={styles.badgeRow}>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
                textStyle={{ color: "#FFF" }}
              >
                {statusLabel}
              </Chip>

              {isAssignee && (
                <Chip style={styles.roleChip}>You're the assignee</Chip>
              )}

              {isReviewer && (
                <Chip style={styles.roleChip}>You're the reviewer</Chip>
              )}
            </View>

            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentText}>
                Assignee: {isAssignee ? "You" : assigneeName}
              </Text>
              <Text style={styles.assignmentText}>
                Reviewer: {isReviewer ? "You" : reviewerName}
              </Text>
            </View>

            {item.dueDate && (
              <Text style={styles.dueDate}>
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && filteredTasks.length === 0) {
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
        <Appbar.Content title="Group Tasks" color={theme.colors.onPrimary} />
      </Appbar.Header>

      {sortedTasks.length > 0 ? (
        <FlatList
          data={sortedTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
          onRefresh={loadTasks}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks found in this group</Text>
          {isAdmin && (
            <Text style={styles.emptySubtext}>
              Tap the + button to create a new task
            </Text>
          )}
        </View>
      )}

      {isAdmin && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate("CreateGroupTask", { groupId })}
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
    justifyContent: "center",
    alignItems: "center",
  },
  tasksList: {
    paddingBottom: 80,
  },
  taskItem: {
    backgroundColor: "white",
    padding: 16,
  },
  taskContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskContent: {
    flex: 1,
    marginLeft: 15,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  roleChip: {
    backgroundColor: "#E0E0E0",
    marginRight: 8,
    marginBottom: 4,
  },
  assignmentInfo: {
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 14,
    color: "#555",
  },
  dueDate: {
    fontSize: 14,
    color: "#FF9800",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GroupTasksScreen;

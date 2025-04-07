"use client";

import { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  Appbar,
  Chip,
  ActivityIndicator,
  Divider,
  Button,
  Menu,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGroup } from "../../store/slices/groupsSlice";
import { filterTasksByGroup } from "../../store/slices/taskSlice";
import { format, isValid } from "date-fns";

const GroupTasksScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentGroup, isLoading: groupLoading } = useAppSelector(
    (state) => state.groups
  );
  const { filteredTasks, isLoading: tasksLoading } = useAppSelector(
    (state) => state.tasks
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      dispatch(filterTasksByGroup(groupId));
    }
  }, [dispatch, groupId]);

  const getStatusColor = (status: string) => {
    const colors = theme.colors.customColors.task;
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "No due date";
    const date = new Date(timestamp);
    if (!isValid(date)) return "Invalid date";
    return format(date, "MMM d, yyyy");
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate("Tasks", {
      screen: "TaskDetail",
      params: { taskId },
    });
  };

  const filteredByStatus = statusFilter
    ? filteredTasks.filter((task) => task.status === statusFilter)
    : filteredTasks;

  const renderTaskItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        { backgroundColor: theme.dark ? theme.colors.card : "white" },
      ]}
      onPress={() => handleTaskPress(item.id)}
    >
      <View style={styles.taskContainer}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text
            style={[styles.taskDueDate, { color: theme.colors.textSecondary }]}
          >
            Due: {formatDate(item.dueDate)}
          </Text>
          <View style={styles.taskMeta}>
            <Chip
              style={styles.taskChip}
              textStyle={{ fontSize: 12, color: theme.colors.text }}
            >
              {item.priority}
            </Chip>
            {item.assignedToName && (
              <Chip
                style={styles.taskChip}
                textStyle={{ fontSize: 12, color: theme.colors.text }}
              >
                Assigned: {item.assignedToName}
              </Chip>
            )}
          </View>
        </View>
      </View>
      <Divider
        style={{ backgroundColor: theme.dark ? "#333333" : "#E0E0E0" }}
      />
    </TouchableOpacity>
  );

  if (groupLoading || !currentGroup) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: "black" }}>
          <Appbar.BackAction
            color="white"
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content title="Group Tasks" color="white" />
        </Appbar.Header>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title={`${currentGroup.name} Tasks`} color="white" />
        <Appbar.Action
          icon="filter"
          color="white"
          onPress={() => setMenuVisible(true)}
        />
      </Appbar.Header>

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={{ position: "absolute", top: 60, right: 10 }}
      >
        <Menu.Item
          onPress={() => {
            setStatusFilter(null);
            setMenuVisible(false);
          }}
          title="All Tasks"
          leadingIcon={statusFilter === null ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("assigned");
            setMenuVisible(false);
          }}
          title="Assigned"
          leadingIcon={statusFilter === "assigned" ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("inProgress");
            setMenuVisible(false);
          }}
          title="In Progress"
          leadingIcon={statusFilter === "inProgress" ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("doneByAssignee");
            setMenuVisible(false);
          }}
          title="Done by Assignee"
          leadingIcon={statusFilter === "doneByAssignee" ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("pendingReview");
            setMenuVisible(false);
          }}
          title="Pending Review"
          leadingIcon={statusFilter === "pendingReview" ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("reviewRejected");
            setMenuVisible(false);
          }}
          title="Review Rejected"
          leadingIcon={statusFilter === "reviewRejected" ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("reviewed");
            setMenuVisible(false);
          }}
          title="Reviewed"
          leadingIcon={statusFilter === "reviewed" ? "check" : undefined}
        />
        <Menu.Item
          onPress={() => {
            setStatusFilter("completed");
            setMenuVisible(false);
          }}
          title="Completed"
          leadingIcon={statusFilter === "completed" ? "check" : undefined}
        />
      </Menu>

      <View
        style={[
          styles.filterBar,
          { backgroundColor: theme.dark ? "#1E1E1E" : "#f5f5f5" },
        ]}
      >
        <Text style={[styles.filterText, { color: theme.colors.text }]}>
          Filter:{" "}
          {statusFilter
            ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
            : "All Tasks"}
        </Text>
        {statusFilter && (
          <Button
            compact
            mode="text"
            onPress={() => setStatusFilter(null)}
            textColor={theme.colors.primary}
          >
            Clear
          </Button>
        )}
      </View>

      {tasksLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredByStatus.length > 0 ? (
        <FlatList
          data={filteredByStatus}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No tasks found</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("CreateGroupTask", { groupId })}
            style={{ marginTop: 16 }}
          >
            Create Task
          </Button>
        </View>
      )}

      <Button
        mode="contained"
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("CreateGroupTask", { groupId })}
      >
        New Task
      </Button>
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
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  filterText: {
    fontWeight: "500",
  },
  tasksList: {
    padding: 8,
  },
  taskItem: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  taskContainer: {
    flexDirection: "row",
    padding: 16,
  },
  statusIndicator: {
    width: 4,
    height: "100%",
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  taskChip: {
    height: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});

export default GroupTasksScreen;

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
  Badge,
  Menu,
  Button,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTasks,
  clearFilters,
  type Task,
} from "../../store/slices/taskSlice";
import { format, isValid } from "date-fns";
import TaskSearchBar from "../../components/TaskSearchBar";
import { ArrowDown, ArrowUp } from "react-native-feather";

type SortOption = "createdAt" | "dueDate" | "priority" | "status";
type SortDirection = "asc" | "desc";

const TasksListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { tasks, filteredTasks, isLoading, error, searchQuery, activeFilters } =
    useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [sortedTasks, setSortedTasks] = useState<Task[]>([]);

  // Add this at the beginning of the component to ensure
  // we're clearing any group filters when viewing all tasks

  useEffect(() => {
    // Clear any group filters when the task list screen mounts
    dispatch(clearFilters());

    if (user) {
      loadTasks();
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Apply sorting to filtered or all tasks
    const tasksToSort =
      searchQuery || Object.keys(activeFilters).length > 0
        ? filteredTasks
        : tasks;
    sortTasks(tasksToSort, sortOption, sortDirection);
  }, [
    tasks,
    filteredTasks,
    sortOption,
    sortDirection,
    searchQuery,
    activeFilters,
  ]);

  // Add this useEffect to ensure the main task list shows all tasks when it mounts:
  useEffect(() => {
    // Clear any group filters when the task list screen loads
    dispatch(clearFilters());
  }, [dispatch]);

  const loadTasks = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchTasks(user.id));
      setRefreshing(false);
    }
  };

  const sortTasks = (
    tasksToSort: Task[],
    option: SortOption,
    direction: SortDirection
  ) => {
    const sorted = [...tasksToSort].sort((a, b) => {
      switch (option) {
        case "dueDate":
          // Handle tasks without due dates
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return direction === "asc" ? 1 : -1;
          if (!b.dueDate) return direction === "asc" ? -1 : 1;
          return direction === "asc"
            ? a.dueDate - b.dueDate
            : b.dueDate - a.dueDate;

        case "priority":
          const priorityValues = { high: 3, medium: 2, low: 1 };
          const aValue = priorityValues[a.priority] || 0;
          const bValue = priorityValues[b.priority] || 0;
          return direction === "asc" ? aValue - bValue : bValue - aValue;

        case "status":
          const statusValues = {
            todo: 1,
            inProgress: 2,
            review: 3,
            pending: 4,
            completed: 5,
          };
          const aStatus =
            statusValues[a.status as keyof typeof statusValues] || 0;
          const bStatus =
            statusValues[b.status as keyof typeof statusValues] || 0;
          return direction === "asc" ? aStatus - bStatus : bStatus - aStatus;

        case "createdAt":
        default:
          return direction === "asc"
            ? a.createdAt - b.createdAt
            : b.createdAt - a.createdAt;
      }
    });

    setSortedTasks(sorted);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colors = theme.colors.customColors.task;
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "work":
        return "W";
      case "personal":
        return "P";
      case "shopping":
        return "S";
      case "health":
        return "H";
      case "finance":
        return "F";
      default:
        return "O";
    }
  };

  // Helper function to safely format dates
  const formatDate = (
    timestamp: number | undefined,
    formatString: string
  ): string => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    if (!isValid(date)) return "";

    try {
      return format(date, formatString);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };

  const handleTaskPress = (taskId: string) => {
    // Use the correct navigation pattern for nested navigators
    navigation.navigate("TaskDetail", { taskId });
  };

  const getDaysRemaining = (dueDate: number): string => {
    const now = new Date();
    const due = new Date(dueDate);

    // If due date is in the past, show "Late"
    if (due < now) {
      return "Late";
    }

    // Calculate days difference
    const diffTime = Math.abs(due.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If less than 1 day, show "Today"
    if (diffDays === 0) {
      return "Today";
    }

    // Return days remaining
    return `${diffDays}d`;
  };

  const getDueDateColor = (dueDate: number): string => {
    const now = new Date();
    const due = new Date(dueDate);

    // If due date is in the past, show red
    if (due < now) {
      return "#FF3B30"; // Red
    }

    // Calculate days difference
    const diffTime = Math.abs(due.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If less than 3 days, show yellow
    if (diffDays < 3) {
      return "#FFCC00"; // Yellow
    }

    // Otherwise show green
    return "#34C759"; // Green
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskItem,
        { backgroundColor: theme.dark ? theme.colors.card : "white" },
      ]}
      onPress={() => handleTaskPress(item.id)}
    >
      <View style={styles.taskContainer}>
        <Avatar.Text
          size={50}
          label={getCategoryIcon(item.category || "other")}
          style={{ backgroundColor: getStatusColor(item.status) }}
        />
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            {item.dueDate && (
              <Text
                style={[styles.taskTime, { color: theme.colors.textSecondary }]}
              >
                {formatDate(item.dueDate, "MMM d")}
              </Text>
            )}
          </View>
          <View style={styles.taskPreview}>
            <Text
              numberOfLines={1}
              style={[
                styles.taskDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.description || `${item.priority} priority task`}
            </Text>
            {item.dueDate && (
              <Badge
                style={{
                  backgroundColor: getDueDateColor(item.dueDate),
                }}
              >
                {getDaysRemaining(item.dueDate)}
              </Badge>
            )}
          </View>
        </View>
      </View>
      <View
        style={[
          styles.divider,
          { backgroundColor: theme.dark ? "#333333" : "#E0E0E0" },
        ]}
      />
    </TouchableOpacity>
  );

  const getSortOptionLabel = (option: SortOption): string => {
    switch (option) {
      case "createdAt":
        return "Date Created";
      case "dueDate":
        return "Due Date";
      case "priority":
        return "Priority";
      case "status":
        return "Status";
      default:
        return "Date Created";
    }
  };

  if (isLoading && tasks.length === 0 && !refreshing) {
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
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: "black" }]}>
        <Text style={[styles.title, { color: "white" }]}>Tasks</Text>
      </View>

      <TaskSearchBar />

      <View style={styles.sortContainer}>
        <Text style={{ marginRight: 8, color: theme.colors.text }}>
          Sort by:
        </Text>
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              style={styles.sortButton}
              icon="sort"
            >
              {getSortOptionLabel(sortOption)}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSortOption("createdAt");
              setSortMenuVisible(false);
            }}
            title="Date Created"
            leadingIcon={sortOption === "createdAt" ? "check" : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortOption("dueDate");
              setSortMenuVisible(false);
            }}
            title="Due Date"
            leadingIcon={sortOption === "dueDate" ? "check" : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortOption("priority");
              setSortMenuVisible(false);
            }}
            title="Priority"
            leadingIcon={sortOption === "priority" ? "check" : undefined}
          />
          <Menu.Item
            onPress={() => {
              setSortOption("status");
              setSortMenuVisible(false);
            }}
            title="Status"
            leadingIcon={sortOption === "status" ? "check" : undefined}
          />
        </Menu>

        <TouchableOpacity
          style={[
            styles.sortDirectionButton,
            { borderColor: theme.dark ? "#444444" : "#e0e0e0" },
          ]}
          onPress={toggleSortDirection}
        >
          {sortDirection === "asc" ? (
            <ArrowUp width={20} height={20} stroke={theme.colors.primary} />
          ) : (
            <ArrowDown width={20} height={20} stroke={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {sortedTasks.length > 0 ? (
        <FlatList
          data={sortedTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.taskList}
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
            {searchQuery ? "No tasks match your search" : "No tasks yet"}
          </Text>
        </View>
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate("CreateTask")}
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
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortButton: {
    flex: 1,
    marginRight: 8,
  },
  sortDirectionButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  taskList: {
    flexGrow: 1,
  },
  taskItem: {
    // backgroundColor is applied dynamically in the component
  },
  taskContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  taskContent: {
    flex: 1,
    marginLeft: 15,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    // color is applied dynamically in the component
  },
  taskTime: {
    fontSize: 12,
    // color is applied dynamically in the component
  },
  taskPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskDescription: {
    fontSize: 14,
    // color is applied dynamically in the component
    flex: 1,
  },
  divider: {
    height: 1,
    // backgroundColor is applied dynamically in the component
    marginLeft: 76,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
});

export default TasksListScreen;

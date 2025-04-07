"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import {
  Text,
  FAB,
  Avatar,
  ActivityIndicator,
  Badge,
  Menu,
  Button,
  Chip,
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
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
} from "react-native-feather";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../api/firebase/config";

type SortOption = "createdAt" | "dueDate" | "priority" | "status";
type SortDirection = "asc" | "desc";
type FilterType = "status" | "priority" | "assignment" | null;

interface TaskSection {
  title: string;
  data: Task[];
  type: "active" | "completed";
  isCollapsed?: boolean;
}

const TasksListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { tasks, filteredTasks, isLoading, error, searchQuery, activeFilters } =
    useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [completedCollapsed, setCompletedCollapsed] = useState(true);
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const groupNamesRef = useRef<Record<string, string>>({});

  // New state for filters
  const [activeFilterType, setActiveFilterType] = useState<FilterType>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<string | null>(null);
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([]);

  // State to track if search is focused
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Clear any group filters when the task list screen mounts
  useEffect(() => {
    dispatch(clearFilters());

    if (user) {
      loadTasks();
    }
  }, [dispatch, user]);

  // Apply filters whenever tasks, filters, or sort options change
  useEffect(() => {
    if (tasks.length > 0) {
      applyFilters();
    }
  }, [
    tasks,
    filteredTasks,
    sortOption,
    sortDirection,
    searchQuery,
    activeFilters,
    statusFilter,
    priorityFilter,
    assignmentFilter,
    completedCollapsed,
  ]);

  useEffect(() => {
    const fetchGroupNames = async () => {
      const newGroupNames: Record<string, string> = {
        ...groupNamesRef.current,
      };
      let hasNewGroups = false;

      // Find all tasks with groupIds that we don't have names for yet
      for (const task of tasks) {
        if (task.groupId && !newGroupNames[task.groupId]) {
          try {
            const groupDoc = await getDoc(doc(db, "groups", task.groupId));
            if (groupDoc.exists()) {
              newGroupNames[task.groupId] = groupDoc.data().name || "Group";
              hasNewGroups = true;
            }
          } catch (error) {
            console.error(
              `Error fetching group name for ${task.groupId}:`,
              error
            );
          }
        }
      }

      // Only update state if we found new groups
      if (hasNewGroups) {
        setGroupNames(newGroupNames);
        groupNamesRef.current = newGroupNames;
      }
    };

    if (tasks.length > 0) {
      fetchGroupNames();
    }
  }, [tasks]);

  const loadTasks = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchTasks(user.id));
      setRefreshing(false);
    }
  };

  const toggleCompletedSection = () => {
    setCompletedCollapsed(!completedCollapsed);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  // Function to apply filters and sort tasks
  const applyFilters = useCallback(() => {
    if (!user) return;

    const tasksToFilter =
      searchQuery || Object.keys(activeFilters).length > 0
        ? filteredTasks
        : tasks;
    let result = [...tasksToFilter];

    // Apply status filter
    if (statusFilter) {
      if (statusFilter === "todo") {
        result = result.filter((task) => task.status === "todo");
      } else if (statusFilter === "inProgress") {
        result = result.filter((task) => task.status === "inProgress");
      } else if (statusFilter === "completed") {
        result = result.filter((task) => task.status === "completed");
      }
    } else if (completedCollapsed) {
      // If no status filter but completed is collapsed, hide completed tasks
      result = result.filter((task) => task.status !== "completed");
    }

    // Apply priority filter
    if (priorityFilter) {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    // Apply assignment filter
    if (assignmentFilter) {
      if (assignmentFilter === "assignedByMe") {
        result = result.filter(
          (task) =>
            task.createdBy === user.id &&
            task.assignedTo &&
            task.assignedTo !== user.id
        );
      } else if (assignmentFilter === "assignedToMe") {
        result = result.filter(
          (task) => task.assignedTo === user.id && task.createdBy !== user.id
        );
      } else if (assignmentFilter === "unassigned") {
        result = result.filter((task) => !task.assignedTo);
      }
    }

    // Sort tasks
    result.sort((a, b) => {
      // First sort by status - put completed tasks at the bottom
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;

      // Then sort by the selected sort option
      if (sortOption === "dueDate") {
        // Handle tasks without due dates
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        // Sort by due date
        const result = a.dueDate - b.dueDate;
        return sortDirection === "asc" ? result : -result;
      } else if (sortOption === "priority") {
        // Convert priority to numeric value for sorting
        const priorityValues = { high: 3, medium: 2, low: 1 };
        const result = priorityValues[b.priority] - priorityValues[a.priority];
        return sortDirection === "asc" ? -result : result;
      } else if (sortOption === "createdAt") {
        const result = (b.createdAt || 0) - (a.createdAt || 0);
        return sortDirection === "asc" ? -result : result;
      } else {
        // Default sort by status
        return a.status.localeCompare(b.status);
      }
    });

    setDisplayedTasks(result);
  }, [
    tasks,
    filteredTasks,
    sortOption,
    sortDirection,
    searchQuery,
    activeFilters,
    statusFilter,
    priorityFilter,
    assignmentFilter,
    completedCollapsed,
    user,
  ]);

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

  // Function to display assignment relationship
  const getAssignmentText = (task: Task): string => {
    if (!user) return "";

    // Check if this is a group task
    const isGroupTask = !!task.groupId;

    // Get the actual group name if available
    const groupName = task.groupId
      ? groupNames[task.groupId] || "Group"
      : "Group";

    // For tasks with no assignee
    if (!task.assignedTo) {
      return "Not assigned to anyone";
    }

    if (task.createdBy === user.id && task.assignedTo === user.id) {
      return "Assigned to yourself";
    } else if (task.createdBy === user.id && task.assignedTo) {
      if (isGroupTask) {
        return `You assigned to ${groupName}`;
      } else {
        return `You assigned to ${task.assignedToName || "someone"}`;
      }
    } else if (task.assignedTo === user.id) {
      if (isGroupTask) {
        return `Assigned to you by ${groupName}`;
      } else {
        return `Assigned to you by ${
          task.createdBy === user.id ? "yourself" : "someone"
        }`;
      }
    } else if (task.assignedTo) {
      if (isGroupTask) {
        return `${
          task.createdBy === user.id ? "You" : "Someone"
        } assigned to ${groupName}`;
      } else {
        return `${task.createdBy === user.id ? "You" : "Someone"} assigned to ${
          task.assignedToName
        }`;
      }
    }

    return "";
  };

  // Function to check if a task is a group task
  const isGroupTask = (task: Task): boolean => {
    return !!task.groupId;
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
          style={{
            backgroundColor:
              item.status === "completed"
                ? "#4CAF50" // Green for completed tasks
                : getStatusColor(item.status),
          }}
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

          {/* Assignment relationship with group indicator */}
          <View style={styles.assignmentRow}>
            <Text
              style={[
                styles.assignmentText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {getAssignmentText(item)}
            </Text>
          </View>

          <View style={styles.taskPreview}>
            <View style={styles.taskMeta}>
              <Text
                style={[
                  styles.priorityText,
                  {
                    color:
                      item.priority === "high"
                        ? "#FF3B30"
                        : item.priority === "medium"
                        ? "#FFCC00"
                        : "#34C759",
                  },
                ]}
              >
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </Text>

              {item.status === "completed" && item.completedAt && (
                <Text
                  style={[
                    styles.completedText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Completed {formatDate(item.completedAt, "MMM d")}
                </Text>
              )}
            </View>

            {item.dueDate && item.status !== "completed" && (
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

  const renderEmptyList = () => (
    <View style={[styles.centered, { flex: 1, paddingTop: 40 }]}>
      <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
        {searchQuery || statusFilter || priorityFilter || assignmentFilter
          ? "No tasks match your filters"
          : "No tasks yet"}
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate("CreateTask")}
        style={{ backgroundColor: theme.colors.primary }}
      >
        Create Your First Task
      </Button>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: TaskSection }) => (
    <TouchableOpacity
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.dark ? "#1E1E1E" : "#F5F5F5" },
      ]}
      onPress={
        section.type === "completed" ? toggleCompletedSection : undefined
      }
      activeOpacity={section.type === "completed" ? 0.7 : 1}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>

      {section.type === "completed" && (
        <View style={styles.collapseButton}>
          {section.isCollapsed ? (
            <>
              <ChevronDown
                width={20}
                height={20}
                stroke={theme.colors.primary}
              />
              <Text style={{ color: theme.colors.primary, marginLeft: 4 }}>
                Show ({tasks.filter((t) => t.status === "completed").length})
              </Text>
            </>
          ) : (
            <>
              <ChevronUp width={20} height={20} stroke={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, marginLeft: 4 }}>
                Hide
              </Text>
            </>
          )}
        </View>
      )}
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

  // Function to handle filter selection
  const handleFilterSelect = (type: FilterType, value: string | null) => {
    // Reset all filters first
    if (type !== activeFilterType) {
      setStatusFilter(null);
      setPriorityFilter(null);
      setAssignmentFilter(null);
    }

    // Set the active filter type
    setActiveFilterType(type);

    // Apply the selected filter
    if (type === "status") {
      setStatusFilter(value);
    } else if (type === "priority") {
      setPriorityFilter(value);
    } else if (type === "assignment") {
      setAssignmentFilter(value);
    }
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setActiveFilterType(null);
    setStatusFilter(null);
    setPriorityFilter(null);
    setAssignmentFilter(null);
  };

  // Function to handle search focus
  const handleSearchFocus = (focused: boolean) => {
    setIsSearchFocused(focused);
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

      <TaskSearchBar
        onFocus={() => handleSearchFocus(true)}
        onBlur={() => handleSearchFocus(false)}
      />

      {/* Status and Priority filters - Only visible when search is focused */}
      {isSearchFocused && (
        <View style={styles.statusPriorityFilters}>
          <Chip
            selected={activeFilterType === "status" && statusFilter === "todo"}
            onPress={() => handleFilterSelect("status", "todo")}
            style={[
              styles.filterChip,
              activeFilterType === "status" && statusFilter === "todo"
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
            ]}
            textStyle={{
              color:
                activeFilterType === "status" && statusFilter === "todo"
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
            compact
          >
            To Do
          </Chip>

          <Chip
            selected={
              activeFilterType === "status" && statusFilter === "inProgress"
            }
            onPress={() => handleFilterSelect("status", "inProgress")}
            style={[
              styles.filterChip,
              activeFilterType === "status" && statusFilter === "inProgress"
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
            ]}
            textStyle={{
              color:
                activeFilterType === "status" && statusFilter === "inProgress"
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
            compact
          >
            In Progress
          </Chip>

          <Chip
            selected={
              activeFilterType === "status" && statusFilter === "completed"
            }
            onPress={() => handleFilterSelect("status", "completed")}
            style={[
              styles.filterChip,
              activeFilterType === "status" && statusFilter === "completed"
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
            ]}
            textStyle={{
              color:
                activeFilterType === "status" && statusFilter === "completed"
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
            compact
          >
            Completed
          </Chip>

          <Chip
            selected={
              activeFilterType === "priority" && priorityFilter === "high"
            }
            onPress={() => handleFilterSelect("priority", "high")}
            style={[
              styles.filterChip,
              activeFilterType === "priority" && priorityFilter === "high"
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
            ]}
            textStyle={{
              color:
                activeFilterType === "priority" && priorityFilter === "high"
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
            compact
          >
            High Priority
          </Chip>

          <Chip
            selected={
              activeFilterType === "priority" && priorityFilter === "medium"
            }
            onPress={() => handleFilterSelect("priority", "medium")}
            style={[
              styles.filterChip,
              activeFilterType === "priority" && priorityFilter === "medium"
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
            ]}
            textStyle={{
              color:
                activeFilterType === "priority" && priorityFilter === "medium"
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
            compact
          >
            Medium
          </Chip>

          <Chip
            selected={
              activeFilterType === "priority" && priorityFilter === "low"
            }
            onPress={() => handleFilterSelect("priority", "low")}
            style={[
              styles.filterChip,
              activeFilterType === "priority" && priorityFilter === "low"
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
            ]}
            textStyle={{
              color:
                activeFilterType === "priority" && priorityFilter === "low"
                  ? theme.colors.onPrimary
                  : theme.colors.text,
            }}
            compact
          >
            Low
          </Chip>
        </View>
      )}

      {/* Assignment filters - Always visible */}
      <View style={styles.assignmentFilters}>
        <Chip
          selected={
            activeFilterType === "assignment" &&
            assignmentFilter === "assignedByMe"
          }
          onPress={() => handleFilterSelect("assignment", "assignedByMe")}
          style={[
            styles.filterChip,
            activeFilterType === "assignment" &&
            assignmentFilter === "assignedByMe"
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
          ]}
          textStyle={{
            color:
              activeFilterType === "assignment" &&
              assignmentFilter === "assignedByMe"
                ? theme.colors.onPrimary
                : theme.colors.text,
          }}
          icon="arrow-right"
          compact
        >
          By Me
        </Chip>

        <Chip
          selected={
            activeFilterType === "assignment" &&
            assignmentFilter === "assignedToMe"
          }
          onPress={() => handleFilterSelect("assignment", "assignedToMe")}
          style={[
            styles.filterChip,
            activeFilterType === "assignment" &&
            assignmentFilter === "assignedToMe"
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
          ]}
          textStyle={{
            color:
              activeFilterType === "assignment" &&
              assignmentFilter === "assignedToMe"
                ? theme.colors.onPrimary
                : theme.colors.text,
          }}
          icon="arrow-left"
          compact
        >
          To Me
        </Chip>

        <Chip
          selected={
            activeFilterType === "assignment" &&
            assignmentFilter === "unassigned"
          }
          onPress={() => handleFilterSelect("assignment", "unassigned")}
          style={[
            styles.filterChip,
            activeFilterType === "assignment" &&
            assignmentFilter === "unassigned"
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
          ]}
          textStyle={{
            color:
              activeFilterType === "assignment" &&
              assignmentFilter === "unassigned"
                ? theme.colors.onPrimary
                : theme.colors.text,
          }}
          icon="help-circle-outline"
          compact
        >
          Unassigned
        </Chip>
      </View>

      {/* Active filters indicator */}
      {(statusFilter || priorityFilter || assignmentFilter) && (
        <View style={styles.activeFiltersRow}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Active filters:
          </Text>
          <Button
            mode="text"
            compact
            onPress={clearAllFilters}
            textColor={theme.colors.primary}
          >
            Clear All
          </Button>
        </View>
      )}

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

      {/* Task list */}
      {displayedTasks.length > 0 ? (
        <FlatList
          data={displayedTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.taskList, { paddingBottom: 100 }]} // Added padding to avoid FAB overlap
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListFooterComponent={
            completedCollapsed &&
            tasks.some((t) => t.status === "completed") ? (
              <TouchableOpacity
                style={[
                  styles.showCompletedButton,
                  { backgroundColor: theme.dark ? "#333" : "#f5f5f5" },
                ]}
                onPress={toggleCompletedSection}
              >
                <Text style={{ color: theme.colors.primary }}>
                  Show Completed Tasks (
                  {tasks.filter((t) => t.status === "completed").length})
                </Text>
                <ChevronDown
                  width={16}
                  height={16}
                  stroke={theme.colors.primary}
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            ) : null
          }
        />
      ) : (
        renderEmptyList()
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
  statusPriorityFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  assignmentFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    marginBottom: 4,
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
    flex: 1,
    marginRight: 8,
  },
  taskTime: {
    fontSize: 12,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 13,
  },
  taskPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  completedText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    marginLeft: 76,
  },
  showCompletedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  collapseButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeFiltersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default TasksListScreen;
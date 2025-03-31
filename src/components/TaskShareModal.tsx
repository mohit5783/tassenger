"use client";

import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  Searchbar,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { useAppSelector } from "../store/hooks";
import type { Task } from "../store/slices/taskSlice";

interface TaskShareModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectTask: (task: Task) => void;
}

const TaskShareModal = ({
  visible,
  onDismiss,
  onSelectTask,
}: TaskShareModalProps) => {
  const { theme } = useTheme();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredTasks(
        tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        )
      );
    } else {
      setFilteredTasks(tasks);
    }
  }, [searchQuery, tasks]);

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

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => {
        onSelectTask(item);
        onDismiss();
      }}
    >
      <Avatar.Text
        size={40}
        label={getCategoryIcon(item.category || "other")}
        style={{ backgroundColor: getStatusColor(item.status) }}
      />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        {item.description && (
          <Text numberOfLines={1} style={styles.taskDescription}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      animationType="slide"
      transparent
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share a Task</Text>
            <Button onPress={onDismiss}>Cancel</Button>
          </View>

          <Searchbar
            placeholder="Search tasks..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.tasksList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No tasks found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    paddingVertical: 0, // Fix vertical alignment
    height: 40,
    alignSelf: "center",
  },
  tasksList: {
    paddingHorizontal: 16,
  },
  taskItem: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  taskContent: {
    marginLeft: 12,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  taskDescription: {
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
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
  },
});

export default TaskShareModal;

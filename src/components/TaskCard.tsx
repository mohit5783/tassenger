"use client";

import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, Chip } from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import type { Task } from "../store/slices/taskSlice";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

const TaskCard = ({ task, onPress }: TaskCardProps) => {
  const { theme } = useTheme();

  const getStatusColor = (status: string) => {
    const colors = theme.colors.customColors.task;
    return colors[status as keyof typeof colors] || colors.todo || "#cccccc"; // Add fallback color
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return theme.colors.error;
      case "medium":
        return theme.colors.customColors.task.inProgress;
      default:
        return theme.colors.customColors.task.todo;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {task.title}
          </Text>

          {task.description && (
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.chipContainer}>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(task.status) },
              ]}
              textStyle={{ color: theme.colors.onPrimary }}
            >
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Chip>

            <Chip
              style={[
                styles.priorityChip,
                { borderColor: getPriorityColor(task.priority) },
              ]}
              textStyle={{ color: getPriorityColor(task.priority) }}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  statusChip: {
    height: 28,
  },
  priorityChip: {
    height: 28,
    backgroundColor: "transparent",
    borderWidth: 1,
  },
});

export default TaskCard;

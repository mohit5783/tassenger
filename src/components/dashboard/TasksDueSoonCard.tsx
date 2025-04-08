"use client"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Text, Card, Chip, Button } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import type { Task } from "../../store/slices/taskSlice"

interface TasksDueSoonCardProps {
  tasksDueSoon: Task[]
  navigation: any
  getCategoryColor: (category: string) => string
  formatDate: (date: number, formatStr: string) => string
}

const TasksDueSoonCard = ({ tasksDueSoon, navigation, getCategoryColor, formatDate }: TasksDueSoonCardProps) => {
  const { theme } = useTheme()

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Tasks Due Soon</Text>

        {tasksDueSoon.length > 0 ? (
          <>
            {tasksDueSoon.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.dueSoonTask,
                  { backgroundColor: theme.dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)" },
                ]}
                onPress={() => navigation.navigate("Tasks", { screen: "TaskDetail", params: { taskId: task.id } })}
              >
                <Text style={[styles.dueSoonTaskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                <View style={styles.dueSoonTaskChips}>
                  <Chip
                    style={[styles.taskChip, { backgroundColor: getCategoryColor(task.category || "other") }]}
                    textStyle={{ color: "white" }}
                  >
                    {task.category?.charAt(0).toUpperCase() + task.category?.slice(1) || "Other"}
                  </Chip>
                  <Chip
                    style={[
                      styles.taskChip,
                      {
                        backgroundColor:
                          task.priority === "high" ? "#FF3B30" : task.priority === "medium" ? "#FFCC00" : "#34C759",
                      },
                    ]}
                    textStyle={{ color: "white" }}
                  >
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Chip>
                </View>
                <Text style={[styles.dueSoonTaskDate, { color: theme.colors.textSecondary }]}>
                  Due: {task.dueDate ? formatDate(task.dueDate, "MMM d, yyyy") : "No due date"}
                </Text>
              </TouchableOpacity>
            ))}

            {tasksDueSoon.length > 3 && (
              <Button
                mode="text"
                onPress={() => navigation.navigate("Tasks")}
                style={{ alignSelf: "center", marginTop: 8 }}
                textColor={theme.colors.primary}
              >
                View all {tasksDueSoon.length} tasks
              </Button>
            )}
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No tasks due in the next 3 days</Text>
        )}
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dueSoonTask: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dueSoonTaskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  dueSoonTaskChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  taskChip: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dueSoonTaskDate: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
})

export default TasksDueSoonCard

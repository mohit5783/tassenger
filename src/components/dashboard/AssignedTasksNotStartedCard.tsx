"use client"
import { StyleSheet, TouchableOpacity } from "react-native"
import { Text, Card, Button } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import type { Task } from "../../store/slices/taskSlice"

interface AssignedTasksNotStartedCardProps {
  tasks: Task[]
  user: any
  navigation: any
  formatDate: (date: number, formatStr: string) => string
}

const AssignedTasksNotStartedCard = ({ tasks, user, navigation, formatDate }: AssignedTasksNotStartedCardProps) => {
  const { theme } = useTheme()

  // Get tasks assigned to the user but not started yet
  const assignedNotStarted = tasks.filter(
    (task) => task.assignedTo === user?.id && task.status === "todo" && task.createdBy !== user?.id,
  )

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Assigned Tasks Not Started</Text>

        {assignedNotStarted.length > 0 ? (
          <>
            {assignedNotStarted.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.approachingTask,
                  { backgroundColor: theme.dark ? "rgba(255, 204, 0, 0.1)" : "rgba(255, 204, 0, 0.1)" },
                ]}
                onPress={() => navigation.navigate("Tasks", { screen: "TaskDetail", params: { taskId: task.id } })}
              >
                <Text style={[styles.approachingTaskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                <Text style={[styles.approachingTaskMeta, { color: theme.colors.textSecondary }]}>
                  Assigned by: {task.createdBy === user?.id ? "You" : "Someone else"}
                </Text>
                <Text style={[styles.approachingTaskMeta, { color: theme.colors.textSecondary }]}>
                  Due: {task.dueDate ? formatDate(task.dueDate, "MMM d, yyyy") : "No due date"}
                </Text>
              </TouchableOpacity>
            ))}

            {assignedNotStarted.length > 3 && (
              <Button
                mode="text"
                onPress={() => navigation.navigate("Tasks")}
                style={{ alignSelf: "center", marginTop: 8 }}
                textColor={theme.colors.primary}
              >
                View all {assignedNotStarted.length} tasks
              </Button>
            )}
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No assigned tasks waiting to be started
          </Text>
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
  approachingTask: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  approachingTaskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  approachingTaskMeta: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
})

export default AssignedTasksNotStartedCard

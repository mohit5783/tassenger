"use client"
import { StyleSheet, TouchableOpacity } from "react-native"
import { Text, Card, Button } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import type { Task } from "../../store/slices/taskSlice"

interface TasksNeedingReviewCardProps {
  tasks: Task[]
  user: any
  navigation: any
  formatDate: (date: number, formatStr: string) => string
}

const TasksNeedingReviewCard = ({ tasks, user, navigation, formatDate }: TasksNeedingReviewCardProps) => {
  const { theme } = useTheme()

  // Get tasks that need review (tasks where the user is the reviewer and status is pending review)
  const tasksNeedingReview = tasks.filter(
    (task) => task.assignment?.reviewerId === user?.id && task.status === "pendingReview",
  )

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Tasks Needing Review</Text>

        {tasksNeedingReview.length > 0 ? (
          <>
            {tasksNeedingReview.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.reviewTask,
                  { backgroundColor: theme.dark ? "rgba(0, 204, 168, 0.1)" : "rgba(0, 204, 168, 0.1)" },
                ]}
                onPress={() => navigation.navigate("Tasks", { screen: "TaskDetail", params: { taskId: task.id } })}
              >
                <Text style={[styles.reviewTaskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                <Text style={[styles.reviewTaskMeta, { color: theme.colors.textSecondary }]}>
                  Completed by: {task.assignment?.assigneeName || "Unknown"}
                </Text>
                <Text style={[styles.reviewTaskMeta, { color: theme.colors.textSecondary }]}>
                  Due: {task.dueDate ? formatDate(task.dueDate, "MMM d, yyyy") : "No due date"}
                </Text>
              </TouchableOpacity>
            ))}

            {tasksNeedingReview.length > 3 && (
              <Button
                mode="text"
                onPress={() => navigation.navigate("Tasks")}
                style={{ alignSelf: "center", marginTop: 8 }}
                textColor={theme.colors.primary}
              >
                View all {tasksNeedingReview.length} tasks
              </Button>
            )}
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No tasks waiting for your review
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
  reviewTask: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewTaskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  reviewTaskMeta: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
})

export default TasksNeedingReviewCard

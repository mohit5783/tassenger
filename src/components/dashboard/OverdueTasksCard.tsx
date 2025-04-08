"use client"
import { StyleSheet, TouchableOpacity } from "react-native"
import { Text, Card, Button } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import type { Task } from "../../store/slices/taskSlice"

interface OverdueTasksCardProps {
  tasks: Task[]
  user: any
  navigation: any
  formatDate: (date: number, formatStr: string) => string
  getDaysOverdue: (dueDate: number) => number
}

const OverdueTasksCard = ({ tasks, user, navigation, formatDate, getDaysOverdue }: OverdueTasksCardProps) => {
  const { theme } = useTheme()

  // Get overdue tasks
  const now = new Date()
  const overdueTasks = tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== "completed",
  )

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Overdue Tasks</Text>

        {overdueTasks.length > 0 ? (
          <>
            {overdueTasks.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.alertTask,
                  {
                    backgroundColor: theme.dark ? "rgba(255, 59, 48, 0.1)" : "rgba(255, 59, 48, 0.1)",
                    borderLeftColor: "#FF3B30",
                  },
                ]}
                onPress={() => navigation.navigate("Tasks", { screen: "TaskDetail", params: { taskId: task.id } })}
              >
                <Text style={[styles.alertTaskTitle, { color: theme.colors.text }]}>{task.title}</Text>
                <Text style={[styles.alertTaskMeta, { color: theme.colors.textSecondary }]}>
                  Due: {task.dueDate ? formatDate(task.dueDate, "MMM d, yyyy") : "No due date"}
                </Text>
                <Text style={[styles.alertTaskMeta, { color: "#FF3B30" }]}>
                  {task.dueDate ? `${getDaysOverdue(task.dueDate)} days overdue` : ""}
                </Text>
              </TouchableOpacity>
            ))}

            {overdueTasks.length > 3 && (
              <Button
                mode="text"
                onPress={() => navigation.navigate("Tasks")}
                style={{ alignSelf: "center", marginTop: 8 }}
                textColor={theme.colors.primary}
              >
                View all {overdueTasks.length} tasks
              </Button>
            )}
          </>
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No overdue tasks</Text>
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
  alertTask: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertTaskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  alertTaskMeta: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
})

export default OverdueTasksCard

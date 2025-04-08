"use client"
import { View, StyleSheet } from "react-native"
import { Text, Card, ProgressBar } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"

interface TaskOverviewCardProps {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  completionRate: number
}

const TaskOverviewCard = ({
  totalTasks,
  completedTasks,
  inProgressTasks,
  todoTasks,
  completionRate,
}: TaskOverviewCardProps) => {
  const { theme } = useTheme()

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Task Overview</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{totalTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{todoTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>To Do</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{inProgressTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>In Progress</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{completedTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
          </View>
        </View>

        <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
          Completion Rate: {completionRate.toFixed(0)}%
        </Text>
        <ProgressBar
          progress={completionRate / 100}
          color={theme.colors.primary}
          style={[styles.progressBar, { backgroundColor: theme.dark ? "#333" : "#f0f0f0" }]}
        />
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
  },
  progressLabel: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
})

export default TaskOverviewCard

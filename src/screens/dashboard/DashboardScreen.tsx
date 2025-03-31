"use client";

import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  ProgressBar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchTasks } from "../../store/slices/taskSlice";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import TaskCard from "../../components/TaskCard";

const DashboardScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [dispatch, user]);

  const loadTasks = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchTasks(user.id));
      setRefreshing(false);
    }
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "inProgress"
  ).length;
  const todoTasks = tasks.filter((task) => task.status === "todo").length;
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Get tasks due soon (next 3 days)
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const tasksDueSoon = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return (
        dueDate >= now &&
        dueDate <= threeDaysFromNow &&
        task.status !== "completed"
      );
    })
    .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  // Data for pie chart
  const chartData = [
    {
      name: "To Do",
      population: todoTasks,
      color: theme.colors.customColors.task.todo,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: "In Progress",
      population: inProgressTasks,
      color: theme.colors.customColors.task.inProgress,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: "Completed",
      population: completedTasks,
      color: theme.colors.customColors.task.completed,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  if (isLoading && tasks.length === 0) {
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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
          Dashboard
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTasks}
            colors={[theme.colors.primary]}
          />
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Task Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalTasks}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todoTasks}</Text>
                <Text style={styles.statLabel}>To Do</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{inProgressTasks}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedTasks}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            <Text style={styles.progressLabel}>
              Completion Rate: {completionRate.toFixed(0)}%
            </Text>
            <ProgressBar
              progress={completionRate / 100}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        {totalTasks > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Task Distribution</Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={chartData}
                  width={Dimensions.get("window").width - 64}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Tasks Due Soon</Text>
            {tasksDueSoon.length > 0 ? (
              tasksDueSoon
                .slice(0, 3)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPress={() =>
                      navigation.navigate("Tasks", {
                        screen: "TaskDetail",
                        params: { taskId: task.id },
                      })
                    }
                  />
                ))
            ) : (
              <Text style={styles.emptyText}>
                No tasks due in the next 3 days
              </Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate("Tasks")}>
              View All Tasks
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="plus"
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() =>
                  navigation.navigate("Tasks", { screen: "CreateTask" })
                }
              >
                New Task
              </Button>
              <Button
                mode="contained"
                icon="message"
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() =>
                  navigation.navigate("Chat", { screen: "ContactsForChat" })
                }
              >
                New Chat
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
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
    color: "#666",
  },
  progressLabel: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
  },
  actionButton: {
    width: "45%",
  },
});

export default DashboardScreen;

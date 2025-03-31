"use client";

import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text, Appbar, Card, ActivityIndicator } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector } from "../../store/hooks";
import { useState, useEffect } from "react";
import { LineChart, PieChart } from "react-native-chart-kit";

const TaskAnalyticsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any>({
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [{ data: [0, 0, 0, 0] }],
  });

  useEffect(() => {
    if (tasks.length > 0) {
      analyzeTaskData();
    }
  }, [tasks]);

  const analyzeTaskData = () => {
    // Status distribution
    const statusCounts: Record<string, number> = {
      todo: 0,
      inProgress: 0,
      completed: 0,
    };

    tasks.forEach((task) => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
    });

    const statusChartData = [
      {
        name: "To Do",
        count: statusCounts.todo,
        color: "#FF6384",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "In Progress",
        count: statusCounts.inProgress,
        color: "#FFCE56",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Completed",
        count: statusCounts.completed,
        color: "#36A2EB",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ];

    // Priority distribution
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    tasks.forEach((task) => {
      priorityCounts[task.priority]++;
    });

    const priorityChartData = [
      {
        name: "Low",
        count: priorityCounts.low,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "Medium",
        count: priorityCounts.medium,
        color: "#FF9800",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "High",
        count: priorityCounts.high,
        color: "#F44336",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ];

    // Completion trend (mock data for now)
    const completionTrend = {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          data: [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
          ],
        },
      ],
    };

    setStatusData(statusChartData);
    setPriorityData(priorityChartData);
    setCompletionData(completionTrend);
  };

  const screenWidth = Dimensions.get("window").width - 32;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (isLoading) {
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
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Task Analytics" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Task Status Distribution" />
          <Card.Content>
            {statusData.length > 0 ? (
              <PieChart
                data={statusData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={styles.noDataText}>No task data available</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Task Priority Distribution" />
          <Card.Content>
            {priorityData.length > 0 ? (
              <PieChart
                data={priorityData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={styles.noDataText}>No task data available</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Task Completion Trend" />
          <Card.Content>
            <LineChart
              data={completionData}
              width={screenWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(7, 94, 84, ${opacity})`,
              }}
              bezier
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Task Summary" />
          <Card.Content>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Tasks</Text>
              <Text style={styles.summaryValue}>{tasks.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completed Tasks</Text>
              <Text style={styles.summaryValue}>
                {tasks.filter((t) => t.status === "completed").length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completion Rate</Text>
              <Text style={styles.summaryValue}>
                {tasks.length > 0
                  ? `${Math.round(
                      (tasks.filter((t) => t.status === "completed").length /
                        tasks.length) *
                        100
                    )}%`
                  : "0%"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>High Priority Tasks</Text>
              <Text style={styles.summaryValue}>
                {tasks.filter((t) => t.priority === "high").length}
              </Text>
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
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  noDataText: {
    textAlign: "center",
    padding: 20,
    color: "#8E8E93",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#555",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TaskAnalyticsScreen;

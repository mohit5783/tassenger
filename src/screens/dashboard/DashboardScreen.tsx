"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  ProgressBar,
  Chip,
  Badge,
  Menu,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchTasks } from "../../store/slices/taskSlice";
import { PieChart, LineChart, ContributionGraph } from "react-native-chart-kit";
import { format, startOfWeek, eachDayOfInterval, subWeeks } from "date-fns";
import {
  Bell,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
} from "react-native-feather";

const screenWidth = Dimensions.get("window").width - 32;

const DashboardScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");
  const [timeRangeMenuVisible, setTimeRangeMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Task due soon",
      message: "You have 3 tasks due in the next 24 hours",
      read: false,
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Task completed",
      message: "Great job! You've completed 5 tasks this week",
      read: true,
      time: "Yesterday",
    },
    {
      id: 3,
      title: "New task assigned",
      message: "John assigned you a new task: 'Review project proposal'",
      read: false,
      time: "2 days ago",
    },
  ]);

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

  // Data for pie chart with theme colors
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
      color: "#00C2A8", // Using the requested color instead of neon green
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundGradientFrom: theme.dark ? "#1E1E1E" : "#ffffff",
    backgroundGradientTo: theme.dark ? "#1E1E1E" : "#ffffff",
    color: (opacity = 1) =>
      `rgba(${theme.dark ? "255, 255, 255" : "0, 0, 0"}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) =>
      `rgba(${theme.dark ? "255, 255, 255" : "0, 0, 0"}, ${opacity})`,
  };

  // Generate productivity data for the past 4 weeks
  const generateProductivityData = () => {
    const weeks = [];
    const today = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i));
      const weekLabel = `W${4 - i}`;

      // Simulate completed tasks for this week
      const completedCount = Math.floor(Math.random() * 10) + 1;

      weeks.push({
        week: weekLabel,
        count: completedCount,
      });
    }

    return {
      labels: weeks.map((w) => w.week),
      datasets: [
        {
          data: weeks.map((w) => w.count),
          color: (opacity = 1) => `rgba(0, 194, 168, ${opacity})`, // Using the requested color
          strokeWidth: 2,
        },
      ],
    };
  };

  // Generate comparison data
  const generateComparisonData = () => {
    return {
      labels: ["Week 1", "Week 2", "Week 3", "Current"],
      datasets: [
        {
          data: [5, 8, 6, 9],
          color: (opacity = 1) => `rgba(0, 194, 168, ${opacity})`, // Current period
          strokeWidth: 2,
        },
        {
          data: [3, 5, 7, 6],
          color: (opacity = 1) => `rgba(150, 150, 150, ${opacity})`, // Previous period
          strokeWidth: 2,
        },
      ],
    };
  };

  // Generate heat map data
  const generateHeatMapData = () => {
    const today = new Date();
    const startDate = subWeeks(today, 5);
    const endDate = today;

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    return dateRange.map((date) => {
      // Generate random count between 0-5 for each day
      const count = Math.floor(Math.random() * 6);
      return {
        date: format(date, "yyyy-MM-dd"),
        count: count,
      };
    });
  };

  const productivityData = generateProductivityData();
  const comparisonData = generateComparisonData();
  const heatMapData = generateHeatMapData();

  const renderNotificationItem = (notification: any) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        { borderBottomColor: theme.dark ? "#333" : "#eee" },
      ]}
      onPress={() => {
        // Mark as read
        setNotifications(
          notifications.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[styles.notificationTitle, { color: theme.colors.text }]}
          >
            {notification.title}
          </Text>
          {!notification.read && (
            <Badge size={8} style={{ backgroundColor: theme.colors.primary }} />
          )}
        </View>
        <Text
          style={[
            styles.notificationMessage,
            { color: theme.colors.textSecondary },
          ]}
        >
          {notification.message}
        </Text>
        <Text
          style={[
            styles.notificationTime,
            { color: theme.colors.textSecondary },
          ]}
        >
          {notification.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <>
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Task Overview
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {totalTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Total
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {todoTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                To Do
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {inProgressTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                In Progress
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {completedTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Completed
              </Text>
            </View>
          </View>

          <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
            Completion Rate: {completionRate.toFixed(0)}%
          </Text>
          <ProgressBar
            progress={completionRate / 100}
            color="#00C2A8"
            style={styles.progressBar}
          />
        </Card.Content>
      </Card>

      {totalTasks > 0 && (
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.dark ? theme.colors.card : "white" },
          ]}
        >
          <Card.Content>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Task Distribution
            </Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={chartData}
                width={screenWidth - 32}
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

      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Tasks Due Soon
          </Text>
          {tasksDueSoon.length > 0 ? (
            tasksDueSoon.slice(0, 3).map((task) => (
              <View key={task.id} style={styles.dueSoonTask}>
                <Text
                  style={[
                    styles.dueSoonTaskTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.dueSoonTaskChips}>
                  <Chip
                    style={[
                      styles.taskChip,
                      { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
                    ]}
                    textStyle={{ color: theme.colors.text }}
                  >
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Chip>
                  <Chip
                    style={[
                      styles.taskChip,
                      {
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor:
                          task.priority === "high"
                            ? "#FF3B30"
                            : task.priority === "medium"
                            ? "#FFCC00"
                            : "#34C759",
                      },
                    ]}
                    textStyle={{
                      color:
                        task.priority === "high"
                          ? "#FF3B30"
                          : task.priority === "medium"
                          ? "#FFCC00"
                          : "#34C759",
                    }}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </Chip>
                  {task.category && (
                    <Chip
                      style={[
                        styles.taskChip,
                        {
                          backgroundColor: "transparent",
                          borderWidth: 1,
                          borderColor: getCategoryColor(task.category),
                        },
                      ]}
                      textStyle={{ color: getCategoryColor(task.category) }}
                    >
                      {task.category.charAt(0).toUpperCase() +
                        task.category.slice(1)}
                    </Chip>
                  )}
                </View>
                <Text
                  style={[
                    styles.dueSoonTaskDate,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Due:{" "}
                  {task.dueDate
                    ? formatDate(task.dueDate, "MMM d, yyyy")
                    : "No due date"}
                </Text>
              </View>
            ))
          ) : (
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No tasks due in the next 3 days
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            onPress={() => navigation.navigate("Tasks")}
            textColor={theme.colors.primary}
          >
            View All Tasks
          </Button>
        </Card.Actions>
      </Card>
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            <Text style={{ color: "#FF9500" }}>⚠️ </Text>
            Assigned Tasks Not Started
          </Text>
          {(() => {
            // Filter tasks assigned to others by the current user that are still in todo status and due soon
            const notStartedTasks = tasks.filter(
              (task) =>
                task.createdBy === user?.id &&
                task.assignedTo &&
                task.assignedTo !== user?.id &&
                task.status === "todo" &&
                task.dueDate &&
                new Date(task.dueDate) > new Date() &&
                new Date(task.dueDate) <=
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in the next 7 days
            );

            if (notStartedTasks.length > 0) {
              return notStartedTasks.slice(0, 3).map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.alertTask,
                    { backgroundColor: "#FFF9E6", borderLeftColor: "#FF9500" },
                  ]}
                >
                  <Text
                    style={[
                      styles.alertTaskTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.alertTaskMeta}>
                    <Text style={{ color: "#FF9500", fontWeight: "500" }}>
                      Assigned to: {task.assignedToName || "Someone"}
                    </Text>
                    {task.dueDate && (
                      <Text style={{ color: "#FF9500" }}>
                        Due: {formatDate(task.dueDate, "MMM d, yyyy")}
                      </Text>
                    )}
                  </View>
                  <Button
                    mode="text"
                    onPress={() =>
                      navigation.navigate("Tasks", {
                        screen: "TaskDetail",
                        params: { taskId: task.id },
                      })
                    }
                    textColor="#FF9500"
                    compact
                  >
                    View Task
                  </Button>
                </View>
              ));
            } else {
              return (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No assigned tasks waiting to be started
                </Text>
              );
            }
          })()}
        </Card.Content>
      </Card>

      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            <Text style={{ color: "#FF3B30" }}>🚨 </Text>
            Overdue Tasks
          </Text>
          {(() => {
            // Filter tasks that are past due date and not completed
            const overdueTasks = tasks.filter(
              (task) =>
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== "completed"
            );

            if (overdueTasks.length > 0) {
              return overdueTasks.slice(0, 3).map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.alertTask,
                    {
                      backgroundColor: theme.dark ? "black" : "yellow",
                      borderLeftColor: "#FF3B30",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.alertTaskTitle,
                      {
                        color: theme.dark ? "yellow" : "black",
                        fontWeight: "bold",
                        fontSize: 18,
                      },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.alertTaskMeta}>
                    {task.assignedTo === user?.id ? (
                      <Text style={{ color: "#FF3B30", fontWeight: "500" }}>
                        Assigned to you
                      </Text>
                    ) : task.createdBy === user?.id ? (
                      <Text style={{ color: "#FF3B30", fontWeight: "500" }}>
                        You assigned to {task.assignedToName || "someone"}
                      </Text>
                    ) : (
                      <Text style={{ color: "#FF3B30", fontWeight: "500" }}>
                        Assigned by someone
                      </Text>
                    )}
                    {task.dueDate && (
                      <Text style={{ color: "#FF3B30" }}>
                        Due: {formatDate(task.dueDate, "MMM d, yyyy")} (
                        {getDaysOverdue(task.dueDate)} days overdue)
                      </Text>
                    )}
                  </View>
                  <Button
                    mode="text"
                    onPress={() =>
                      navigation.navigate("Tasks", {
                        screen: "TaskDetail",
                        params: { taskId: task.id },
                      })
                    }
                    textColor="#FF3B30"
                    compact
                  >
                    Handle Now
                  </Button>
                </View>
              ));
            } else {
              return (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No overdue tasks
                </Text>
              );
            }
          })()}
        </Card.Content>
      </Card>
      {/* Tasks Needing Your Review */}
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Tasks Needing Your Review
          </Text>
          {(() => {
            // Filter tasks that are in "doneByAssignee" status and assigned to the current user for review
            const tasksForReview = tasks.filter(
              (task) =>
                task.status === "doneByAssignee" &&
                task.assignment?.reviewerId === user?.id
            );

            if (tasksForReview.length > 0) {
              return tasksForReview.slice(0, 3).map((task) => (
                <View key={task.id} style={styles.reviewTask}>
                  <Text
                    style={[
                      styles.reviewTaskTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.reviewTaskMeta}>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      Assigned to: {task.assignment?.assigneeName || "Someone"}
                    </Text>
                    {task.dueDate && (
                      <Text style={{ color: theme.colors.textSecondary }}>
                        Due: {formatDate(task.dueDate, "MMM d, yyyy")}
                      </Text>
                    )}
                  </View>
                  <Button
                    mode="text"
                    onPress={() =>
                      navigation.navigate("Tasks", {
                        screen: "TaskDetail",
                        params: { taskId: task.id },
                      })
                    }
                    textColor={theme.colors.primary}
                    compact
                  >
                    Review Task
                  </Button>
                </View>
              ));
            } else {
              return (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No tasks currently needing your review
                </Text>
              );
            }
          })()}
        </Card.Content>
      </Card>

      {/* Tasks in Progress with Approaching Deadlines */}
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Tasks in Progress with Approaching Deadlines
          </Text>
          {(() => {
            // Filter tasks that are in progress and due in the next 3 days
            const approachingTasks = tasks.filter(
              (task) =>
                task.status === "inProgress" &&
                task.dueDate &&
                new Date(task.dueDate) <=
                  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) &&
                new Date(task.dueDate) >= new Date()
            );

            if (approachingTasks.length > 0) {
              return approachingTasks.slice(0, 3).map((task) => (
                <View key={task.id} style={styles.approachingTask}>
                  <Text
                    style={[
                      styles.approachingTaskTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.approachingTaskMeta}>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {task.dueDate
                        ? formatDate(task.dueDate, "MMM d, yyyy")
                        : "No due date"}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {task.assignedToName
                        ? `Assigned to: ${task.assignedToName}`
                        : "Unassigned"}
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    onPress={() =>
                      navigation.navigate("Tasks", {
                        screen: "TaskDetail",
                        params: { taskId: task.id },
                      })
                    }
                    textColor={theme.colors.primary}
                    compact
                  >
                    View Task
                  </Button>
                </View>
              ));
            } else {
              return (
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No tasks in progress with approaching deadlines
                </Text>
              );
            }
          })()}
        </Card.Content>
      </Card>
    </>
  );

  const renderProductivityTab = () => (
    <>
      <View style={styles.timeRangeSelector}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Productivity Trends
        </Text>
        <Menu
          visible={timeRangeMenuVisible}
          onDismiss={() => setTimeRangeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setTimeRangeMenuVisible(true)}
              icon="calendar"
              style={{ borderColor: theme.colors.primary }}
              textColor={theme.colors.primary}
            >
              {timeRange === "week"
                ? "Weekly"
                : timeRange === "month"
                ? "Monthly"
                : "Yearly"}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setTimeRange("week");
              setTimeRangeMenuVisible(false);
            }}
            title="Weekly"
          />
          <Menu.Item
            onPress={() => {
              setTimeRange("month");
              setTimeRangeMenuVisible(false);
            }}
            title="Monthly"
          />
          <Menu.Item
            onPress={() => {
              setTimeRange("year");
              setTimeRangeMenuVisible(false);
            }}
            title="Yearly"
          />
        </Menu>
      </View>

      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Tasks Completed Over Time
          </Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={productivityData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#00C2A8",
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </Card.Content>
      </Card>

      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Comparison with Previous Period
          </Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={comparisonData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#00C2A8",
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#00C2A8" }]}
              />
              <Text style={{ color: theme.colors.text }}>Current Month</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#969696" }]}
              />
              <Text style={{ color: theme.colors.text }}>Previous Month</Text>
            </View>
          </View>
          <View style={styles.comparisonStats}>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonValue, { color: "#00C2A8" }]}>
                +33%
              </Text>
              <Text
                style={[
                  styles.comparisonLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                vs Last Month
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonValue, { color: "#00C2A8" }]}>
                9
              </Text>
              <Text
                style={[
                  styles.comparisonLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Current Week
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text
                style={[
                  styles.comparisonValue,
                  { color: theme.colors.textSecondary },
                ]}
              >
                6
              </Text>
              <Text
                style={[
                  styles.comparisonLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Previous Week
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </>
  );

  const renderHeatMapTab = () => (
    <>
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Activity Heat Map
          </Text>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Task activity over the past 5 weeks
          </Text>
          <View style={[styles.chartContainer, { marginTop: 16 }]}>
            <ContributionGraph
              values={heatMapData}
              endDate={new Date()}
              numDays={35}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                backgroundGradientFrom: theme.dark ? "#1E1E1E" : "#ffffff",
                backgroundGradientTo: theme.dark ? "#1E1E1E" : "#ffffff",
                color: (opacity = 1) => `rgba(0, 194, 168, ${opacity})`,
              }}
              style={styles.chart}
              tooltipDataAttrs={() => ({
                onPress: () => {}, // Empty function to satisfy the type requirement
                // We can't actually show tooltips easily in React Native, so this is just for type safety
              })}
            />
          </View>
        </Card.Content>
      </Card>

      <Card
        style={[
          styles.card,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Productivity Insights
          </Text>

          <View style={styles.insightItem}>
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: "rgba(0, 194, 168, 0.1)" },
              ]}
            >
              <TrendingUp width={24} height={24} stroke="#00C2A8" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                Most Productive Day
              </Text>
              <Text
                style={[
                  styles.insightValue,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Wednesday (8 tasks completed)
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: "rgba(255, 204, 0, 0.1)" },
              ]}
            >
              <Calendar width={24} height={24} stroke="#FFCC00" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                Busiest Day
              </Text>
              <Text
                style={[
                  styles.insightValue,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Monday (12 tasks due)
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <View
              style={[
                styles.insightIcon,
                { backgroundColor: "rgba(255, 59, 48, 0.1)" },
              ]}
            >
              <BarChart2 width={24} height={24} stroke="#FF3B30" />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                Task Completion Rate
              </Text>
              <Text
                style={[
                  styles.insightValue,
                  { color: theme.colors.textSecondary },
                ]}
              >
                75% (this week) vs 60% (last week)
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </>
  );

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "work":
        return "#4285F4"; // Blue
      case "personal":
        return "#EA4335"; // Red
      case "shopping":
        return "#FBBC05"; // Yellow
      case "health":
        return "#34A853"; // Green
      case "finance":
        return "#8E24AA"; // Purple
      default:
        return "#757575"; // Gray
    }
  };

  const getDaysOverdue = (dueDate: number): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = Math.abs(now.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: number, formatStr: string): string => {
    return format(new Date(date), formatStr);
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: "black" }]}>
        <Text style={[styles.title, { color: "white" }]}>Dashboard</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setNotificationsVisible(!notificationsVisible)}
        >
          <Bell width={24} height={24} stroke="white" />
          {unreadCount > 0 && (
            <Badge size={16} style={styles.notificationBadge}>
              {unreadCount}
            </Badge>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Panel */}
      {notificationsVisible && (
        <View
          style={[
            styles.notificationsPanel,
            {
              backgroundColor: theme.dark ? theme.colors.card : "white",
              borderColor: theme.dark ? "#333" : "#eee",
            },
          ]}
        >
          <View style={styles.notificationsHeader}>
            <Text
              style={[styles.notificationsTitle, { color: theme.colors.text }]}
            >
              Notifications
            </Text>
            <Button
              compact
              mode="text"
              onPress={() => {
                setNotifications(
                  notifications.map((n) => ({ ...n, read: true }))
                );
              }}
              textColor={theme.colors.primary}
            >
              Mark all as read
            </Button>
          </View>
          <Divider />
          <ScrollView style={styles.notificationsList}>
            {notifications.length > 0 ? (
              notifications.map(renderNotificationItem)
            ) : (
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary, padding: 16 },
                ]}
              >
                No notifications
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Dashboard Tabs */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.dark ? theme.colors.card : "white" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "overview" && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => {
            setActiveTab("overview");
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
        >
          <PieChartIcon
            width={20}
            height={20}
            stroke={
              activeTab === "overview"
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "overview"
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "productivity" && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => {
            setActiveTab("productivity");
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
        >
          <TrendingUp
            width={20}
            height={20}
            stroke={
              activeTab === "productivity"
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "productivity"
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Trends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "heatmap" && [
              styles.activeTab,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => {
            setActiveTab("heatmap");
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
        >
          <Calendar
            width={20}
            height={20}
            stroke={
              activeTab === "heatmap"
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "heatmap"
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Activity
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTasks}
            colors={[theme.colors.primary]}
          />
        }
      >
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "productivity" && renderProductivityTab()}
        {activeTab === "heatmap" && renderHeatMapTab()}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
  },
  notificationsPanel: {
    position: "absolute",
    top: 110,
    right: 16,
    width: "90%",
    maxHeight: 300,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  notificationsList: {
    maxHeight: 240,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  notificationMessage: {
    fontSize: 13,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 12,
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
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  chart: {
    borderRadius: 8,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
  dueSoonTask: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
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
  timeRangeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  comparisonStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  comparisonItem: {
    alignItems: "center",
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  comparisonLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 13,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
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
  reviewTask: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "rgba(0, 204, 168, 0.1)", // Light green background
  },
  reviewTaskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  reviewTaskMeta: {
    marginBottom: 8,
  },
  approachingTask: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "rgba(255, 204, 0, 0.1)", // Light yellow background
  },
  approachingTaskTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  approachingTaskMeta: {
    marginBottom: 8,
  },
});

export default DashboardScreen;

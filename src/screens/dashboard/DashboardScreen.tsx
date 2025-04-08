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
import { Text, Button, ActivityIndicator, Menu } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchTasks } from "../../store/slices/taskSlice";
import {
  format,
  startOfWeek,
  eachDayOfInterval,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";
import {
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
} from "react-native-feather";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import TaskOverviewCard from "../../components/dashboard/TaskOverviewCard";
import TaskDistributionChartCard from "../../components/dashboard/TaskDistributionChartCard";
import TasksDueSoonCard from "../../components/dashboard/TasksDueSoonCard";
import AssignedTasksNotStartedCard from "../../components/dashboard/AssignedTasksNotStartedCard";
import OverdueTasksCard from "../../components/dashboard/OverdueTasksCard";
import TasksNeedingReviewCard from "../../components/dashboard/TasksNeedingReviewCard";
import ProductivityTrendsCard from "../../components/dashboard/ProductivityTrendsCard";
import ActivityHeatMapCard from "../../components/dashboard/ActivityHeatMapCard";
import ComparisonWithPreviousPeriodCard from "../../components/dashboard/ComparisonWithPreviousPeriodCard";
import ProductivityInsightsCard from "../../components/dashboard/ProductivityInsightsCard";
import DashboardNotifications from "../../components/dashboard/DashboardNotifications";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../api/firebase/config";

const screenWidth = Dimensions.get("window").width - 32;

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

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

  // Remove Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      loadTasks();
      loadNotifications();
    }
  }, [dispatch, user]);

  const loadTasks = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchTasks(user.id));
      setRefreshing(false);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.id, "notifications"),
      where("userId", "==", user.id),
      orderBy("time", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsList: Notification[] = [];
        snapshot.forEach((doc) => {
          notificationsList.push({
            id: doc.id,
            ...doc.data(),
          } as Notification);
        });
        setNotifications(notificationsList);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => unsubscribe();
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

  // Generate productivity data for the past 4 weeks - Replace with real data from the backend
  const generateProductivityData = (timeRange: string) => {
    const dataPoints = [];
    const today = new Date();

    let numberOfIntervals = 4;
    let intervalFn;
    let subIntervalFn;
    let intervalLabelFormat;

    switch (timeRange) {
      case "week":
        intervalFn = startOfWeek;
        subIntervalFn = subWeeks;
        intervalLabelFormat = "MMM d";
        break;
      case "month":
        intervalFn = (date: Date) =>
          new Date(date.getFullYear(), date.getMonth(), 1);
        subIntervalFn = subMonths;
        intervalLabelFormat = "MMM";
        break;
      case "year":
        intervalFn = (date: Date) => new Date(date.getFullYear(), 0, 1);
        subIntervalFn = subYears;
        intervalLabelFormat = "yyyy";
        numberOfIntervals = 4;
        break;
      default:
        intervalFn = startOfWeek;
        subIntervalFn = subWeeks;
        intervalLabelFormat = "MMM d";
    }

    for (let i = numberOfIntervals - 1; i >= 0; i--) {
      const intervalStart = intervalFn(subIntervalFn(today, i));
      const intervalEnd = new Date(intervalStart.getTime());

      if (timeRange === "week") {
        intervalEnd.setDate(intervalEnd.getDate() + 6);
      } else if (timeRange === "month") {
        intervalEnd.setMonth(intervalEnd.getMonth() + 1);
        intervalEnd.setDate(0);
      } else if (timeRange === "year") {
        intervalEnd.setFullYear(intervalEnd.getFullYear() + 1);
        intervalEnd.setDate(0);
      }

      const completedCount = tasks.filter((task) => {
        if (task.status !== "completed" || !task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= intervalStart && completedDate <= intervalEnd;
      }).length;

      dataPoints.push({
        interval: format(intervalStart, intervalLabelFormat),
        count: completedCount,
      });
    }

    return {
      labels: dataPoints.map((w) => w.interval),
      datasets: [
        {
          data: dataPoints.map((w) => w.count),
          color: (opacity = 1) => `rgba(0, 194, 168, ${opacity})`, // Using the requested color
          strokeWidth: 2,
        },
      ],
    };
  };

  // Generate comparison data
  const generateComparisonData = () => {
    const currentWeekData = productivityData.datasets[0].data;
    const previousWeekData = [0, 0, 0, 0]; // Replace with actual data from the previous period

    return {
      labels: ["Week 1", "Week 2", "Week 3", "Current"],
      datasets: [
        {
          data: currentWeekData,
          color: (opacity = 1) => `rgba(0, 194, 168, ${opacity})`, // Current period
          strokeWidth: 2,
        },
        {
          data: previousWeekData,
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
      // Count tasks completed on this day
      const count = tasks.filter((task) => {
        if (task.status !== "completed" || !task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return (
          format(completedDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        );
      }).length;

      return {
        date: format(date, "yyyy-MM-dd"),
        count: count,
      };
    });
  };

  const productivityData = generateProductivityData(timeRange);
  const comparisonData = generateComparisonData();
  const heatMapData = generateHeatMapData();

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

  // Filter tasks due soon (within the next 3 days)
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

  const renderOverviewTab = () => (
    <>
      <TaskOverviewCard
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        inProgressTasks={inProgressTasks}
        todoTasks={todoTasks}
        completionRate={completionRate}
      />

      {totalTasks > 0 && <TaskDistributionChartCard chartData={chartData} />}

      <TasksDueSoonCard
        tasksDueSoon={tasksDueSoon}
        navigation={navigation}
        getCategoryColor={getCategoryColor}
        formatDate={formatDate}
      />

      <AssignedTasksNotStartedCard
        tasks={tasks}
        user={user}
        navigation={navigation}
        formatDate={formatDate}
      />

      <OverdueTasksCard
        tasks={tasks}
        user={user}
        navigation={navigation}
        formatDate={formatDate}
        getDaysOverdue={getDaysOverdue}
      />

      <TasksNeedingReviewCard
        tasks={tasks}
        user={user}
        navigation={navigation}
        formatDate={formatDate}
      />
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

      <ProductivityTrendsCard
        productivityData={productivityData}
        chartConfig={chartConfig}
      />

      {/* Add the comparison with previous period card */}
      <ComparisonWithPreviousPeriodCard
        comparisonData={comparisonData}
        chartConfig={chartConfig}
      />
    </>
  );

  const renderHeatMapTab = () => (
    <>
      <ActivityHeatMapCard
        heatMapData={heatMapData}
        chartConfig={chartConfig}
      />

      {/* Add the productivity insights card */}
      <ProductivityInsightsCard />
    </>
  );

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
      <DashboardHeader
        notifications={notifications}
        notificationsVisible={notificationsVisible}
        setNotificationsVisible={setNotificationsVisible}
      />

      {/* Notifications Panel */}
      {notificationsVisible && (
        <DashboardNotifications
          notifications={notifications}
          setNotifications={setNotifications}
          notificationsVisible={notificationsVisible}
          setNotificationsVisible={setNotificationsVisible}
        />
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

"use client"
import { View, StyleSheet } from "react-native"
import { Text, Card } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import { Calendar, Clock, TrendingUp, Award } from "react-native-feather"

const ProductivityInsightsCard = () => {
  const { theme } = useTheme()

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Productivity Insights</Text>

        <View style={styles.insightItem}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: theme.dark ? "rgba(0, 194, 168, 0.2)" : "rgba(0, 194, 168, 0.1)" },
            ]}
          >
            <Calendar width={20} height={20} stroke={theme.colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Most Productive Day</Text>
            <Text style={[styles.insightValue, { color: theme.colors.textSecondary }]}>Wednesday</Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: theme.dark ? "rgba(0, 194, 168, 0.2)" : "rgba(0, 194, 168, 0.1)" },
            ]}
          >
            <Clock width={20} height={20} stroke={theme.colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Peak Productivity Hours</Text>
            <Text style={[styles.insightValue, { color: theme.colors.textSecondary }]}>10:00 AM - 12:00 PM</Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: theme.dark ? "rgba(0, 194, 168, 0.2)" : "rgba(0, 194, 168, 0.1)" },
            ]}
          >
            <TrendingUp width={20} height={20} stroke={theme.colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Productivity Trend</Text>
            <Text style={[styles.insightValue, { color: theme.colors.textSecondary }]}>
              Increasing (+15% this week)
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: theme.dark ? "rgba(0, 194, 168, 0.2)" : "rgba(0, 194, 168, 0.1)" },
            ]}
          >
            <Award width={20} height={20} stroke={theme.colors.primary} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>Most Productive Category</Text>
            <Text style={[styles.insightValue, { color: theme.colors.textSecondary }]}>Work Tasks</Text>
          </View>
        </View>
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
})

export default ProductivityInsightsCard

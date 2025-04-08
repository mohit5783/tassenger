"use client";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, Card } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../theme/ThemeProvider";

interface ComparisonWithPreviousPeriodCardProps {
  comparisonData: any;
  chartConfig: any;
}

const ComparisonWithPreviousPeriodCard = ({
  comparisonData,
  chartConfig,
}: ComparisonWithPreviousPeriodCardProps) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width - 32;

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.dark ? theme.colors.card : "white" },
      ]}
    >
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Comparison with Previous Period
        </Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              ...comparisonData,
              legend: ["Current", "Previous"],
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.comparisonStats}>
          <View style={styles.comparisonItem}>
            <Text
              style={[styles.comparisonValue, { color: theme.colors.primary }]}
            >
              +15%
            </Text>
            <Text
              style={[
                styles.comparisonLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Tasks Completed
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text
              style={[styles.comparisonValue, { color: theme.colors.primary }]}
            >
              -8%
            </Text>
            <Text
              style={[
                styles.comparisonLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Time to Complete
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text
              style={[styles.comparisonValue, { color: theme.colors.primary }]}
            >
              +5%
            </Text>
            <Text
              style={[
                styles.comparisonLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Productivity
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

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
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  chart: {
    borderRadius: 8,
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
});

export default ComparisonWithPreviousPeriodCard;

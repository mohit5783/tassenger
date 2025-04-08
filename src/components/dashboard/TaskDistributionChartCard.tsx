"use client"
import { View, StyleSheet, Dimensions } from "react-native"
import { Text, Card } from "react-native-paper"
import { PieChart } from "react-native-chart-kit"
import { useTheme } from "../../theme/ThemeProvider"

interface TaskDistributionChartCardProps {
  chartData: any[]
}

const TaskDistributionChartCard = ({ chartData }: TaskDistributionChartCardProps) => {
  const { theme } = useTheme()
  const screenWidth = Dimensions.get("window").width - 32

  const chartConfig = {
    backgroundGradientFrom: theme.dark ? "#1E1E1E" : "#ffffff",
    backgroundGradientTo: theme.dark ? "#1E1E1E" : "#ffffff",
    color: (opacity = 1) => `rgba(${theme.dark ? "255, 255, 255" : "0, 0, 0"}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Task Distribution</Text>
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
            style={styles.chart}
          />
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
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  chart: {
    borderRadius: 8,
  },
})

export default TaskDistributionChartCard

"use client"
import { View, StyleSheet, Dimensions } from "react-native"
import { Text, Card } from "react-native-paper"
import { LineChart } from "react-native-chart-kit"
import { useTheme } from "../../theme/ThemeProvider"

interface ProductivityTrendsCardProps {
  productivityData: any
  chartConfig: any
}

const ProductivityTrendsCard = ({ productivityData, chartConfig }: ProductivityTrendsCardProps) => {
  const { theme } = useTheme()
  const screenWidth = Dimensions.get("window").width - 32

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Completed Tasks Over Time</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={productivityData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
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

export default ProductivityTrendsCard

"use client"
import { View, StyleSheet, Dimensions } from "react-native"
import { Text, Card } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"

interface ActivityHeatMapCardProps {
  heatMapData: any[]
  chartConfig: any
}

const ActivityHeatMapCard = ({ heatMapData, chartConfig }: ActivityHeatMapCardProps) => {
  const { theme } = useTheme()
  const screenWidth = Dimensions.get("window").width - 32

  // Group data by week
  const weeks: { [key: string]: any[] } = {}
  heatMapData.forEach((day) => {
    const date = new Date(day.date)
    const weekNum = Math.floor(date.getDate() / 7)
    if (!weeks[weekNum]) {
      weeks[weekNum] = []
    }
    weeks[weekNum].push(day)
  })

  return (
    <Card style={[styles.card, { backgroundColor: theme.dark ? theme.colors.card : "white" }]}>
      <Card.Content>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Activity Heatmap</Text>
        <View style={styles.heatmapContainer}>
          {/* Simplified heatmap visualization */}
          <View style={styles.heatmapGrid}>
            {Object.values(weeks).map((week, weekIndex) => (
              <View key={weekIndex} style={styles.heatmapWeek}>
                {week.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.heatmapDay,
                      {
                        backgroundColor:
                          day.count === 0
                            ? theme.dark
                              ? "#333"
                              : "#eee"
                            : `rgba(0, 194, 168, ${0.2 + day.count * 0.15})`,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.dark ? "#333" : "#eee" }]} />
            <Text style={{ color: theme.colors.textSecondary }}>No activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "rgba(0, 194, 168, 0.35)" }]} />
            <Text style={{ color: theme.colors.textSecondary }}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "rgba(0, 194, 168, 0.65)" }]} />
            <Text style={{ color: theme.colors.textSecondary }}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "rgba(0, 194, 168, 0.95)" }]} />
            <Text style={{ color: theme.colors.textSecondary }}>High</Text>
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
  heatmapContainer: {
    marginVertical: 16,
  },
  heatmapGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heatmapWeek: {
    flexDirection: "column",
    gap: 4,
  },
  heatmapDay: {
    width: 20,
    height: 20,
    borderRadius: 4,
    margin: 2,
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
})

export default ActivityHeatMapCard

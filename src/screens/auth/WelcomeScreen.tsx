"use client"
import { View, StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"

const WelcomeScreen = ({ navigation }: any) => {
  const { theme } = useTheme()

  const handleGetStarted = () => {
    navigation.navigate("PhoneAuth")
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Welcome to Tassenger</Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Your task management app</Text>

        <View style={styles.featuresContainer}>
          <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Key Features:</Text>

          <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
            • Create and assign tasks with due dates
          </Text>

          <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
            • Organize tasks by projects or groups
          </Text>

          <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
            • Track task status and progress
          </Text>

          <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
            • Receive notifications for task updates
          </Text>
        </View>

        <Button
          mode="contained"
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleGetStarted}
        >
          Get Started
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
  },
  featuresContainer: {
    alignSelf: "stretch",
    marginBottom: 40,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 24,
    borderRadius: 8,
  },
})

export default WelcomeScreen


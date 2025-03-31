"use client"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Divider, List, Appbar } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import Constants from "expo-constants"

const AboutScreen = ({ navigation }: any) => {
  const { theme } = useTheme()
  const appVersion = Constants.expoConfig?.version || "1.0.0"

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color={theme.colors.onPrimary} onPress={() => navigation.goBack()} />
        <Appbar.Content title="About" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.logoText, { color: theme.colors.onPrimary }]}>T</Text>
            </View>
          </View>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>Tassenger</Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Version {appVersion}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>About Tassenger</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Tassenger is a task management application designed to help you organize and track your tasks efficiently.
            With features like task creation, assignment, and status tracking, Tassenger makes it easy to stay on top of
            your work.
          </Text>
        </View>

        <View style={styles.linksSection}>
          <List.Section>
            <List.Item
              title="Privacy Policy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Open Source Libraries"
              left={(props) => <List.Icon {...props} icon="code-tags" />}
              onPress={() => {}}
            />
          </List.Section>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: theme.colors.textSecondary }]}>
            © 2025 Tassenger. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "white",
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
  },
  infoSection: {
    padding: 16,
    backgroundColor: "white",
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  linksSection: {
    backgroundColor: "white",
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    alignItems: "center",
    margin: 8,
  },
  copyright: {
    fontSize: 14,
  },
})

export default AboutScreen


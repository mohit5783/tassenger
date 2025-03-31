"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, View } from "react-native"
import { List, Switch, Divider, Appbar } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"

const SettingsScreen = ({ navigation }: any) => {
  const { theme, toggleTheme } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color={theme.colors.onPrimary} onPress={() => navigation.goBack()} />
        <Appbar.Content title="Settings" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <List.Section>
            <List.Subheader>Appearance</List.Subheader>
            <List.Item
              title="Dark Mode"
              right={() => <Switch value={theme.dark} onValueChange={toggleTheme} color={theme.colors.primary} />}
            />
            <Divider />

            <List.Subheader>Notifications</List.Subheader>
            <List.Item
              title="Push Notifications"
              description="Receive notifications for task updates"
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  color={theme.colors.primary}
                />
              )}
            />
            <List.Item
              title="Sound"
              description="Play sound for notifications"
              right={() => (
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  color={theme.colors.primary}
                  disabled={!notificationsEnabled}
                />
              )}
            />
            <Divider />

            <List.Subheader>Data & Storage</List.Subheader>
            <List.Item title="Clear Cache" description="Free up space by clearing cached data" onPress={() => {}} />
            <Divider />

            <List.Subheader>Privacy</List.Subheader>
            <List.Item title="Privacy Policy" onPress={() => {}} />
            <List.Item title="Terms of Service" onPress={() => {}} />
          </List.Section>
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
    backgroundColor: "white",
    margin: 8,
    borderRadius: 8,
  },
})

export default SettingsScreen


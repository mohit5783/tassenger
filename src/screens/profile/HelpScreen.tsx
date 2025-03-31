"use client"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, List, Button, Appbar } from "react-native-paper"
import { useTheme } from "../../theme/ThemeProvider"
import { Mail, MessageCircle } from "react-native-feather"

const HelpScreen = ({ navigation }: any) => {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color={theme.colors.onPrimary} onPress={() => navigation.goBack()} />
        <Appbar.Content title="Help & Support" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>How can we help?</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Find answers to common questions or contact our support team
          </Text>
        </View>

        <View style={styles.faqSection}>
          <List.Section>
            <List.Subheader>Frequently Asked Questions</List.Subheader>
            <List.Accordion
              title="How do I create a task?"
              left={(props) => <List.Icon {...props} icon="plus-circle-outline" />}
            >
              <List.Item
                description="To create a task, tap on the + button at the bottom right of the Tasks screen. Fill in the task details and tap 'Create Task'."
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <List.Accordion title="How do I edit a task?" left={(props) => <List.Icon {...props} icon="pencil" />}>
              <List.Item
                description="To edit a task, tap on the task in the task list to view its details, then tap on the edit button."
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <List.Accordion title="How do I delete a task?" left={(props) => <List.Icon {...props} icon="delete" />}>
              <List.Item
                description="To delete a task, swipe left on the task in the task list, or tap on the task to view its details and then tap on the delete button."
                descriptionNumberOfLines={4}
              />
            </List.Accordion>
          </List.Section>
        </View>

        <View style={styles.contactSection}>
          <Text style={[styles.contactTitle, { color: theme.colors.primary }]}>Contact Support</Text>

          <Button
            mode="outlined"
            icon={({ size, color }) => <Mail width={size} height={size} stroke={color} />}
            style={styles.contactButton}
            onPress={() => {}}
          >
            Email Support
          </Button>

          <Button
            mode="outlined"
            icon={({ size, color }) => <MessageCircle width={size} height={size} stroke={color} />}
            style={styles.contactButton}
            onPress={() => {}}
          >
            Live Chat
          </Button>
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
    padding: 16,
    backgroundColor: "white",
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  faqSection: {
    backgroundColor: "white",
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
  },
  contactSection: {
    padding: 16,
    backgroundColor: "white",
    margin: 8,
    borderRadius: 8,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  contactButton: {
    marginBottom: 12,
  },
})

export default HelpScreen


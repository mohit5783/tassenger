"use client";
import { View, StyleSheet, ScrollView, Linking } from "react-native";
import { Text, List, Button, Appbar, Divider, Card } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { Mail, MessageCircle, Phone, HelpCircle } from "react-native-feather";

const HelpScreen = ({ navigation }: any) => {
  const { theme } = useTheme();

  const sendEmail = () => {
    Linking.openURL(
      "mailto:support@tassenger.app?subject=Support%20Request"
    ).catch((err) => console.error("Could not open email app", err));
  };

  const startChat = () => {
    // In a real app, this would open a chat interface
    alert("Live chat would start here");
  };

  const callSupport = () => {
    Linking.openURL("tel:+18005551234").catch((err) =>
      console.error("Could not open phone app", err)
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Help & Support" color="white"
 />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card
          style={[styles.headerCard, { backgroundColor: theme.colors.card }]}
        >
          <Card.Content>
            <View style={styles.headerContent}>
              <HelpCircle
                width={40}
                height={40}
                stroke={theme.colors.primary}
              />
              <View style={styles.headerTextContainer}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>
                  How can we help?
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Find answers to common questions or contact our support team
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View
          style={[styles.faqSection, { backgroundColor: theme.colors.card }]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Frequently Asked Questions
            </List.Subheader>
            <List.Accordion
              title="How do I create a task?"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="plus-circle-outline"
                  color={theme.colors.primary}
                />
              )}
            >
              <List.Item
                title=""
                description="To create a task, tap on the + button at the bottom right of the Tasks screen. Fill in the task details and tap 'Create Task'."
                descriptionStyle={{ color: theme.colors.text }}
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <Divider style={{ backgroundColor: theme.colors.border }} />

            <List.Accordion
              title="How do I edit a task?"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="pencil"
                  color={theme.colors.primary}
                />
              )}
            >
              <List.Item
                title=""
                description="To edit a task, tap on the task in the task list to view its details, then tap on the edit button."
                descriptionStyle={{ color: theme.colors.text }}
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <Divider style={{ backgroundColor: theme.colors.border }} />

            <List.Accordion
              title="How do I delete a task?"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="delete"
                  color={theme.colors.primary}
                />
              )}
            >
              <List.Item
                title=""
                description="To delete a task, swipe left on the task in the task list, or tap on the task to view its details and then tap on the delete button."
                descriptionStyle={{ color: theme.colors.text }}
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <Divider style={{ backgroundColor: theme.colors.border }} />

            <List.Accordion
              title="How do I share a task?"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="share"
                  color={theme.colors.primary}
                />
              )}
            >
              <List.Item
                title=""
                description="To share a task, open the task details and tap on the share icon in the top right. You can then select a contact or conversation to share the task with."
                descriptionStyle={{ color: theme.colors.text }}
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <Divider style={{ backgroundColor: theme.colors.border }} />

            <List.Accordion
              title="How do I set up recurring tasks?"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="repeat"
                  color={theme.colors.primary}
                />
              )}
            >
              <List.Item
                title=""
                description="When creating a task, set a due date and then enable the recurring option. You can choose the frequency (daily, weekly, monthly) and when the recurrence should end."
                descriptionStyle={{ color: theme.colors.text }}
                descriptionNumberOfLines={4}
              />
            </List.Accordion>
          </List.Section>
        </View>

        <View
          style={[
            styles.contactSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.contactTitle, { color: theme.colors.primary }]}>
            Contact Support
          </Text>
          <Text
            style={[styles.contactDescription, { color: theme.colors.text }]}
          >
            Our support team is available Monday through Friday, 9am to 5pm EST.
          </Text>

          <View style={styles.contactButtonsContainer}>
            <Button
              mode="outlined"
              icon={({ size, color }) => (
                <Mail width={size} height={size} stroke={color} />
              )}
              style={styles.contactButton}
              textColor={theme.colors.primary}
              onPress={sendEmail}
            >
              Email Support
            </Button>

            <Button
              mode="outlined"
              icon={({ size, color }) => (
                <MessageCircle width={size} height={size} stroke={color} />
              )}
              style={styles.contactButton}
              textColor={theme.colors.primary}
              onPress={startChat}
            >
              Live Chat
            </Button>

            <Button
              mode="outlined"
              icon={({ size, color }) => (
                <Phone width={size} height={size} stroke={color} />
              )}
              style={styles.contactButton}
              textColor={theme.colors.primary}
              onPress={callSupport}
            >
              Call Support
            </Button>
          </View>
        </View>

        <View
          style={[
            styles.resourcesSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.contactTitle, { color: theme.colors.primary }]}>
            Additional Resources
          </Text>

          <Button
            mode="text"
            icon="book-open-variant"
            textColor={theme.colors.primary}
            style={styles.resourceButton}
            onPress={() => {}}
          >
            User Guide
          </Button>

          <Button
            mode="text"
            icon="video"
            textColor={theme.colors.primary}
            style={styles.resourceButton}
            onPress={() => {}}
          >
            Video Tutorials
          </Button>

          <Button
            mode="text"
            icon="frequently-asked-questions"
            textColor={theme.colors.primary}
            style={styles.resourceButton}
            onPress={() => {}}
          >
            Full FAQ
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerCard: {
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  faqSection: {
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 1,
  },
  contactSection: {
    padding: 16,
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  contactButtonsContainer: {
    gap: 12,
  },
  contactButton: {
    marginBottom: 0,
  },
  resourcesSection: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
    elevation: 1,
  },
  resourceButton: {
    alignSelf: "flex-start",
    marginVertical: 4,
  },
});

export default HelpScreen;

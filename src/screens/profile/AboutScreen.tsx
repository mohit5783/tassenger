"use client";
import { View, StyleSheet, ScrollView, Linking } from "react-native";
import { Text, Divider, List, Appbar, Button } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import Constants from "expo-constants";

const AboutScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't open URL:", err)
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="About" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.logoContainer}>
            <View
              style={[styles.logo, { backgroundColor: theme.colors.primary }]}
            >
              <Text
                style={[styles.logoText, { color: theme.colors.onPrimary }]}
              >
                T
              </Text>
            </View>
          </View>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            Tassenger
          </Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
            Version {appVersion}
          </Text>
        </View>

        <View
          style={[styles.infoSection, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            About Tassenger
          </Text>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            Tassenger is a task management application designed to help you
            organize and track your tasks efficiently. With features like task
            creation, assignment, and status tracking, Tassenger makes it easy
            to stay on top of your work.
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.text, marginTop: 12 },
            ]}
          >
            Our mission is to simplify task management and team collaboration,
            helping you achieve more with less stress.
          </Text>
        </View>

        <View
          style={[styles.linksSection, { backgroundColor: theme.colors.card }]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.primary }}>
              Legal & Resources
            </List.Subheader>
            <List.Item
              title="Privacy Policy"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="shield-account"
                  color={theme.colors.primary}
                />
              )}
              onPress={() =>
                openLink("https://www.virtualifyme.com/privacy-notice")
              }
            />
            <Divider style={{ backgroundColor: theme.colors.border }} />
            <List.Item
              title="Terms of Service"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="file-document"
                  color={theme.colors.primary}
                />
              )}
              onPress={() =>
                openLink("https://www.virtualifyme.com/terms-of-use")
              }
            />
            <Divider style={{ backgroundColor: theme.colors.border }} />
            <List.Item
              title="Open Source Libraries"
              titleStyle={{ color: theme.colors.text }}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="code-tags"
                  color={theme.colors.primary}
                />
              )}
              onPress={() =>
                openLink("https://github.com/virtualifyme/tassenger-opensource")
              }
            />
          </List.Section>
        </View>

        <View
          style={[styles.teamSection, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Our Team
          </Text>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            Tassenger is developed by a dedicated team of developers passionate
            about creating tools that make your life easier.
          </Text>
          <Button
            mode="outlined"
            icon="email"
            style={styles.teamButton}
            textColor={theme.colors.primary}
            onPress={() => openLink("mailto:virtualifyme2023@gmail.com")}
          >
            Contact the Team
          </Button>
        </View>

        <View style={styles.footer}>
          <Text
            style={[styles.copyright, { color: theme.colors.textSecondary }]}
          >
            © 2025 Virtualify Software Consultancy Pvt Ltd. All rights reserved.
          </Text>
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
  section: {
    alignItems: "center",
    padding: 24,
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 1,
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
    elevation: 4,
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
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 1,
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
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 1,
  },
  teamSection: {
    padding: 16,
    margin: 8,
    marginBottom: 0,
    borderRadius: 8,
    elevation: 1,
  },
  teamButton: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  footer: {
    padding: 16,
    alignItems: "center",
    margin: 8,
  },
  copyright: {
    fontSize: 14,
  },
});

export default AboutScreen;

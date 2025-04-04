"use client";

import { View, StyleSheet } from "react-native";
import { Text, Appbar, Avatar } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";

const PlaceholderChatScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { contact } = route.params;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title={contact.name} color="white" />
      </Appbar.Header>

      <View style={styles.content}>
        <Avatar.Text
          size={80}
          label={contact.name.substring(0, 1).toUpperCase()}
          style={{ backgroundColor: "#CCCCCC" }}
        />

        <Text style={styles.message}>
          You'll be connected with {contact.name} on Tassenger once they join.
        </Text>

        <Text style={styles.subMessage}>
          We've sent them an invitation to download the app.
        </Text>
      </View>
    </View>
  );
};

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
  message: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#8E8E93",
  },
});

export default PlaceholderChatScreen;

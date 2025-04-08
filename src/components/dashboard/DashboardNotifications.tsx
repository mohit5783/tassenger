"use client";

import type React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Button, Badge, Divider } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
// Import the Notification interface from DashboardScreen
import type { Notification } from "../../screens/dashboard/DashboardScreen";

interface DashboardNotificationsProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  notificationsVisible: boolean;
  setNotificationsVisible: (visible: boolean) => void;
}

const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({
  notifications,
  setNotifications,
  notificationsVisible,
  setNotificationsVisible,
}) => {
  const { theme } = useTheme();

  const renderNotificationItem = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        { borderBottomColor: theme.dark ? "#333" : "#eee" },
      ]}
      onPress={() => {
        // Mark as read
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[styles.notificationTitle, { color: theme.colors.text }]}
          >
            {notification.title}
          </Text>
          {!notification.read && (
            <Badge size={8} style={{ backgroundColor: theme.colors.primary }} />
          )}
        </View>
        <Text
          style={[
            styles.notificationMessage,
            { color: theme.colors.textSecondary },
          ]}
        >
          {notification.message}
        </Text>
        <Text
          style={[
            styles.notificationTime,
            { color: theme.colors.textSecondary },
          ]}
        >
          {notification.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.notificationsPanel,
        {
          backgroundColor: theme.dark ? theme.colors.card : "white",
          borderColor: theme.dark ? "#333" : "#eee",
        },
      ]}
    >
      <View style={styles.notificationsHeader}>
        <Text style={[styles.notificationsTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>
        <Button
          compact
          mode="text"
          onPress={() => {
            setNotifications((prevNotifications) =>
              prevNotifications.map((n) => ({ ...n, read: true }))
            );
          }}
          textColor={theme.colors.primary}
        >
          Mark all as read
        </Button>
      </View>
      <Divider />
      <ScrollView style={styles.notificationsList}>
        {notifications.length > 0 ? (
          notifications.map(renderNotificationItem)
        ) : (
          <Text
            style={[
              styles.emptyText,
              { color: theme.colors.textSecondary, padding: 16 },
            ]}
          >
            No notifications
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationsPanel: {
    position: "absolute",
    top: 110,
    right: 16,
    width: "90%",
    maxHeight: 300,
    zIndex: 1000,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  notificationsList: {
    maxHeight: 240,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  notificationMessage: {
    fontSize: 13,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
  },
});

export default DashboardNotifications;

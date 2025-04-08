"use client"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Text, Badge } from "react-native-paper"
import { Bell } from "react-native-feather"
import { useTheme } from "../../theme/ThemeProvider"

interface DashboardHeaderProps {
  notificationsVisible: boolean
  setNotificationsVisible: (visible: boolean) => void
  notifications: any[]
}

const DashboardHeader = ({ notificationsVisible, setNotificationsVisible, notifications }: DashboardHeaderProps) => {
  const { theme } = useTheme()
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <View style={[styles.header, { backgroundColor: "black" }]}>
      <Text style={[styles.title, { color: "white" }]}>Dashboard</Text>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => setNotificationsVisible(!notificationsVisible)}
      >
        <Bell width={24} height={24} stroke="white" />
        {unreadCount > 0 && (
          <Badge size={16} style={styles.notificationBadge}>
            {unreadCount}
          </Badge>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
  },
})

export default DashboardHeader

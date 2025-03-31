"use client";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Text, List, Divider, Avatar } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { signOut } from "../../store/slices/authSlice";
import { Settings, HelpCircle, Info, LogOut, Edit } from "react-native-feather";

const ProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const handleSignOut = async () => {
    try {
      await dispatch(signOut());
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
          Profile
        </Text>
      </View>

      <View
        style={[
          styles.profileSection,
          { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
        ]}
      >
        <View style={styles.profileImageContainer}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={
                user?.displayName ? user.displayName[0].toUpperCase() : "U"
              }
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        </View>

        <Text
          style={[
            styles.displayName,
            { color: theme.dark ? "#FFFFFF" : theme.colors.text },
          ]}
        >
          {user?.displayName || "User"}
        </Text>
        <Text
          style={[
            styles.phoneNumber,
            { color: theme.dark ? "#CCCCCC" : theme.colors.textSecondary },
          ]}
        >
          {user?.phoneNumber}
        </Text>
      </View>

      <ScrollView>
        <List.Section>
          <List.Item
            title="Edit Profile"
            left={(props) => (
              <List.Icon {...props} icon={(props) => <Edit {...props} />} />
            )}
            onPress={() => navigation.navigate("EditProfile")}
          />
          <Divider />

          <List.Item
            title="Settings"
            left={(props) => (
              <List.Icon {...props} icon={(props) => <Settings {...props} />} />
            )}
            onPress={() => navigation.navigate("Settings")}
          />
          <Divider />

          <List.Item
            title="Help & Support"
            left={(props) => (
              <List.Icon
                {...props}
                icon={(props) => <HelpCircle {...props} />}
              />
            )}
            onPress={() => navigation.navigate("Help")}
          />
          <Divider />

          <List.Item
            title="About"
            left={(props) => (
              <List.Icon {...props} icon={(props) => <Info {...props} />} />
            )}
            onPress={() => navigation.navigate("About")}
          />
          <Divider />

          <List.Item
            title="Sign Out"
            titleStyle={{ color: theme.colors.error }}
            left={(props) => (
              <List.Icon
                {...props}
                icon={(props) => (
                  <LogOut {...props} color={theme.colors.error} />
                )}
              />
            )}
            onPress={handleSignOut}
            disabled={isLoading}
          />
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default ProfileScreen;

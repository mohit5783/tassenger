"use client";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Text, List, Divider, Avatar, Card, Button } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { signOut } from "../../store/slices/authSlice";
import {
  Settings,
  HelpCircle,
  Info,
  LogOut,
  Edit,
  Briefcase,
  Mail,
  Phone,
} from "react-native-feather";

const ProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  // Get the appropriate default avatar based on sex
  const getDefaultAvatar = () => {
    if (!user?.sex || user.sex === "prefer_not_to_say") {
      return require("../../../assets/default-avatar.png");
    } else if (user.sex === "male") {
      return require("../../../assets/default-male-avatar.png");
    } else if (user.sex === "female") {
      return require("../../../assets/default-female-avatar.png");
    }
    return require("../../../assets/default-avatar.png");
  };

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

      <ScrollView>
        <Card
          style={[
            styles.profileCard,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.profileImage}
                />
              ) : (
                <Avatar.Image size={80} source={getDefaultAvatar()} />
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.displayName,
                  { color: theme.dark ? "#FFFFFF" : theme.colors.text },
                ]}
              >
                {user?.salutation ? `${user.salutation} ` : ""}
                {user?.displayName || "User"}
              </Text>

              {user?.occupation && (
                <View style={styles.infoRow}>
                  <Briefcase
                    width={16}
                    height={16}
                    stroke={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {user.occupation}
                  </Text>
                </View>
              )}

              {user?.email && (
                <View style={styles.infoRow}>
                  <Mail
                    width={16}
                    height={16}
                    stroke={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {user.email}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Phone
                  width={16}
                  height={16}
                  stroke={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {user?.phoneNumber || "No phone number"}
                </Text>
              </View>
            </View>
          </View>

          {user?.bio && (
            <View style={styles.bioSection}>
              <Text style={[styles.bioTitle, { color: theme.colors.primary }]}>
                About Me
              </Text>
              <Text style={[styles.bioText, { color: theme.colors.text }]}>
                {user.bio}
              </Text>
            </View>
          )}

          <Button
            mode="outlined"
            icon={({ size, color }) => (
              <Edit width={size} height={size} stroke={color} />
            )}
            onPress={() => navigation.navigate("EditProfile")}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </Card>

        <List.Section
          style={[
            styles.menuSection,
            { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
          ]}
        >
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
  profileCard: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: {
    marginTop: 16,
  },
  menuSection: {
    margin: 8,
    borderRadius: 8,
  },
});

export default ProfileScreen;

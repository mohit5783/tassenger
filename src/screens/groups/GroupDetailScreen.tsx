"use client";

import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Appbar,
  ActivityIndicator,
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Avatar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGroup, deleteGroup } from "../../store/slices/groupSlice";
import { filterTasksByGroup } from "../../store/slices/taskSlice";
import {
  Users,
  List as ListIcon,
  MessageCircle,
  MoreVertical,
} from "react-native-feather";

interface GroupDetailScreenProps {
  navigation: any;
  route: any;
}

const GroupDetailScreen = ({ navigation, route }: GroupDetailScreenProps) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentGroup, isLoading } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
      dispatch(filterTasksByGroup(groupId));
    }
  }, [dispatch, groupId]);

  // Check if current user is an admin
  const isAdmin = currentGroup?.members.some(
    (member) => member.userId === user?.id && member.role === "admin"
  );

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteGroup(groupId)).unwrap();
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete group:", error);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !currentGroup) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content
          title={currentGroup.name}
          color={theme.colors.onPrimary}
        />
        {isAdmin && (
          <Appbar.Action
            icon={({ size, color }) => (
              <MoreVertical width={size} height={size} stroke={color} />
            )}
            color={theme.colors.onPrimary}
            onPress={() => setMenuVisible(!menuVisible)}
          />
        )}
        {menuVisible && (
          <View
            style={[styles.menu, { backgroundColor: theme.colors.background }]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                // Navigate to edit group screen - to be implemented
              }}
            >
              <Text>Edit Group</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleDeleteGroup();
              }}
            >
              <Text style={{ color: theme.colors.error }}>Delete Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </Appbar.Header>

      <ScrollView>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title>{currentGroup.name}</Title>
            {currentGroup.description && (
              <Paragraph>{currentGroup.description}</Paragraph>
            )}
            <View style={styles.stats}>
              <Text style={styles.stat}>
                {currentGroup.members.length}{" "}
                {currentGroup.members.length === 1 ? "member" : "members"}
              </Text>
              {/* Can add more stats here if needed */}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionSection}>
          <Button
            mode="contained"
            icon={({ size, color }) => (
              <ListIcon width={size} height={size} stroke={color} />
            )}
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("GroupTasks", { groupId })}
          >
            Tasks
          </Button>

          <Button
            mode="contained"
            icon={({ size, color }) => (
              <Users width={size} height={size} stroke={color} />
            )}
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("GroupMembers", { groupId })}
          >
            Members
          </Button>

          {currentGroup.hasChat && currentGroup.conversationId && (
            <Button
              mode="contained"
              icon={({ size, color }) => (
                <MessageCircle width={size} height={size} stroke={color} />
              )}
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() =>
                navigation.navigate("Chat", {
                  screen: "ConversationDetail",
                  params: { conversationId: currentGroup.conversationId },
                })
              }
            >
              Chat
            </Button>
          )}
        </View>

        <Card style={styles.membersCard}>
          <Card.Title
            title="Members"
            subtitle={`${currentGroup.members.length} members`}
          />
          <Card.Content>
            <List.Section>
              {currentGroup.members.slice(0, 3).map((member) => (
                <List.Item
                  key={member.userId}
                  title={member.userName || member.userId}
                  description={member.role === "admin" ? "Admin" : "Member"}
                  left={() => (
                    <Avatar.Text
                      size={40}
                      label={(member.userName?.[0] || "U").toUpperCase()}
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  )}
                />
              ))}
              {currentGroup.members.length > 3 && (
                <Button
                  mode="text"
                  onPress={() =>
                    navigation.navigate("GroupMembers", { groupId })
                  }
                >
                  See all members
                </Button>
              )}
            </List.Section>
          </Card.Content>
        </Card>

        {isAdmin && (
          <Card style={styles.adminCard}>
            <Card.Title title="Admin Actions" />
            <Card.Content>
              <Button
                mode="outlined"
                icon="plus"
                style={styles.adminButton}
                onPress={() =>
                  navigation.navigate("CreateGroupTask", { groupId })
                }
              >
                Create Task
              </Button>

              <Button
                mode="outlined"
                icon="account-plus"
                style={styles.adminButton}
                onPress={() => navigation.navigate("GroupMembers", { groupId })}
              >
                Manage Members
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    margin: 16,
  },
  stats: {
    marginTop: 8,
    flexDirection: "row",
  },
  stat: {
    fontSize: 14,
    color: "#8E8E93",
  },
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  membersCard: {
    margin: 16,
    marginTop: 0,
  },
  adminCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 24,
  },
  adminButton: {
    marginBottom: 8,
  },
  menu: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 150,
    borderRadius: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default GroupDetailScreen;

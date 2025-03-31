"use client";

import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Text,
  FAB,
  Avatar,
  ActivityIndicator,
  Badge,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchConversations } from "../../store/slices/chatSlice";
import { format, isToday, isYesterday } from "date-fns";

const ConversationsListScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { conversations, isLoading } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [dispatch, user]);

  const loadConversations = async () => {
    if (user) {
      setRefreshing(true);
      await dispatch(fetchConversations(user.id));
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getConversationTitle = (conversation: any) => {
    if (!user) return "Chat";

    if (conversation.title) return conversation.title;

    if (!conversation.participantNames) return "Chat";

    // For direct messages, show the other person's name
    if (!conversation.isGroup) {
      const otherParticipantId = conversation.participants.find(
        (id: string) => id !== user.id
      );
      return otherParticipantId &&
        conversation.participantNames[otherParticipantId]
        ? conversation.participantNames[otherParticipantId]
        : "Chat";
    }

    // For group chats without a title, list participants
    return (
      Object.values(conversation.participantNames)
        .filter((_: any, index: number) => index < 3)
        .join(", ") + (conversation.participants.length > 3 ? "..." : "")
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (timestamp: number) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const renderConversationItem = ({ item }: { item: any }) => {
    const title = getConversationTitle(item);
    const lastMessage = item.lastMessage || {};
    const unreadCount = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: theme.colors.card },
        ]}
        onPress={() =>
          navigation.navigate("ConversationDetail", { conversationId: item.id })
        }
      >
        <Avatar.Text
          size={50}
          label={getInitials(title)}
          style={{ backgroundColor: theme.colors.primary }}
          color={theme.colors.onPrimary}
        />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.messageTime,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatMessageTime(lastMessage.timestamp)}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text
              numberOfLines={1}
              style={[
                styles.messageText,
                {
                  color:
                    unreadCount > 0
                      ? theme.colors.text
                      : theme.colors.textSecondary,
                },
                unreadCount > 0 && styles.unreadMessage,
              ]}
            >
              {lastMessage.text || "No messages yet"}
            </Text>

            {unreadCount > 0 && (
              <Badge
                style={[
                  styles.unreadBadge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                {unreadCount}
              </Badge>
            )}
          </View>
        </View>
        <Divider
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading && conversations.length === 0 && !refreshing) {
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
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
          Chats
        </Text>
      </View>

      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      ) : (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={{ color: theme.colors.textSecondary }}>
            No conversations yet
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Start a new chat by tapping the + button
          </Text>
        </View>
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate("NewConversation")}
      />
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
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  conversationsList: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    position: "relative",
  },
  conversationContent: {
    flex: 1,
    marginLeft: 16,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messageText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
  },
  unreadMessage: {
    fontWeight: "bold",
  },
  unreadBadge: {
    marginLeft: 8,
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 66,
    right: 0,
    height: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
});

export default ConversationsListScreen;

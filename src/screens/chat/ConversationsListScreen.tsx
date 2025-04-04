"use client";

import { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  FAB,
  Avatar,
  ActivityIndicator,
  Badge,
  Divider,
  Button,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchConversations,
  type Conversation,
} from "../../store/slices/chatSlice";
import { format, isToday, isYesterday, isThisYear } from "date-fns";
import ReadReceipt from "../../components/ReadReceipt";

const ConversationsListScreen = ({ navigation }: any) => {
  const { theme, readReceipts } = useTheme();
  const dispatch = useAppDispatch();
  const { conversations, isLoading, error } = useAppSelector(
    (state) => state.chat
  );
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [dispatch, user]);

  const loadConversations = async () => {
    if (user) {
      await dispatch(fetchConversations(user.id));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisYear(date)) {
      return format(date, "MMM d");
    } else {
      return format(date, "MM/dd/yyyy");
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;

    if (!user || !conversation.participantNames) return "Chat";

    // For direct messages, show the other person's name
    if (!conversation.isGroup) {
      const otherParticipantId = conversation.participants.find(
        (id) => id !== user.id
      );
      return otherParticipantId &&
        conversation.participantNames[otherParticipantId]
        ? conversation.participantNames[otherParticipantId]
        : "Chat";
    }

    // For group chats without a title, list participants
    return (
      Object.values(conversation.participantNames)
        .filter((_, index) => index < 3)
        .join(", ") + (conversation.participants.length > 3 ? "..." : "")
    );
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!user || !conversation.unreadCount) return 0;
    return conversation.unreadCount[user.id] || 0;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to check if the last message was sent by the current user and read by others
  const isLastMessageReadByAll = (conversation: Conversation) => {
    if (!readReceipts || !user || !conversation.lastMessage) return false;

    // If the last message was not sent by the current user, we don't show read receipts
    if (conversation.lastMessage.senderId !== user.id) return false;

    // Check if all participants except the sender have read the message
    return conversation.lastMessageReadByAll === true;
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const title = getConversationTitle(item);
    const unreadCount = getUnreadCount(item);
    const lastMessageRead = isLastMessageReadByAll(item);

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: theme.dark ? "#1E1E1E" : "white" },
        ]}
        onPress={() =>
          navigation.navigate("ConversationDetail", { conversationId: item.id })
        }
      >
        <View style={styles.conversationContainer}>
          <Avatar.Text
            size={50}
            label={getInitials(title)}
            style={{ backgroundColor: theme.colors.primary }}
          />

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text
                style={[
                  styles.conversationTitle,
                  unreadCount > 0 && styles.unreadTitle,
                  { color: theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {item.lastMessage && (
                <Text
                  style={[
                    styles.timeText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {formatTime(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>

            <View style={styles.messagePreview}>
              <View style={styles.messageTextContainer}>
                {item.lastMessage ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.previewText,
                      unreadCount > 0 && styles.unreadText,
                      {
                        color:
                          unreadCount > 0
                            ? theme.colors.text
                            : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {item.lastMessage.text}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.previewText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No messages yet
                  </Text>
                )}

                {item.lastMessage &&
                  item.lastMessage.senderId === user?.id &&
                  readReceipts && (
                    <ReadReceipt
                      status={lastMessageRead ? "read" : "delivered"}
                      size={16}
                      style={styles.readReceiptIcon}
                    />
                  )}
              </View>

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
        </View>
        <Divider
          style={[
            styles.divider,
            { backgroundColor: theme.dark ? "#333333" : "#E0E0E0" },
          ]}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading && conversations.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.text, marginTop: 16, fontSize: 16 }}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          style={{
            color: theme.colors.error,
            marginBottom: 16,
            textAlign: "center",
            paddingHorizontal: 20,
          }}
        >
          {error}
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            marginBottom: 16,
            textAlign: "center",
            paddingHorizontal: 20,
          }}
        >
          This may be due to a missing Firebase index. Please check the console
          for details.
        </Text>
        <Button
          mode="contained"
          onPress={loadConversations}
          style={{ marginTop: 8 }}
          buttonColor={theme.colors.primary}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: "black" }]}>
        <Text style={[styles.title, { color: "white" }]}>Chats</Text>
      </View>

      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={{ color: theme.colors.textSecondary }}>
            No conversations yet
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Start a new conversation by tapping the + button
          </Text>
        </View>
      )}

      <FAB
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.primary,
        }}
        icon="plus"
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate("ContactsForChat")}
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
    fontSize: 20,
    fontWeight: "bold",
  },
  conversationsList: {
    flexGrow: 1,
  },
  conversationItem: {
    // backgroundColor is now set dynamically in the render function
  },
  conversationContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  conversationContent: {
    flex: 1,
    marginLeft: 15,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messageTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  previewText: {
    fontSize: 14,
    color: "#8E8E93",
    flex: 1,
    marginRight: 4,
  },
  unreadText: {
    color: "#000",
    fontWeight: "500",
  },
  readReceiptIcon: {
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: "#075E54", // Default color
  },
  divider: {
    height: 1,
    // backgroundColor is now set dynamically in the render function
    marginLeft: 76,
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

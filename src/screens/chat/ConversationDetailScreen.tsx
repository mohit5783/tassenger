"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Text, Appbar, Avatar, ActivityIndicator } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchConversation,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  type Message,
} from "../../store/slices/chatSlice";
import { format, isToday, isYesterday } from "date-fns";
import { Send, Paperclip } from "react-native-feather";
import TaskShareModal from "../../components/TaskShareModal";
import type { Task } from "../../store/slices/taskSlice";

const ConversationDetailScreen = ({ navigation, route }: any) => {
  const { conversationId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentConversation, messages, isLoading } = useAppSelector(
    (state) => state.chat
  );
  const { user } = useAppSelector((state) => state.auth);
  const [messageText, setMessageText] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchConversation(conversationId));
      dispatch(fetchMessages(conversationId));
    }
  }, [dispatch, conversationId]);

  useEffect(() => {
    // Mark messages as read when the conversation is opened
    if (user && conversationId) {
      dispatch(markMessagesAsRead({ conversationId, userId: user.id }));
    }
  }, [dispatch, conversationId, user]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !user || !currentConversation) return;

    dispatch(
      sendMessage({
        conversationId,
        text: messageText.trim(),
        senderId: user.id,
        senderName: user.displayName || user.phoneNumber || "User",
      })
    );
    setMessageText("");
  };

  const handleShareTask = (task: Task) => {
    if (!user || !currentConversation) return;

    dispatch(
      sendMessage({
        conversationId,
        text: `Shared task: ${task.title}`,
        senderId: user.id,
        senderName: user.displayName || user.phoneNumber || "User",
        attachments: [
          {
            type: "task",
            id: task.id,
            name: task.title,
          },
        ],
      })
    );
  };

  const handleViewTask = (taskId: string) => {
    // Use the correct navigation pattern for nested navigators
    navigation.navigate("Tasks", {
      screen: "TaskDetail",
      params: { taskId },
    });
  };

  const getConversationTitle = () => {
    if (!currentConversation || !user) return "Chat";

    if (currentConversation.title) return currentConversation.title;

    if (!currentConversation.participantNames) return "Chat";

    // For direct messages, show the other person's name
    if (!currentConversation.isGroup) {
      const otherParticipantId = currentConversation.participants.find(
        (id) => id !== user.id
      );
      return otherParticipantId &&
        currentConversation.participantNames[otherParticipantId]
        ? currentConversation.participantNames[otherParticipantId]
        : "Chat";
    }

    // For group chats without a title, list participants
    return (
      Object.values(currentConversation.participantNames)
        .filter((_, index) => index < 3)
        .join(", ") + (currentConversation.participants.length > 3 ? "..." : "")
    );
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  };

  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return "Today";
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const shouldShowDate = (message: Message, index: number) => {
    if (index === 0) return true;

    const prevMessage = messages[index - 1];
    const prevDate = new Date(prevMessage.createdAt);
    const currentDate = new Date(message.createdAt);

    return (
      prevDate.getDate() !== currentDate.getDate() ||
      prevDate.getMonth() !== currentDate.getMonth() ||
      prevDate.getFullYear() !== currentDate.getFullYear()
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const hasTaskAttachment = item.attachments?.some(
      (att) => att.type === "task"
    );

    return (
      <View>
        {shouldShowDate(item, index) && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {formatMessageDate(item.createdAt)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            isOwnMessage
              ? styles.ownMessageContainer
              : styles.otherMessageContainer,
          ]}
        >
          {!isOwnMessage && (
            <Avatar.Text
              size={30}
              label={
                item.senderName
                  ? item.senderName.substring(0, 1).toUpperCase()
                  : "U"
              }
              style={styles.messageAvatar}
            />
          )}

          <View
            style={[
              styles.messageBubble,
              isOwnMessage
                ? [
                    styles.ownMessageBubble,
                    { backgroundColor: theme.colors.primary },
                  ]
                : styles.otherMessageBubble,
              hasTaskAttachment && styles.taskMessageBubble,
            ]}
          >
            {!isOwnMessage && item.senderName && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}

            {hasTaskAttachment ? (
              <View>
                <Text
                  style={[
                    styles.messageText,
                    isOwnMessage
                      ? { color: theme.colors.onPrimary }
                      : { color: theme.colors.text },
                  ]}
                >
                  {item.text}
                </Text>

                {item.attachments?.map((attachment, i) => {
                  if (attachment.type === "task" && attachment.id) {
                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.taskAttachment}
                        onPress={() => handleViewTask(attachment.id!)}
                      >
                        <View
                          style={[
                            styles.taskCard,
                            {
                              backgroundColor: isOwnMessage
                                ? "rgba(255, 255, 255, 0.1)"
                                : "#f0f0f0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskTitle,
                              isOwnMessage
                                ? { color: theme.colors.onPrimary }
                                : { color: theme.colors.text },
                            ]}
                          >
                            {attachment.name || "View Task"}
                          </Text>
                          <Text
                            style={[
                              styles.taskAction,
                              isOwnMessage
                                ? { color: "rgba(255, 255, 255, 0.7)" }
                                : { color: theme.colors.primary },
                            ]}
                          >
                            Tap to view
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })}
              </View>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage
                    ? { color: theme.colors.onPrimary }
                    : { color: theme.colors.text },
                ]}
              >
                {item.text}
              </Text>
            )}

            <Text
              style={[
                styles.messageTime,
                isOwnMessage
                  ? { color: "rgba(255, 255, 255, 0.7)" }
                  : { color: "rgba(0, 0, 0, 0.5)" },
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && !currentConversation) {
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content
          title={getConversationTitle()}
          color={theme.colors.onPrimary}
        />
      </Appbar.Header>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowTaskModal(true)}
        >
          <Paperclip width={24} height={24} stroke={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <RNTextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Send width={20} height={20} stroke={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <TaskShareModal
        visible={showTaskModal}
        onDismiss={() => setShowTaskModal(false)}
        onSelectTask={handleShareTask}
      />
    </KeyboardAvoidingView>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  dateText: {
    fontSize: 12,
    color: "#8E8E93",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 8,
    maxWidth: "80%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  taskMessageBubble: {
    padding: 8,
    paddingBottom: 12,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  taskAttachment: {
    marginTop: 8,
  },
  taskCard: {
    padding: 8,
    borderRadius: 8,
  },
  taskTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  taskAction: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  attachButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  textInput: {
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ConversationDetailScreen;

"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Keyboard,
} from "react-native";
import {
  Text,
  TextInput,
  ActivityIndicator,
  Avatar,
  Menu,
  Appbar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchMessages,
  sendMessage,
  markConversationAsRead,
  type Message,
} from "../../store/slices/chatSlice";
import { format, isToday, isYesterday } from "date-fns";
import { Paperclip, Send, MoreVertical } from "react-native-feather";
import * as ImagePicker from "expo-image-picker";
import { storage } from "../../api/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const ConversationDetailScreen = ({ navigation, route }: any) => {
  const { conversationId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { messages, conversations, isLoading } = useAppSelector(
    (state) => state.chat
  );
  const { user } = useAppSelector((state) => state.auth);
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentConversation = conversations.find(
    (c) => c.id === conversationId
  );

  useEffect(() => {
    if (user && conversationId) {
      dispatch(fetchMessages(conversationId));
      dispatch(markConversationAsRead({ conversationId, userId: user.id }));
    }
  }, [dispatch, conversationId, user]);

  const handleSend = async () => {
    if (!messageText.trim() || !user) return;

    try {
      await dispatch(
        sendMessage({
          conversationId,
          text: messageText.trim(),
          senderId: user.id,
          senderName: user.displayName || user.phoneNumber || "User",
        })
      ).unwrap();

      setMessageText("");
      Keyboard.dismiss();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleAttachment = async () => {
    if (!user) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("You need to allow access to your photos to share images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      await uploadAndSendImage(selectedImage.uri);
    }
  };

  const uploadAndSendImage = async (uri: string) => {
    if (!user) return;

    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const imageId = uuidv4();
      const storageRef = ref(
        storage,
        `chat_images/${conversationId}/${imageId}`
      );
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await dispatch(
        sendMessage({
          conversationId,
          text: "Sent an image",
          senderId: user.id,
          senderName: user.displayName || user.phoneNumber || "User",
          attachments: [
            {
              type: "image",
              url: downloadURL,
            },
          ],
        })
      ).unwrap();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatMessageTime = (timestamp: number) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday " + format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const renderDateSeparator = (date: Date) => {
    let dateText;
    if (isToday(date)) {
      dateText = "Today";
    } else if (isYesterday(date)) {
      dateText = "Yesterday";
    } else {
      dateText = format(date, "MMMM d, yyyy");
    }

    return (
      <View style={styles.dateSeparator}>
        <Text
          style={[
            styles.dateSeparatorText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {dateText}
        </Text>
      </View>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.senderId === user?.id;
    const showDateSeparator =
      index === 0 ||
      (messages[index - 1] &&
        new Date(messages[index - 1].createdAt).toDateString() !==
          new Date(item.createdAt).toDateString());

    return (
      <>
        {showDateSeparator && renderDateSeparator(new Date(item.createdAt))}
        <View
          style={[
            styles.messageContainer,
            isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
            isCurrentUser
              ? { backgroundColor: theme.colors.primary }
              : { backgroundColor: theme.dark ? "#333333" : "#f0f0f0" },
          ]}
        >
          {!isCurrentUser && !currentConversation?.isGroup && (
            <Text style={[styles.senderName, { color: theme.colors.primary }]}>
              {item.senderName}
            </Text>
          )}

          {item.attachments?.map((attachment, attachIndex) => {
            if (attachment.type === "image") {
              return (
                <Image
                  key={attachIndex}
                  source={{ uri: attachment.url }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              );
            } else if (attachment.type === "task") {
              return (
                <TouchableOpacity
                  key={attachIndex}
                  style={[
                    styles.taskAttachment,
                    { backgroundColor: theme.dark ? "#444444" : "#e0e0e0" },
                  ]}
                  onPress={() =>
                    navigation.navigate("Tasks", {
                      screen: "TaskDetail",
                      params: { taskId: attachment.id },
                    })
                  }
                >
                  <Text
                    style={[
                      styles.taskAttachmentTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Task: {attachment.name}
                  </Text>
                  <Text
                    style={[
                      styles.taskAttachmentAction,
                      { color: theme.colors.primary },
                    ]}
                  >
                    View Task
                  </Text>
                </TouchableOpacity>
              );
            }
            return null;
          })}

          <Text
            style={[
              styles.messageText,
              {
                color: isCurrentUser
                  ? theme.colors.onPrimary
                  : theme.colors.text,
              },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {
                color: isCurrentUser
                  ? "rgba(255, 255, 255, 0.7)"
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </>
    );
  };

  const getConversationTitle = () => {
    if (!currentConversation || !user) return "Chat";

    if (currentConversation.title) return currentConversation.title;

    if (!currentConversation.participantNames) return "Chat";

    // For direct messages, show the other person's name
    if (!currentConversation.isGroup) {
      const otherParticipantId = currentConversation.participants.find(
        (id: string) => id !== user.id
      );
      return otherParticipantId &&
        currentConversation.participantNames[otherParticipantId]
        ? currentConversation.participantNames[otherParticipantId]
        : "Chat";
    }

    // For group chats without a title, list participants
    return (
      Object.values(currentConversation.participantNames)
        .filter((_: any, index: number) => index < 3)
        .join(", ") + (currentConversation.participants.length > 3 ? "..." : "")
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

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
        <Avatar.Text
          size={36}
          label={getInitials(getConversationTitle())}
          style={{ backgroundColor: theme.dark ? "#444444" : "#e0e0e0" }}
          color={theme.colors.text}
        />
        <Appbar.Content
          title={getConversationTitle()}
          color={theme.colors.onPrimary}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon={(props) => (
                <MoreVertical {...props} color={theme.colors.onPrimary} />
              )}
              onPress={() => setMenuVisible(true)}
              color={theme.colors.onPrimary}
            />
          }
        >
          <Menu.Item onPress={() => {}} title="View Profile" />
          <Menu.Item onPress={() => {}} title="Search" />
          <Menu.Item onPress={() => {}} title="Mute Notifications" />
          <Menu.Item onPress={() => {}} title="Clear Chat" />
        </Menu>
      </Appbar.Header>

      {isLoading && messages.length === 0 ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToOffset({
                offset: 0,
                animated: false,
              });
            }
          }}
        />
      )}

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.dark ? "#1e1e1e" : "#f5f5f5" },
        ]}
      >
        <TouchableOpacity
          onPress={handleAttachment}
          style={styles.attachButton}
        >
          <Paperclip width={24} height={24} stroke={theme.colors.primary} />
        </TouchableOpacity>

        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="What to say?"
          style={[
            styles.input,
            {
              backgroundColor: theme.dark ? "#333333" : "white",
              color: theme.colors.text,
            },
          ]}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          theme={{
            colors: {
              text: theme.colors.text,
              placeholder: theme.colors.textSecondary,
              primary: theme.colors.primary,
            },
          }}
        />

        {uploading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={styles.sendButton}
          />
        ) : (
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
            ]}
            disabled={!messageText.trim()}
          >
            <Send width={20} height={20} stroke="white" />
          </TouchableOpacity>
        )}
      </View>
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
  header: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    elevation: 1,
  },
  currentUserMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherUserMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskAttachment: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskAttachmentTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  taskAttachmentAction: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ConversationDetailScreen;

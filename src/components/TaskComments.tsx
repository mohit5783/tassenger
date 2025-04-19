"use client";

import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Avatar,
  Button,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { useAppSelector } from "../store/hooks";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../api/firebase/config";
import { format } from "date-fns";
import { sendPushNotification } from "../services/NotificationService";

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

interface TaskCommentsProps {
  taskId: string;
}

const TaskComments = ({ taskId }: TaskCommentsProps) => {
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const commentsRef = collection(db, "tasks", taskId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsList: Comment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          commentsList.push({
            id: doc.id,
            taskId: data.taskId,
            userId: data.userId,
            userName: data.userName,
            text: data.text,
            createdAt: data.createdAt?.toMillis() || Date.now(),
          });
        });
        setComments(commentsList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !taskId) return;

    setIsSending(true);
    try {
      // Add comment to Firestore
      const commentRef = await addDoc(
        collection(db, "tasks", taskId, "comments"),
        {
          taskId,
          userId: user.id,
          userName: user.displayName || user.phoneNumber || "User",
          text: commentText.trim(),
          createdAt: Timestamp.now(),
        }
      );

      // Send push notification to the other party
      // Get the task
      const taskRef = doc(db, "tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (taskSnap.exists()) {
        const task = taskSnap.data() as any;

        // Determine the recipient
        const recipientId =
          task.createdBy === user.id ? task.assignedTo : task.createdBy;

        if (recipientId && recipientId !== user.id) {
          await sendPushNotification(
            recipientId,
            "New Comment on Task",
            `${user.displayName || user.phoneNumber} commented on “${
              task.title
            }”: “${commentText.trim()}”`
          );
        }
      }

      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatCommentTime = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
  };

  const renderCommentItem = ({ item }: { item: Comment }) => {
    const isOwnComment = item.userId === user?.id;
    const initial = item.userName ? item.userName[0].toUpperCase() : "U";

    return (
      <View style={styles.commentItem}>
        <Avatar.Text
          size={36}
          label={initial}
          style={{ backgroundColor: theme.colors.primary }}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>
              {isOwnComment ? "You" : item.userName}
            </Text>
            <Text style={styles.commentTime}>
              {formatCommentTime(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={5}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Comments
      </Text>

      {isLoading ? (
        <ActivityIndicator
          style={styles.loader}
          size="small"
          color={theme.colors.primary}
        />
      ) : (
        <View style={styles.commentsList}>
          {comments.length === 0 ? (
            <Text style={styles.emptyText}>
              No comments yet. Be the first to comment!
            </Text>
          ) : (
            comments.map((item) => (
              <View key={item.id}>
                {renderCommentItem({ item })}
                <Divider style={styles.divider} />
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <RNTextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <Button
          mode="contained"
          onPress={handleAddComment}
          loading={isSending}
          disabled={isSending || !commentText.trim()}
          style={{ backgroundColor: theme.colors.primary }}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  commentsList: {
    maxHeight: 300,
  },
  commentItem: {
    flexDirection: "row",
    padding: 12,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: "bold",
  },
  commentTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    backgroundColor: "#E0E0E0",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#8E8E93",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
});

export default TaskComments;

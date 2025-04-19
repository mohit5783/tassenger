"use client";

import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Menu,
  Appbar,
  Portal,
  Dialog,
  Switch,
  TextInput,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTask,
  deleteTask,
  updateTask,
  type TaskStatus,
  updateTaskStatus,
  fetchTaskRejections,
} from "../../store/slices/taskSlice";
import { generateNextOccurrence } from "../../store/slices/recurrenceSlice";
import { format, isValid } from "date-fns";
import {
  MoreVertical,
  User,
  Calendar,
  Clock,
  Bell,
  Repeat,
} from "react-native-feather";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../api/firebase/config";
import { sendMessage } from "../../store/slices/chatSlice";
import {
  scheduleTaskReminder,
  cancelTaskReminder,
} from "../../services/NotificationService";
import TaskComments from "../../components/TaskComments";
import DateTimePickerModal from "@/components/DateTimePickerModal";
import ContactSelector from "../../components/ContactSelector";
import type { Contact } from "../../services/ContactsService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const TaskDetailScreen = ({ navigation, route }: any) => {
  const { taskId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentTask, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareDialogVisible, setShareDialogVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderIdentifier, setReminderIdentifier] = useState<string | null>(
    null
  );
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);
  const [rejectionDialogVisible, setRejectionDialogVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejections, setRejections] = useState<any[]>([]);
  const { currentGroup } = useAppSelector((state) => state.groups);
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [contactSelectorVisible, setContactSelectorVisible] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{
    id: string;
    displayName?: string;
  } | null>(null);
  const [isDueDatePassed, setIsDueDatePassed] = useState(false);

  useEffect(() => {
    dispatch(fetchTask(taskId));
  }, [dispatch, taskId]);

  useEffect(() => {
    // Check if the task has a due date and set reminder state
    if (currentTask?.dueDate) {
      const dueDate = new Date(currentTask.dueDate);
      // Only enable reminder toggle if due date is in the future
      if (dueDate > new Date()) {
        setReminderEnabled(!!currentTask.reminderSet);
      }
      setIsDueDatePassed(dueDate < new Date());
    }

    // Set assigned user from task data
    if (currentTask?.assignedTo) {
      setAssignedUser({
        id: currentTask.assignedTo,
        displayName: currentTask.assignedToName,
      });
    }
  }, [currentTask]);

  useEffect(() => {
    if (taskId && currentTask?.status === "reviewRejected") {
      dispatch(fetchTaskRejections(taskId))
        .unwrap()
        .then((data) => {
          setRejections(data);
        })
        .catch((error) => {
          console.error("Error fetching rejections:", error);
        });
    }
  }, [dispatch, taskId, currentTask?.status]);

  const handleDateTimeChange = (date: Date | null) => {
    setDateTimePickerVisible(false);
    if (date && isValid(date)) {
      // Update the task with the new due date
      dispatch(
        updateTask({
          taskId,
          updates: {
            dueDate: date.getTime(),
          },
        })
      );
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Cancel any scheduled reminder
            if (reminderIdentifier) {
              await cancelTaskReminder(reminderIdentifier);
            }

            await dispatch(deleteTask(taskId)).unwrap();
            navigation.goBack();
          } catch (error) {
            console.error("Failed to delete task:", error);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate("EditTask", { taskId });
  };

  const handleShare = async () => {
    if (!user) return;

    setLoadingConversations(true);
    try {
      // Fetch user's conversations
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.id)
      );

      const querySnapshot = await getDocs(q);
      const conversationsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setConversations(conversationsList);
      setShareDialogVisible(true);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleShareToConversation = async (conversation: any) => {
    if (!user || !currentTask) return;

    try {
      await dispatch(
        sendMessage({
          conversationId: conversation.id,
          text: `Shared task: ${currentTask.title}`,
          senderId: user.id,
          senderName: user.displayName || user.phoneNumber || "User",
          attachments: [
            {
              type: "task",
              id: currentTask.id,
              name: currentTask.title,
            },
          ],
        })
      ).unwrap();

      // Navigate to the conversation
      navigation.navigate("Chat", {
        screen: "ConversationDetail",
        params: { conversationId: conversation.id },
      });
    } catch (error) {
      console.error("Error sharing task:", error);
    } finally {
      setShareDialogVisible(false);
    }
  };

  const handleNewChat = () => {
    setShareDialogVisible(false);
    navigation.navigate("Chat", {
      screen: "NewConversation",
    });
  };

  const handleUpdateStatus = async (status: TaskStatus) => {
    if (!currentTask) return;

    try {
      // Update the task status
      await dispatch(
        updateTask({
          taskId,
          updates: {
            status,
            ...(status === "completed" ? { completedAt: Date.now() } : {}),
          },
        })
      ).unwrap();

      // If the task is completed and it's a recurring task, generate the next occurrence
      if (
        status === "completed" &&
        currentTask.isRecurring &&
        currentTask.recurrencePatternId
      ) {
        await dispatch(
          generateNextOccurrence({
            taskId,
            completedDate: new Date(),
          })
        ).unwrap();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleToggleReminder = async () => {
    if (!currentTask || !currentTask.dueDate) return;

    const newReminderState = !reminderEnabled;
    setReminderEnabled(newReminderState);

    try {
      if (newReminderState) {
        // Schedule a new reminder
        const identifier = await scheduleTaskReminder(currentTask);
        if (identifier) {
          setReminderIdentifier(identifier);
          dispatch(
            updateTask({
              taskId,
              updates: {
                reminderSet: true,
                reminderIdentifier: identifier,
              },
            })
          );
        }
      } else {
        // Cancel existing reminder
        if (currentTask.reminderIdentifier) {
          await cancelTaskReminder(currentTask.reminderIdentifier);
          dispatch(
            updateTask({
              taskId,
              updates: {
                reminderSet: false,
                reminderIdentifier: null,
              },
            })
          );
        }
      }
    } catch (error) {
      console.error("Failed to toggle reminder:", error);
      // Revert UI state if operation failed
      setReminderEnabled(!newReminderState);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = theme.colors.customColors.task;
    return colors[status as keyof typeof colors] || colors.todo;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return theme.colors.error;
      case "medium":
        return theme.colors.customColors.task.inProgress;
      default:
        return theme.colors.customColors.task.todo;
    }
  };

  // Helper function to safely format dates
  const formatDate = (
    timestamp: number | undefined,
    formatString: string
  ): string => {
    if (!timestamp) return "Not set";

    const date = new Date(timestamp);
    if (!isValid(date)) return "Invalid date";

    try {
      return format(date, formatString);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
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

  const handleUserSelect = () => {
    navigation.navigate("ContactsForTaskAssignment", { taskId });
  };

  const handleUpdateGroupTaskStatus = async (
    newStatus: TaskStatus,
    reason?: string
  ) => {
    if (!currentTask) return;

    try {
      await dispatch(
        updateTaskStatus({
          taskId,
          newStatus,
          rejectionReason: reason,
        })
      ).unwrap();

      // If we're rejecting, close the dialog
      if (newStatus === "reviewRejected") {
        setRejectionDialogVisible(false);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const handleRejectTask = () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    handleUpdateGroupTaskStatus("reviewRejected", rejectionReason.trim());
  };

  const handleContactSelect = (contact: Contact) => {
    setContactSelectorVisible(false);
    if (contact) {
      // Update the task with the selected contact
      dispatch(
        updateTask({
          taskId,
          updates: {
            assignedTo: contact.id,
            assignedToName: contact.name,
          },
        })
      );
    }
  };

  // Function to get recurrence description
  const getRecurrenceDescription = (): string => {
    if (!currentTask?.recurrencePattern || !currentTask?.dueDate)
      return "Does not repeat";

    const options = currentTask.recurrencePattern;
    const date = new Date(currentTask.dueDate);

    // For weekly recurrence with specific days
    if (
      options.type === "weekly" &&
      options.weekDays &&
      options.weekDays.length > 0
    ) {
      const dayNames = options.weekDays
        .map(
          (dayIndex: any) =>
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex]
        )
        .join(", ");

      return options.frequency === 1
        ? `Weekly on ${dayNames}`
        : `Every ${options.frequency} weeks on ${dayNames}`;
    }

    // For other recurrence types
    switch (options.type) {
      case "daily":
        return options.frequency === 1
          ? "Daily"
          : `Every ${options.frequency} days`;
      case "weekly":
        return options.frequency === 1
          ? `Weekly on ${format(date, "EEEE")}`
          : `Every ${options.frequency} weeks on ${format(date, "EEEE")}`;
      case "monthly":
        return options.frequency === 1
          ? `Monthly on the ${format(date, "do")}`
          : `Every ${options.frequency} months on the ${format(date, "do")}`;
      case "yearly":
        return options.frequency === 1
          ? `Annually on ${format(date, "MMMM d")}`
          : `Every ${options.frequency} years on ${format(date, "MMMM d")}`;
      default:
        return "Custom";
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Task Details" color="white" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon={(props) => <MoreVertical {...props} color="white" />}
              onPress={() => setMenuVisible(true)}
              color="white"
            />
          }
        >
          <Menu.Item onPress={handleShare} title="Share" leadingIcon="share" />
          <Menu.Item onPress={handleEdit} title="Edit" leadingIcon="pencil" />
          <Menu.Item
            onPress={handleDelete}
            title="Delete"
            leadingIcon="delete"
          />
        </Menu>
      </Appbar.Header>

      <ScrollView style={{ backgroundColor: theme.colors.background }}>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {currentTask?.title}
          </Text>
          <View style={styles.metaContainer}>
            <Chip
              style={[
                styles.statusChip,
                {
                  backgroundColor: getStatusColor(
                    currentTask?.status || "todo"
                  ),
                },
              ]}
              textStyle={{ color: theme.colors.onPrimary }}
            >
              {(currentTask?.status || "todo").charAt(0).toUpperCase() +
                (currentTask?.status || "todo").slice(1)}
            </Chip>

            <Chip
              style={[
                styles.priorityChip,
                {
                  borderColor: getPriorityColor(
                    currentTask?.priority || "medium"
                  ),
                },
              ]}
              textStyle={{
                color: getPriorityColor(currentTask?.priority || "medium"),
              }}
            >
              {(currentTask?.priority || "medium").charAt(0).toUpperCase() +
                currentTask?.priority?.slice(1)}{" "}
              Priority
            </Chip>

            {currentTask?.isRecurring && (
              <Chip
                style={[
                  styles.recurringChip,
                  { borderColor: theme.colors.primary },
                ]}
                textStyle={{ color: theme.colors.primary }}
                icon="repeat"
              >
                Recurring
              </Chip>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          {currentTask?.description ? (
            <>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                Description
              </Text>
              <Text style={[styles.description, { color: theme.colors.text }]}>
                {currentTask?.description}
              </Text>
            </>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Details
          </Text>

          <View
            style={[
              styles.detailRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.detailLabelContainer}>
              <Calendar
                width={20}
                height={20}
                stroke={theme.colors.textSecondary}
                style={styles.detailIcon}
              />
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Created
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {formatDate(currentTask?.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </Text>
          </View>

          {currentTask?.dueDate && (
            <View
              style={[
                styles.detailRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.detailLabelContainer}>
                <Clock
                  width={20}
                  height={20}
                  stroke={theme.colors.textSecondary}
                  style={styles.detailIcon}
                />
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Due Date & Time
                </Text>
              </View>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      isDueDatePassed && currentTask.status !== "completed"
                        ? theme.colors.error
                        : theme.colors.text,
                  },
                ]}
              >
                {formatDate(currentTask?.dueDate, "MMM d, yyyy 'at' h:mm a")}
                {isDueDatePassed &&
                  currentTask.status !== "completed" &&
                  " (Overdue)"}
              </Text>
            </View>
          )}

          {currentTask?.isRecurring && (
            <View
              style={[
                styles.detailRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.detailLabelContainer}>
                <Repeat
                  width={20}
                  height={20}
                  stroke={theme.colors.textSecondary}
                  style={styles.detailIcon}
                />
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Recurrence
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {getRecurrenceDescription()}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.detailRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.detailLabelContainer}>
              <User
                width={20}
                height={20}
                stroke={theme.colors.textSecondary}
                style={styles.detailIcon}
              />
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Assigned To
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {currentTask?.assignedToName || "Not assigned"}
            </Text>
          </View>

          {currentTask?.completedAt && (
            <View
              style={[
                styles.detailRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.detailLabelContainer}>
                <Icon
                  name="check-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.detailIcon}
                />
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Completed
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {formatDate(
                  currentTask?.completedAt,
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </Text>
            </View>
          )}

          {/* Display reminders */}
          {currentTask?.reminders && currentTask.reminders.length > 0 && (
            <View
              style={[
                styles.detailRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.detailLabelContainer}>
                <Bell
                  width={20}
                  height={20}
                  stroke={theme.colors.textSecondary}
                  style={styles.detailIcon}
                />
                <Text
                  style={[
                    styles.detailLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Reminders
                </Text>
              </View>
              <View style={styles.remindersList}>
                {currentTask.reminders.map((reminder, index) => (
                  <Text
                    key={index}
                    style={[styles.reminderItem, { color: theme.colors.text }]}
                  >
                    {reminder.label || reminder.value}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {currentTask?.dueDate &&
            !isDueDatePassed &&
            !currentTask.isRecurring && (
              <View
                style={[
                  styles.reminderRow,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <View style={styles.detailLabelContainer}>
                  <Bell
                    width={20}
                    height={20}
                    stroke={theme.colors.textSecondary}
                    style={styles.detailIcon}
                  />
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Set Reminder
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={handleToggleReminder}
                  color={theme.colors.primary}
                />
              </View>
            )}
        </View>

        <View
          style={[
            styles.actionsSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Update Status
          </Text>

          <View style={styles.statusButtons}>
            <Button
              mode={currentTask?.status === "todo" ? "contained" : "outlined"}
              onPress={() => handleUpdateStatus("todo")}
              style={styles.statusButton}
              buttonColor={
                currentTask?.status === "todo"
                  ? theme.colors.primary
                  : undefined
              }
              textColor={
                currentTask?.status === "todo"
                  ? theme.colors.onPrimary
                  : theme.colors.text
              }
            >
              To Do
            </Button>

            <Button
              mode={
                currentTask?.status === "inProgress" ? "contained" : "outlined"
              }
              onPress={() => handleUpdateStatus("inProgress")}
              style={styles.statusButton}
              buttonColor={
                currentTask?.status === "inProgress"
                  ? theme.colors.primary
                  : undefined
              }
              textColor={
                currentTask?.status === "inProgress"
                  ? theme.colors.onPrimary
                  : theme.colors.text
              }
            >
              In Progress
            </Button>

            <Button
              mode={
                currentTask?.status === "completed" ? "contained" : "outlined"
              }
              onPress={() => handleUpdateStatus("completed")}
              style={styles.statusButton}
              buttonColor={
                currentTask?.status === "completed"
                  ? theme.colors.primary
                  : undefined
              }
              textColor={
                currentTask?.status === "completed"
                  ? theme.colors.onPrimary
                  : theme.colors.text
              }
            >
              Completed
            </Button>
          </View>
          {currentTask?.status !== "completed" && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus("completed")}
              style={styles.completeButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              Mark as Complete
            </Button>
          )}
          {currentTask?.groupId && (
            <View style={styles.groupTaskActions}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                Group Task Workflow
              </Text>

              {currentTask?.assignment?.assigneeId === user?.id && (
                <View style={styles.workflowButtons}>
                  {currentTask?.status === "assigned" && (
                    <Button
                      mode="contained"
                      onPress={() => handleUpdateGroupTaskStatus("inProgress")}
                      style={styles.workflowButton}
                    >
                      Start Working
                    </Button>
                  )}

                  {currentTask?.status === "inProgress" && (
                    <Button
                      mode="contained"
                      onPress={() =>
                        handleUpdateGroupTaskStatus("doneByAssignee")
                      }
                      style={styles.workflowButton}
                    >
                      Mark as Done
                    </Button>
                  )}

                  {currentTask?.status === "reviewRejected" && (
                    <Button
                      mode="contained"
                      onPress={() =>
                        handleUpdateGroupTaskStatus("doneByAssignee")
                      }
                      style={styles.workflowButton}
                    >
                      Submit Again
                    </Button>
                  )}
                </View>
              )}

              {currentTask?.assignment?.reviewerId === user?.id && (
                <View style={styles.workflowButtons}>
                  {currentTask?.status === "doneByAssignee" && (
                    <>
                      <Button
                        mode="contained"
                        onPress={() => handleUpdateGroupTaskStatus("reviewed")}
                        style={[
                          styles.workflowButton,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        Approve
                      </Button>

                      <Button
                        mode="contained"
                        onPress={() => setRejectionDialogVisible(true)}
                        style={[
                          styles.workflowButton,
                          { backgroundColor: theme.colors.error },
                        ]}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </View>
              )}

              {currentGroup?.createdBy === user?.id && (
                <View style={styles.workflowButtons}>
                  {currentTask?.status === "reviewed" && (
                    <Button
                      mode="contained"
                      onPress={() => handleUpdateGroupTaskStatus("completed")}
                      style={styles.workflowButton}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </View>
              )}

              {rejections.length > 0 && (
                <View style={styles.rejectionsContainer}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Rejection History
                  </Text>
                  {rejections.map((rejection, index) => (
                    <View key={index} style={styles.rejectionItem}>
                      <Text style={styles.rejectionHeader}>
                        Rejected by {rejection.reviewerName} on{" "}
                        {formatDate(
                          rejection.timestamp,
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </Text>
                      <Text style={styles.rejectionReason}>
                        {rejection.reason}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card, marginBottom: 100 },
          ]}
        >
          <TaskComments taskId={taskId} />
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={shareDialogVisible}
          onDismiss={() => setShareDialogVisible(false)}
          style={{ backgroundColor: theme.colors.background }}
        >
          <Dialog.Title style={{ color: theme.colors.text }}>
            Share Task
          </Dialog.Title>
          <Dialog.Content>
            {loadingConversations ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : conversations.length > 0 ? (
              <ScrollView style={{ maxHeight: 300 }}>
                {conversations.map((conversation) => (
                  <Button
                    key={conversation.id}
                    mode="text"
                    onPress={() => handleShareToConversation(conversation)}
                    style={styles.conversationButton}
                    textColor={theme.colors.text}
                  >
                    {getConversationTitle(conversation)}
                  </Button>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ color: theme.colors.text }}>
                No conversations found
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShareDialogVisible(false)}
              textColor={theme.colors.text}
            >
              Cancel
            </Button>
            <Button onPress={handleNewChat} textColor={theme.colors.primary}>
              New Chat
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Rejection Dialog */}
      <Portal>
        <Dialog
          visible={rejectionDialogVisible}
          onDismiss={() => setRejectionDialogVisible(false)}
        >
          <Dialog.Title>Reject Task</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Reason for rejection"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRejectionDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleRejectTask}>Reject</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* DateTimePickerModal */}
      <DateTimePickerModal
        visible={dateTimePickerVisible}
        onDismiss={() => setDateTimePickerVisible(false)}
        onConfirm={handleDateTimeChange}
        initialDate={
          currentTask?.dueDate ? new Date(currentTask.dueDate) : new Date()
        }
      />

      {/* ContactSelector */}
      {contactSelectorVisible && (
        <ContactSelector
          onSelectContact={handleContactSelect}
          onCancel={() => setContactSelectorVisible(false)}
          title="Assign Task To"
          visible={contactSelectorVisible}
        />
      )}
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
  section: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  priorityChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  categoryChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  recurringChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 8,
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    maxWidth: "60%",
    textAlign: "right",
  },
  actionsSection: {
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  statusButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  conversationButton: {
    justifyContent: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  groupTaskActions: {
    marginTop: 16,
  },
  workflowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  workflowButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  rejectionsContainer: {
    marginTop: 16,
  },
  rejectionItem: {
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectionHeader: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  rejectionReason: {
    fontStyle: "italic",
  },
  viewAllButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  assignmentButton: {
    marginBottom: 24,
    overflow: "hidden",
  },
  assignmentButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  assignmentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  assignmentIcon: {
    marginRight: 12,
  },
  remindersList: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  reminderItem: {
    marginBottom: 4,
  },
  completeButton: {
    marginTop: 16,
  },
});

export default TaskDetailScreen;

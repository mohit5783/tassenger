"use client";

import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Appbar,
  SegmentedButtons,
  Modal,
  Portal,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTask,
  updateTask,
  type TaskStatus,
  type TaskPriority,
} from "../../store/slices/taskSlice";
import { isValid } from "date-fns";
import ContactSelector from "../../components/ContactSelector";
import type { Contact } from "../../services/ContactsService";
import DateTimePickerModal from "@/components/DateTimePickerModal";

import { format } from "date-fns";
import type { RecurrenceOptions } from "../../types/recurrence";
import NotificationPickerModal from "@/components/NotificationPickerModal";
import { User } from "react-native-feather";

const EditTaskScreen = ({ navigation, route }: any) => {
  const { taskId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentTask, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [contactSelectorVisible, setContactSelectorVisible] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{
    id: string;
    displayName?: string;
  } | null>(null);

  const [recurrenceOptions, setRecurrenceOptions] =
    useState<RecurrenceOptions | null>(null);
  const [recurrenceModalVisible, setRecurrenceModalVisible] = useState(false);
  const [notificationPickerVisible, setNotificationPickerVisible] =
    useState(false);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchTask(taskId));
  }, [dispatch, taskId]);

  useEffect(() => {
    if (currentTask) {
      setTitle(currentTask.title);
      setDescription(currentTask.description || "");
      setStatus(currentTask.status);
      setPriority(currentTask.priority);

      if (currentTask.dueDate) {
        setDueDate(new Date(currentTask.dueDate));
      }

      if (currentTask.assignedTo) {
        setAssignedUser({
          id: currentTask.assignedTo,
          displayName: currentTask.assignedToName,
        });
      }

      if (currentTask.isRecurring && currentTask.recurrencePatternId) {
        // In a real app, you would fetch the recurrence pattern from Firestore
        // For now, we'll just set a default
        setRecurrenceOptions({
          type: "weekly",
          frequency: 1,
          endType: "never",
        });
      } else {
        setRecurrenceOptions(null);
      }
    }
  }, [currentTask]);

  const handleUpdateTask = async () => {
    if (!title.trim() || !user) return;

    try {
      const updates: any = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
      };

      if (assignedUser?.id) {
        updates.assignedTo = assignedUser.id;
        updates.assignedToName = assignedUser.displayName;
      } else {
        // If no user is assigned, clear the assignment
        updates.assignedTo = null;
        updates.assignedToName = null;
      }

      await dispatch(
        updateTask({
          taskId,
          updates,
        })
      ).unwrap();

      navigation.goBack();
    } catch (error) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", "Failed to update task. Please try again.");
    }
  };

  const handleDateTimeConfirm = (date: Date) => {
    setDueDate(date);
    setShowDateTimePicker(false);
  };

  const handleContactSelect = (contact: Contact) => {
    if (contact && contact.userId) {
      setAssignedUser({
        id: contact.userId,
        displayName: contact.name,
      });
    }
    setContactSelectorVisible(false);
  };

  const getRecurrenceDescription = (
    options: RecurrenceOptions,
    date: Date
  ): string => {
    if (!options) return "Does not repeat";

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

  if (isLoading && !currentTask) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
          <Appbar.BackAction
            color={theme.colors.onPrimary}
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content title="Edit Task" color={theme.colors.onPrimary} />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text>Loading task...</Text>
        </View>
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
        <Appbar.Content title="Edit Task" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={{ backgroundColor: theme.colors.background }}>
        <View style={[styles.formCard, { backgroundColor: theme.colors.card }]}>
          <TextInput
            style={styles.input}
            mode="outlined"
            label="Task Title"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Status
          </Text>
          <SegmentedButtons
            value={status}
            onValueChange={(value) => setStatus(value as TaskStatus)}
            buttons={[
              { value: "todo", label: "To Do" },
              { value: "inProgress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Priority
          </Text>
          <View style={styles.priorityContainer}>
            <Button
              mode={priority === "low" ? "contained" : "outlined"}
              onPress={() => setPriority("low")}
              style={styles.priorityButton}
            >
              Low
            </Button>
            <Button
              mode={priority === "medium" ? "contained" : "outlined"}
              onPress={() => setPriority("medium")}
              style={styles.priorityButton}
            >
              Medium
            </Button>
            <Button
              mode={priority === "high" ? "contained" : "outlined"}
              onPress={() => setPriority("high")}
              style={styles.priorityButton}
            >
              High
            </Button>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Due Date & Time (Optional)
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowDateTimePicker(true)}
            style={styles.dateTimeButton}
            icon="calendar-clock"
          >
            {dueDate && isValid(dueDate)
              ? `${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}`
              : "Set Due Date & Time"}
          </Button>

          {dueDate && (
            <Button
              mode="outlined"
              onPress={() => setRecurrenceModalVisible(true)}
              style={styles.recurrenceButton}
              icon="repeat"
            >
              {recurrenceOptions
                ? getRecurrenceDescription(recurrenceOptions, dueDate)
                : "Does not repeat"}
            </Button>
          )}

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Assignment
          </Text>
          <TouchableOpacity
            style={[
              styles.assignmentButton,
              {
                backgroundColor: theme.dark ? "#1E1E1E" : "#F5F5F5",
                borderRadius: 8,
              },
            ]}
            onPress={() => setContactSelectorVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.assignmentButtonContent}>
              <View style={styles.assignmentLeft}>
                <User
                  width={20}
                  height={20}
                  stroke={theme.colors.primary}
                  style={styles.assignmentIcon}
                />
                <Text style={{ color: theme.colors.text }}>
                  {assignedUser
                    ? `Assigned to: ${assignedUser.displayName}`
                    : "Assign to someone"}
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary }}>Select</Text>
            </View>
          </TouchableOpacity>

          <Button
            mode="contained"
            style={[
              styles.updateButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !title.trim()}
            onPress={handleUpdateTask}
          >
            Update Task
          </Button>
        </View>
      </ScrollView>

      <DateTimePickerModal
        visible={showDateTimePicker}
        onDismiss={() => setShowDateTimePicker(false)}
        onConfirm={handleDateTimeConfirm}
        initialDate={dueDate || new Date()}
      />

      {contactSelectorVisible && (
        <Portal>
          <Modal
            visible={contactSelectorVisible}
            onDismiss={() => setContactSelectorVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <ContactSelector
              onSelectContact={handleContactSelect}
              onCancel={() => setContactSelectorVisible(false)}
              title="Assign Task To"
            />
          </Modal>
        </Portal>
      )}
      <NotificationPickerModal
        visible={notificationPickerVisible}
        onDismiss={() => setNotificationPickerVisible(false)}
        onConfirm={(selected) => {
          setSelectedReminders(selected);
          setNotificationPickerVisible(false);
        }}
        initialSelected={selectedReminders}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formCard: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateTimeButton: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  assignButton: {
    marginBottom: 16,
  },
  updateButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
    margin: 0,
    padding: 0,
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  recurrenceButton: {
    marginBottom: 16,
  },
  notificationButton: {
    marginBottom: 24,
    paddingVertical: 8,
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
});

export default EditTaskScreen;

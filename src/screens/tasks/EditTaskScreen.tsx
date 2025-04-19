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
  Menu,
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
  type TaskReminder,
} from "../../store/slices/taskSlice";
import { isValid, format } from "date-fns";
import ContactSelector from "../../components/ContactSelector";
import type { Contact } from "../../services/ContactsService";
import DateTimePickerModal from "@/components/DateTimePickerModal";
import type { RecurrenceOptions } from "../../types/recurrence";
import NotificationPickerModal from "@/components/NotificationPickerModal";
import { User } from "react-native-feather";
import CustomRecurrenceModal from "@/components/CustomRecurrenceModal";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ReminderItem from "@/components/ReminderItem";

const EditTaskScreen = ({ navigation, route }: any) => {
  const { taskId } = route.params;
  const { theme, taskReminderDefault } = useTheme();
  const dispatch = useAppDispatch();
  const { currentTask, isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  const { contacts } = useAppSelector((state) => state.contacts);

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
  const [selectedReminders, setSelectedReminders] = useState<TaskReminder[]>(
    []
  );
  const [menuVisible, setMenuVisible] = useState(false);

  const defaultReminderTimes = [
    { id: "at_time", days: 0, hours: 0, minutes: 0, label: "At time of event" },
    {
      id: "5_min_before",
      days: 0,
      hours: 0,
      minutes: 5,
      label: "5 minutes before",
    },
    {
      id: "10_min_before",
      days: 0,
      hours: 0,
      minutes: 10,
      label: "10 minutes before",
    },
    {
      id: "15_min_before",
      days: 0,
      hours: 0,
      minutes: 15,
      label: "15 minutes before",
    },
    {
      id: "30_min_before",
      days: 0,
      hours: 0,
      minutes: 30,
      label: "30 minutes before",
    },
    {
      id: "1_hour_before",
      days: 0,
      hours: 1,
      minutes: 0,
      label: "1 hour before",
    },
    {
      id: "1_day_before",
      days: 1,
      hours: 0,
      minutes: 0,
      label: "1 day before",
    },
    {
      id: "2_days_before",
      days: 2,
      hours: 0,
      minutes: 0,
      label: "2 days before",
    },
  ];

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

      if (currentTask.isRecurring && currentTask.recurrencePattern) {
        setRecurrenceOptions(currentTask.recurrencePattern);
      } else {
        setRecurrenceOptions(null);
      }

      // Load reminders if they exist
      if (currentTask.reminders && currentTask.reminders.length > 0) {
        setSelectedReminders(currentTask.reminders);
      } else {
        // Set default reminder if none exist and there's a due date
        if (taskReminderDefault && currentTask.dueDate) {
          setSelectedReminders([
            { id: `reminder_${Date.now()}`, value: taskReminderDefault },
          ]);
        } else {
          setSelectedReminders([]);
        }
      }
    }
  }, [currentTask, taskReminderDefault]);

  const handleUpdateTask = async () => {
    if (!title.trim() || !user) return;

    try {
      const updates: any = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
        reminders: selectedReminders.length > 0 ? selectedReminders : null,
        reminderSet: selectedReminders.length > 0,
        isRecurring: !!recurrenceOptions,
      };

      if (recurrenceOptions) {
        updates.recurrencePattern = recurrenceOptions;
      }

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

  // Handle recurrence options change
  const handleRecurrenceChange = (options: RecurrenceOptions | null) => {
    setRecurrenceOptions(options);
    setRecurrenceModalVisible(false);
  };

  const getRecurrenceDescription = (
    options: RecurrenceOptions | null,
    date: Date | null
  ): string => {
    if (!options || !date) return "Does not repeat";

    // For weekly recurrence with specific days
    if (
      options.type === "weekly" &&
      options.weekDays &&
      options.weekDays.length > 0
    ) {
      const dayNames = options.weekDays
        .map(
          (dayIndex) =>
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

  const handleAddReminder = () => {
    const newId = `reminder_${Date.now()}`;
    setSelectedReminders((prev) => [
      ...prev,
      { id: newId, value: "10 minutes before" },
    ]);
  };

  const handleSelectReminder = (id: string, value: string) => {
    setSelectedReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value } : r))
    );
  };

  const handleRemoveReminder = (id: string) => {
    setSelectedReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Task" color="white" />
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

          {/* Recurrence Section */}
          {dueDate && (
            <View style={styles.recurrenceSection}>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                Repeat
              </Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuVisible(true)}
                    style={styles.recurrenceDropdown}
                    icon={() => (
                      <Icon name="repeat" size={20} color={theme.colors.text} />
                    )}
                    textColor={theme.colors.text}
                    contentStyle={styles.recurrenceButtonContent}
                  >
                    {getRecurrenceDescription(recurrenceOptions, dueDate)}
                    <Text style={{ color: theme.colors.text }}> ▼</Text>
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setRecurrenceOptions(null);
                    setMenuVisible(false);
                  }}
                  title="Does not repeat"
                />
                <Menu.Item
                  onPress={() => {
                    setRecurrenceOptions({
                      type: "daily",
                      frequency: 1,
                      endType: "never",
                    });
                    setMenuVisible(false);
                  }}
                  title="Daily"
                />
                <Menu.Item
                  onPress={() => {
                    setRecurrenceOptions({
                      type: "weekly",
                      frequency: 1,
                      endType: "never",
                      weekDays: [dueDate.getDay()],
                    });
                    setMenuVisible(false);
                  }}
                  title={`Weekly on ${format(dueDate, "EEEE")}`}
                />
                <Menu.Item
                  onPress={() => {
                    setRecurrenceOptions({
                      type: "monthly",
                      frequency: 1,
                      endType: "never",
                    });
                    setMenuVisible(false);
                  }}
                  title={`Monthly on the ${format(dueDate, "do")}`}
                />
                <Menu.Item
                  onPress={() => {
                    setRecurrenceOptions({
                      type: "yearly",
                      frequency: 1,
                      endType: "never",
                    });
                    setMenuVisible(false);
                  }}
                  title={`Annually on ${format(dueDate, "MMMM d")}`}
                />
                <Menu.Item
                  onPress={() => {
                    setRecurrenceModalVisible(true);
                    setMenuVisible(false);
                  }}
                  title="Custom..."
                />
              </Menu>
            </View>
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

          {/* Reminders Section */}
          <View>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Reminders
            </Text>
            {selectedReminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                id={reminder.id}
                value={reminder.value}
                onRemove={handleRemoveReminder}
                onChange={handleSelectReminder}
              />
            ))}
            <Button
              mode="outlined"
              onPress={handleAddReminder}
              style={styles.addReminderButton}
              icon="bell-plus"
            >
              Add Reminder
            </Button>
          </View>

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

      {/* Important: Only render the Modal when contactSelectorVisible is true */}
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
          setSelectedReminders(
            selected.map((id) => {
              const reminderTime = defaultReminderTimes.find(
                (r) => r.id === id
              );
              return {
                id,
                value: reminderTime ? reminderTime.label : "Custom reminder",
              };
            })
          );
          setNotificationPickerVisible(false);
        }}
        initialSelected={selectedReminders.map((r) => r.id)}
      />

      {/* Use CustomRecurrenceModal directly without nesting in another modal */}
      <CustomRecurrenceModal
        visible={recurrenceModalVisible}
        onDismiss={() => setRecurrenceModalVisible(false)}
        onConfirm={handleRecurrenceChange}
        initialDate={dueDate || new Date()}
        initialOptions={recurrenceOptions}
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
    width: "80%",
    alignSelf: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  recurrenceButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  recurrenceSection: {
    marginBottom: 24,
  },
  recurrenceDropdown: {
    width: "100%",
    alignSelf: "center",
    justifyContent: "space-between",
    marginVertical: 8,
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
  notificationButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  assignmentButton: {
    marginBottom: 16,
  },
  addReminderButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default EditTaskScreen;

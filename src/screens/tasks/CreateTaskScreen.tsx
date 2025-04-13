"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Appbar,
  Menu,
  Modal,
  Portal,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createTask,
  type TaskStatus,
  type TaskPriority,
  updateTask,
} from "../../store/slices/taskSlice";
import { createRecurringTask } from "../../store/slices/recurrenceSlice";
import { isValid } from "date-fns";
import CustomReminderModal from "../../components/CustomReminderModal";
import ContactSelector from "../../components/ContactSelector";
import type { Contact } from "../../services/ContactsService";
import { User } from "react-native-feather";
import DateTimePickerModal from "../../components/DateTimePickerModal";
import { format } from "date-fns";
import type { RecurrenceOptions } from "../../types/recurrence";
import NotificationPickerModal from "@/components/NotificationPickerModal";
import { scheduleCustomTaskReminder } from "@/services/NotificationService";
// Import the new CustomRecurrenceModal component
import CustomRecurrenceModal from "../../components/CustomRecurrenceModal";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ReminderItem from "@/components/ReminderItem";

interface ReminderTime {
  id: string;
  days?: number;
  hours?: number;
  minutes?: number;
  label: string;
}

const CreateTaskScreen = ({ navigation, route }: any) => {
  const { theme, taskReminderDefault } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.tasks);
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
  const [selectedReminders, setSelectedReminders] = useState<
    { id: string; value: string }[]
  >([{ id: "default", value: "10 minutes before" }]);
  const [customReminderModalVisible, setCustomReminderModalVisible] =
    useState(false);
  const [customReminders, setCustomReminders] = useState<
    Array<{
      id: string;
      days?: number;
      hours?: number;
      minutes?: number;
      label: string;
    }>
  >([]);

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

  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const template = route.params?.template;
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setPriority(template.priority);
    }
  }, [route.params]);

  useEffect(() => {
    // Apply default reminder setting from theme
    if (dueDate && taskReminderDefault) {
      // Start with an empty selection
      const initialReminders: { id: string; value: string }[] = [];

      // Add the default reminder based on user preference
      switch (taskReminderDefault) {
        case "attime":
          initialReminders.push({ id: "at_time", value: "At time of event" });
          break;
        case "10min":
          initialReminders.push({
            id: "10_min_before",
            value: "10 minutes before",
          });
          break;
        case "1hour":
          initialReminders.push({
            id: "1_hour_before",
            value: "1 hour before",
          });
          break;
        case "1day":
          initialReminders.push({ id: "1_day_before", value: "1 day before" });
          break;
      }

      // Set the selected reminders
      if (initialReminders.length > 0) {
        setSelectedReminders(initialReminders);
      }
    }
  }, [dueDate, taskReminderDefault]);

  const handleAddCustomReminder = (
    days: number,
    hours: number,
    minutes: number
  ) => {
    const simpleId = `reminder_${days}_${hours}_${minutes}_${Date.now()}`;

    const newReminder = {
      id: simpleId,
      days,
      hours,
      minutes,
      label: `${days > 0 ? `${days} day${days > 1 ? "s" : ""} ` : ""}${
        hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""} ` : ""
      }${
        minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""} ` : ""
      }before`,
    };

    setCustomReminders([...customReminders, newReminder]);
    //setSelectedReminders([...selectedReminders, simpleId])
    setCustomReminderModalVisible(false);
  };

  const handleCreateTask = async () => {
    if (!title.trim() || !user) return;

    try {
      // Create a task object with all required fields
      const taskData: any = {
        title,
        description,
        status,
        priority,
        createdBy: user.id,
        dueDate: dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
      };

      // Only add assignedTo fields if we have an assigned user
      if (assignedUser?.id) {
        taskData.assignedTo = assignedUser.id;
        taskData.assignedToName = assignedUser.displayName;
      }

      // If this is a recurring task, use the createRecurringTask action
      if (recurrenceOptions && dueDate) {
        // Make sure we have a valid endDate if endType is "date"
        const safeRecurrenceOptions = { ...recurrenceOptions };
        if (safeRecurrenceOptions.endType !== "date") {
          delete safeRecurrenceOptions.endDate;
        }

        await dispatch(
          createRecurringTask({
            taskData,
            recurrenceOptions: safeRecurrenceOptions,
          })
        ).unwrap();
      } else {
        // Otherwise create a regular task
        const result = await dispatch(createTask(taskData)).unwrap();

        if (selectedReminders.length > 0 && dueDate && isValid(dueDate)) {
          const reminderIdentifiers: string[] = [];

          const allReminderTimes = [
            ...defaultReminderTimes,
            ...customReminders,
          ];

          for (const reminderId of selectedReminders) {
            const reminderTime = allReminderTimes.find(
              (r) => r.id === reminderId.id
            );
            if (reminderTime) {
              const identifier = await scheduleCustomTaskReminder(result, {
                days: reminderTime.days,
                hours: reminderTime.hours,
                minutes: reminderTime.minutes,
              });

              if (identifier) {
                reminderIdentifiers.push(identifier);
              }
            }
          }

          if (reminderIdentifiers.length > 0) {
            await dispatch(
              updateTask({
                taskId: result.id,
                updates: {
                  reminderSet: true,
                  reminderIdentifiers: reminderIdentifiers,
                },
              })
            );
          }
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create task:", error);
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

  const handleOpenContactSelector = () => {
    setContactSelectorVisible(true);
  };

  // Handle recurrence options change
  const handleRecurrenceChange = (options: RecurrenceOptions | null) => {
    setRecurrenceOptions(options);
    setRecurrenceModalVisible(false);
  };

  const getRecurrenceDescription = (
    options: RecurrenceOptions,
    date: Date
  ): string => {
    if (!options) return "Does not repeat";

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
        <Appbar.Content title="Create Task" color="white" />
      </Appbar.Header>

      <ScrollView style={{ backgroundColor: theme.colors.background }}>
        <View style={[styles.formCard, { backgroundColor: theme.colors.card }]}>
          <TextInput
            style={styles.input}
            mode="outlined"
            label="Task Title"
            value={title}
            onChangeText={setTitle}
            theme={{ colors: { text: theme.colors.text } }}
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            theme={{ colors: { text: theme.colors.text } }}
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
              buttonColor={
                priority === "low" ? theme.colors.primary : undefined
              }
              textColor={
                priority === "low" ? theme.colors.onPrimary : theme.colors.text
              }
            >
              Low
            </Button>
            <Button
              mode={priority === "medium" ? "contained" : "outlined"}
              onPress={() => setPriority("medium")}
              style={styles.priorityButton}
              buttonColor={
                priority === "medium" ? theme.colors.primary : undefined
              }
              textColor={
                priority === "medium"
                  ? theme.colors.onPrimary
                  : theme.colors.text
              }
            >
              Medium
            </Button>
            <Button
              mode={priority === "high" ? "contained" : "outlined"}
              onPress={() => setPriority("high")}
              style={styles.priorityButton}
              buttonColor={
                priority === "high" ? theme.colors.primary : undefined
              }
              textColor={
                priority === "high" ? theme.colors.onPrimary : theme.colors.text
              }
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
            textColor={theme.colors.text}
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
                    {recurrenceOptions
                      ? getRecurrenceDescription(recurrenceOptions, dueDate)
                      : "Does not repeat"}
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

          {/* Only show notifications if not a recurring task */}
          <View>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Reminders
            </Text>
            {selectedReminders.map((reminder) => {
              return (
                <ReminderItem
                  key={reminder.id}
                  id={reminder.id}
                  value={reminder.value}
                  onRemove={handleRemoveReminder}
                  onChange={handleSelectReminder}
                />
              );
            })}
            <Button
              mode="outlined"
              onPress={handleAddReminder}
              style={styles.addReminderButton}
            >
              Add Reminder
            </Button>
          </View>

          <Button
            mode="contained"
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !title.trim()}
            onPress={handleCreateTask}
          >
            Create Task
          </Button>
        </View>
      </ScrollView>

      <DateTimePickerModal
        visible={showDateTimePicker}
        onDismiss={() => setShowDateTimePicker(false)}
        onConfirm={handleDateTimeConfirm}
        initialDate={dueDate || new Date()}
      />

      <CustomReminderModal
        visible={customReminderModalVisible}
        onDismiss={() => setCustomReminderModalVisible(false)}
        onSave={handleAddCustomReminder}
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
          //setSelectedReminders(selected);
          setNotificationPickerVisible(false);
        }}
        initialSelected={[]}
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
  },
});

export default CreateTaskScreen;

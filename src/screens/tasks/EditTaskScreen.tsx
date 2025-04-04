"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Appbar,
  Chip,
  Menu,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTask,
  updateTask,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
} from "../../store/slices/taskSlice";
import DateTimePicker from "@react-native-community/datetimepicker";
import { isValid } from "date-fns";

// Add these imports at the top
import NotificationSettings from "../../components/NotificationSettings";
import CustomReminderModal from "../../components/CustomReminderModal";
import {
  scheduleCustomTaskReminder,
  cancelTaskReminder,
} from "../../services/NotificationService";
import { v4 as uuidv4 } from "uuid";

const EditTaskScreen = ({ navigation, route }: any) => {
  const { taskId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentTask, isLoading } = useAppSelector((state) => state.tasks);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Add these state variables inside the component
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
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

  // Add this constant inside the component
  const defaultReminderTimes = [
    { id: "at_time", days: 0, hours: 0, minutes: 0, label: "At time of event" },
    {
      id: "10_min_before",
      days: 0,
      hours: 0,
      minutes: 10,
      label: "10 minutes before",
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
      setCategory(currentTask.category || "other");
      setTags(currentTask.tags || []);

      // Safely set the due date
      if (currentTask.dueDate) {
        const date = new Date(currentTask.dueDate);
        setDueDate(isValid(date) ? date : null);
      } else {
        setDueDate(null);
      }
    }
  }, [currentTask]);

  // Add this useEffect to initialize notification settings when the task is loaded
  useEffect(() => {
    if (currentTask) {
      // Check if the task has reminders set
      setNotificationsEnabled(!!currentTask.reminderSet);

      // If we had stored the selected reminder IDs in the task, we could load them here
      // For now, we'll just set a default if reminders are enabled
      if (currentTask.reminderSet) {
        setSelectedReminders(["1_hour_before"]);
      }
    }
  }, [currentTask]);

  // Add this function to handle custom reminders
  const handleAddCustomReminder = (
    days: number,
    hours: number,
    minutes: number
  ) => {
    const newReminder = {
      id: uuidv4(),
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
    setSelectedReminders([...selectedReminders, newReminder.id]);
    setCustomReminderModalVisible(false);
  };

  // Modify the handleUpdateTask function to include notification scheduling
  const handleUpdateTask = async () => {
    if (!title.trim() || !currentTask) return;

    try {
      // Cancel existing reminders if any
      if (currentTask.reminderIdentifier) {
        await cancelTaskReminder(currentTask.reminderIdentifier);
      }

      // If the task has multiple reminder identifiers
      if (
        currentTask.reminderIdentifiers &&
        Array.isArray(currentTask.reminderIdentifiers)
      ) {
        for (const identifier of currentTask.reminderIdentifiers) {
          await cancelTaskReminder(identifier);
        }
      }

      // Prepare the updates
      const updates: any = {
        title,
        description,
        status,
        priority,
        category,
        tags,
        dueDate: dueDate ? dueDate.getTime() : undefined,
        updatedAt: Date.now(),
        reminderSet: notificationsEnabled,
        reminderIdentifier: null,
        reminderIdentifiers: [],
      };

      // Schedule new notifications if enabled and due date is set
      if (notificationsEnabled && dueDate && isValid(dueDate)) {
        const reminderIdentifiers: string[] = [];

        // Get all reminder times (default + custom)
        const allReminderTimes = [...defaultReminderTimes, ...customReminders];

        // Schedule selected reminders
        for (const reminderId of selectedReminders) {
          const reminderTime = allReminderTimes.find(
            (r) => r.id === reminderId
          );
          if (reminderTime) {
            const identifier = await scheduleCustomTaskReminder(
              { ...currentTask, title, dueDate: dueDate.getTime() },
              {
                days: reminderTime.days,
                hours: reminderTime.hours,
                minutes: reminderTime.minutes,
              }
            );

            if (identifier) {
              reminderIdentifiers.push(identifier);
            }
          }
        }

        // Add reminder identifiers to updates
        if (reminderIdentifiers.length > 0) {
          updates.reminderIdentifiers = reminderIdentifiers;
          updates.reminderSet = true;
        }
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
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && isValid(selectedDate)) {
      setDueDate(selectedDate);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getCategoryColor = (cat: TaskCategory): string => {
    switch (cat) {
      case "work":
        return "#4285F4"; // Blue
      case "personal":
        return "#EA4335"; // Red
      case "shopping":
        return "#FBBC05"; // Yellow
      case "health":
        return "#34A853"; // Green
      case "finance":
        return "#8E24AA"; // Purple
      default:
        return "#757575"; // Gray
    }
  };

  if (!currentTask) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Edit Task" color="white"
 />
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
            Category
          </Text>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCategoryMenuVisible(true)}
                style={[
                  styles.categoryButton,
                  { borderColor: getCategoryColor(category) },
                ]}
                labelStyle={{ color: getCategoryColor(category) }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            }
          >
            <Menu.Item
              title="Work"
              onPress={() => {
                setCategory("work");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="briefcase"
            />
            <Menu.Item
              title="Personal"
              onPress={() => {
                setCategory("personal");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="account"
            />
            <Menu.Item
              title="Shopping"
              onPress={() => {
                setCategory("shopping");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="cart"
            />
            <Menu.Item
              title="Health"
              onPress={() => {
                setCategory("health");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="heart"
            />
            <Menu.Item
              title="Finance"
              onPress={() => {
                setCategory("finance");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="cash"
            />
            <Menu.Item
              title="Other"
              onPress={() => {
                setCategory("other");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="dots-horizontal"
            />
          </Menu>

          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.primary, marginTop: 16 },
            ]}
          >
            Tags
          </Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                style={[
                  styles.tagChip,
                  { backgroundColor: theme.dark ? "#444444" : "#f0f0f0" },
                ]}
                textStyle={{ color: theme.colors.text }}
                onClose={() => handleRemoveTag(tag)}
              >
                {tag}
              </Chip>
            ))}
          </View>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              mode="outlined"
              label="Add Tag"
              value={newTag}
              onChangeText={setNewTag}
              theme={{ colors: { text: theme.colors.text } }}
            />
            <Button
              mode="contained"
              onPress={handleAddTag}
              style={styles.addTagButton}
              disabled={!newTag.trim()}
              buttonColor={theme.colors.primary}
            >
              Add
            </Button>
          </View>

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
            Due Date (Optional)
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
            textColor={theme.colors.text}
          >
            {dueDate && isValid(dueDate)
              ? dueDate.toLocaleDateString()
              : "Select Due Date"}
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* Add this JSX before the Update Task button */}
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Notifications
          </Text>
          <NotificationSettings
            enabled={notificationsEnabled}
            onToggle={setNotificationsEnabled}
            reminderTimes={[...defaultReminderTimes, ...customReminders]}
            selectedReminders={selectedReminders}
            onSelectReminder={(reminderId, selected) => {
              if (selected) {
                setSelectedReminders([...selectedReminders, reminderId]);
              } else {
                setSelectedReminders(
                  selectedReminders.filter((id) => id !== reminderId)
                );
              }
            }}
            onAddCustomReminder={() => setCustomReminderModalVisible(true)}
          />

          <CustomReminderModal
            visible={customReminderModalVisible}
            onDismiss={() => setCustomReminderModalVisible(false)}
            onSave={handleAddCustomReminder}
          />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  categoryButton: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  tagChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  tagInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
    marginRight: 8,
  },
  addTagButton: {
    marginTop: 8,
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
  dateButton: {
    marginBottom: 24,
  },
  updateButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default EditTaskScreen;

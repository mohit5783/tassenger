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
  createTask,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
  updateTask,
} from "../../store/slices/taskSlice";
import DateTimePicker from "@react-native-community/datetimepicker";
import { isValid } from "date-fns";
import UserAssignmentModal from "../../components/UserAssignmentModal";
import NotificationSettings from "../../components/NotificationSettings";
import CustomReminderModal from "../../components/CustomReminderModal";
import { scheduleCustomTaskReminder } from "../../services/NotificationService";
import { v4 as uuidv4 } from "uuid";

const CreateTaskScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

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
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{
    id: string;
    displayName?: string;
  } | null>(null);

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
    const template = route.params?.template;
    if (template) {
      setTitle(template.title);
      setDescription(template.description || "");
      setPriority(template.priority);
      setCategory(template.category || "other");
      setTags(template.tags || []);
    }
  }, [route.params]);

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

  const handleCreateTask = async () => {
    if (!title.trim() || !user) return;

    try {
      // Create a task object with all required fields
      const taskData: any = {
        title,
        description,
        status,
        priority,
        category,
        tags,
        createdBy: user.id,
        dueDate: dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
      };

      // Only add assignedTo fields if we have an assigned user
      if (assignedUser?.id) {
        taskData.assignedTo = assignedUser.id;
        taskData.assignedToName = assignedUser.displayName;
      }

      const result = await dispatch(createTask(taskData)).unwrap();

      if (notificationsEnabled && dueDate && isValid(dueDate)) {
        const reminderIdentifiers: string[] = [];

        const allReminderTimes = [...defaultReminderTimes, ...customReminders];

        for (const reminderId of selectedReminders) {
          const reminderTime = allReminderTimes.find(
            (r) => r.id === reminderId
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

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create task:", error);
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

  const handleUserSelect = (selectedUser: any) => {
    if (selectedUser) {
      setAssignedUser({
        id: selectedUser.id,
        displayName: selectedUser.displayName || selectedUser.phoneNumber,
      });
    } else {
      setAssignedUser(null);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Create Task" color={theme.colors.onPrimary} />
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

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Assignment
          </Text>
          <Button
            mode="outlined"
            onPress={() => setAssigneeModalVisible(true)}
            style={styles.assignButton}
            icon="account-plus"
            textColor={theme.colors.text}
          >
            {assignedUser
              ? `Assigned to: ${assignedUser.displayName}`
              : "Assign to someone"}
          </Button>

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
      <UserAssignmentModal
        visible={assigneeModalVisible}
        onDismiss={() => setAssigneeModalVisible(false)}
        onSelectUser={handleUserSelect}
        currentAssigneeId={assignedUser?.id}
      />
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
  createButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  assignButton: {
    marginBottom: 24,
  },
});

export default CreateTaskScreen;

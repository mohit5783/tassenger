"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Modal } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Chip,
  Menu,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createGroupTask,
  type TaskPriority,
  type TaskCategory,
  type TaskStatus,
} from "../../store/slices/taskSlice";
import { createRecurringTask } from "../../store/slices/recurrenceSlice";
import { fetchGroup } from "../../store/slices/groupsSlice";
import DateTimePicker from "@react-native-community/datetimepicker";
import { isValid } from "date-fns";
import ContactSelector from "../../components/ContactSelector";
import type { Contact } from "../../services/ContactsService";
import RecurrenceSelector from "../../components/RecurrenceSelector";
import type { RecurrenceOptions } from "../../types/recurrence";

const CreateGroupTaskScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentGroup, isLoading: groupLoading } = useAppSelector(
    (state) => state.groups
  );
  const { isLoading } = useAppSelector((state) => state.tasks);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [contactSelectorVisible, setContactSelectorVisible] = useState(false);
  const [reviewerSelectorVisible, setReviewerSelectorVisible] = useState(false);
  const [assignee, setAssignee] = useState<{
    id: string;
    displayName?: string;
  } | null>(null);
  const [reviewer, setReviewer] = useState<{
    id: string;
    displayName?: string;
  } | null>(null);
  const [recurrenceOptions, setRecurrenceOptions] =
    useState<RecurrenceOptions | null>(null);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, groupId]);

  const handleRecurrenceChange = (options: RecurrenceOptions | null) => {
    setRecurrenceOptions(options);
  };

  const handleCreateTask = async () => {
    if (!title.trim() || !user || !assignee) {
      Alert.alert(
        "Error",
        "Please fill in all required fields and assign the task to a group member"
      );
      return;
    }

    try {
      // If this is a recurring task, use the createRecurringTask action
      if (recurrenceOptions && dueDate) {
        // Create the task data object
        const taskData = {
          title,
          description,
          priority,
          category,
          tags,
          status: "assigned" as TaskStatus,
          createdBy: user.id,
          dueDate: dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
          groupId,
          assigneeId: assignee.id,
          assigneeName: assignee.displayName,
          reviewerId: reviewer?.id,
          reviewerName: reviewer?.displayName,
        };

        // Keep the original recurrenceOptions with Date object intact
        // The createRecurringTask action will handle the conversion internally
        await dispatch(
          createRecurringTask({
            taskData,
            recurrenceOptions: recurrenceOptions,
          })
        ).unwrap();
      } else {
        // Otherwise create a regular group task
        await dispatch(
          createGroupTask({
            title,
            description,
            priority,
            category,
            tags,
            status: "assigned", // Add the missing status property
            createdBy: user.id,
            dueDate:
              dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
            groupId,
            assigneeId: assignee.id,
            assigneeName: assignee.displayName,
            reviewerId: reviewer?.id,
            reviewerName: reviewer?.displayName,
          })
        ).unwrap();
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create group task:", error);
      Alert.alert("Error", "Failed to create task. Please try again.");
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

  const handleContactSelect = (contact: Contact) => {
    if (contact && contact.userId) {
      setAssignee({
        id: contact.userId,
        displayName: contact.name,
      });
    }
    setContactSelectorVisible(false);
  };

  const handleReviewerSelect = (contact: Contact) => {
    if (contact && contact.userId) {
      setReviewer({
        id: contact.userId,
        displayName: contact.name,
      });
    }
    setReviewerSelectorVisible(false);
  };

  if (groupLoading || !currentGroup) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: "black" }}>
          <Appbar.BackAction
            color="white"
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content
            title="Create Group Task"
            color={theme.colors.onPrimary}
          />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text>Loading group...</Text>
        </View>
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
        <Appbar.Content
          title={`New Task for ${currentGroup.name}`}
          color={theme.colors.onPrimary}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.dark ? theme.colors.card : "white" },
          ]}
        >
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
            Assignment
          </Text>
          <Button
            mode="outlined"
            onPress={() => setContactSelectorVisible(true)}
            style={styles.assignButton}
            icon="account-outline"
            textColor={theme.colors.text}
            buttonColor={theme.dark ? theme.colors.background : undefined}
          >
            {assignee
              ? `Assigned to: ${assignee.displayName}`
              : "Assign to Group Member"}
          </Button>

          <Button
            mode="outlined"
            onPress={() => setReviewerSelectorVisible(true)}
            style={styles.assignButton}
            icon="account-check-outline"
            textColor={theme.colors.text}
            buttonColor={theme.dark ? theme.colors.background : undefined}
          >
            {reviewer
              ? `Reviewer: ${reviewer.displayName}`
              : "Add Reviewer (Optional)"}
          </Button>

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
                buttonColor={theme.dark ? theme.colors.background : undefined}
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
                style={styles.tagChip}
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
              theme={{
                colors: {
                  text: theme.colors.text,
                  background: theme.dark ? theme.colors.background : undefined,
                },
              }}
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
            Priority
          </Text>
          <View style={styles.priorityContainer}>
            <Button
              mode={priority === "low" ? "contained" : "outlined"}
              onPress={() => setPriority("low")}
              style={styles.priorityButton}
              buttonColor={
                priority === "low"
                  ? theme.colors.primary
                  : theme.dark
                  ? theme.colors.background
                  : undefined
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
                priority === "medium"
                  ? theme.colors.primary
                  : theme.dark
                  ? theme.colors.background
                  : undefined
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
                priority === "high"
                  ? theme.colors.primary
                  : theme.dark
                  ? theme.colors.background
                  : undefined
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
            buttonColor={theme.dark ? theme.colors.background : undefined}
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

          {dueDate && (
            <View
              style={[
                styles.recurrenceSection,
                { backgroundColor: theme.dark ? "#333333" : "#f9f9f9" },
              ]}
            >
              <RecurrenceSelector
                initialDueDate={dueDate}
                onRecurrenceChange={handleRecurrenceChange}
                initialOptions={recurrenceOptions}
              />
            </View>
          )}

          <Button
            mode="contained"
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !title.trim() || !assignee}
            onPress={handleCreateTask}
          >
            Create Task
          </Button>
        </View>
      </ScrollView>

      {contactSelectorVisible && (
        <Modal
          visible={contactSelectorVisible}
          onRequestClose={() => setContactSelectorVisible(false)}
          animationType="slide"
        >
          <ContactSelector
            onSelectContact={handleContactSelect}
            onCancel={() => setContactSelectorVisible(false)}
            title="Assign Task"
          />
        </Modal>
      )}

      {reviewerSelectorVisible && (
        <Modal
          visible={reviewerSelectorVisible}
          onRequestClose={() => setReviewerSelectorVisible(false)}
          animationType="slide"
        >
          <ContactSelector
            onSelectContact={handleReviewerSelect}
            onCancel={() => setReviewerSelectorVisible(false)}
            title="Select Reviewer"
          />
        </Modal>
      )}
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
  content: {
    flex: 1,
  },
  formCard: {
    backgroundColor: "white",
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
  assignButton: {
    marginBottom: 16,
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
  recurrenceSection: {
    marginBottom: 24,
    borderRadius: 8,
    padding: 8,
  },
});

export default CreateGroupTaskScreen;

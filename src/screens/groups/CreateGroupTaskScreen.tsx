"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Appbar,
  TextInput,
  Button,
  Menu,
  Divider,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createGroupTask, fetchTasks } from "../../store/slices/taskSlice";
import { fetchGroup } from "../../store/slices/groupSlice";
import DateTimePicker from "@react-native-community/datetimepicker";
import { isValid } from "date-fns";

interface CreateGroupTaskScreenProps {
  navigation: any;
  route: any;
}

const CreateGroupTaskScreen = ({
  navigation,
  route,
}: CreateGroupTaskScreenProps) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.tasks);
  const { currentGroup } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // For assignees and reviewers selection
  const [assigneeSelectVisible, setAssigneeSelectVisible] = useState(false);
  const [reviewerSelectVisible, setReviewerSelectVisible] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<any>(null);
  const [selectedReviewer, setSelectedReviewer] = useState<any>(null);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, groupId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && isValid(selectedDate)) {
      setDueDate(selectedDate);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim() || !user || !currentGroup || !selectedAssignee) return;

    try {
      await dispatch(
        createGroupTask({
          title,
          description,
          priority,
          category: "work", // Default for group tasks
          status: "assigned", // Add this line to fix the error
          createdBy: user.id,
          groupId,
          assigneeId: selectedAssignee.userId,
          assigneeName: selectedAssignee.userName,
          reviewerId: selectedReviewer?.userId,
          reviewerName: selectedReviewer?.userName,
          dueDate: dueDate && isValid(dueDate) ? dueDate.getTime() : undefined,
        })
      ).unwrap();

      await dispatch(fetchTasks(user.id));
      navigation.goBack();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  // Filter out current user from assignee/reviewer lists
  const getGroupMembers = () => {
    if (!currentGroup) return [];
    // For assignee, show all members
    return currentGroup.members.filter((member) => member.userId !== user?.id);
  };

  // Filter to only show admins for reviewers
  const getReviewers = () => {
    if (!currentGroup) return [];
    return currentGroup.members.filter(
      (member) =>
        member.userId !== user?.id && member.userId !== selectedAssignee?.userId
    );
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
        <Appbar.Content
          title="Create Group Task"
          color={theme.colors.onPrimary}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
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

          <Text style={styles.sectionTitle}>Task Assignment</Text>

          <View style={styles.assignmentSection}>
            <Text style={styles.label}>Assignee (Required):</Text>
            <Button
              mode="outlined"
              onPress={() => setAssigneeSelectVisible(true)}
              style={styles.selectButton}
            >
              {selectedAssignee ? selectedAssignee.userName : "Select Assignee"}
            </Button>

            <Text style={styles.label}>Reviewer (Optional):</Text>
            <Button
              mode="outlined"
              onPress={() => setReviewerSelectVisible(true)}
              style={styles.selectButton}
              disabled={!selectedAssignee}
            >
              {selectedReviewer ? selectedReviewer.userName : "Select Reviewer"}
            </Button>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Priority</Text>
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

          <Text style={styles.sectionTitle}>Due Date (Optional)</Text>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
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

          <Button
            mode="contained"
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !title.trim() || !selectedAssignee}
            onPress={handleCreateTask}
          >
            Create Task
          </Button>
        </View>
      </ScrollView>

      {/* Assignee Selection Menu */}
      <Menu
        visible={assigneeSelectVisible}
        onDismiss={() => setAssigneeSelectVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          title="Select Assignee"
          disabled
          style={{ backgroundColor: theme.colors.primary }}
          titleStyle={{ color: theme.colors.onPrimary }}
        />
        {getGroupMembers().map((member) => (
          <Menu.Item
            key={member.userId}
            title={member.userName || member.userId}
            onPress={() => {
              setSelectedAssignee(member);
              // If the reviewer is the same as the assignee, clear it
              if (
                selectedReviewer &&
                selectedReviewer.userId === member.userId
              ) {
                setSelectedReviewer(null);
              }
              setAssigneeSelectVisible(false);
            }}
          />
        ))}
      </Menu>

      {/* Reviewer Selection Menu */}
      <Menu
        visible={reviewerSelectVisible}
        onDismiss={() => setReviewerSelectVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          title="Select Reviewer"
          disabled
          style={{ backgroundColor: theme.colors.primary }}
          titleStyle={{ color: theme.colors.onPrimary }}
        />
        <Menu.Item
          title="No Reviewer"
          onPress={() => {
            setSelectedReviewer(null);
            setReviewerSelectVisible(false);
          }}
        />
        {getReviewers().map((member) => (
          <Menu.Item
            key={member.userId}
            title={member.userName || member.userId}
            onPress={() => {
              setSelectedReviewer(member);
              setReviewerSelectVisible(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formCard: {
    padding: 16,
    backgroundColor: "white",
    margin: 8,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#075E54", // WhatsApp green
  },
  assignmentSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
  },
  selectButton: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
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
    paddingVertical: 8,
  },
  menu: {
    position: "absolute",
    width: "80%",
    maxHeight: "60%",
    top: 120,
    alignSelf: "center",
  },
});

export default CreateGroupTaskScreen;

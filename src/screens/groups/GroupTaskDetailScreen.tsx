"use client";

import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Modal } from "react-native";
import {
  Text,
  Appbar,
  Card,
  Title,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  TextInput,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchTask,
  updateTaskStatus,
  fetchTaskRejections,
} from "../../store/slices/taskSlice";
import { fetchGroup } from "../../store/slices/groupSlice";
import { format } from "date-fns";
import type { TaskRejection } from "../../types/group";
import type { TaskStatus } from "../../types/task";

interface GroupTaskDetailScreenProps {
  navigation: any;
  route: any;
}

const GroupTaskDetailScreen = ({
  navigation,
  route,
}: GroupTaskDetailScreenProps) => {
  const { taskId, groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentTask, rejections, isLoading } = useAppSelector(
    (state) => state.tasks
  );
  const { currentGroup } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTask(taskId));
      dispatch(fetchTaskRejections(taskId));
    }
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, taskId, groupId]);

  // Check user permissions
  const isAdmin = currentGroup?.members.some(
    (member) => member.userId === user?.id && member.role === "admin"
  );

  const isAssignee = currentTask?.assignment?.assigneeId === user?.id;
  const isReviewer = currentTask?.assignment?.reviewerId === user?.id;

  // Determine which actions are available to this user
  const canStartTask = isAssignee && currentTask?.status === "assigned";
  const canMarkAsDone = isAssignee && currentTask?.status === "inProgress";
  const canReviewTask =
    (isReviewer || isAdmin) && currentTask?.status === "doneByAssignee";

  const canReopen =
    (isReviewer || isAdmin) && currentTask?.status === "pendingReview";

  const handleUpdateStatus = (newStatus: string) => {
    if (!currentTask) return;

    dispatch(
      updateTaskStatus({
        taskId: currentTask.id,
        newStatus: newStatus as TaskStatus,
      })
    );
  };

  const handleRejectTask = () => {
    if (!currentTask || !rejectionReason.trim()) return;

    dispatch(
      updateTaskStatus({
        taskId: currentTask.id,
        newStatus: "reopened" as TaskStatus,
        rejectionReason: rejectionReason.trim(),
      })
    );

    setRejectModalVisible(false);
    setRejectionReason("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return theme.colors.customColors.task.todo;
      case "inProgress":
        return theme.colors.customColors.task.inProgress;
      case "doneByAssignee":
        return "#8E24AA"; // Purple
      case "pendingReview":
        return "#FF9800"; // Orange
      case "reviewed":
        return theme.colors.customColors.task.completed;
      case "reopened":
        return "#F44336"; // Red
      default:
        return theme.colors.customColors.task.todo;
    }
  };

  const statusLabels: Record<string, string> = {
    assigned: "Assigned",
    inProgress: "In Progress",
    doneByAssignee: "Done by Assignee",
    pendingReview: "Pending Review",
    reviewed: "Reviewed",
    reopened: "Reopened",
  };

  // Helper function to safely format dates
  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return "Not set";
    return format(new Date(timestamp), "PPp");
  };

  if (isLoading || !currentTask) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Appbar.Content title="Task Details" color={theme.colors.onPrimary} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{currentTask.title}</Title>

            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(currentTask.status) },
              ]}
              textStyle={{ color: "#fff" }}
            >
              {statusLabels[currentTask.status] || currentTask.status}
            </Chip>

            {currentTask.description && (
              <Text style={styles.description}>{currentTask.description}</Text>
            )}

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {formatDate(currentTask.createdAt)}
                </Text>
              </View>

              {currentTask.dueDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      currentTask.status !== "reviewed" &&
                      new Date(currentTask.dueDate) < new Date()
                        ? { color: theme.colors.error }
                        : {},
                    ]}
                  >
                    {formatDate(currentTask.dueDate)}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Priority</Text>
                <Text style={styles.detailValue}>
                  {currentTask.priority.charAt(0).toUpperCase() +
                    currentTask.priority.slice(1)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assignee</Text>
                <Text style={styles.detailValue}>
                  {currentTask.assignment?.assigneeName || "Unassigned"}
                  {isAssignee ? " (You)" : ""}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reviewer</Text>
                <Text style={styles.detailValue}>
                  {currentTask.assignment?.reviewerName || "No reviewer"}
                  {isReviewer ? " (You)" : ""}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Task Actions based on status and user role */}
        <Card style={styles.actionsCard}>
          <Card.Title title="Task Actions" />
          <Card.Content>
            <View style={styles.actionButtons}>
              {canStartTask && (
                <Button
                  mode="contained"
                  onPress={() => handleUpdateStatus("inProgress")}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  Start Working
                </Button>
              )}

              {canMarkAsDone && (
                <Button
                  mode="contained"
                  onPress={() => handleUpdateStatus("doneByAssignee")}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  Mark as Done
                </Button>
              )}

              {canReviewTask && (
                <View style={styles.reviewButtons}>
                  <Button
                    mode="contained"
                    onPress={() => handleUpdateStatus("reviewed")}
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor:
                          theme.colors.customColors.task.completed,
                      },
                    ]}
                  >
                    Approve
                  </Button>

                  <Button
                    mode="contained"
                    onPress={() => setRejectModalVisible(true)}
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.colors.error },
                    ]}
                  >
                    Reject
                  </Button>
                </View>
              )}

              {currentTask.status === "reopened" && isAssignee && (
                <Button
                  mode="contained"
                  onPress={() => handleUpdateStatus("inProgress")}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  Resume Working
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Rejection History */}
        {rejections.length > 0 && (
          <Card style={styles.rejectionsCard}>
            <Card.Title title="Rejection History" />
            <Card.Content>
              {rejections.map((rejection: TaskRejection) => (
                <View key={rejection.id} style={styles.rejectionItem}>
                  <Text style={styles.rejectionHeader}>
                    {rejection.reviewerName || "Reviewer"} rejected on{" "}
                    {formatDate(rejection.timestamp)}:
                  </Text>
                  <Text style={styles.rejectionReason}>{rejection.reason}</Text>
                  <Divider style={styles.divider} />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Title style={{ marginBottom: 16 }}>Reject Task</Title>

            <TextInput
              mode="outlined"
              label="Reason for rejection"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="text"
                onPress={() => setRejectModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleRejectTask}
                disabled={!rejectionReason.trim()}
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.error },
                ]}
              >
                Reject
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  statusChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 16,
  },
  description: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  detailsSection: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#555",
  },
  detailValue: {
    maxWidth: "60%",
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    gap: 16,
  },
  actionButton: {
    paddingVertical: 8,
  },
  reviewButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  rejectionsCard: {
    marginBottom: 16,
  },
  rejectionItem: {
    marginBottom: 16,
  },
  rejectionHeader: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  rejectionReason: {
    fontStyle: "italic",
    marginBottom: 8,
  },
  divider: {
    marginTop: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    marginLeft: 8,
  },
});

export default GroupTaskDetailScreen;

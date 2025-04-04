"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Chip,
  Avatar,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGroup, updateGroup } from "../../store/slices/groupsSlice";
import UserAssignmentModal from "../../components/UserAssignmentModal";
import { UserService } from "../../services/UserService";

const EditGroupScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentGroup, isLoading } = useAppSelector((state) => state.groups);
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<
    Array<{ id: string; displayName?: string }>
  >([]);
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, groupId]);

  useEffect(() => {
    if (currentGroup) {
      setName(currentGroup.name);
      setDescription(currentGroup.description || "");

      // Fix the member name resolution to not rely on participantNames
      const fetchMemberDetails = async () => {
        try {
          const memberObjects = [];
          for (const memberId of currentGroup.members) {
            // Try to fetch from UserService directly
            let memberName = memberId;

            try {
              const memberData = await UserService.getUserById(memberId);
              if (memberData) {
                memberName =
                  memberData.displayName || memberData.phoneNumber || memberId;
              }
            } catch (err) {
              console.error("Error fetching user data:", err);
            }

            memberObjects.push({
              id: memberId,
              displayName: memberName,
            });
          }
          setMembers(memberObjects);
        } catch (error) {
          console.error("Error fetching member details:", error);
        }
      };

      fetchMemberDetails();
    }
  }, [currentGroup]);

  const handleUpdateGroup = async () => {
    if (!name.trim() || !user?.id) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    try {
      await dispatch(
        updateGroup({
          groupId,
          updates: {
            name: name.trim(),
            description: description.trim(),
            updatedAt: Date.now(),
          },
        })
      ).unwrap();

      navigation.goBack();
    } catch (error) {
      console.error("Failed to update group:", error);
      Alert.alert("Error", "Failed to update group. Please try again.");
    }
  };

  const handleAddMember = (selectedUser: any) => {
    if (selectedUser && !members.some((m) => m.id === selectedUser.id)) {
      setMembers([
        ...members,
        {
          id: selectedUser.id,
          displayName: selectedUser.displayName || selectedUser.phoneNumber,
        },
      ]);
    }
    setAssigneeModalVisible(false);
  };

  if (isLoading || !currentGroup) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ backgroundColor: "black" }}>
          <Appbar.BackAction
            color="white"
            onPress={() => navigation.goBack()}
          />
          <Appbar.Content title="Edit Group" color="white"
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
        <Appbar.Content title="Edit Group" color="white"
 />
      </Appbar.Header>

      <ScrollView style={{ backgroundColor: theme.colors.background }}>
        <View style={[styles.formCard, { backgroundColor: theme.colors.card }]}>
          <TextInput
            style={styles.input}
            mode="outlined"
            label="Group Name"
            value={name}
            onChangeText={setName}
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
            Members
          </Text>

          <View style={styles.membersContainer}>
            {members.map((member) => (
              <Chip
                key={member.id}
                style={[
                  styles.memberChip,
                  { backgroundColor: theme.dark ? "#333" : "#f0f0f0" },
                ]}
                textStyle={{ color: theme.colors.text }}
                avatar={
                  <Avatar.Text
                    size={24}
                    label={member.displayName?.substring(0, 1) || "U"}
                  />
                }
                disabled={member.id === user?.id} // Can't remove yourself
              >
                {member.displayName || member.id}
                {member.id === user?.id ? " (You)" : ""}
              </Chip>
            ))}
          </View>

          <Text style={[styles.note, { color: theme.dark ? "#aaa" : "#666" }]}>
            Note: To add or remove members, please use the Group Members screen.
          </Text>

          <Button
            mode="contained"
            style={[
              styles.updateButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !name.trim() || !user?.id}
            onPress={handleUpdateGroup}
          >
            Update Group
          </Button>
        </View>
      </ScrollView>

      <UserAssignmentModal
        visible={assigneeModalVisible}
        onDismiss={() => setAssigneeModalVisible(false)}
        onSelectUser={handleAddMember}
        currentAssigneeId={null}
        allowMultiple={true}
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
  membersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  memberChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  note: {
    fontStyle: "italic",
    marginBottom: 16,
    color: "#666",
  },
  updateButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default EditGroupScreen;

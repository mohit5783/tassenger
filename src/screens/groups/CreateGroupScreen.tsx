"use client";

import { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Modal } from "react-native";
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
import { createGroup } from "../../store/slices/groupsSlice";
import ContactSelector from "../../components/ContactSelector";

// Update the component to use ContactSelector instead of UserAssignmentModal
const CreateGroupScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<
    Array<{ id: string; displayName?: string }>
  >([]);
  const [contactSelectorVisible, setContactSelectorVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!name.trim() || !user?.id) {
      // Show error if name is empty or user is not logged in
      Alert.alert("Error", "Group name is required");
      return;
    }

    try {
      setIsLoading(true);

      // Extract just the member IDs
      const memberIds = members.map((member) => member.id);

      // Make sure the current user is included
      if (!memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }

      await dispatch(
        createGroup({
          name: name.trim(),
          description: description.trim(),
          createdBy: user.id,
          members: memberIds,
        })
      ).unwrap();

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSelect = (contact: any) => {
    if (
      contact &&
      contact.userId &&
      !members.some((m) => m.id === contact.userId)
    ) {
      setMembers([
        ...members,
        {
          id: contact.userId,
          displayName: contact.name,
        },
      ]);
    }
    setContactSelectorVisible(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((member) => member.id !== memberId));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Create Group" color="white"
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
            Members
          </Text>

          <View style={styles.membersContainer}>
            {members.map((member) => (
              <Chip
                key={member.id}
                style={styles.memberChip}
                avatar={
                  <Avatar.Text
                    size={24}
                    label={member.displayName?.substring(0, 1) || "U"}
                  />
                }
                onClose={() => handleRemoveMember(member.id)}
              >
                {member.displayName || member.id}
              </Chip>
            ))}
          </View>

          <Button
            mode="outlined"
            onPress={() => setContactSelectorVisible(true)}
            style={styles.addMemberButton}
            icon="account-plus"
          >
            Add Members
          </Button>

          <Button
            mode="contained"
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !name.trim() || !user?.id}
            onPress={handleCreateGroup}
          >
            Create Group
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
            title="Add Group Members"
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
  addMemberButton: {
    marginBottom: 24,
  },
  createButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default CreateGroupScreen;

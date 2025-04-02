"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import {
  Text,
  Appbar,
  List,
  Avatar,
  Button,
  ActivityIndicator,
  FAB,
  Dialog,
  Portal,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGroup, removeGroupMember } from "../../store/slices/groupSlice";
import UserService, { type UserProfile } from "../../services/UserService";

const GroupMembersScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentGroup, isLoading } = useAppSelector((state) => state.groups);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removeMemberDialogVisible, setRemoveMemberDialogVisible] =
    useState(false);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchGroup(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    if (currentGroup?.members) {
      loadMembers();
    }
  }, [currentGroup]);

  const loadMembers = async () => {
    if (!currentGroup?.members || currentGroup.members.length === 0) return;

    setLoadingMembers(true);
    try {
      const memberData = await UserService.getUsersByIds(currentGroup.members);
      setMembers(memberData);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !user) return;

    try {
      await dispatch(
        removeGroupMember({
          groupId,
          userId: selectedMember.id,
        })
      ).unwrap();

      // Update local state
      setMembers(members.filter((member) => member.id !== selectedMember.id));
      setRemoveMemberDialogVisible(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
      Alert.alert("Error", "Failed to remove member from group");
    }
  };

  const isAdmin = currentGroup?.createdBy === user?.id;

  const renderMemberItem = ({ item }: { item: UserProfile }) => {
    const isGroupAdmin = item.id === currentGroup?.createdBy;
    const canRemove = isAdmin && !isGroupAdmin && item.id !== user?.id;

    return (
      <List.Item
        title={item.displayName || item.phoneNumber || "Unknown User"}
        description={isGroupAdmin ? "Admin" : "Member"}
        left={(props) => (
          <Avatar.Text
            {...props}
            size={40}
            label={(item.displayName || item.phoneNumber || "?")
              .substring(0, 1)
              .toUpperCase()}
          />
        )}
        right={(props) =>
          canRemove ? (
            <Button
              {...props}
              icon="account-remove"
              mode="text"
              onPress={() => {
                setSelectedMember(item);
                setRemoveMemberDialogVisible(true);
              }}
            >
              Remove
            </Button>
          ) : null
        }
      />
    );
  };

  if (isLoading || !currentGroup) {
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
        <Appbar.Content title="Group Members" color={theme.colors.onPrimary} />
      </Appbar.Header>

      {loadingMembers ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No members found</Text>
          }
        />
      )}

      {isAdmin && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="account-plus"
          onPress={() => navigation.navigate("AddGroupMembers", { groupId })}
        />
      )}

      <Portal>
        <Dialog
          visible={removeMemberDialogVisible}
          onDismiss={() => setRemoveMemberDialogVisible(false)}
        >
          <Dialog.Title>Remove Member</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to remove{" "}
              {selectedMember?.displayName ||
                selectedMember?.phoneNumber ||
                "this member"}{" "}
              from the group?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveMemberDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleRemoveMember}>Remove</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  listContent: {
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    color: "#888",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GroupMembersScreen;

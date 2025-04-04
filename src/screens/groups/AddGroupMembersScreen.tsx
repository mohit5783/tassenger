"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Appbar, ActivityIndicator } from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchGroup, addGroupMember } from "../../store/slices/groupsSlice";
import ContactSelector from "../../components/ContactSelector";

const AddGroupMembersScreen = ({ navigation, route }: any) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentGroup, isLoading: groupLoading } = useAppSelector(
    (state) => state.groups
  );
  const [contactSelectorVisible, setContactSelectorVisible] = useState(true);

  useEffect(() => {
    dispatch(fetchGroup(groupId));
  }, [dispatch, groupId]);

  const handleContactSelect = async (contact: any) => {
    if (!contact || !contact.userId) return;

    try {
      // Check if user is already a member
      if (currentGroup?.members.includes(contact.userId)) {
        Alert.alert(
          "Already a Member",
          "This user is already a member of the group."
        );
        return;
      }

      await dispatch(
        addGroupMember({
          groupId,
          userId: contact.userId,
        })
      ).unwrap();

      Alert.alert("Success", "Member added to group");
    } catch (error) {
      console.error("Failed to add member:", error);
      Alert.alert("Error", "Failed to add member to group");
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (groupLoading || !currentGroup) {
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
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content
          title="Add Group Members"
          color={theme.colors.onPrimary}
        />
      </Appbar.Header>

      <ContactSelector
        onSelectContact={handleContactSelect}
        onCancel={handleCancel}
        title="Add Group Members"
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
});

export default AddGroupMembersScreen;

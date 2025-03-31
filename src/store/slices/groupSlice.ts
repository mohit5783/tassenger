import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  orderBy,
} from "firebase/firestore";
import { db } from "../../api/firebase/config";
import type { Group, GroupMember, GroupRole } from "../../types/group";

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
};

// Create a new group
export const createGroup = createAsyncThunk(
  "groups/createGroup",
  async (
    {
      name,
      description,
      members,
      hasChat,
    }: {
      name: string;
      description?: string;
      members: { userId: string; userName?: string; role: GroupRole }[];
      hasChat: boolean;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const timestamp = Date.now();

      // Add the current user as an admin
      const initialMembers: GroupMember[] = [
        {
          id: auth.user.id,
          userId: auth.user.id,
          userName: auth.user.displayName || auth.user.phoneNumber,
          role: "admin",
          joinedAt: timestamp,
        },
        ...members.map((member) => ({
          id: member.userId,
          userId: member.userId,
          userName: member.userName,
          role: member.role,
          joinedAt: timestamp,
        })),
      ];

      const groupRef = await addDoc(collection(db, "groups"), {
        name,
        description,
        createdBy: auth.user.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        members: initialMembers,
        hasChat,
      });

      // If this group should have a chat, create a conversation for it
      if (hasChat) {
        const participantIds = initialMembers.map((member) => member.userId);
        const participantNames: Record<string, string> = {};

        initialMembers.forEach((member) => {
          if (member.userName) {
            participantNames[member.userId] = member.userName;
          }
        });

        const conversationRef = await addDoc(collection(db, "conversations"), {
          participants: participantIds,
          participantNames,
          title: name,
          isGroup: true,
          groupId: groupRef.id,
          createdAt: timestamp,
          updatedAt: timestamp,
          unreadCount: participantIds.reduce((acc, userId) => {
            acc[userId] = 0;
            return acc;
          }, {} as Record<string, number>),
        });

        // Update the group with the conversation ID
        await updateDoc(doc(db, "groups", groupRef.id), {
          conversationId: conversationRef.id,
        });
      }

      return {
        id: groupRef.id,
        name,
        description,
        createdBy: auth.user.id,
        createdAt: timestamp,
        updatedAt: timestamp,
        members: initialMembers,
        hasChat,
      } as Group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create group");
    }
  }
);

// Fetch user's groups
export const fetchGroups = createAsyncThunk(
  "groups/fetchGroups",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", {
          userId: auth.user.id,
          // We need to query by a specific field in the members array
          // This might need adjustment based on Firestore's capabilities
        }),
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const groups: Group[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        groups.push({
          id: doc.id,
          ...data,
        } as Group);
      });

      return groups;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch groups");
    }
  }
);

// Fetch a single group
export const fetchGroup = createAsyncThunk(
  "groups/fetchGroup",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        return rejectWithValue("Group not found");
      }

      const groupData = groupSnap.data();
      return { id: groupSnap.id, ...groupData } as Group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch group");
    }
  }
);

// Update group
export const updateGroup = createAsyncThunk(
  "groups/updateGroup",
  async (
    {
      groupId,
      updates,
    }: {
      groupId: string;
      updates: Partial<Group>;
    },
    { rejectWithValue }
  ) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: Date.now(),
      });

      return { groupId, updates };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update group");
    }
  }
);

// Add member to group
export const addGroupMember = createAsyncThunk(
  "groups/addGroupMember",
  async (
    {
      groupId,
      member,
    }: {
      groupId: string;
      member: { userId: string; userName?: string; role: GroupRole };
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        return rejectWithValue("Group not found");
      }

      const groupData = groupSnap.data() as Group;

      // Check if current user is an admin
      const currentUserMember = groupData.members.find(
        (m) => m.userId === auth.user.id
      );
      if (!currentUserMember || currentUserMember.role !== "admin") {
        return rejectWithValue("You don't have permission to add members");
      }

      const newMember: GroupMember = {
        id: member.userId,
        userId: member.userId,
        userName: member.userName,
        role: member.role,
        joinedAt: Date.now(),
      };

      await updateDoc(groupRef, {
        members: arrayUnion(newMember),
        updatedAt: Date.now(),
      });

      // If the group has a chat, add the new member to the conversation
      if (groupData.hasChat && groupData.conversationId) {
        const conversationRef = doc(
          db,
          "conversations",
          groupData.conversationId
        );
        await updateDoc(conversationRef, {
          participants: arrayUnion(member.userId),
          [`participantNames.${member.userId}`]:
            member.userName || member.userId,
          [`unreadCount.${member.userId}`]: 0,
          updatedAt: Date.now(),
        });
      }

      return { groupId, newMember };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add group member");
    }
  }
);

// Remove member from group
export const removeGroupMember = createAsyncThunk(
  "groups/removeGroupMember",
  async (
    {
      groupId,
      userId,
    }: {
      groupId: string;
      userId: string;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        return rejectWithValue("Group not found");
      }

      const groupData = groupSnap.data() as Group;

      // Check if current user is an admin
      const currentUserMember = groupData.members.find(
        (m) => m.userId === auth.user.id
      );
      if (!currentUserMember || currentUserMember.role !== "admin") {
        return rejectWithValue("You don't have permission to remove members");
      }

      // Find the member to remove
      const memberToRemove = groupData.members.find((m) => m.userId === userId);
      if (!memberToRemove) {
        return rejectWithValue("Member not found in group");
      }

      // Cannot remove the last admin
      const admins = groupData.members.filter((m) => m.role === "admin");
      if (memberToRemove.role === "admin" && admins.length === 1) {
        return rejectWithValue("Cannot remove the last admin from the group");
      }

      await updateDoc(groupRef, {
        members: arrayRemove(memberToRemove),
        updatedAt: Date.now(),
      });

      // If the group has a chat, remove the member from the conversation
      if (groupData.hasChat && groupData.conversationId) {
        const conversationRef = doc(
          db,
          "conversations",
          groupData.conversationId
        );
        await updateDoc(conversationRef, {
          participants: arrayRemove(userId),
          updatedAt: Date.now(),
        });
      }

      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove group member");
    }
  }
);

// Change member role
export const changeGroupMemberRole = createAsyncThunk(
  "groups/changeGroupMemberRole",
  async (
    {
      groupId,
      userId,
      newRole,
    }: {
      groupId: string;
      userId: string;
      newRole: GroupRole;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        return rejectWithValue("Group not found");
      }

      const groupData = groupSnap.data() as Group;

      // Check if current user is an admin
      const currentUserMember = groupData.members.find(
        (m) => m.userId === auth.user.id
      );
      if (!currentUserMember || currentUserMember.role !== "admin") {
        return rejectWithValue(
          "You don't have permission to change member roles"
        );
      }

      // Find the member to update
      const memberIndex = groupData.members.findIndex(
        (m) => m.userId === userId
      );
      if (memberIndex === -1) {
        return rejectWithValue("Member not found in group");
      }

      // Cannot demote the last admin
      if (
        newRole !== "admin" &&
        groupData.members[memberIndex].role === "admin"
      ) {
        const admins = groupData.members.filter((m) => m.role === "admin");
        if (admins.length === 1) {
          return rejectWithValue("Cannot demote the last admin in the group");
        }
      }

      // Update the member's role
      const updatedMembers = [...groupData.members];
      updatedMembers[memberIndex] = {
        ...updatedMembers[memberIndex],
        role: newRole,
      };

      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      return { groupId, userId, newRole };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to change member role");
    }
  }
);

// Delete group
export const deleteGroup = createAsyncThunk(
  "groups/deleteGroup",
  async (groupId: string, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as { auth: { user: any } };
      if (!auth.user) return rejectWithValue("User not authenticated");

      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        return rejectWithValue("Group not found");
      }

      const groupData = groupSnap.data() as Group;

      // Check if current user is an admin
      const currentUserMember = groupData.members.find(
        (m) => m.userId === auth.user.id
      );
      if (!currentUserMember || currentUserMember.role !== "admin") {
        return rejectWithValue(
          "You don't have permission to delete this group"
        );
      }

      // Delete the group
      await deleteDoc(groupRef);

      // If the group has a chat, delete the conversation
      if (groupData.hasChat && groupData.conversationId) {
        await deleteDoc(doc(db, "conversations", groupData.conversationId));
      }

      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete group");
    }
  }
);

const groupSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    clearGroupError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create group
    builder
      .addCase(createGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups.unshift(action.payload);
        state.currentGroup = action.payload;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch groups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch group
    builder
      .addCase(fetchGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroup = action.payload;

        // Update the group in the groups array if it exists
        const index = state.groups.findIndex(
          (group) => group.id === action.payload.id
        );
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update group
    builder
      .addCase(updateGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, updates } = action.payload;

        // Update in groups array
        state.groups = state.groups.map((group) => {
          if (group.id === groupId) {
            return { ...group, ...updates, updatedAt: Date.now() };
          }
          return group;
        });

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = {
            ...state.currentGroup,
            ...updates,
            updatedAt: Date.now(),
          };
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add group member
    builder
      .addCase(addGroupMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addGroupMember.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, newMember } = action.payload;

        // Update in groups array
        state.groups = state.groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              members: [...group.members, newMember],
              updatedAt: Date.now(),
            };
          }
          return group;
        });

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = {
            ...state.currentGroup,
            members: [...state.currentGroup.members, newMember],
            updatedAt: Date.now(),
          };
        }
      })
      .addCase(addGroupMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove group member
    builder
      .addCase(removeGroupMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, userId } = action.payload;

        // Update in groups array
        state.groups = state.groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              members: group.members.filter(
                (member) => member.userId !== userId
              ),
              updatedAt: Date.now(),
            };
          }
          return group;
        });

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = {
            ...state.currentGroup,
            members: state.currentGroup.members.filter(
              (member) => member.userId !== userId
            ),
            updatedAt: Date.now(),
          };
        }
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Change member role
    builder
      .addCase(changeGroupMemberRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changeGroupMemberRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, userId, newRole } = action.payload;

        // Update in groups array
        state.groups = state.groups.map((group) => {
          if (group.id === groupId) {
            const updatedMembers = group.members.map((member) => {
              if (member.userId === userId) {
                return { ...member, role: newRole };
              }
              return member;
            });
            return { ...group, members: updatedMembers, updatedAt: Date.now() };
          }
          return group;
        });

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          const updatedMembers = state.currentGroup.members.map((member) => {
            if (member.userId === userId) {
              return { ...member, role: newRole };
            }
            return member;
          });
          state.currentGroup = {
            ...state.currentGroup,
            members: updatedMembers,
            updatedAt: Date.now(),
          };
        }
      })
      .addCase(changeGroupMemberRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete group
    builder
      .addCase(deleteGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = state.groups.filter(
          (group) => group.id !== action.payload
        );
        if (state.currentGroup && state.currentGroup.id === action.payload) {
          state.currentGroup = null;
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentGroup, clearGroupError } = groupSlice.actions;
export default groupSlice.reducer;

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
} from "firebase/firestore";
import { db } from "../../api/firebase/config";
import type { Group } from "../../types/group";

interface GroupsState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
};

// Fetch groups for a user
export const fetchUserGroups = createAsyncThunk(
  "groups/fetchUserGroups",
  async (userId: string, { rejectWithValue }) => {
    try {
      // Query groups where the user is a member
      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", userId)
      );

      const querySnapshot = await getDocs(q);
      const groups: Group[] = [];

      querySnapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() } as Group);
      });

      return groups;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch groups");
    }
  }
);

// Create a new group
export const createGroup = createAsyncThunk(
  "groups/createGroup",
  async (
    {
      name,
      description,
      createdBy,
      members = [],
    }: {
      name: string;
      description?: string;
      createdBy: string;
      members?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      // Validate createdBy is not undefined
      if (!createdBy) {
        return rejectWithValue("Creator ID is required");
      }

      // Ensure creator is in members list
      if (!members.includes(createdBy)) {
        members.push(createdBy);
      }

      const timestamp = Date.now();
      const groupData = {
        name,
        description: description || "",
        createdBy,
        members,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const groupRef = await addDoc(collection(db, "groups"), groupData);

      return {
        id: groupRef.id,
        ...groupData,
      } as Group;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create group");
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

      if (groupSnap.exists()) {
        return { id: groupSnap.id, ...groupSnap.data() } as Group;
      } else {
        return rejectWithValue("Group not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch group");
    }
  }
);

// Update a group
export const updateGroup = createAsyncThunk(
  "groups/updateGroup",
  async (
    { groupId, updates }: { groupId: string; updates: Partial<Group> },
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

// Delete a group
export const deleteGroup = createAsyncThunk(
  "groups/deleteGroup",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await deleteDoc(groupRef);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete group");
    }
  }
);

// Add member to group
export const addGroupMember = createAsyncThunk(
  "groups/addMember",
  async (
    { groupId, userId }: { groupId: string; userId: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const { groups } = getState() as { groups: GroupsState };
      const currentGroup = groups.groups.find((g) => g.id === groupId);

      if (!currentGroup) {
        return rejectWithValue("Group not found");
      }

      if (currentGroup.members.includes(userId)) {
        return rejectWithValue("User is already a member of this group");
      }

      const updatedMembers = [...currentGroup.members, userId];

      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add member to group");
    }
  }
);

// Remove member from group
export const removeGroupMember = createAsyncThunk(
  "groups/removeMember",
  async (
    { groupId, userId }: { groupId: string; userId: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const { groups } = getState() as { groups: GroupsState };
      const currentGroup = groups.groups.find((g) => g.id === groupId);

      if (!currentGroup) {
        return rejectWithValue("Group not found");
      }

      if (!currentGroup.members.includes(userId)) {
        return rejectWithValue("User is not a member of this group");
      }

      // Cannot remove the creator of the group
      if (currentGroup.createdBy === userId) {
        return rejectWithValue("Cannot remove the creator of the group");
      }

      const updatedMembers = currentGroup.members.filter((id) => id !== userId);

      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: Date.now(),
      });

      return { groupId, userId };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to remove member from group"
      );
    }
  }
);

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user groups
      .addCase(fetchUserGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create group
      .addCase(createGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups.push(action.payload);
        state.currentGroup = action.payload;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch group
      .addCase(fetchGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update group
      .addCase(updateGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, updates } = action.payload;

        // Update in groups array
        state.groups = state.groups.map((group) =>
          group.id === groupId ? { ...group, ...updates } : group
        );

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = { ...state.currentGroup, ...updates };
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete group
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
      })

      // Add member to group
      .addCase(addGroupMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addGroupMember.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, userId } = action.payload;

        // Update members in groups array
        state.groups = state.groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              members: [...group.members, userId],
            };
          }
          return group;
        });

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = {
            ...state.currentGroup,
            members: [...state.currentGroup.members, userId],
          };
        }
      })
      .addCase(addGroupMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Remove member from group
      .addCase(removeGroupMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        state.isLoading = false;
        const { groupId, userId } = action.payload;

        // Update members in groups array
        state.groups = state.groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              members: group.members.filter((id) => id !== userId),
            };
          }
          return group;
        });

        // Update current group if it's the one being updated
        if (state.currentGroup && state.currentGroup.id === groupId) {
          state.currentGroup = {
            ...state.currentGroup,
            members: state.currentGroup.members.filter((id) => id !== userId),
          };
        }
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentGroup, clearError } = groupsSlice.actions;
export default groupsSlice.reducer;

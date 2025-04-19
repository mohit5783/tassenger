import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getContacts,
  refreshContacts,
  refreshAppUsers,
} from "../../services/ContactsService";
import type { Contact } from "../../services/ContactsService";

interface ContactsState {
  contacts: Contact[];
  filteredContacts: Contact[];
  isLoading: boolean;
  hasPermission: boolean;
  searchQuery: string;
  loadingProgress: string | null;
  loadingPercentage: number | null;
  isCheckingNewUsers: boolean;
  lastNewUserCheck: number | null;
  newUsersFound: number;
}

const initialState: ContactsState = {
  contacts: [],
  filteredContacts: [],
  isLoading: false,
  hasPermission: false,
  searchQuery: "",
  loadingProgress: null,
  loadingPercentage: null,
  isCheckingNewUsers: false,
  lastNewUserCheck: null,
  newUsersFound: 0,
};

// Create async thunk for fetching contacts
export const fetchContacts = createAsyncThunk(
  "contacts/fetchContacts",
  async (_, { dispatch }) => {
    try {
      // Set initial loading state
      dispatch(setLoadingProgress({ message: "Initializing..." }));

      // Get contacts
      const contacts = await getContacts();

      return contacts;
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw error;
    }
  }
);

// Create async thunk for refreshing contacts
export const forceRefreshContacts = createAsyncThunk(
  "contacts/refreshContacts",
  async (_, { dispatch }) => {
    try {
      // Set initial loading state
      dispatch(setLoadingProgress({ message: "Refreshing contacts..." }));

      // Force refresh contacts
      const contacts = await refreshContacts();

      return contacts;
    } catch (error) {
      console.error("Error refreshing contacts:", error);
      throw error;
    }
  }
);

// Create async thunk for checking new app users
export const checkForNewAppUsers = createAsyncThunk(
  "contacts/checkForNewAppUsers",
  async (_, { dispatch }) => {
    try {
      // Set initial loading state
      dispatch(
        setLoadingProgress({ message: "Checking for new app users..." })
      );

      // Refresh app users
      const newAppUsers = await refreshAppUsers();

      // Set new users found
      dispatch(setNewUsersFound(newAppUsers.length));

      return newAppUsers.length;
    } catch (error) {
      console.error("Error checking for new app users:", error);
      return 0;
    }
  }
);

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      if (action.payload.trim() === "") {
        state.filteredContacts = state.contacts;
      } else {
        const query = action.payload.toLowerCase();
        state.filteredContacts = state.contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(query) ||
            contact.phoneNumber.toLowerCase().includes(query) ||
            (contact.email && contact.email.toLowerCase().includes(query))
        );
      }
    },
    setLoadingProgress: (
      state,
      action: { payload: { message: string; percentage?: number | null } }
    ) => {
      state.loadingProgress = action.payload.message;
      state.loadingPercentage =
        action.payload.percentage !== undefined
          ? action.payload.percentage
          : null;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
      if (!action.payload) {
        state.loadingProgress = null;
        state.loadingPercentage = null;
      }
    },
    setContacts: (state, action) => {
      state.contacts = action.payload;
      state.filteredContacts = action.payload;
      state.hasPermission = true;
    },
    setNewUsersFound: (state, action) => {
      state.newUsersFound = action.payload;
    },
    updateContactWithNewAppUsers: (state, action) => {
      const updatedContacts = action.payload;

      // Update existing contacts with new app user information
      state.contacts = state.contacts.map((contact) => {
        const updatedContact = updatedContacts.find(
          (updated: any) => updated.id === contact.id
        );
        return updatedContact || contact;
      });

      // Update filtered contacts as well
      state.filteredContacts = state.filteredContacts.map((contact) => {
        const updatedContact = updatedContacts.find(
          (updated: any) => updated.id === contact.id
        );
        return updatedContact || contact;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchContacts
      .addCase(fetchContacts.pending, (state: any) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
        state.filteredContacts = action.payload;
        state.isLoading = false;
        state.hasPermission = true;
        state.loadingProgress = null;
        state.loadingPercentage = null;
      })
      .addCase(fetchContacts.rejected, (state: any, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.hasPermission = action.payload !== "Permission not granted";
      })

      // Handle forceRefreshContacts
      .addCase(forceRefreshContacts.pending, (state: any) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forceRefreshContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
        state.filteredContacts = action.payload;
        state.isLoading = false;
        state.loadingProgress = null;
        state.loadingPercentage = null;
      })
      .addCase(forceRefreshContacts.rejected, (state: any, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Handle checkForNewAppUsers
      .addCase(checkForNewAppUsers.pending, (state) => {
        state.isCheckingNewUsers = true;
      })
      .addCase(checkForNewAppUsers.fulfilled, (state, action) => {
        state.isCheckingNewUsers = false;
        state.lastNewUserCheck = Date.now();
        state.newUsersFound = action.payload;
      })
      .addCase(checkForNewAppUsers.rejected, (state) => {
        state.isCheckingNewUsers = false;
      });
  },
});

export const {
  setSearchQuery,
  setLoadingProgress,
  setIsLoading,
  setContacts,
  setNewUsersFound,
  updateContactWithNewAppUsers,
} = contactsSlice.actions;
export default contactsSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getContacts, refreshContacts } from "../../services/ContactsService";
import { contactsEventEmitter } from "../../utils/eventEmitter";
import type { Contact } from "../../services/ContactsService";

interface ContactsState {
  contacts: Contact[];
  filteredContacts: Contact[];
  isLoading: boolean;
  hasPermission: boolean;
  searchQuery: string;
  loadingProgress: string | null;
}

const initialState: ContactsState = {
  contacts: [],
  filteredContacts: [],
  isLoading: false,
  hasPermission: false,
  searchQuery: "",
  loadingProgress: null,
};

// Create async thunk for fetching contacts
export const fetchContacts = createAsyncThunk(
  "contacts/fetchContacts",
  async (_, { dispatch }) => {
    try {
      // Set initial loading state
      dispatch(setLoadingProgress("Initializing..."));

      // Set up progress listener
      const progressListener = (data: { message: string }) => {
        console.log("Progress update:", data.message);
        dispatch(setLoadingProgress(data.message));
      };

      contactsEventEmitter.on("progress", progressListener);

      // Get contacts (will use cache if available)
      const contacts = await getContacts();

      // Clean up listener
      contactsEventEmitter.off("progress", progressListener);

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
      dispatch(setLoadingProgress("Refreshing contacts..."));

      // Set up progress listener
      const progressListener = (data: { message: string }) => {
        console.log("Progress update:", data.message);
        dispatch(setLoadingProgress(data.message));
      };

      contactsEventEmitter.on("progress", progressListener);

      // Force refresh contacts
      const contacts = await refreshContacts();

      // Clean up listener
      contactsEventEmitter.off("progress", progressListener);

      return contacts;
    } catch (error) {
      console.error("Error refreshing contacts:", error);
      throw error;
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
    setLoadingProgress: (state, action) => {
      state.loadingProgress = action.payload;
      // Ensure isLoading is true when we have a loading progress message
      if (action.payload) {
        state.isLoading = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchContacts
      .addCase(fetchContacts.pending, (state) => {
        console.log("fetchContacts.pending");
        state.isLoading = true;
        state.loadingProgress = "Preparing to load contacts...";
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        console.log("fetchContacts.fulfilled");
        state.contacts = action.payload;
        state.filteredContacts = action.payload;
        state.isLoading = false;
        state.hasPermission = true;
        state.loadingProgress = null;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        console.log("fetchContacts.rejected", action.error);
        state.isLoading = false;
        state.loadingProgress = "Error loading contacts";
        // Don't set hasPermission to false here, as the error might be unrelated to permissions
      })

      // Handle forceRefreshContacts
      .addCase(forceRefreshContacts.pending, (state) => {
        console.log("forceRefreshContacts.pending");
        state.isLoading = true;
        state.loadingProgress = "Preparing to refresh contacts...";
      })
      .addCase(forceRefreshContacts.fulfilled, (state, action) => {
        console.log("forceRefreshContacts.fulfilled");
        state.contacts = action.payload;
        state.filteredContacts = action.payload;
        state.isLoading = false;
        state.hasPermission = true;
        state.loadingProgress = null;
      })
      .addCase(forceRefreshContacts.rejected, (state, action) => {
        console.log("forceRefreshContacts.rejected", action.error);
        state.isLoading = false;
        state.loadingProgress = "Error refreshing contacts";
      });
  },
});

export const { setSearchQuery, setLoadingProgress } = contactsSlice.actions;
export default contactsSlice.reducer;

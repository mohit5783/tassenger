import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../api/firebase/config";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  createdAt: number;
  read: boolean;
  attachments?: {
    type: "task" | "image" | "file";
    id?: string;
    url?: string;
    name?: string;
  }[];
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: number;
  };
  createdAt: number;
  updatedAt: number;
  unreadCount?: Record<string, number>;
  title?: string;
  isGroup: boolean;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

// Create a new conversation
export const createConversation = createAsyncThunk(
  "chat/createConversation",
  async (
    {
      participants,
      participantNames,
      title,
      isGroup = false,
    }: {
      participants: string[];
      participantNames: Record<string, string>;
      title?: string;
      isGroup?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const timestamp = Date.now();

      // Check if a direct conversation already exists between these two users
      if (!isGroup && participants.length === 2) {
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", participants[0]),
          where("isGroup", "==", false)
        );

        const querySnapshot = await getDocs(q);
        const existingConversation = querySnapshot.docs.find((doc) => {
          const data = doc.data();
          return data.participants.includes(participants[1]);
        });

        if (existingConversation) {
          return {
            id: existingConversation.id,
            ...existingConversation.data(),
          } as Conversation;
        }
      }

      // Create new conversation
      const conversationRef = await addDoc(collection(db, "conversations"), {
        participants,
        participantNames,
        title: title || "",
        isGroup,
        createdAt: timestamp,
        updatedAt: timestamp,
        unreadCount: participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {} as Record<string, number>),
      });

      return {
        id: conversationRef.id,
        participants,
        participantNames,
        title: title || "",
        isGroup,
        createdAt: timestamp,
        updatedAt: timestamp,
        unreadCount: participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {} as Record<string, number>),
      } as Conversation;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create conversation");
    }
  }
);

// Fetch user's conversations
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (userId: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
      );
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch conversations");
    }
  }
);

// Fetch a single conversation
export const fetchConversation = createAsyncThunk(
  "chat/fetchConversation",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        return {
          id: conversationSnap.id,
          ...conversationSnap.data(),
        } as Conversation;
      } else {
        return rejectWithValue("Conversation not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch conversation");
    }
  }
);

// Send a message
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      conversationId,
      text,
      senderId,
      senderName,
      attachments,
    }: {
      conversationId: string;
      text: string;
      senderId: string;
      senderName: string;
      attachments?: {
        type: "task" | "image" | "file";
        id?: string;
        url?: string;
        name?: string;
      }[];
    },
    { rejectWithValue }
  ) => {
    try {
      const timestamp = Date.now();

      // Ensure attachments is an array, not undefined
      const safeAttachments = attachments || [];

      // Add message to the messages collection
      const messageRef = await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
          text,
          senderId,
          senderName,
          createdAt: timestamp,
          read: false,
          attachments: safeAttachments,
        }
      );

      // Update the conversation with the last message
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data();
        const participants = conversationData.participants || [];

        // Update unread count for all participants except the sender
        const unreadCount = { ...(conversationData.unreadCount || {}) };
        participants.forEach((participantId: any) => {
          if (participantId !== senderId) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        });

        await updateDoc(conversationRef, {
          lastMessage: {
            text,
            senderId,
            createdAt: timestamp,
          },
          updatedAt: timestamp,
          unreadCount,
        });
      }

      return {
        id: messageRef.id,
        text,
        senderId,
        senderName,
        createdAt: timestamp,
        read: false,
        attachments: safeAttachments,
      } as Message;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to send message");
    }
  }
);

// Fetch messages for a conversation
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Handle different timestamp formats
        let createdAt = data.createdAt;

        // If it's a Firestore timestamp, convert to milliseconds
        if (createdAt && typeof createdAt.toMillis === "function") {
          createdAt = createdAt.toMillis();
        }

        // If it's undefined, use current time
        if (createdAt === undefined) {
          createdAt = Date.now();
        }

        return {
          id: doc.id,
          ...data,
          createdAt,
        } as Message;
      });
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch messages");
    }
  }
);

// Mark messages as read
export const markMessagesAsRead = createAsyncThunk(
  "chat/markMessagesAsRead",
  async (
    { conversationId, userId }: { conversationId: string; userId: string },
    { rejectWithValue }
  ) => {
    try {
      // Update the conversation's unread count for this user
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data();
        const unreadCount = { ...(conversationData.unreadCount || {}) };

        // Reset unread count for this user
        if (unreadCount[userId] !== undefined) {
          unreadCount[userId] = 0;
          await updateDoc(conversationRef, { unreadCount });
        }
      }

      return { conversationId, userId };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to mark messages as read"
      );
    }
  }
);

// Add the missing markConversationAsRead function (alias for markMessagesAsRead)
export const markConversationAsRead = markMessagesAsRead;

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateConversation: (state, action) => {
      const { conversationId, data } = action.payload;
      const index = state.conversations.findIndex(
        (c) => c.id === conversationId
      );
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...data };
      }
      if (state.currentConversation?.id === conversationId) {
        state.currentConversation = { ...state.currentConversation, ...data };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create conversation
      .addCase(createConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Check if conversation already exists in the state
        const existingIndex = state.conversations.findIndex(
          (c) => c.id === action.payload.id
        );
        if (existingIndex === -1) {
          state.conversations.unshift(action.payload);
        }
        state.currentConversation = action.payload;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch conversation
      .addCase(fetchConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push(action.payload);

        // Update the conversation's last message
        const conversationId = state.currentConversation?.id;
        if (conversationId) {
          const conversationIndex = state.conversations.findIndex(
            (c) => c.id === conversationId
          );
          if (conversationIndex !== -1) {
            state.conversations[conversationIndex] = {
              ...state.conversations[conversationIndex],
              lastMessage: {
                text: action.payload.text,
                senderId: action.payload.senderId,
                createdAt: action.payload.createdAt,
              },
              updatedAt: action.payload.createdAt,
            };
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { conversationId, userId } = action.payload;

        // Update the conversation's unread count in the state
        const conversationIndex = state.conversations.findIndex(
          (c) => c.id === conversationId
        );
        if (
          conversationIndex !== -1 &&
          state.conversations[conversationIndex].unreadCount
        ) {
          state.conversations[conversationIndex].unreadCount![userId] = 0;
        }

        if (
          state.currentConversation?.id === conversationId &&
          state.currentConversation.unreadCount
        ) {
          state.currentConversation.unreadCount[userId] = 0;
        }
      });
  },
});

export const {
  clearCurrentConversation,
  clearError,
  addMessage,
  updateConversation,
} = chatSlice.actions;
export default chatSlice.reducer;

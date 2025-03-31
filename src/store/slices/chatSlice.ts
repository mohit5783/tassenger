import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { db } from "../../api/firebase/config";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number; // Timestamp in milliseconds
  attachments?: Array<{
    type: string;
    url?: string;
    id?: string;
    name?: string;
  }>;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: string[];
  participantNames?: Record<string, string>;
  lastMessage?: {
    text: string;
    timestamp: number;
  };
  isGroup: boolean;
  createdAt: number;
  unreadCount?: number;
}

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messages: [],
  isLoading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (userId: string) => {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId)
      );
      const querySnapshot = await getDocs(q);

      const conversations: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data(),
        } as Conversation);
      });

      return conversations;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: string) => {
    try {
      const q = query(
        collection(db, `conversations/${conversationId}/messages`),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis() || Date.now(), // Convert Firestore timestamp to milliseconds
        } as Message);
      });

      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }
);

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
      attachments?: Array<{
        type: string;
        url?: string;
        id?: string;
        name?: string;
      }>;
    },
    { dispatch }
  ) => {
    try {
      const timestamp = Date.now();

      // Add message to the conversation
      const messageRef = await addDoc(
        collection(db, `conversations/${conversationId}/messages`),
        {
          conversationId,
          senderId,
          senderName,
          text,
          createdAt: serverTimestamp(),
          attachments,
        }
      );

      // Update the conversation with the last message
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          text,
          timestamp,
          senderId,
        },
      });

      // Get the conversation to update participants' unread counts
      const conversationDoc = await getDoc(conversationRef);
      const conversation = conversationDoc.data();

      if (conversation && conversation.participants) {
        // Update unread counts for all participants except the sender
        const batch = conversation.participants
          .filter((participantId: string) => participantId !== senderId)
          .map((participantId: string) => {
            const unreadCountsRef = doc(
              db,
              `users/${participantId}/unreadCounts`,
              conversationId
            );
            return updateDoc(unreadCountsRef, {
              count: increment(1),
              lastUpdated: serverTimestamp(),
            }).catch(() => {
              // If the document doesn't exist, create it
              return setDoc(
                doc(db, `users/${participantId}/unreadCounts`, conversationId),
                {
                  count: 1,
                  lastUpdated: serverTimestamp(),
                }
              );
            });
          });

        await Promise.all(batch);
      }

      // Return the new message
      return {
        id: messageRef.id,
        conversationId,
        senderId,
        senderName,
        text,
        createdAt: timestamp,
        attachments,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  "chat/markConversationAsRead",
  async ({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }) => {
    try {
      const unreadCountRef = doc(
        db,
        `users/${userId}/unreadCounts`,
        conversationId
      );
      await updateDoc(unreadCountRef, {
        count: 0,
        lastUpdated: serverTimestamp(),
      }).catch(() => {
        // If the document doesn't exist, that's fine
      });

      return { conversationId };
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw error;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
        state.error = action.error.message || "Failed to fetch conversations";
      })
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
        state.error = action.error.message || "Failed to fetch messages";
      })
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = [action.payload, ...state.messages];

        // Update the conversation's last message
        const conversationIndex = state.conversations.findIndex(
          (conv) => conv.id === action.payload.conversationId
        );

        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = {
            text: action.payload.text,
            timestamp: action.payload.createdAt,
          };
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to send message";
      })
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationIndex = state.conversations.findIndex(
          (conv) => conv.id === action.payload.conversationId
        );

        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].unreadCount = 0;
        }
      });
  },
});

export default chatSlice.reducer;

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
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../api/firebase/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Add this import at the top of the file
import {
  sendPushNotification,
  sendMessageReadNotification,
  sendGroupMentionNotification,
} from "../../services/NotificationService";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  createdAt: number;
  read: boolean;
  readBy?: string[]; // Array of user IDs who have read the message
  readAt?: Record<string, number>; // Timestamp when each user read the message
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
  lastMessageReadByAll?: boolean; // Add this property
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  activeListeners: Record<string, () => void>;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  activeListeners: {},
};

// Cache key for storing conversations locally
const CONVERSATIONS_CACHE_KEY = "tassenger_conversations_cache";

// Helper function to save conversations to AsyncStorage
const cacheConversations = async (conversations: Conversation[]) => {
  try {
    await AsyncStorage.setItem(
      CONVERSATIONS_CACHE_KEY,
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error("Error caching conversations:", error);
  }
};

// Helper function to load cached conversations
const loadCachedConversations = async (): Promise<Conversation[]> => {
  try {
    const cachedData = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error("Error loading cached conversations:", error);
  }
  return [];
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

      const newConversation = {
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

      return newConversation;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create conversation");
    }
  }
);

// Fetch user's conversations
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (userId: string, { rejectWithValue, dispatch }) => {
    try {
      // First, try to load cached conversations for immediate display
      const cachedConversations = await loadCachedConversations();

      // Set up real-time listener for conversations
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const conversations = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Conversation)
          );

          // Update Redux store with fresh data
          dispatch(updateConversationsFromListener(conversations));

          // Cache the conversations
          cacheConversations(conversations);
        },
        (error) => {
          console.error("Error in conversations listener:", error);
          // Dispatch an action to update the error state
          dispatch(
            setConversationsError(
              error.message || "Failed to load conversations"
            )
          );
        }
      );

      // Store the unsubscribe function
      dispatch(
        setActiveListener({ key: `conversations_${userId}`, unsubscribe })
      );

      // Return cached conversations initially
      return cachedConversations;
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
          readBy: [senderId], // Sender has read their own message
          readAt: { [senderId]: timestamp }, // When the sender read it
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
            id: messageRef.id,
            text,
            senderId,
            createdAt: timestamp,
          },
          updatedAt: timestamp,
          unreadCount,
          lastMessageReadByAll: false, // New message is not read by all yet
        });

        // Check for mentions in group chats
        if (conversationData.isGroup) {
          // Simple mention detection - look for @username pattern
          const mentionRegex = /@(\w+)/g;
          const mentions = text.match(mentionRegex);

          if (mentions && mentions.length > 0) {
            // For each mention, find the corresponding user
            for (const mention of mentions) {
              const username = mention.substring(1); // Remove the @ symbol

              // Find user by display name (simplified approach)
              // In a real app, you'd have a more robust way to resolve mentions
              for (const participantId of participants) {
                if (participantId === senderId) continue; // Skip sender

                const participantName =
                  conversationData.participantNames?.[participantId] || "";

                // Check if mention matches participant name (case insensitive)
                if (
                  participantName.toLowerCase().includes(username.toLowerCase())
                ) {
                  // Send mention notification
                  await sendGroupMentionNotification(
                    participantId,
                    senderId,
                    senderName,
                    conversationId,
                    conversationData.title || "Group Chat",
                    text
                  );
                }
              }
            }
          }
        } else {
          // For direct messages, send regular notification
          const recipientId = participants.find((id: any) => id !== senderId);
          if (recipientId) {
            await sendPushNotification(
              recipientId,
              `New message from ${senderName}`,
              text, // Use the message text as the notification body
              {
                type: "messageReceived",
                itemId: conversationId,
                itemType: "chat",
                senderId,
                messageId: messageRef.id,
              }
            );
          }
        }
      }

      return {
        id: messageRef.id,
        text,
        senderId,
        senderName,
        createdAt: timestamp,
        read: false,
        readBy: [senderId],
        readAt: { [senderId]: timestamp },
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
  async (conversationId: string, { rejectWithValue, dispatch }) => {
    try {
      const q = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("createdAt", "asc")
      );

      // Set up real-time listener for messages
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map((doc) => {
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

          // Update Redux store with fresh messages
          dispatch(updateMessagesFromListener(messages));
        },
        (error) => {
          console.error("Error in messages listener:", error);
        }
      );

      // Store the unsubscribe function
      dispatch(
        setActiveListener({ key: `messages_${conversationId}`, unsubscribe })
      );

      // Return empty array initially - the listener will populate the messages
      return [];
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
    { rejectWithValue, getState }
  ) => {
    try {
      // Get user info for notifications
      const { auth } = getState() as { auth: { user: any } };
      const readerName =
        auth.user?.displayName || auth.user?.phoneNumber || "A user";

      // Update the conversation's unread count for this user
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const conversationData = conversationSnap.data();
        const unreadCount = { ...(conversationData.unreadCount || {}) };

        // Reset unread count for this user
        if (unreadCount[userId] !== undefined) {
          unreadCount[userId] = 0;

          // Check if all participants have read the last message
          const lastMessage = conversationData.lastMessage;
          if (lastMessage && lastMessage.senderId !== userId) {
            // Check if all participants have now read the message
            const allParticipantsRead = Object.keys(unreadCount).every(
              (participantId) =>
                unreadCount[participantId] === 0 ||
                participantId === lastMessage.senderId
            );

            // Update the conversation with the read status
            await updateDoc(conversationRef, {
              unreadCount,
              lastMessageReadByAll: allParticipantsRead,
            });

            // Send read receipt notification to the sender
            if (allParticipantsRead) {
              await sendMessageReadNotification(
                lastMessage.id || "unknown",
                conversationId,
                userId,
                lastMessage.senderId,
                readerName
              );
            }
          } else {
            await updateDoc(conversationRef, { unreadCount });
          }
        }

        // Mark all unread messages as read by this user
        const messagesQuery = query(
          collection(db, "conversations", conversationId, "messages"),
          where("readBy", "array-contains", userId),
          orderBy("createdAt", "desc")
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        const readTimestamp = Date.now();

        // Batch update for better performance
        const batch = messagesSnapshot.docs.map(async (messageDoc) => {
          const messageData = messageDoc.data();
          const messageRef = doc(
            db,
            "conversations",
            conversationId,
            "messages",
            messageDoc.id
          );

          // Update readBy array and readAt record
          const readBy = messageData.readBy || [];
          if (!readBy.includes(userId)) {
            readBy.push(userId);

            const readAt = messageData.readAt || {};
            readAt[userId] = readTimestamp;

            await updateDoc(messageRef, {
              read: true,
              readBy,
              readAt,
            });

            // Send read receipt notification to the sender
            if (messageData.senderId && messageData.senderId !== userId) {
              await sendMessageReadNotification(
                messageDoc.id,
                conversationId,
                userId,
                messageData.senderId,
                readerName
              );
            }
          }
        });

        await Promise.all(batch);
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
      // Check if message already exists before adding
      const messageExists = state.messages.some(
        (msg) => msg.id === action.payload.id
      );
      if (!messageExists) {
        state.messages.push(action.payload);
      }
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
    updateConversationsFromListener: (state, action) => {
      state.conversations = action.payload;
      state.isLoading = false;
    },
    updateMessagesFromListener: (state, action) => {
      state.messages = action.payload;
      state.isLoading = false;
    },
    setActiveListener: (state, action) => {
      const { key, unsubscribe } = action.payload;
      // Clean up previous listener if it exists
      if (state.activeListeners[key]) {
        state.activeListeners[key]();
      }
      state.activeListeners[key] = unsubscribe;
    },
    cleanupListeners: (state) => {
      // Unsubscribe from all active listeners
      Object.values(state.activeListeners).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
      state.activeListeners = {};
    },
    setConversationsError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
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
        // Only update if we got conversations back
        if (action.payload.length > 0) {
          state.conversations = action.payload;
        }
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

        // Check if message already exists before adding
        const messageExists = state.messages.some(
          (msg) => msg.id === action.payload.id
        );
        if (!messageExists) {
          state.messages.push(action.payload);
        }

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
        // Messages will be populated by the listener
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

        // Mark messages as read in the state
        state.messages = state.messages.map((message) => {
          if (!message.readBy?.includes(userId)) {
            return {
              ...message,
              read: true,
              readBy: [...(message.readBy || []), userId],
              readAt: { ...(message.readAt || {}), [userId]: Date.now() },
            };
          }
          return message;
        });
      });
  },
});

export const {
  clearCurrentConversation,
  clearError,
  addMessage,
  updateConversation,
  updateConversationsFromListener,
  updateMessagesFromListener,
  setActiveListener,
  cleanupListeners,
  setConversationsError,
} = chatSlice.actions;
export default chatSlice.reducer;

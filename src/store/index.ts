import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/taskSlice";
import chatReducer from "./slices/chatSlice";
import contactsReducer from "./slices/contactsSlice";
import recurrenceReducer from "./slices/recurrenceSlice";
import groupsReducer from "./slices/groupsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    chat: chatReducer,
    contacts: contactsReducer,
    recurrence: recurrenceReducer,
    groups: groupsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

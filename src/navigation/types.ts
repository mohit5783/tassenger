import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  EmailAuth: undefined;
  ProfileCompletion: { userId: string; isNewUser: boolean };
};

export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined | { template: any };
  EditTask: { taskId: string };
  TaskAnalytics: undefined;
  TaskTemplates: undefined;
  CreateTaskTemplate: undefined;
  ContactsForTaskAssignment: { taskId?: string; returnScreen?: string };
};

export type ChatStackParamList = {
  ConversationsList: undefined;
  ConversationDetail: { conversationId: string };
  NewConversation: undefined;
  UserSearch: undefined;
  PlaceholderChat: { contact: any };
  ContactsForChat: undefined;
};

// Update the ProfileStackParamList to include NotificationPreferences
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Help: undefined;
  About: undefined;
  NotificationPreferences: undefined;
};

export type GroupStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  GroupTasks: { groupId: string };
  CreateGroupTask: { groupId: string };
  GroupTaskDetail: { taskId: string; groupId: string };
  GroupMembers: { groupId: string };
  EditGroup: { groupId: string };
  AddGroupMembers: { groupId: string };
};

// Add custom parameters for navigation
export interface MainTabNavigationParams {
  screen?: keyof MainTabParamList;
  params?: any;
}

export interface TasksNavigationParams {
  screen?: keyof TasksStackParamList;
}

export interface ProfileNavigationParams {
  screen?: keyof ProfileStackParamList;
}

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: TasksNavigationParams | undefined;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Groups: NavigatorScreenParams<GroupStackParamList>;
  Profile: ProfileNavigationParams | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: MainTabNavigationParams | undefined;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
};

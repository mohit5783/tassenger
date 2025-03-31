import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OTPVerification: { phoneNumber: string; verificationId: string };
  SetupProfile: undefined;
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

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Help: undefined;
  About: undefined;
};

export type GroupStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  GroupTasks: { groupId: string };
  CreateGroupTask: { groupId: string };
  GroupTaskDetail: { taskId: string; groupId: string };
  GroupMembers: { groupId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: NavigatorScreenParams<TasksStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Groups: NavigatorScreenParams<GroupStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
};

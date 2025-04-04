import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { TasksStackParamList } from "./types";

// Import screens
import TasksListScreen from "../screens/tasks/TasksListScreen";
import TaskDetailScreen from "../screens/tasks/TaskDetailScreen";
import CreateTaskScreen from "../screens/tasks/CreateTaskScreen";
import EditTaskScreen from "../screens/tasks/EditTaskScreen";
import TaskAnalyticsScreen from "../screens/tasks/TaskAnalyticsScreen";
import TaskTemplatesScreen from "../screens/tasks/TaskTemplatesScreen";
import CreateTaskTemplateScreen from "../screens/tasks/CreateTaskTemplateScreen";
import ContactsForTaskAssignmentScreen from "../screens/contacts/ContactsForTaskAssignmentScreen";

const Stack = createNativeStackNavigator<TasksStackParamList>();

const TasksNavigator = ({ route }: any) => {
  const initialScreen = route.params?.screen || "TasksList";

  return (
    <Stack.Navigator initialRouteName={initialScreen}>
      <Stack.Screen
        name="TasksList"
        component={TasksListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskAnalytics"
        component={TaskAnalyticsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskTemplates"
        component={TaskTemplatesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTaskTemplate"
        component={CreateTaskTemplateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactsForTaskAssignment"
        component={ContactsForTaskAssignmentScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default TasksNavigator;

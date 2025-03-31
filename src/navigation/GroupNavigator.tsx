import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { GroupStackParamList } from "./types";
import GroupsListScreen from "@/screens/groups/GroupsListScreen";
import GroupDetailScreen from "@/screens/groups/GroupDetailScreen";
import CreateGroupScreen from "@/screens/groups/CreateGroupScreen";
import GroupTasksScreen from "@/screens/groups/GroupTasksScreen";
import CreateGroupTaskScreen from "@/screens/groups/CreateGroupTaskScreen";
import GroupTaskDetailScreen from "@/screens/groups/GroupTaskDetailScreen";
import GroupMembersScreen from "@/screens/groups/GroupMembersScreen";

const Stack = createNativeStackNavigator<GroupStackParamList>();

const GroupNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupTasks"
        component={GroupTasksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateGroupTask"
        component={CreateGroupTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupTaskDetail"
        component={GroupTaskDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupMembers"
        component={GroupMembersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default GroupNavigator;

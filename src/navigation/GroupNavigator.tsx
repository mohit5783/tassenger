import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { GroupStackParamList } from "./types";

// Import screens
import GroupsListScreen from "../screens/groups/GroupsListScreen";
import GroupDetailScreen from "../screens/groups/GroupDetailScreen";
import CreateGroupScreen from "../screens/groups/CreateGroupScreen";
import GroupMembersScreen from "../screens/groups/GroupMembersScreen";
import CreateGroupTaskScreen from "../screens/groups/CreateGroupTaskScreen";
import GroupTasksScreen from "../screens/groups/GroupTasksScreen";
import EditGroupScreen from "../screens/groups/EditGroupScreen";
import AddGroupMembersScreen from "../screens/groups/AddGroupMembersScreen";

const Stack = createNativeStackNavigator<GroupStackParamList>();

const GroupsNavigator = () => {
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
        name="GroupMembers"
        component={GroupMembersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateGroupTask"
        component={CreateGroupTaskScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupTasks"
        component={GroupTasksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditGroup"
        component={EditGroupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddGroupMembers"
        component={AddGroupMembersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default GroupsNavigator;

"use client";

import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Searchbar, Menu } from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setSearchQuery,
  setFilters,
  clearFilters,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
} from "../store/slices/taskSlice";
import { Filter } from "react-native-feather";

interface TaskSearchBarProps {
  onFocus?: (focused: boolean) => void;
  onBlur?: (focused: boolean) => void;
}

const TaskSearchBar = ({ onFocus, onBlur }: TaskSearchBarProps) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { searchQuery, activeFilters } = useAppSelector((state) => state.tasks);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleFilterPress = () => {
    // Toggle menu visibility instead of just setting it to true
    setMenuVisible(!menuVisible);
  };

  const handleFilterSelect = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters };

    switch (filterType) {
      case "status":
        // Initialize the array if it doesn't exist
        if (!newFilters.status) newFilters.status = [];
        // Create a new array to avoid mutation issues
        newFilters.status = [...newFilters.status];

        if (newFilters.status.includes(value as TaskStatus)) {
          newFilters.status = newFilters.status.filter((s) => s !== value);
        } else {
          newFilters.status.push(value as TaskStatus);
        }
        break;
      case "priority":
        // Initialize the array if it doesn't exist
        if (!newFilters.priority) newFilters.priority = [];
        // Create a new array to avoid mutation issues
        newFilters.priority = [...newFilters.priority];

        if (newFilters.priority.includes(value as TaskPriority)) {
          newFilters.priority = newFilters.priority.filter((p) => p !== value);
        } else {
          newFilters.priority.push(value as TaskPriority);
        }
        break;
      case "category":
        // Initialize the array if it doesn't exist
        if (!newFilters.category) newFilters.category = [];
        // Create a new array to avoid mutation issues
        newFilters.category = [...newFilters.category];

        if (newFilters.category.includes(value as TaskCategory)) {
          newFilters.category = newFilters.category.filter((c) => c !== value);
        } else {
          newFilters.category.push(value as TaskCategory);
        }
        break;
    }

    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setMenuVisible(false);
  };

  const isFilterActive = (filterType: string, value: string): boolean => {
    switch (filterType) {
      case "status":
        return activeFilters.status?.includes(value as TaskStatus) || false;
      case "priority":
        return activeFilters.priority?.includes(value as TaskPriority) || false;
      case "category":
        return activeFilters.category?.includes(value as TaskCategory) || false;
      default:
        return false;
    }
  };

  const hasActiveFilters = (): boolean => {
    return (
      (activeFilters.status && activeFilters.status.length > 0) ||
      (activeFilters.priority && activeFilters.priority.length > 0) ||
      (activeFilters.category && activeFilters.category.length > 0) ||
      (activeFilters.tags && activeFilters.tags.length > 0) ||
      !!activeFilters.dateRange
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search tasks"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        inputStyle={styles.searchInput}
        onFocus={() => onFocus && onFocus(true)}
        onBlur={() => onBlur && onBlur(false)}
      />

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onPress={handleFilterPress}
            style={styles.filterButton}
          >
            <Filter
              width={24}
              height={24}
              stroke={
                hasActiveFilters() ? theme.colors.primary : theme.colors.text
              }
              strokeWidth={hasActiveFilters() ? 2.5 : 1.5}
            />
          </TouchableOpacity>
        }
        style={styles.menu}
      >
        <Menu.Item title="Status" disabled />
        <Menu.Item
          title="To Do"
          onPress={() => handleFilterSelect("status", "todo")}
          leadingIcon={isFilterActive("status", "todo") ? "check" : undefined}
        />
        <Menu.Item
          title="In Progress"
          onPress={() => handleFilterSelect("status", "inProgress")}
          leadingIcon={
            isFilterActive("status", "inProgress") ? "check" : undefined
          }
        />
        <Menu.Item
          title="Completed"
          onPress={() => handleFilterSelect("status", "completed")}
          leadingIcon={
            isFilterActive("status", "completed") ? "check" : undefined
          }
        />

        <Menu.Item title="Priority" disabled />
        <Menu.Item
          title="Low"
          onPress={() => handleFilterSelect("priority", "low")}
          leadingIcon={isFilterActive("priority", "low") ? "check" : undefined}
        />
        <Menu.Item
          title="Medium"
          onPress={() => handleFilterSelect("priority", "medium")}
          leadingIcon={
            isFilterActive("priority", "medium") ? "check" : undefined
          }
        />
        <Menu.Item
          title="High"
          onPress={() => handleFilterSelect("priority", "high")}
          leadingIcon={isFilterActive("priority", "high") ? "check" : undefined}
        />

        <Menu.Item title="Category" disabled />
        <Menu.Item
          title="Work"
          onPress={() => handleFilterSelect("category", "work")}
          leadingIcon={isFilterActive("category", "work") ? "check" : undefined}
        />
        <Menu.Item
          title="Personal"
          onPress={() => handleFilterSelect("category", "personal")}
          leadingIcon={
            isFilterActive("category", "personal") ? "check" : undefined
          }
        />
        <Menu.Item
          title="Shopping"
          onPress={() => handleFilterSelect("category", "shopping")}
          leadingIcon={
            isFilterActive("category", "shopping") ? "check" : undefined
          }
        />
        <Menu.Item
          title="Health"
          onPress={() => handleFilterSelect("category", "health")}
          leadingIcon={
            isFilterActive("category", "health") ? "check" : undefined
          }
        />
        <Menu.Item
          title="Finance"
          onPress={() => handleFilterSelect("category", "finance")}
          leadingIcon={
            isFilterActive("category", "finance") ? "check" : undefined
          }
        />
        <Menu.Item
          title="Other"
          onPress={() => handleFilterSelect("category", "other")}
          leadingIcon={
            isFilterActive("category", "other") ? "check" : undefined
          }
        />

        <Menu.Item
          title="Clear Filters"
          onPress={handleClearFilters}
          leadingIcon="close"
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flex: 1,
    borderRadius: 20,
    height: 40,
  },
  searchInput: {
    paddingVertical: 0, // Fix vertical alignment
    height: 40,
    alignSelf: "center",
  },
  filterButton: {
    marginLeft: 8,
    padding: 8,
  },
  menu: {
    marginTop: 40,
  },
});

export default TaskSearchBar;
